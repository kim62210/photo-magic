const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export const env = {
  APP_URL,
  API_URL,
  SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN ?? '',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEV: process.env.NODE_ENV !== 'production',
} as const;

export type Env = typeof env;
