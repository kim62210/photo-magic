import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const subscriptionTier = pgEnum('subscription_tier', ['free', 'pro', 'pro_plus']);
export const aiJobType = pgEnum('ai_job_type', ['enhance', 'background_removal', 'upscale', 'inpaint']);
export const aiJobStatus = pgEnum('ai_job_status', ['queued', 'running', 'succeeded', 'failed']);
export const uploadPlatform = pgEnum('upload_platform', ['threads', 'instagram', 'tiktok', 'x']);
export const uploadStatus = pgEnum('upload_status', ['pending', 'succeeded', 'failed']);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 254 }).notNull(),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    displayName: varchar('display_name', { length: 64 }),
    avatarUrl: text('avatar_url'),
    birthYear: integer('birth_year'),
    tier: subscriptionTier('tier').notNull().default('free'),
    parentalConsentAt: timestamp('parental_consent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    emailUq: uniqueIndex('users_email_unique_idx').on(table.email),
    tierIdx: index('users_tier_idx').on(table.tier),
  }),
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 128 }).notNull(),
    userAgent: text('user_agent'),
    ipAddress: varchar('ip_address', { length: 64 }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => ({
    userIdx: index('sessions_user_idx').on(table.userId),
    tokenUq: uniqueIndex('sessions_token_unique_idx').on(table.tokenHash),
  }),
);

export const consents = pgTable(
  'consents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    documentType: varchar('document_type', { length: 32 }).notNull(),
    documentVersion: varchar('document_version', { length: 16 }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    ipAddress: varchar('ip_address', { length: 64 }),
  },
  (table) => ({
    userIdx: index('consents_user_idx').on(table.userId),
  }),
);

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tier: subscriptionTier('tier').notNull(),
    status: varchar('status', { length: 24 }).notNull(),
    externalRef: varchar('external_ref', { length: 128 }),
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).notNull(),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    userIdx: index('subscriptions_user_idx').on(table.userId),
  }),
);

export const aiJobs = pgTable(
  'ai_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: aiJobType('type').notNull(),
    status: aiJobStatus('status').notNull().default('queued'),
    inputKey: text('input_key').notNull(),
    outputKey: text('output_key'),
    progress: real('progress').default(0),
    errorMessage: text('error_message'),
    runtimeMs: integer('runtime_ms'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    userStatusIdx: index('ai_jobs_user_status_idx').on(table.userId, table.status),
    statusIdx: index('ai_jobs_status_idx').on(table.status),
  }),
);

export const uploads = pgTable(
  'uploads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    platform: uploadPlatform('platform').notNull(),
    status: uploadStatus('status').notNull().default('pending'),
    sourceKey: text('source_key').notNull(),
    platformPostId: varchar('platform_post_id', { length: 128 }),
    platformUrl: text('platform_url'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => ({
    userIdx: index('uploads_user_idx').on(table.userId),
    platformIdx: index('uploads_platform_idx').on(table.platform),
  }),
);

export const uploadTokens = pgTable(
  'upload_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    platform: uploadPlatform('platform').notNull(),
    encryptedToken: text('encrypted_token').notNull(),
    envelopeKeyId: varchar('envelope_key_id', { length: 64 }).notNull(),
    scope: text('scope'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => ({
    userPlatformIdx: index('upload_tokens_user_platform_idx').on(table.userId, table.platform),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  consents: many(consents),
  subscriptions: many(subscriptions),
  aiJobs: many(aiJobs),
  uploads: many(uploads),
  uploadTokens: many(uploadTokens),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type AiJob = typeof aiJobs.$inferSelect;
export type Upload = typeof uploads.$inferSelect;
