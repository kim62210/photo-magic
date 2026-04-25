import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

export type DbClient = ReturnType<typeof createClient>;

export interface DbClientOptions {
  url: string;
  max?: number;
  ssl?: 'require' | 'prefer' | 'allow' | 'verify-full' | false;
}

export function createClient(options: DbClientOptions) {
  const sql = postgres(options.url, {
    max: options.max ?? 10,
    ssl: options.ssl ?? 'prefer',
    prepare: false,
    idle_timeout: 20,
  });
  return drizzle(sql, { schema });
}
