/// <reference types="@gcoredev/fastedge-sdk-js" />
import { KvDatabase, KvError } from 'fastedge::db/kv';

/** Requests one user may make per window. */
const LIMIT = 5;
const WINDOW_MS = 60_000;

async function app(event: FetchEvent): Promise<Response> {
  const user = new URL(event.request.url).searchParams.get('user') ?? 'anonymous';

  try {
    // "main" is the binding name; the host resolves it to the app's database.
    const db = KvDatabase.open('main');

    // One atomic batch: start the user's window counter if missing (it expires with the
    // window), count this request, count the visit.
    const window = `rl:${user}`;
    const [, requests, visits] = await db.batch([
      { op: 'set', key: window, value: '0', options: { ttlMs: WINDOW_MS, ifNotExists: true } },
      { op: 'incr', key: window },
      { op: 'incr', key: 'visits' },
    ]);

    if ((requests as number) > LIMIT) {
      return Response.json({ error: 'rate limited', user, limit: LIMIT }, { status: 429 });
    }
    return Response.json({ user, requests, limit: LIMIT, visits });
  } catch (error) {
    // e.g. code WRONGTYPE / ERR: "visits" holds something that isn't a counter
    if (error instanceof KvError && error.kind === 'operation') {
      return Response.json({ error: error.message, code: error.code }, { status: 500 });
    }
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}

addEventListener('fetch', (event) => event.respondWith(app(event)));
