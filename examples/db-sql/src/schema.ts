import { sql } from 'drizzle-orm';
import { bigint, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// Same table as the Rust example's schema.sql. `npm run db:generate` turns changes here into
// SQL migrations in drizzle/.
export const users = pgTable('example_users', {
  id: bigint('id', { mode: 'number' }).primaryKey(),
  email: text('email').notNull().unique(),
  nickname: text('nickname'),
  created: timestamp('created', { withTimezone: true, mode: 'string' }).notNull().defaultNow(), // UTC text
  meta: jsonb('meta')
    .$type<{ plan: string }>()
    .notNull()
    .default(sql`'{}'::jsonb`),
});

export type User = typeof users.$inferSelect;
