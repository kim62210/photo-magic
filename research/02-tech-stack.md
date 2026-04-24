# 오픈소스 기술 스택 평가 — photo-magic

> 작성일: 2026-04-24 | 조사 기준: 2025~2026 최신 정보 반영

---

## 요약 (Recommended Stack)

| 레이어 | 1순위 | 2순위 (폴백) | 근거 |
|---|---|---|---|
| **프레임워크** | Next.js 15 App Router + TypeScript strict | Vite SPA | SSR/API Route 겸용, 이미지 최적화 내장 |
| **편집 UI SDK** | Filerobot Image Editor (MIT) | TOAST UI Image Editor (MIT, 유지보수 침체) | 2024년 말 릴리스, React 컴포넌트 일급 지원 |
| **뷰티 필터 (클라이언트)** | MediaPipe Face Mesh + WebGL 셰이더 | JeelizFaceFilter (Apache-2.0) | WASM 불필요, 브라우저 네이티브, 60 FPS 달성 |
| **뷰티 필터 (서버)** | GPUPixel (Apache-2.0, 네이티브 서버) | — | WASM 포트 미검증, 서버 사이드 네이티브 실행 권장 |
| **얼굴 복원 AI** | GFPGAN v1.4 (Apache-2.0 코드, 가중치 주의) | CodeFormer (NTU S-Lab, **비상업**) | SNS 뷰티 품질, 속도 우위 |
| **업스케일** | Real-ESRGAN x4plus (BSD-3) | SwinIR (Apache-2.0, 속도 3–5× 느림) | 속도·품질 균형 최적 |
| **배경 제거** | rembg u2net (MIT) | BRIA RMBG-2.0 (**비상업**, 라이선스 협의 필요) | rembg만 완전 상업 사용 가능 |
| **인페인팅** | LaMa (Apache-2.0) | — | 해상도 강인, 빠른 CPU 추론 가능 |
| **AI 서빙** | FastAPI + ONNX Runtime | Triton (GPU 멀티모델 필요 시) | 중소 규모 MVP에 과잉 설계 방지 |
| **큐잉** | Celery + Redis | — | FastAPI 생태계 자연스러운 연동 |
| **DB ORM** | Drizzle ORM | Prisma (v7 이후 성능 개선됨) | 번들 7.4 KB, cold-start 우위 |
| **인증** | Auth.js (NextAuth v5) | Clerk (빠른 출시 우선 시) | 오픈소스, 벤더 락인 없음 |
| **스토리지** | Cloudflare R2 | AWS S3 | 이그레스 무료, 이미지 전송 비용 최소화 |
| **관측성** | Sentry + OpenTelemetry | — | 표준 조합 |

---

## A. 웹 이미지 편집기 SDK 비교

### A-1. TOAST UI Image Editor (`nhn/tui.image-editor`)

| 항목 | 내용 |
|---|---|
| **라이선스** | MIT |
| **GitHub 스타** | 7,600+ |
| **최신 버전** | v3.15.3 (2022-04-25 — **마지막 릴리스**) |
| **활성도** | 낮음. 263개 이슈 미해결, 27개 PR 방치 상태. 2022년 이후 신규 릴리스 없음 |
| **React 통합** | `@toast-ui/react-image-editor` 래퍼 별도 (스타 118개) |
| **기능** | 자르기, 회전, 뒤집기, 드로잉, 텍스트, 필터(그레이스케일/세피아/블러/샤픈/블렌드 등), 아이콘 |
| **Canvas 기반** | Fabric.js 위에서 동작 |
| **최소 크기 요구** | 550×450px 이상 |
| **장점** | MIT, 기능 완성도 높음, 문서 풍부 |
| **단점** | 2022년 이후 사실상 유지보수 중단, 오래된 Fabric.js 의존성, 모바일 UX 열악 |

**결론**: MVP 초기에는 사용 가능하나, 장기 운영 시 리스크. 커스텀 UI를 많이 올릴 경우 기술부채 발생.

---

### A-2. Filerobot Image Editor (`scaleflex/filerobot-image-editor`)

| 항목 | 내용 |
|---|---|
| **라이선스** | MIT |
| **GitHub 스타** | 1,800+ |
| **최신 버전** | v4.9.1 (2024-12-30 — 활성 유지) |
| **활성도** | 중간. 67개 이슈 오픈. 2024년 말 릴리스 |
| **React 통합** | `react-filerobot-image-editor` — 퍼스트클래스 React 컴포넌트 |
| **번들 크기** | CDN 버전 938 KB (minified), 코드 스플리팅 고려 필요 |
| **기능** | 자르기/리사이즈, 필터, 파인튠(밝기/명암/채도), 어노테이션, 워터마크, 텍스트 |
| **알려진 이슈** | 고 DPI 기기에서 크래시 가능성, CORS 이슈(크로미움), 텍스트 워터마크 다중 행 미지원 |
| **장점** | MIT, 2024년 활성 릴리스, React 네이티브, 모던 UI |
| **단점** | TOAST UI 대비 스타 수 적음, 번들 938 KB 주의 |

**결론**: photo-magic MVP **1순위**. 2024년 릴리스 + React 지원 + MIT.

---

### A-3. Pintura Image Editor (`pqina.nl/pintura`)

| 항목 | 내용 |
|---|---|
| **라이선스** | **상업 유료** (소스 비공개 SDK) |
| **가격** | Personal €169/년 (1 프로덕트), Developer €749/년/시트 (무제한 프로덕트) |
| **React 통합** | `@pqina/react-pintura` — 공식 지원 |
| **기능** | 자르기, 필터, 파인튠, 스티커, 어노테이션, 비디오 편집(Developer 이상) |
| **영구 라이선스** | 구독 만료 후에도 기존 버전 계속 사용 가능 |
| **장점** | 폴리시 높음, React Native 지원, 13개 언어 로케일 |
| **단점** | 유료 (오픈소스 프로젝트 불가), 소스 비공개 |

**결론**: 예산이 있고 UI 품질이 최우선이면 고려. MVP 단계에서는 비용 리스크. **상업 라이선스 필수**.

---

### A-4. 기타

- **react-photo-editor** (npm): 경량 MIT 라이브러리, 기능 제한적. 풀 에디터 대체 불가.
- **Ente Photo Editor SDK** (`ente-io/photo-editor-sdk`): 2024년 기준 포크/초기 단계, 프로덕션 사용 불충분.

---

## B. 뷰티 필터 엔진 비교

### B-1. GPUPixel (`pixpark/gpupixel`)

| 항목 | 내용 |
|---|---|
| **라이선스** | Apache-2.0 |
| **GitHub 스타** | 2,200+ |
| **최신 버전** | v1.3.1 (2025-06-27 릴리스) |
| **언어** | C++11 + OpenGL/ES |
| **지원 플랫폼** | iOS, Android, macOS, Windows, Linux |
| **Web/WASM 지원** | **공식 미지원** |
| **뷰티 필터** | 피부 스무딩, 미백, 얼굴 슬리밍, 눈 확대 등 (FaceBetter 연동으로 확장) |

**WASM 빌드 가능성 조사 결과**:
- 공식 문서, GitHub 이슈, 릴리스 어디에도 WebAssembly/Emscripten 빌드 언급 없음
- C++11 + OpenGL/ES 코드베이스는 이론적으로 Emscripten + WebGL 타겟으로 빌드 가능하나 미검증
- Mars-Face 얼굴 감지 라이브러리(v1.3 신규 도입)의 WASM 호환성 불명확
- 커뮤니티 포크에서 WASM 포트 시도 사례 미발견

**결론: WASM 빌드 현실적으로 불가능 수준 (미검증, 커뮤니티 사례 전무)**. MVP에서 웹 클라이언트 뷰티 필터로 사용 불가. 서버 사이드 네이티브 바이너리로는 사용 가능.

---

### B-2. MediaPipe Face Mesh / Face Detection (Google)

| 항목 | 내용 |
|---|---|
| **라이선스** | Apache-2.0 |
| **npm 패키지** | `@mediapipe/face_mesh`, `@mediapipe/tasks-vision` |
| **플랫폼** | 브라우저 (WebAssembly + WebGL 가속) |
| **랜드마크 수** | 468개 3D 얼굴 랜드마크 |
| **성능** | 모바일 GPU에서 50~1000 FPS (네이티브), 브라우저 WebGL 기준 30~60 FPS 달성 가능 |
| **React 통합** | 가능. `@mediapipe/tasks-vision`으로 직접 연동 |
| **활성도** | Google AI Edge팀 공식 유지, 2025 활성 |

**웹 뷰티 필터 구현 전략**: MediaPipe로 468개 랜드마크 추출 → WebGL 셰이더(GLSL)로 피부 스무딩/미백 처리. 추가 라이브러리 없이 구현 가능.

**결론**: 웹 클라이언트 실시간 뷰티 필터 **1순위**. Apache-2.0, 브라우저 네이티브, 60 FPS 달성.

---

### B-3. JeelizFaceFilter

| 항목 | 내용 |
|---|---|
| **라이선스** | Apache-2.0 |
| **특징** | 경량 WebGL 기반 멀티 페이스 추적 |
| **Three.js/Babylon.js 연동** | 공식 예제 제공 |
| **성능** | WebGL 데모가 Canvas2D보다 최적화 |
| **단점** | AR 필터 특화, 정적 이미지 편집보다 실시간 카메라 스트림에 최적화 |

**결론**: 카메라 실시간 필터(스냅챗 스타일)에 적합. SNS 사진 편집(정적 이미지) 뷰티 필터로는 MediaPipe가 더 적합.

---

### B-4. vladmandic/face-api

| 항목 | 내용 |
|---|---|
| **라이선스** | MIT |
| **상태** | **2025년 2월 아카이브 처리 (유지보수 중단)** |
| **대체** | 저자가 `Human` 라이브러리로 이전 권장 |

**결론**: 사용 금지. 아카이브 상태.

---

## C. AI 이미지 보정 (서버사이드 파이프라인)

### C-1. GFPGAN (`TencentARC/GFPGAN`)

| 항목 | 내용 |
|---|---|
| **라이선스 (코드)** | Apache-2.0 |
| **라이선스 (가중치)** | 일부 가중치에 비상업 제한 가능성 — **반드시 직접 확인 필요** |
| **버전** | v1.3, v1.4, RestoreFormer++ |
| **SNS 뷰티 적합성** | v1.4 기준: 자연스러운 얼굴 복원, 피부 텍스처 보존 |
| **속도** | CodeFormer 대비 약 1.7× 빠름 (약 6초 vs 10초, GPU 기준) |
| **품질 순위** | 2025 벤치마크: CodeFormer(w=0.7) > GFPGAN v1.4 |

**상업 라이선스 주의**: 코드 자체는 Apache-2.0이나, 일부 사전학습 가중치가 비상업 조건일 수 있음. GitHub 공식 이슈에서도 미해결 상태(2025-04 기준 답변 없음). **상업 배포 전 TencentARC에 직접 문의 필수**.

**RestoreFormer++**: GAN 아키텍처 개선. GFPGAN v1.4보다 품질 약간 우위이나 속도 느림.

---

### C-2. CodeFormer (`sczhou/CodeFormer`)

| 항목 | 내용 |
|---|---|
| **라이선스** | **NTU S-Lab License 1.0 — 비상업 전용** |
| **상업 사용** | 금지. 별도 상업 라이선스 협의 필요 |
| **품질** | 2025 벤치마크 1위 (w=0.7 설정 기준) |
| **특징** | `w` 파라미터로 복원 강도 조절 가능 (0=충실도, 1=품질) |
| **SNS 적합성** | 최고 품질이나 상업 사용 불가 |

**결론**: **photo-magic 상업 서비스에 사용 불가**. 라이선스 협의 없이는 배포 금지.

---

### C-3. Real-ESRGAN

| 항목 | 내용 |
|---|---|
| **라이선스** | BSD-3-Clause |
| **상업 사용** | 가능 |
| **모델** | x4plus (범용), x4plus-anime (애니 특화), x2plus |
| **성능** | SwinIR 대비 3~5× 빠름, 품질은 SwinIR보다 약간 낮음 |
| **SNS 용도** | x4plus 모델이 인물 사진 업스케일에 적합 |
| **추론 환경** | GPU 필수 (CUDA). ONNX 변환 후 CPU 가능하나 느림 |

---

### C-4. SwinIR / HAT

| 항목 | 내용 |
|---|---|
| **라이선스** | Apache-2.0 |
| **품질** | Real-ESRGAN 대비 선명도 우위 |
| **속도** | Real-ESRGAN 대비 3~5× 느림 |
| **웹 추론** | 느린 속도로 배치 처리에만 적합 |

**결론**: 속도가 중요한 SNS 서비스에서는 Real-ESRGAN 우선. SwinIR은 고품질 오프라인 처리에 한정.

---

### C-5. 배경 제거

#### rembg (`danielgatis/rembg`)

| 항목 | 내용 |
|---|---|
| **라이선스** | **MIT (완전 상업 사용 가능)** |
| **모델** | u2net, u2netp, isnet-general-use 등 선택 가능 |
| **설치** | `pip install rembg` |
| **추론 속도** | CPU 가능, GPU 권장 |
| **주의** | BRIA 모델 사용 시 해당 모델 라이선스 별도 확인 필요 |

#### BRIA RMBG-1.4 / RMBG-2.0

| 항목 | 내용 |
|---|---|
| **라이선스** | **CC BY-NC 4.0 — 비상업 전용** |
| **상업 사용** | 별도 계약 필요 (유료, $0.018/생성 기준) |
| **품질** | RMBG-2.0: 90% 정확도, Adobe Photoshop 46% 대비 압도적 |
| **결론** | 상업 서비스에서 무료 사용 불가 |

#### MODNet / BackgroundMattingV2

| 항목 | 내용 |
|---|---|
| **MODNet 라이선스** | Apache-2.0 (상업 가능) |
| **특징** | 실시간 영상 매팅 특화, 정적 이미지 배경 제거보다 영상에 최적 |
| **BackgroundMattingV2** | MIT, 고해상도 매팅 |

**결론**: MVP에서 `rembg + u2net` (MIT). 품질 고도화 시 MODNet 추가 검토.

---

### C-6. 인페인팅 — LaMa (`advimman/lama`)

| 항목 | 내용 |
|---|---|
| **라이선스** | Apache-2.0 |
| **논문** | WACV 2022, Fourier Convolutions |
| **특징** | 대형 마스크에 강인, 해상도 독립적 |
| **CPU 추론** | 가능 (느리지만 동작) |
| **SNS 용도** | 객체 제거, 불필요한 요소 인페인팅 |
| **통합 예시** | `lama-cleaner` 래퍼 사용 가능 |

---

## D. 프론트엔드 프레임워크 / 런타임

### D-1. Next.js 15 App Router vs Vite SPA

| 기준 | Next.js 15 App Router | Vite SPA |
|---|---|---|
| **SSR/SEO** | 기본 지원 | 별도 설정 필요 |
| **API Route** | 내장 (`app/api/`) | 별도 백엔드 필요 |
| **번들러** | Turbopack (Stable, cold start 3~5초) | Vite (sub-second HMR) |
| **이미지 최적화** | `next/image` 내장 | 별도 처리 |
| **WebGPU 지원** | 가능 (ONNX Runtime Web 연동 예제 다수) | 가능 |
| **적합 상황** | API + 프론트 통합, SSR 필요 시 | 순수 SPA, 백엔드 분리 |

**photo-magic 권장**: **Next.js 15 App Router**. API Route로 이미지 처리 엔드포인트 통합, SSR로 초기 로딩 최적화, `next/image`로 이미지 서빙 최적화.

---

### D-2. WebGL vs WebGPU 브라우저 호환성 (2025-2026 기준)

| API | Chrome | Firefox | Safari | Mobile |
|---|---|---|---|---|
| **WebGL 2.0** | 전체 지원 | 전체 지원 | 전체 지원 | 광범위 지원 |
| **WebGPU** | 지원 (v113+) | v141 (Windows), v145 (macOS) | Safari 26.0+ (macOS/iOS Tahoe) | Android 일부, iOS Safari 26+ |
| **OffscreenCanvas** | 지원 | 지원 | 지원 (부분) | 가변적 |

**현재 권장**: WebGL 2.0 기반 구현 (범용성). WebGPU는 Safari 지원이 macOS Tahoe 26 이상으로 제한되어 2026년 이전 메인 타겟으로 부적합. 점진적 강화(WebGPU 지원 시 활성화) 전략 권장.

---

### D-3. Web Worker / OffscreenCanvas 전략

```
[Main Thread] → postMessage(imageData) → [Web Worker]
[Web Worker] → OffscreenCanvas.getContext('2d' | 'webgl2')
            → 필터 처리 → transferToImageBitmap()
            → postMessage(bitmap, [bitmap])
[Main Thread] → canvas.drawImage(bitmap)
```

- **OffscreenCanvas**: Chrome/Edge 완전 지원, Safari 부분 지원. 이미지 연산 메인 스레드 블로킹 제거.
- **전략**: 1MB 이상 이미지 처리는 Web Worker 오프로드. 소형 필터는 메인 스레드.
- **알려진 이슈**: Safari OffscreenCanvas에서 WebGL2 컨텍스트 일부 미지원. Canvas2D fallback 필수.

---

### D-4. WASM 런타임

| 런타임 | 언어 | 도구체인 | 적합 용도 |
|---|---|---|---|
| **Emscripten** | C/C++ | `emcc` | C++ 라이브러리 포팅 |
| **wasm-pack** | Rust | `wasm-pack build` | Rust 라이브러리 |
| **AssemblyScript** | TypeScript 유사 | `asc` | 신규 작성 WASM |

**photo-magic 권장**: 커스텀 이미지 필터를 Rust + wasm-pack으로 구현. C++ 라이브러리 포팅은 Emscripten이나 GPUPixel처럼 OpenGL 의존성이 있으면 WASM 변환 복잡도 급증.

---

## E. 백엔드 AI 파이프라인

### E-1. FastAPI vs Node.js

| 기준 | FastAPI (Python) | Node.js |
|---|---|---|
| **AI 라이브러리 생태계** | 압도적 우위 (PyTorch, ONNX, cv2) | 제한적 (ONNX Runtime, TF.js) |
| **이미지 처리** | Pillow, OpenCV 완전 지원 | Sharp (빠르지만 AI 모델 제한) |
| **비동기 처리** | asyncio 기반 | 네이티브 비동기 |
| **GPU 모델 로딩** | Python 생태계 자연스러움 | 복잡한 바인딩 필요 |

**결론**: AI 파이프라인은 **FastAPI**. Node.js는 API Gateway/BFF 레이어에만 한정.

---

### E-2. GPU 필요 vs CPU 가능 분류

| 모델 | GPU 필요 | CPU 가능 | 비고 |
|---|---|---|---|
| GFPGAN v1.4 | 권장 (CUDA) | 가능 (느림, ~30초) | ONNX 변환 후 CPU 가속 |
| Real-ESRGAN x4plus | 권장 | 가능 (매우 느림) | 4K 이미지 시 GPU 필수 |
| LaMa | 가능 | 가능 | CPU에서도 수 초 이내 |
| rembg u2net | 권장 | 가능 | CPU 10~30초, GPU 1~3초 |
| MediaPipe (클라이언트) | — | 브라우저 WebGL | 서버리스 |

---

### E-3. 모델 서빙 프레임워크 비교

| 프레임워크 | 장점 | 단점 | photo-magic 적합도 |
|---|---|---|---|
| **FastAPI + ONNX Runtime** | 단순, 직접 제어, CPU/GPU 모두 | 배칭 수동 구현 | MVP 최적 ★★★★★ |
| **Triton Inference Server** | 멀티모델, GPU 배칭 최적화, 멀티프레임워크 | 운영 복잡도 높음 | M3 스케일업 시 ★★★ |
| **TorchServe** | PyTorch 특화 | 다른 모델 통합 어려움 | ★★ |
| **Replicate API** | 즉시 사용 가능 | 비용, 레이턴시, 벤더 의존 | 프로토타입 전용 ★★ |

---

### E-4. 큐잉: Celery + Redis

```
FastAPI → Redis (Celery Broker) → Celery Worker (GPU)
       → 작업 상태 폴링 or WebSocket Push
```

- **Celery**: Python FastAPI 생태계 표준. 재시도, 우선순위, 스케줄링 지원.
- **Redis**: Celery 브로커 + 결과 백엔드로 단일 인스턴스 활용.
- **BullMQ**: Node.js 스택 한정. photo-magic은 Python 백엔드이므로 제외.

---

### E-5. 스토리지: Cloudflare R2 권장

| 항목 | Cloudflare R2 | AWS S3 |
|---|---|---|
| **이그레스 비용** | **$0/GB** | $0.09/GB |
| **스토리지** | $0.015/GB/월 | $0.023/GB/월 |
| **S3 호환** | 완전 호환 (presigned URL 지원) | — |
| **CDN 통합** | Cloudflare CDN 무료 연동 | CloudFront 별도 과금 |
| **월 무료 한도** | 10 GB 스토리지, 1000만 읽기 | 5 GB (12개월) |

**결론**: 이미지 전송이 많은 SNS 앱에서 이그레스 무료 R2가 압도적으로 유리.

---

## F. 기타 인프라

### F-1. DB ORM: Drizzle ORM 권장

| 항목 | Drizzle ORM | Prisma v7 |
|---|---|---|
| **번들 크기** | ~7.4 KB (gzip) | ~1.6 MB |
| **Cold Start** | 우수 | Prisma v7 이후 개선 |
| **타입 안전성** | SQL 수준 타입 추론 | 스키마 생성 기반 |
| **Edge 지원** | Vercel Edge, CF Workers | 제한적 |
| **마이그레이션** | Drizzle Kit | Prisma Migrate |

---

### F-2. 인증: Auth.js (NextAuth v5) 권장

| 항목 | Auth.js (NextAuth v5) | Clerk |
|---|---|---|
| **라이선스** | MIT 오픈소스 | 클로즈드코어 |
| **비용** | 무료 | 무료 티어 + 유료 플랜 |
| **소셜 로그인** | 80+ OAuth 프로바이더 | 15+ |
| **UI 컴포넌트** | 없음 (직접 구현) | 내장 |
| **Next.js 15 지원** | App Router 공식 지원 | v15.2.3+ 필요 |
| **벤더 락인** | 없음 | 있음 |

**MVP 빠른 출시 우선 시**: Clerk (5분 설정). 장기 운영 오픈소스 선호 시: Auth.js.

---

### F-3. CI/CD: GitHub Actions

- Docker 이미지 빌드 + ECR/GCR 푸시
- AI 모델 가중치는 DVC 또는 S3/R2 별도 관리 (Git LFS 금지)
- GPU 워커 CI 비용 주의: 실제 GPU 테스트는 셀프호스티드 러너 권장

---

## 핵심 의사결정

### Q1: GPUPixel WASM 실현 가능한가?

**조사 결과**:
- 공식 문서: Web/WASM 플랫폼 미언급. iOS/Android/macOS/Windows/Linux만 공식 지원.
- GitHub Issues (2025-04 기준): WASM 관련 이슈/논의 전무.
- 기술적 장벽: C++11 + OpenGL/ES 코드베이스. Emscripten으로 빌드 이론상 가능하나 Mars-Face 얼굴 감지 라이브러리(v1.3 신규 도입)의 WASM 호환성 불명확. OpenGL ES → WebGL 매핑 필요.
- 커뮤니티 포크: WASM 포트 시도 사례 미발견.

**결론**: **현실적으로 불가능 (단기 MVP 기준)**. 웹 클라이언트 뷰티 필터로 GPUPixel WASM 사용 불가. 대안: MediaPipe Face Mesh + 커스텀 WebGL 셰이더. GPUPixel은 서버사이드 네이티브 바이너리로만 활용 가능.

---

### Q2: GFPGAN vs CodeFormer — SNS 뷰티에 더 적합한 것은?

| 기준 | GFPGAN v1.4 | CodeFormer (w=0.7) |
|---|---|---|
| **품질** | ★★★★ | ★★★★★ (2025 벤치마크 1위) |
| **속도** | ~6초 (GPU) | ~10초 (GPU) |
| **라이선스** | Apache-2.0 코드, 가중치 주의 | **비상업 전용 (NTU S-Lab)** |
| **조절 가능성** | 낮음 | w 파라미터로 강도 조절 |
| **SNS 자연스러움** | 우수 | 최우수 |

**결론**: CodeFormer가 품질 우위이나 **상업 라이선스 불가**. photo-magic 상업 서비스에서는 **GFPGAN v1.4**를 기본으로 사용하되, 가중치 라이선스 TencentARC 직접 확인 필수. CodeFormer 사용 시 반드시 sczhou와 상업 라이선스 협의 후 진행.

---

### Q3: 웹 실시간 뷰티 필터 vs 서버 배치 — 어느 쪽이 UX에 유리?

| 기준 | 웹 실시간 (클라이언트) | 서버 배치 |
|---|---|---|
| **레이턴시** | 즉각 (0ms) | 3~15초 대기 |
| **품질** | 중간 (WebGL 셰이더 한계) | 높음 (AI 모델) |
| **비용** | GPU 서버 불필요 | GPU 서버 필요 |
| **오프라인** | 가능 | 불가 |
| **구현 복잡도** | WebGL 셰이더 작성 필요 | AI 파이프라인 구축 |
| **모바일 성능** | 기기 의존적 | 서버 일관 품질 |

**결론**: **하이브리드 전략 권장**
- M1 MVP: 서버 배치 AI (품질 우선, 구현 빠름)
- M2 뷰티 필터: 클라이언트 실시간 (MediaPipe + WebGL) + 서버 고품질 병행
- 사용자 경험: "즉시 프리뷰(클라이언트) → 최종 처리(서버)" 패턴

---

## 결정 트리 — 시나리오별 스택 조합

### M1: MVP 최단 경로 (4주)

```
프론트엔드: Next.js 15 App Router
편집 UI:    Filerobot Image Editor (react-filerobot-image-editor)
뷰티 필터:  서버 배치 (빠른 구현)
AI 백엔드:  FastAPI + rembg(배경제거) + GFPGAN v1.4(얼굴보정) + Real-ESRGAN(업스케일)
서빙:       ONNX Runtime (GPU 1장)
큐잉:       Celery + Redis
스토리지:   Cloudflare R2
DB:         PostgreSQL + Drizzle ORM
인증:       Clerk (빠른 출시)
```

**왜 이 조합?**
- Filerobot: 2024년 활성 릴리스 + React 네이티브
- ONNX Runtime: 단일 모델 MVP에 Triton 과잉 설계 방지
- Clerk: UI 컴포넌트 포함으로 인증 구현 시간 0

---

### M2: 뷰티 필터 활성화

```
추가: MediaPipe Face Mesh + 커스텀 WebGL 셰이더 (피부 스무딩, 미백)
      → OffscreenCanvas + Web Worker로 메인 스레드 블로킹 제거
전략: 클라이언트 실시간 프리뷰 + "최종 저장" 시 서버 고품질 처리
비교: 서버 배치(품질↑, 레이턴시↑) vs 클라이언트(즉각, 품질 중간)
결론: "프리뷰는 클라이언트, 저장은 서버" 하이브리드
```

---

### M3: AI 고도화

```
추가 모델:  LaMa 인페인팅 (객체 제거)
업스케일:   Real-ESRGAN → 품질 우선 시 SwinIR 옵션 추가
서빙:       트래픽 증가 시 Triton 전환 (멀티모델 배칭)
인증:       Clerk → Auth.js 마이그레이션 (벤더 락인 해제)
WebGPU:     Safari 26+ 보급률 확인 후 클라이언트 WebGPU 전환 검토
```

---

## 종합 추천

| 레이어 | 1순위 | 2순위(폴백) | 핵심 근거 |
|---|---|---|---|
| **편집 UI** | Filerobot Image Editor | TOAST UI Image Editor | MIT, 2024 활성, React 네이티브 |
| **클라이언트 뷰티** | MediaPipe + WebGL 셰이더 | JeelizFaceFilter | Apache-2.0, 브라우저 네이티브, 60 FPS |
| **서버 뷰티** | GPUPixel 네이티브 바이너리 | — | WASM 포트 불가, 서버 전용 |
| **얼굴 복원** | GFPGAN v1.4 (가중치 라이선스 확인 필수) | — | **CodeFormer 비상업 금지** |
| **업스케일** | Real-ESRGAN x4plus (BSD-3) | SwinIR (속도 희생) | 속도·품질 균형 |
| **배경 제거** | rembg + u2net (MIT) | MODNet (Apache-2.0) | **BRIA 비상업 금지** |
| **인페인팅** | LaMa (Apache-2.0) | — | CPU 추론 가능, 상업 허용 |
| **AI 서빙** | FastAPI + ONNX Runtime | Triton (M3 스케일) | MVP 단순성 우선 |
| **큐잉** | Celery + Redis | — | Python 생태계 표준 |
| **DB** | Drizzle ORM + PostgreSQL | Prisma (v7+) | 7.4 KB 번들, Edge 지원 |
| **인증** | Clerk (MVP) → Auth.js (장기) | — | MVP 속도 vs 장기 오픈소스 |
| **스토리지** | Cloudflare R2 | AWS S3 | 이그레스 무료 |

---

## 라이선스 위험 요약

> 상업 서비스 배포 전 반드시 확인할 항목

| 컴포넌트 | 라이선스 | 위험도 | 조치 |
|---|---|---|---|
| **CodeFormer** | NTU S-Lab (비상업) | 🔴 높음 | **사용 금지** 또는 sczhou 상업 계약 |
| **GFPGAN 가중치** | Apache-2.0 + 제3자 의존성 불명확 | 🟡 중간 | TencentARC 직접 문의 필수 |
| **BRIA RMBG-1.4/2.0** | CC BY-NC 4.0 (비상업) | 🔴 높음 | **사용 금지** 또는 BRIA 상업 계약 |
| **Pintura** | 상업 유료 | 🟡 중간 | 라이선스 구매 필요 |
| **GPUPixel (코드)** | Apache-2.0 | 🟢 낮음 | 사용 가능 |
| **rembg (코드)** | MIT | 🟢 낮음 | 완전 상업 사용 가능 |
| **LaMa** | Apache-2.0 | 🟢 낮음 | 사용 가능 |
| **Real-ESRGAN** | BSD-3-Clause | 🟢 낮음 | 사용 가능 |
| **MediaPipe** | Apache-2.0 | 🟢 낮음 | 사용 가능 |
| **Filerobot IE** | MIT | 🟢 낮음 | 사용 가능 |

---

## 참고 출처

- [TOAST UI Image Editor GitHub](https://github.com/nhn/tui.image-editor)
- [Filerobot Image Editor GitHub](https://github.com/scaleflex/filerobot-image-editor)
- [Pintura Pricing](https://pqina.nl/pintura/pricing/)
- [GPUPixel Official Docs](https://gpupixel.pixpark.net/guide/intro)
- [GPUPixel GitHub](https://github.com/pixpark/gpupixel)
- [MediaPipe Face Mesh](https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/face_mesh.md)
- [JeelizFaceFilter GitHub](https://github.com/jeeliz/jeelizFaceFilter)
- [vladmandic/face-api (Archived 2025-02)](https://github.com/vladmandic/face-api)
- [GFPGAN GitHub](https://github.com/TencentARC/GFPGAN)
- [CodeFormer GitHub](https://github.com/sczhou/CodeFormer) — NTU S-Lab License
- [BRIA RMBG-2.0 HuggingFace](https://huggingface.co/briaai/RMBG-2.0) — CC BY-NC 4.0
- [rembg MIT License](https://github.com/danielgatis/rembg/blob/main/LICENSE.txt)
- [LaMa GitHub](https://github.com/advimman/lama) — Apache-2.0
- [Real-ESRGAN vs SwinIR 비교 (Medium)](https://rockyshikoku.medium.com/which-super-resolution-show-realesrgan-and-swinir-image-quality-and-speed-comparison-1ff15ae15d11)
- [WebGPU 브라우저 지원 현황 (web.dev)](https://web.dev/blog/webgpu-supported-major-browsers)
- [OffscreenCanvas (web.dev)](https://web.dev/articles/offscreen-canvas)
- [GFPGAN vs CodeFormer 벤치마크 (Genspark)](https://www.genspark.ai/spark/evaluating-face-enhancement-tools-gpen-codeformer-restorformer-and-gfpgan-in-2024/419c04c3-7206-40eb-8d82-9a087eb0541d)
- [Drizzle vs Prisma 비교 (2026)](https://makerkit.dev/blog/tutorials/drizzle-vs-prisma)
- [Cloudflare R2 vs AWS S3](https://www.digitalapplied.com/blog/cloudflare-r2-vs-aws-s3-comparison)
- [Auth.js vs Clerk 비교 (Medium)](https://chhimpashubham.medium.com/nextauth-js-vs-clerk-vs-auth-js-which-is-best-for-your-next-js-app-in-2025-fc715c2ccbfd)
- [FastAPI vs Triton 비교 (Medium)](https://medium.com/@hemanthodarwinr/nvidia-triton-vs-fastapi-choosing-the-right-ml-serving-solution-in-2024-3e6c771f3cf6)
