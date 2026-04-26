import { getEnv } from 'fastedge::env';
import { KvStore } from 'fastedge::kv';

const BLOOM_KEY = 'blocked-ips';

function app(event) {
  const storeName = getEnv('DENYLIST_STORE');
  if (!storeName) {
    return Response.json(
      { error: 'DENYLIST_STORE environment variable is not configured' },
      { status: 500 },
    );
  }

  const ip = event.client.address;
  if (!ip) {
    return Response.json({ error: 'client address unavailable' }, { status: 500 });
  }

  let blocked;
  try {
    const store = KvStore.open(storeName);
    blocked = store.bfExists(BLOOM_KEY, ip);
  } catch (err) {
    return Response.json({ error: `KV lookup failed: ${err.message}` }, { status: 500 });
  }

  if (blocked) {
    // Bloom filter says "maybe in set" — a small fraction of hits will be false positives.
    // Acceptable for a denylist (you over-block some legitimate users); not acceptable for
    // allowlists or anything requiring exact membership — use KvStore.get() for that.
    return Response.json({ allowed: false, ip }, { status: 403 });
  }

  return Response.json({ allowed: true, ip });
}

addEventListener('fetch', (event) => {
  event.respondWith(app(event));
});
