/**
 * FaceLandmarker478 — MediaPipe Tasks Vision Face Landmarker (478 landmarks).
 *
 * 핵심 원칙 (D9, beauty-filter spec):
 *   1. 추론은 100% 브라우저 내에서만 수행. 좌표는 절대 서버로 전송되지 않는다.
 *   2. 모델·WASM은 lazy-import — 초기 페이지 번들에 포함되지 않는다.
 *   3. 30초 idle 후 GPU 자원 해제(`idleDispose`)로 메모리 압박 회피.
 *
 * 사용:
 *   const landmarker = await FaceLandmarker478.load();
 *   const faces = await landmarker.detect(imgEl);
 *   FaceLandmarker478.idleDispose();   // 보통 디바운스 타이머가 호출
 */

const TASK_FILE_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const WASM_BASE_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.20/wasm';

const IDLE_DISPOSE_MS = 30_000;
const MAX_FACES = 4;

export interface FaceLandmarkResult {
  faceIndex: number;
  /** 정규화 좌표(0..1). x: width 비율, y: height 비율. z는 상대 깊이. */
  landmarks: { x: number; y: number; z: number }[];
  /** 얼굴 바운딩 박스 — 정규화 좌표(0..1). */
  bbox: { x: number; y: number; width: number; height: number };
  /** 0..1, 감지 신뢰도 (face blendshape category 평균 — 없으면 1.0) */
  confidence: number;
}

interface LoadedFaceLandmarker {
  detect(source: HTMLImageElement | HTMLCanvasElement | ImageBitmap): {
    faceLandmarks: { x: number; y: number; z: number }[][];
    faceBlendshapes?: { categories: { score: number }[] }[];
  };
  close(): void;
}

let _instance: FaceLandmarker478 | null = null;
let _loadingPromise: Promise<FaceLandmarker478> | null = null;
let _idleTimer: ReturnType<typeof setTimeout> | null = null;

export class FaceLandmarker478 {
  private inner: LoadedFaceLandmarker;

  private constructor(inner: LoadedFaceLandmarker) {
    this.inner = inner;
  }

  /**
   * Lazy-init 후 캐시. 동시 호출은 동일 Promise를 공유한다.
   * 모델 로드가 10초 이상 걸리면 reject (spec: model initialization timeout).
   */
  static async load(): Promise<FaceLandmarker478> {
    if (_instance) {
      FaceLandmarker478.scheduleIdleDispose();
      return _instance;
    }
    if (_loadingPromise) return _loadingPromise;

    _loadingPromise = (async () => {
      // dynamic import: 초기 번들에서 제외 (Next.js code-split)
      const vision = await import('@mediapipe/tasks-vision');

      const fileset = await vision.FilesetResolver.forVisionTasks(WASM_BASE_URL);

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('FACE_LANDMARKER_LOAD_TIMEOUT')), 10_000);
      });

      const created = await Promise.race([
        vision.FaceLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath: TASK_FILE_URL,
            delegate: 'GPU',
          },
          outputFaceBlendshapes: true,
          runningMode: 'IMAGE',
          numFaces: MAX_FACES,
        }),
        timeoutPromise,
      ]);

      _instance = new FaceLandmarker478(created as unknown as LoadedFaceLandmarker);
      FaceLandmarker478.scheduleIdleDispose();
      return _instance;
    })();

    try {
      return await _loadingPromise;
    } finally {
      _loadingPromise = null;
    }
  }

  /**
   * 이미지·캔버스에서 얼굴 랜드마크 감지.
   * 결과는 정규화 좌표(0..1). 픽셀 변환은 호출자가 width·height와 곱해서 처리한다.
   */
  async detect(
    source: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
  ): Promise<FaceLandmarkResult[]> {
    FaceLandmarker478.scheduleIdleDispose();

    const raw = this.inner.detect(source);
    const list = raw.faceLandmarks ?? [];
    if (list.length === 0) return [];

    return list.slice(0, MAX_FACES).map((landmarks, faceIndex) => {
      let minX = 1;
      let minY = 1;
      let maxX = 0;
      let maxY = 0;
      for (const p of landmarks) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }

      const blendshape = raw.faceBlendshapes?.[faceIndex];
      let confidence = 1;
      if (blendshape && blendshape.categories.length > 0) {
        let sum = 0;
        for (const c of blendshape.categories) sum += c.score;
        confidence = sum / blendshape.categories.length;
      }

      return {
        faceIndex,
        landmarks: landmarks.map((p) => ({ x: p.x, y: p.y, z: p.z })),
        bbox: {
          x: minX,
          y: minY,
          width: Math.max(0, maxX - minX),
          height: Math.max(0, maxY - minY),
        },
        confidence,
      };
    });
  }

  private static scheduleIdleDispose(): void {
    if (_idleTimer) clearTimeout(_idleTimer);
    _idleTimer = setTimeout(() => {
      idleDispose();
    }, IDLE_DISPOSE_MS);
  }
}

/**
 * 30초 idle 후 또는 라우팅 변경 시 GPU 자원 해제.
 * 다음 호출 때 `load()`가 재초기화한다.
 */
export function idleDispose(): void {
  if (_idleTimer) {
    clearTimeout(_idleTimer);
    _idleTimer = null;
  }
  if (_instance) {
    try {
      // close()는 GPU 텍스처/WebAssembly 인스턴스를 모두 해제
      (_instance as unknown as { inner: LoadedFaceLandmarker }).inner.close();
    } catch {
      // 이미 close된 경우 무시
    }
    _instance = null;
  }
}
