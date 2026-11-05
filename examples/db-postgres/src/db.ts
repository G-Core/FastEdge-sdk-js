import { drizzle } from 'drizzle-orm/pg-proxy';
import { PostgresDatabase } from 'fastedge::db/postgres';

/**
 * Drizzle over the database bound to the app as `name`. The connection string stays with the
 * host; the app only knows the binding name.
 *
 * pg-proxy calls this once per query. `method === 'all'` wants rows as arrays (Drizzle maps the
 * columns), otherwise rows as objects.
 */
export function openDb(name: string) {
  const sqlDb = PostgresDatabase.open(name);
  return drizzle(async (sql, params, method) => {
    const { rows } = await sqlDb.query(sql, params, {
      rowMode: method === 'all' ? 'array' : 'object',
    });
    return { rows };
  });
}
