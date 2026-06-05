// FastEdge Cache — bulk invalidation with purge and purgePrefix
//
// The cache `purge` operations let you invalidate large sets of keys at
// once without knowing every individual key. Both operate on the
// application's own key index — they cannot touch another application's
// cache entries.
//
//   Cache.purge()            Deletes every key owned by this application.
//   Cache.purgePrefix(pfx)   Deletes only keys that begin with `pfx`.
//
// Both resolve with the number of keys deleted, which is useful for
// monitoring and audit logging.
//
// This example demonstrates the pattern with three actions:
//
//   GET /?action=seed                        Populate keys across two namespaces
//   GET /?action=purge-prefix&prefix=user:   Invalidate only user keys
//   GET /?action=purge                       Wipe all remaining keys

import { Cache } from 'fastedge::cache';

// Keys seeded by the `seed` action, grouped by namespace prefix.
const SEED_ENTRIES = [
  { key: 'user:1', value: 'Alice' },
  { key: 'user:2', value: 'Bob' },
  { key: 'user:3', value: 'Carol' },
  { key: 'product:1', value: 'Widget' },
  { key: 'product:2', value: 'Gadget' },
];

const SEED_TTL = 300; // 5 minutes — long enough to observe purge behaviour

async function eventHandler(event) {
  try {
    const url = new URL(event.request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'seed': {
        // Write a set of keys across two namespaces (user: and product:) so
        // that the purge-prefix action has something to selectively remove.
        await Promise.all(
          SEED_ENTRIES.map(({ key, value }) =>
            Cache.set(key, value, { ttl: SEED_TTL }),
          ),
        );
        return Response.json({ action, seeded: SEED_ENTRIES.length });
      }

      case 'purge-prefix': {
        // Cache.purgePrefix removes all keys that begin with `prefix`.
        // Only keys belonging to this application are affected.
        // The return value is the count of keys deleted.
        const prefix = url.searchParams.get('prefix') ?? '';
        const purged = await Cache.purgePrefix(prefix);
        return Response.json({ action, prefix, purged });
      }

      case 'purge': {
        // Cache.purge removes every key owned by this application and
        // tears down the application's key index entirely.
        // The return value is the count of keys deleted.
        const purged = await Cache.purge();
        return Response.json({ action, purged });
      }

      default:
        throw new Error(
          `Unknown action: "${action}". Use one of: seed, purge-prefix, purge.`,
        );
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
