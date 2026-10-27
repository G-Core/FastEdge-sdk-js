import { eq } from 'drizzle-orm';
import { SqlError } from 'fastedge::db/sql';

import { openDb } from './db';
import { users } from './schema';

async function app(event: FetchEvent): Promise<Response> {
  const idParam = new URL(event.request.url).searchParams.get('id');
  const id = idParam === null ? null : Number.parseInt(idParam, 10);

  try {
    // "main" is the binding name; the host resolves it to the app's database.
    const db = openDb('main');

    if (id !== null) {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user ? Response.json(user) : Response.json({ error: 'not found' }, { status: 404 });
    }
    return Response.json(await db.select().from(users).orderBy(users.id));
  } catch (error) {
    // Drizzle wraps driver errors; the SqlError is the cause.
    const cause = (error as { cause?: unknown }).cause ?? error;
    if (cause instanceof SqlError) {
      // e.g. 42P01 (undefined_table): migrations not applied yet
      return Response.json({ error: cause.message, code: cause.code }, { status: 500 });
    }
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(app(event));
});
