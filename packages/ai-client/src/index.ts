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
}

export class AiClient {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;

  constructor(config: AiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.fetcher = config.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  async submitJob(type: AiJobType, body: FormData): Promise<AiJob> {
    const res = await this.fetcher(`${this.baseUrl}/api/v1/jobs/${type}`, {
      method: 'POST',
      body,
    });
    if (!res.ok) throw new Error(`AI job ${type} failed: ${res.status}`);
    return (await res.json()) as AiJob;
  }

  async getJob(id: string): Promise<AiJob> {
    const res = await this.fetcher(`${this.baseUrl}/api/v1/jobs/${id}`);
    if (!res.ok) throw new Error(`AI job lookup failed: ${res.status}`);
    return (await res.json()) as AiJob;
  }
}
