// FastEdge Cache — flagship patterns
//
// This example demonstrates the three highest-value uses of the
// `fastedge::cache` module:
//
//   1. Per-IP rate limiting (atomic counters)
//   2. Origin-cache proxy (getOrSet with a fetch populator)
//   3. JSON memoisation        (getOrSet with a computed populator)
//
// All three patterns rely on the cache being:
//   - **Strongly consistent within a POP** — atomic `incr` returns a
//     correct count under concurrent load, which `fastedge::kv` cannot.
//   - **Fast for both reads and writes** — sub-millisecond on the hot
//     path, so caching is cheaper than recomputing or refetching.
//   - **POP-local** — values do not replicate across data centers.
//     This is acceptable (and often desirable) for transient state.

import { Cache } from 'fastedge::cache';

// ---------------------------------------------------------------------------
// Pattern 1 — Rate limiting via atomic incr + expire
// ---------------------------------------------------------------------------
//
// Increment a per-IP counter. On the first hit (count === 1) we attach
// a TTL to create a fixed 60-second window anchored to that request:
// the counter resets 60 seconds after the user's *first* request, not
// after every request.
//
// `Cache.incr` is atomic: under concurrent load, two simultaneous
// requests cannot both see "count === 1" and double-set the expiry.
// This is the property that makes the cache suitable for limiting,
// quotas, locks, and other counter primitives.

const RATE_LIMIT_MAX = 10; // Requests per window.
const RATE_LIMIT_WINDOW_S = 60; // Window length, seconds.

async function rateLimit(event: FetchEvent): Promise<Response> {
  // `event.client.address` is the trusted-edge client IP. Sourced from
  // `x-real-ip` (with fallback to `x-forwarded-for`); both are set by
  // the FastEdge POP, not the client, so they're safe to key on.
  const ip = event.client.address || 'unknown';

  const key = `rl:${ip}`;

  const count = await Cache.incr(key);

  // Only set the expiry on the first hit of a new window. If we set it
  // on every request, the window would never close — each new request
  // would push the deadline another 60 seconds out.
  if (count === 1) {
    await Cache.expire(key, { ttl: RATE_LIMIT_WINDOW_S });
  }

  if (count > RATE_LIMIT_MAX) {
    return Response.json(
      { error: 'Too Many Requests', limit: RATE_LIMIT_MAX, count },
      { status: 429, headers: { 'retry-after': String(RATE_LIMIT_WINDOW_S) } },
    );
  }

  return Response.json({
    pattern: 'rate-limit',
    ip,
    count,
    remaining: RATE_LIMIT_MAX - count,
    windowSeconds: RATE_LIMIT_WINDOW_S,
  });
}

// ---------------------------------------------------------------------------
// Pattern 2 — Origin-cache proxy with conditional caching
// ---------------------------------------------------------------------------
//
// Cache successful upstream responses for PROXY_TTL_S seconds; pass
// non-2xx and redirects through *without* caching, so a transient 404
// or 500 doesn't get pinned for the rest of the window. The cache is
// a byte cache (no status/headers), so we only cache when "200 OK with
// application/octet-stream" is a faithful replay of the upstream.
//
// `getOrSet` is not used here because its populator can't signal
// "fetched, but don't cache" — we need that distinction to handle
// error responses safely. See Pattern 3 for `getOrSet` in a context
// where every populator output is cacheable.

const PROXY_TTL_S = 30;

async function proxy(url: string): Promise<Response> {
  // Validate the URL before we use it as a cache key.
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return Response.json({ error: `Invalid url: "${url}"` }, { status: 400 });
  }

  // Strip the fragment: fetch() never sends it to the origin, so
  // `https://example.com/#a` and `#b` are the same upstream resource
  // and must share one cache entry.
  parsed.hash = '';

  const key = `proxy:${parsed.toString()}`;

  // Cache hit — replay the bytes as 200 OK. Status/headers from the
  // original response are not preserved by the byte cache.
  const cached = await Cache.get(key);
  if (cached !== null) {
    return new Response(await cached.arrayBuffer(), {
      headers: {
        'content-type': 'application/octet-stream',
        'x-cache': 'hit',
        'x-cache-ttl': String(PROXY_TTL_S),
      },
    });
  }

  // Cache miss — fetch upstream and only cache successful responses.
  // Non-2xx and redirects flow through unchanged so callers see the
  // real status code instead of a synthetic 200.
  const upstream = await fetch(parsed.toString());
  if (!upstream.ok) {
    return upstream;
  }

  const bytes = await upstream.arrayBuffer();
  await Cache.set(key, bytes, { ttl: PROXY_TTL_S });
  return new Response(bytes, {
    headers: {
      'content-type': 'application/octet-stream',
      'x-cache': 'miss',
      'x-cache-ttl': String(PROXY_TTL_S),
    },
  });
}

// ---------------------------------------------------------------------------
// Pattern 3 — JSON memoisation via getOrSet with a computed populator
// ---------------------------------------------------------------------------
//
// Same shape as the proxy pattern, but the populator does CPU work
// instead of network I/O. Use this whenever you compute the same
// expensive answer many times in a row — search index lookups,
// signed-token verification, derived report rollups, JSON
// transformations of slow-changing source data.
//
// We embed `generatedAt` in the result so a client refreshing the
// page can see the timestamp stay constant within the cache window
// and update once it expires.

const MEMO_TTL_S = 60;

async function memo(): Promise<Response> {
  const entry = await Cache.getOrSet(
    'memo:report',
    () => {
      // Stand-in for "expensive computation". The populator can be
      // synchronous or async — both are accepted.
      const report = {
        generatedAt: new Date().toISOString(),
        topItems: ['alpha', 'beta', 'gamma'].map((name, i) => ({
          name,
          score: Math.round(Math.random() * 1000) / 10,
          rank: i + 1,
        })),
      };
      // The populator returns the value to store. Because we want
      // structured JSON back later, we serialise here and re-parse
      // via `entry.json()` on read.
      return JSON.stringify(report);
    },
    { ttl: MEMO_TTL_S },
  );

  // `entry.json()` parses the cached UTF-8 bytes as JSON. Use
  // `entry.text()` for a string, or `entry.arrayBuffer()` for bytes.
  const report = await entry.json();

  return Response.json({
    pattern: 'memo',
    note: `Cached for ${MEMO_TTL_S}s. Refresh to confirm 'generatedAt' stays the same until expiry.`,
    report,
  });
}

// ---------------------------------------------------------------------------
// Default landing — usage menu when no action is supplied
// ---------------------------------------------------------------------------

function landing(): Response {
  return Response.json({
    name: 'FastEdge Cache patterns',
    actions: {
      'rate-limit': '/?action=rate-limit',
      proxy: '/?action=proxy&url=https://www.example.com',
      memo: '/?action=memo',
    },
  });
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

async function eventHandler(event: FetchEvent): Promise<Response> {
  try {
    const url = new URL(event.request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'rate-limit':
        return await rateLimit(event);
      case 'proxy':
        return await proxy(url.searchParams.get('url') ?? '');
      case 'memo':
        return await memo();
      case null:
        return landing();
      default:
        return Response.json(
          { error: `Unknown action: "${action}". Use one of: rate-limit, proxy, memo.` },
          { status: 400 },
        );
    }
  } catch (error: Error | unknown) {
    // Validation errors thrown by Cache.* (e.g. conflicting WriteOptions
    // fields) are synchronous; host errors arrive as Promise rejections.
    // Both are caught by this single handler.
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}

addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(eventHandler(event));
});
