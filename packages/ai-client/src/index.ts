/**
 * AI 작업 클라이언트 SDK — 정적 배포 환경에서는 mock 모드로 동작.
 * 실제 GPU API가 켜지면 baseUrl만 바꾸면 동일 인터페이스로 전환된다.
 */

export type AiJobType = 'enhance' | 'background-removal' | 'upscale' | 'inpaint';

export type AiJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface AiJob {
  id: string;
  type: AiJobType;
  status: AiJobStatus;
  inputUrl?: string;
  outputUrl?: string;
  progress?: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiClientConfig {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  /** Mock 모드: 실제 API 호출 없이 가짜 결과 반환. 정적 배포 환경 기본값. */
  mock?: boolean;
}

export interface SubmitJobOptions {
  type: AiJobType;
  blob: Blob;
  /** Optional model preference (e.g. 'gfpgan-v1.4', 'real-esrgan-x4plus') */
  model?: string;
  /** Optional metadata to forward */
  metadata?: Record<string, unknown>;
}

const MOCK_LATENCIES: Record<AiJobType, number> = {
  enhance: 800,
  'background-removal': 1500,
  upscale: 2400,
  inpaint: 2000,
};

export class AiClient {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;
  private readonly mock: boolean;

  constructor(config: AiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.fetcher = config.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.mock = config.mock ?? !this.baseUrl;
  }

  async submitJob(opts: SubmitJobOptions): Promise<AiJob> {
    if (this.mock) return this.mockSubmit(opts);

    const form = new FormData();
    form.append('file', opts.blob, 'input');
    if (opts.model) form.append('model', opts.model);
    if (opts.metadata) form.append('metadata', JSON.stringify(opts.metadata));
    const res = await this.fetcher(`${this.baseUrl}/api/v1/jobs/${opts.type}`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) throw new Error(`AI job ${opts.type} failed: ${res.status}`);
    return (await res.json()) as AiJob;
  }

  async getJob(id: string): Promise<AiJob> {
    if (this.mock) return this.mockGet(id);
    const res = await this.fetcher(`${this.baseUrl}/api/v1/jobs/${id}`);
    if (!res.ok) throw new Error(`AI job lookup failed: ${res.status}`);
    return (await res.json()) as AiJob;
  }

  /**
   * Stream job progress via Server-Sent Events. Yields each AiJob update.
   * Real implementation hits `/api/v1/jobs/<id>/stream`. Mock simulates progress.
   */
  async *streamJob(id: string): AsyncIterable<AiJob> {
    if (this.mock) {
      yield* this.mockStream(id);
      return;
    }
    const res = await this.fetcher(`${this.baseUrl}/api/v1/jobs/${id}/stream`);
    if (!res.ok || !res.body) throw new Error(`stream failed: ${res.status}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';
      for (const evt of events) {
        const dataLine = evt.split('\n').find((l) => l.startsWith('data: '));
        if (!dataLine) continue;
        try {
          yield JSON.parse(dataLine.slice(6)) as AiJob;
        } catch {
          // ignore malformed event
        }
      }
    }
  }

  private async mockSubmit(opts: SubmitJobOptions): Promise<AiJob> {
    const now = new Date().toISOString();
    return {
      id: `mock-${crypto.randomUUID()}`,
      type: opts.type,
      status: 'queued',
      createdAt: now,
      updatedAt: now,
    };
  }

  private async mockGet(id: string): Promise<AiJob> {
    const now = new Date().toISOString();
    return {
      id,
      type: 'enhance',
      status: 'succeeded',
      createdAt: now,
      updatedAt: now,
      outputUrl: undefined,
    };
  }

  private async *mockStream(id: string): AsyncIterable<AiJob> {
    const now = new Date().toISOString();
    const type: AiJobType = 'enhance';
    const total = MOCK_LATENCIES[type];
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      await new Promise((r) => setTimeout(r, total / steps));
      yield {
        id,
        type,
        status: i === steps ? 'succeeded' : 'running',
        progress: i / steps,
        createdAt: now,
        updatedAt: new Date().toISOString(),
      };
    }
  }
}

export function createMockClient(): AiClient {
  return new AiClient({ baseUrl: '', mock: true });
}
