// Migrations run from your machine or CI, never from the app.
// DATABASE_URL is the same connection string as the app's FASTEDGE_DB_SQL_main secret.
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
