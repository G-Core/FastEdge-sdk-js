// FastEdge Cache — basic operations
//
// The `fastedge::cache` module gives you a fast, data-center-scoped
// key/value store. Values written here are stored in the same point of
// presence (POP) that runs the worker, so reads and writes are very fast,
// and writes from one POP are not visible to others.
//
// Use this for transient, request-time state — short-lived caches, hit
// counters, rate limit windows, deduplicated work. For globally
// replicated storage, use the `fastedge::kv` module instead.
//
// This example demonstrates the four most common operations:
//
//   GET /?action=set&key=foo&value=bar   -> Cache.set
//   GET /?action=get&key=foo             -> Cache.get
//   GET /?action=exists&key=foo          -> Cache.exists
//   GET /?action=delete&key=foo          -> Cache.delete

import { Cache } from 'fastedge::cache';

async function eventHandler(event) {
  try {
    const url = new URL(event.request.url);
    const action = url.searchParams.get('action');
    const key = url.searchParams.get('key');

    if (!key) {
      throw new Error('Missing required query parameter: "key"');
    }

    switch (action) {
      case 'set': {
        // Cache.set writes a value under `key`. Accepts strings,
        // ArrayBuffers, ArrayBufferViews, ReadableStreams, and Response
        // objects (the body is consumed; status and headers are not stored).
        //
        // The `{ ttl: 60 }` option means "expire 60 seconds from now". You
        // can also use `ttlMs` for sub-second precision, or `expiresAt` for
        // a fixed Unix-epoch deadline. Omit options entirely for no expiry.
        const value = url.searchParams.get('value') ?? '';
        await Cache.set(key, value, { ttl: 60 });
        return Response.json({ action, key, value, ttl: 60 });
      }

      case 'get': {
        // Cache.get returns a CacheEntry on a hit, or `null` on a miss
        // (key absent or expired). The cache stores raw bytes, so on read
        // you choose how to decode using one of:
        //   entry.text()         -> Promise<string>  (UTF-8)
        //   entry.json()         -> Promise<unknown> (parsed JSON)
        //   entry.arrayBuffer()  -> Promise<ArrayBuffer>
        const entry = await Cache.get(key);
        if (entry === null) {
          return Response.json({ action, key, hit: false });
        }
        const value = await entry.text();
        return Response.json({ action, key, hit: true, value });
      }

      case 'exists': {
        // Cache.exists is a cheap presence check — useful when you only
        // need to know whether a key is set without transferring its value
        // (e.g. idempotency-key checks, "have we seen this token?").
        const present = await Cache.exists(key);
        return Response.json({ action, key, present });
      }

      case 'delete': {
        // Cache.delete removes the entry. It is a no-op if the key is
        // already absent — no error is thrown.
        await Cache.delete(key);
        return Response.json({ action, key, deleted: true });
      }

      default:
        throw new Error(
          `Unknown action: "${action}". Use one of: set, get, exists, delete.`,
        );
    }
  } catch (error) {
    // Validation errors (e.g. wrong types, conflicting WriteOptions fields)
    // are thrown synchronously; host errors (access denied, internal error)
    // arrive as Promise rejections. Both are caught by this single handler.
    return Response.json({ error: error.message }, { status: 500 });
  }
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
