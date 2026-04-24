# AI Enhancement Specification

## ADDED Requirements

### Requirement: Asynchronous Job Queue
시스템은 모든 AI 작업(얼굴 복원, 업스케일, 배경 제거, 인페인팅)을 Celery + Redis 기반 비동기 큐로 SHALL 처리한다. API 엔드포인트는 Job ID를 즉시 반환하고, 클라이언트는 폴링 또는 WebSocket으로 상태를 조회한다.

#### Scenario: Job ID returned immediately
- **WHEN** 클라이언트가 `/api/v1/ai/face-restore`에 이미지를 제출한다
- **THEN** 서버는 500ms 이내에 `{ "job_id": "...", "status": "queued" }`를 응답 MUST 한다

#### Scenario: Job status polling
- **WHEN** 클라이언트가 `GET /api/v1/jobs/{job_id}`를 호출한다
- **THEN** 서버는 `queued`, `processing`, `completed`, `failed` 중 하나의 상태를 반환 MUST 한다

#### Scenario: Job timeout
- **WHEN** 작업이 30초 이상 `processing` 상태로 남는다
- **THEN** 워커는 작업을 중단하고 `failed` 상태와 타임아웃 에러 코드를 기록 MUST 한다

### Requirement: Face Restoration with GFPGAN v1.4
시스템은 얼굴 복원을 GFPGAN v1.4(Apache-2.0 라이선스)로 SHALL 수행하며, CodeFormer는 비상업 라이선스로 인해 사용하지 아니 한다. 512×512 입력에서 GPU T4 기준 500ms 이내 처리를 목표로 한다.

#### Scenario: Face restore latency target
- **WHEN** T4 GPU 워커가 512×512 이미지에 대해 얼굴 복원을 실행한다
- **THEN** 처리 시간은 500ms 이하 MUST 한다

#### Scenario: GFPGAN model only
- **WHEN** 시스템 초기화 시점에 얼굴 복원 모델을 로드한다
- **THEN** 로드되는 모델 파일은 GFPGAN v1.4 가중치이며 CodeFormer 가중치는 번들에 포함되지 않 MUST 한다

#### Scenario: Result includes C2PA tag
- **WHEN** 얼굴 복원이 완료된다
- **THEN** 결과 이미지에는 "AI-edited: face restoration via photo-magic" C2PA 매니페스트가 삽입 MUST 한다

### Requirement: Image Upscaling with Real-ESRGAN x4plus
시스템은 업스케일을 Real-ESRGAN x4plus(BSD-3 라이선스)로 SHALL 수행한다. 1024×1024×4 출력 기준 T4 GPU에서 2초 이내 처리를 목표로 한다.

#### Scenario: Upscale latency target
- **WHEN** T4 GPU 워커가 256×256 입력을 4배 업스케일한다
- **THEN** 1024×1024 결과까지 처리 시간은 2초 이하 MUST 한다

#### Scenario: Scale factor options
- **WHEN** 클라이언트가 업스케일 요청에 `scale=2` 또는 `scale=4`를 지정한다
- **THEN** 워커는 해당 배율로 처리하고 다른 배율은 거부 MUST 한다

#### Scenario: Maximum output resolution cap
- **WHEN** 업스케일 결과가 8192×8192를 초과할 것으로 예상된다
- **THEN** 서버는 요청을 거부하고 해상도 초과 에러를 반환 MUST 한다

### Requirement: Background Removal with rembg and InSPyReNet
시스템은 배경 제거 기본 엔진으로 rembg u2net(MIT 라이선스)을, 프리미엄 엔진으로 InSPyReNet(머리카락 엣지 품질 우수)을 SHALL 제공한다. BRIA RMBG와 MODNet은 비상업 라이선스로 배제된다.

#### Scenario: Free tier uses u2net
- **WHEN** 무료 티어 사용자가 배경 제거를 요청한다
- **THEN** 워커는 rembg u2net으로 처리 MUST 한다

#### Scenario: Premium tier uses InSPyReNet
- **WHEN** Pro+ 사용자가 "고급 모드" 옵션으로 배경 제거를 요청한다
- **THEN** 워커는 InSPyReNet으로 처리 MUST 한다

#### Scenario: 1080p performance target
- **WHEN** 1080p 이미지를 서버 배경 제거로 처리한다
- **THEN** 전체 처리 시간(업로드 제외)은 3초 이하 MUST 한다

### Requirement: AI Inpainting with LaMa
시스템은 인페인팅(AI 지우개)을 LaMa(Apache-2.0)로 SHALL 수행한다. 클라이언트는 원본 이미지와 함께 마스크 이미지(PNG 알파)를 업로드한다.

#### Scenario: Inpaint with provided mask
- **WHEN** 클라이언트가 이미지와 마스크를 제출한다
- **THEN** 워커는 마스크 영역을 LaMa 모델로 재구성하고 나머지 영역은 픽셀 그대로 유지 MUST 한다

#### Scenario: Mask size mismatch
- **WHEN** 마스크 해상도가 원본 이미지와 일치하지 않는다
- **THEN** 서버는 400 에러와 "mask dimensions must match source" 메시지를 반환 MUST 한다

### Requirement: Usage Quota per Tier
시스템은 AI 작업에 대해 사용자 티어별 일일 쿼터를 SHALL 강제한다. 무료 티어는 일 10회, Pro는 일 100회, Pro+는 무제한(하드 상한 일 1000회)이다.

#### Scenario: Free tier quota exhaustion
- **WHEN** 무료 티어 사용자가 하루에 10번째 AI 작업을 성공한 뒤 11번째를 요청한다
- **THEN** 서버는 429 응답과 "쿼터 초과" 메시지를 반환 MUST 한다

#### Scenario: Quota resets at UTC midnight
- **WHEN** UTC 00:00이 경과한다
- **THEN** 모든 사용자 일일 쿼터 카운터는 0으로 리셋 MUST 한다

#### Scenario: Pro+ hard ceiling
- **WHEN** Pro+ 사용자가 하루 1000회를 초과해 요청한다
- **THEN** 서버는 429를 반환하고 남용 방지 플래그를 기록 MUST 한다

### Requirement: Result Caching by Image Hash
시스템은 AI 작업 결과를 입력 이미지 SHA-256 해시 + 작업 타입 + 파라미터 조합을 키로 SHALL 캐싱한다. 캐시 TTL은 24시간이다.

#### Scenario: Cache hit returns instant result
- **WHEN** 동일 이미지·동일 작업 조합이 24시간 내 재요청된다
- **THEN** 서버는 워커를 거치지 않고 캐시된 결과 URL을 반환 MUST 한다

#### Scenario: Cache miss triggers worker
- **WHEN** 캐시에 없는 요청이 들어온다
- **THEN** 서버는 큐에 작업을 등록하고 완료 시 결과를 캐시에 저장 MUST 한다

#### Scenario: Cache expiration
- **WHEN** 캐시 엔트리가 24시간을 초과한다
- **THEN** 해당 엔트리는 자동 삭제되고 다음 요청은 재처리 MUST 한다

### Requirement: Failure and Timeout Handling
시스템은 AI 작업 실패 시 사용자에게 실패 원인별 메시지를 SHALL 표시하며, 쿼터·해상도 초과 외의 서버 오류는 사용자 쿼터를 차감하지 아니 한다.

#### Scenario: Worker crash
- **WHEN** 워커가 OOM 또는 CUDA 에러로 크래시한다
- **THEN** 서버는 `failed` 상태를 반환하고 해당 요청은 쿼터에서 차감하지 않 MUST 한다

#### Scenario: Face not detected for restoration
- **WHEN** 얼굴 복원 입력 이미지에서 얼굴이 감지되지 않는다
- **THEN** 서버는 `failed` 상태와 "얼굴을 찾지 못했습니다" 사용자 메시지를 반환 MUST 한다

#### Scenario: Retry is client responsibility
- **WHEN** 작업이 `failed`로 끝난다
- **THEN** 서버는 자동 재시도를 수행하지 않고 클라이언트가 명시적으로 재요청 MUST 한다
