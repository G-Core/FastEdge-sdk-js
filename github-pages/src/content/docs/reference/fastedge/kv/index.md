---
title: KV Store
description: Overview of the FastEdge globally-replicated KV Store.
---

### Globally-replicated KV Store

The `fastedge::kv` module is a key/value store that is globally replicated across every edge
location where FastEdge runs. Reads are served locally with sub-millisecond latency; writes go to
a central source-of-truth and propagate to every edge automatically.

### Architecture and propagation

Unlike CDN solutions that run a single data store at a regional point of presence, FastEdge KV
deploys a storage instance at **every edge location** where your application runs. Your WASM
component and its KV instance live in the same environment, so reads do not cross the network —
they resolve locally with **sub-millisecond latency**.

Writes follow a **write-once, replicate-everywhere** model. When you write through the Gcore API,
the value is first persisted to a central source-of-truth, then replicated automatically to every
edge KV instance worldwide. Global replication typically completes within **1–2 seconds**.

This makes the store **eventually consistent**: during the propagation window, a read served from a
different edge than the one that performed the write may return a stale value, or `null` for a
freshly written key. Reads from the same edge see the new value immediately.

### When to use KV vs Cache

The architecture is tuned for **read-heavy, infrequently-written data** — configuration, feature
flags, content fragments, allow/deny lists keyed by IP, IP subnet, or ASN, lookup tables, and
sorted sets.

| Property        | `fastedge::kv`                            | `fastedge::cache`                          |
| --------------- | ----------------------------------------- | ------------------------------------------ |
| Scope           | All edges (globally replicated)           | One POP                                    |
| Consistency     | Eventual; ~1–2s propagation               | Strong within a POP                        |
| Atomic counters | Not available                             | `incr`, `decr`, `getOrSet` coalescing      |
| Persistence     | Durable across deployments                | Evicted; no durability guarantee           |
| Typical use    | Configuration, lookup tables, sorted sets | Rate limits, counters, response memoising  |

If your workload needs strong consistency on every read — atomic counters, rate limits, quotas,
request coalescing — use [`fastedge::cache`](/FastEdge-sdk-js/reference/fastedge/cache/) instead.

### Importing

Open a store by name with `KvStore.open()`, then call instance methods on the returned handle.

```js
import { KvStore } from 'fastedge::kv';

async function eventHandler(event) {
  const store = KvStore.open('kv-store-name-as-defined-on-app');
  const value = store.get('greeting');
  return new Response(value ?? 'not found');
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
```

See [`KvStore.open()`](/FastEdge-sdk-js/reference/fastedge/kv/open/) for the open API, and the KV
Instance pages for `get`/`scan`, sorted-set, and Bloom-filter operations.
