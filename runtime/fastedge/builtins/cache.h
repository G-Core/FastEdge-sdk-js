#pragma once

#include "builtin.h"

#include <optional>
#include <vector>

// Shared with `fastedge::db/kv`.
namespace fastedge::cache {

// A `CacheEntry` (`arrayBuffer()` / `text()` / `json()`) holding a copy of `bytes`.
JSObject *new_entry(JSContext *cx, const uint8_t *bytes, size_t len);

// `WriteOptions` (`ttl` | `ttlMs` | `expiresAt`) -> ms from now; `nullopt` for no expiry.
// Throws on invalid options.
bool ttl_ms_option(JSContext *cx, JS::HandleValue options, std::optional<uint64_t> *out);

// string / ArrayBuffer / ArrayBufferView -> bytes. `*done` is false for other types.
bool value_bytes(JSContext *cx, JS::HandleValue value, std::vector<uint8_t> *out, bool *done);

} // namespace fastedge::cache
