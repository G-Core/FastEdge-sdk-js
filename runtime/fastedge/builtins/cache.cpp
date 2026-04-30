#include "builtin.h"

#include "../host-api/include/fastedge_host_api.h"

#include <js/ArrayBuffer.h>
#include <js/CallAndConstruct.h>
#include <js/CharacterEncoding.h>
#include <js/JSON.h>
#include <js/Promise.h>
#include <js/Stream.h>

#include <chrono>
#include <cmath>
#include <cstring>
#include <optional>
#include <vector>

namespace fastedge::cache {

namespace {

api::Engine *ENGINE;

// Process-local map of in-flight `getOrSet` populators. Keyed by user
// cache key, values are pending Promise<CacheEntry>. Initialised in
// `install()` to a JSObject with no prototype (so user keys cannot
// accidentally collide with Object.prototype names like "constructor").
JS::PersistentRooted<JSObject *> *INFLIGHT_MAP = nullptr;

// Resolve `args.rval()` with a fresh Promise resolved to `value`.
bool resolve_with(JSContext *cx, JS::HandleValue value, JS::CallArgs &args) {
  JS::RootedObject promise(cx, JS::CallOriginalPromiseResolve(cx, value));
  if (!promise) return false;
  args.rval().setObject(*promise);
  return true;
}

void throw_cache_error(JSContext *cx, const host_api::CacheError &err) {
  switch (err.tag) {
    case host_api::CacheErrorTag::ACCESS_DENIED:
      JS_ReportErrorUTF8(cx, "Access denied to cache");
      break;
    case host_api::CacheErrorTag::INTERNAL_ERROR:
      JS_ReportErrorUTF8(cx, "Internal cache error");
      break;
    case host_api::CacheErrorTag::OTHER:
      JS_ReportErrorUTF8(cx, "Cache error: %.*s",
                        static_cast<int>(err.val.other.len),
                        err.val.other.ptr);
      break;
  }
}

// Parse a `WriteOptions` JS value into milliseconds-from-now.
//
// undefined / null / {} → out=nullopt (no expiry)
// { ttl: N }            → out=N*1000
// { ttlMs: N }          → out=N
// { expiresAt: N }      → out=(N*1000 - Date.now())
//
// Throws and returns false on validation error (multiple fields, non-finite,
// non-positive, or non-object).
bool build_ttl_ms(JSContext *cx, JS::HandleValue options_val,
                  std::optional<uint64_t> *out) {
  if (options_val.isNullOrUndefined()) {
    *out = std::nullopt;
    return true;
  }
  if (!options_val.isObject()) {
    JS_ReportErrorUTF8(cx, "WriteOptions must be an object");
    return false;
  }

  JS::RootedObject options(cx, &options_val.toObject());
  JS::RootedValue ttl_val(cx);
  JS::RootedValue ttl_ms_val(cx);
  JS::RootedValue expires_at_val(cx);

  if (!JS_GetProperty(cx, options, "ttl", &ttl_val) ||
      !JS_GetProperty(cx, options, "ttlMs", &ttl_ms_val) ||
      !JS_GetProperty(cx, options, "expiresAt", &expires_at_val)) {
    return false;
  }

  bool has_ttl = !ttl_val.isUndefined();
  bool has_ttl_ms = !ttl_ms_val.isUndefined();
  bool has_expires_at = !expires_at_val.isUndefined();
  int count = (has_ttl ? 1 : 0) + (has_ttl_ms ? 1 : 0) + (has_expires_at ? 1 : 0);

  if (count > 1) {
    JS_ReportErrorUTF8(cx,
        "WriteOptions: pass only one of ttl, ttlMs, expiresAt");
    return false;
  }
  if (count == 0) {
    *out = std::nullopt;
    return true;
  }

  double ms;
  if (has_ttl) {
    double secs;
    if (!JS::ToNumber(cx, ttl_val, &secs)) return false;
    ms = secs * 1000.0;
  } else if (has_ttl_ms) {
    if (!JS::ToNumber(cx, ttl_ms_val, &ms)) return false;
  } else {  // has_expires_at
    double epoch_secs;
    if (!JS::ToNumber(cx, expires_at_val, &epoch_secs)) return false;
    auto now_ms = std::chrono::duration_cast<std::chrono::milliseconds>(
                      std::chrono::system_clock::now().time_since_epoch())
                      .count();
    ms = epoch_secs * 1000.0 - static_cast<double>(now_ms);
  }

  if (!std::isfinite(ms) || ms <= 0.0) {
    JS_ReportErrorUTF8(cx, "WriteOptions: TTL must be positive");
    return false;
  }

  *out = static_cast<uint64_t>(ms);
  return true;
}

class CacheEntry {
public:
  enum class Slot : uint32_t {
    Bytes = 0,
    Count
  };

  static const JSClass class_;
  static const JSFunctionSpec methods[];

  static bool arrayBuffer(JSContext *cx, unsigned argc, JS::Value *vp);
  static bool text(JSContext *cx, unsigned argc, JS::Value *vp);
  static bool json(JSContext *cx, unsigned argc, JS::Value *vp);

  // Allocates a Uint8Array and copies `bytes` into it, then wraps the array
  // in a freshly-created CacheEntry. Returns nullptr on allocation failure
  // (with a pending JS exception).
  static JSObject *create(JSContext *cx, const uint8_t *bytes, size_t len);
};

const JSClass CacheEntry::class_ = {
    "CacheEntry",
    JSCLASS_HAS_RESERVED_SLOTS(static_cast<uint32_t>(CacheEntry::Slot::Count))};

class Cache {
public:
  static bool get(JSContext *cx, unsigned argc, JS::Value *vp);
  static bool exists(JSContext *cx, unsigned argc, JS::Value *vp);
  static bool set(JSContext *cx, unsigned argc, JS::Value *vp);
  static bool delete_op(JSContext *cx, unsigned argc, JS::Value *vp);
  static bool expire(JSContext *cx, unsigned argc, JS::Value *vp);
  static bool incr(JSContext *cx, unsigned argc, JS::Value *vp);
  static bool decr(JSContext *cx, unsigned argc, JS::Value *vp);
  static bool getOrSet(JSContext *cx, unsigned argc, JS::Value *vp);

  // Promise reaction handlers used by `set` for the async coercion path.
  // Static (not in the anon namespace) so their addresses can be passed as
  // template arguments to `create_internal_method<...>`.
  //
  // For both: `receiver` is the outer Promise we resolve/reject; for
  // `set_then` `extra` is `{ key: string, ttlMs: number }`.
  static bool set_then(JSContext *cx, JS::HandleObject receiver,
                       JS::HandleValue extra, JS::CallArgs args);
  static bool set_catch(JSContext *cx, JS::HandleObject receiver,
                        JS::HandleValue extra, JS::CallArgs args);

  // Reaction handlers for `getOrSet`.
  //
  // `populate_then`/`populate_catch`: reactions on the populator's Promise.
  //   `populate_then` extracts the populator's CacheValue and either
  //   finalises immediately (sync coercion) or chains to `bytes_then`
  //   for async coercion (Response/ReadableStream).
  // `bytes_then`: reaction on `value.arrayBuffer()` for the async path —
  //   extracts bytes from the resolved ArrayBuffer and finalises.
  //
  // For all three: `receiver` is the outer Promise, `extra` is
  // `{ key: string, ttlMs: number }` (ttlMs == -1 means no expiry).
  static bool getOrSet_populate_then(JSContext *cx, JS::HandleObject receiver,
                                     JS::HandleValue extra, JS::CallArgs args);
  static bool getOrSet_populate_catch(JSContext *cx, JS::HandleObject receiver,
                                      JS::HandleValue extra, JS::CallArgs args);
  static bool getOrSet_bytes_then(JSContext *cx, JS::HandleObject receiver,
                                  JS::HandleValue extra, JS::CallArgs args);
};

// Forward declarations — used by Cache::set / Cache::getOrSet, defined further below.
bool try_sync_coerce_bytes(JSContext *cx, JS::HandleValue value,
                           std::vector<uint8_t> *out, bool *done);
bool finish_set(JSContext *cx, JS::HandleObject outer_promise,
                JS::HandleString key_jsstring, const uint8_t *bytes,
                size_t len, std::optional<uint64_t> ttl_ms);

// In-flight map helpers (process-local coalescing).
JSObject *inflight_get(JSContext *cx, JS::HandleString key);
bool inflight_set(JSContext *cx, JS::HandleString key, JS::HandleObject promise);
void inflight_delete(JSContext *cx, JS::HandleString key);

// Capture pending JS exception, remove `key` from inflight, reject the
// outer Promise with the captured exception, and clear `args.rval()`.
bool reject_and_finish(JSContext *cx, JS::HandleObject outer_promise,
                       JS::HandleString key_jsstring, JS::CallArgs &args);

// Finalise an in-flight populate: cache_set the bytes, build a CacheEntry,
// resolve the outer Promise, and remove `key` from the inflight map.
// On host or allocation error: reject the outer Promise with the captured
// exception; still removes from inflight.
bool getOrSet_finalize(JSContext *cx, JS::HandleObject outer_promise,
                       JS::HandleString key_jsstring,
                       std::optional<uint64_t> ttl_ms, const uint8_t *bytes,
                       size_t len);

// Get the Uint8Array stored in a CacheEntry's reserved slot.
JSObject *cache_entry_bytes(JSContext *cx, JS::HandleObject self) {
  JS::Value v = JS::GetReservedSlot(
      self, static_cast<uint32_t>(CacheEntry::Slot::Bytes));
  if (!v.isObject()) {
    JS_ReportErrorUTF8(cx, "Invalid CacheEntry");
    return nullptr;
  }
  return &v.toObject();
}

// Decode the bytes of a Uint8Array as UTF-8 into a fresh JS string.
JSString *decode_utf8_string(JSContext *cx, JS::HandleObject bytes_array) {
  size_t len = JS_GetTypedArrayLength(bytes_array);
  std::vector<char> buf(len);
  if (len > 0) {
    JS::AutoCheckCannotGC noGC(cx);
    bool is_shared;
    void *data = JS_GetArrayBufferViewData(bytes_array, &is_shared, noGC);
    memcpy(buf.data(), data, len);
  }
  return JS_NewStringCopyUTF8N(cx, JS::UTF8Chars(buf.data(), buf.size()));
}

JSObject *CacheEntry::create(JSContext *cx, const uint8_t *bytes, size_t len) {
  JS::RootedObject byte_array(cx, JS_NewUint8Array(cx, len));
  if (!byte_array) return nullptr;

  if (len > 0) {
    JS::AutoCheckCannotGC noGC(cx);
    bool is_shared;
    void *dst = JS_GetArrayBufferViewData(byte_array, &is_shared, noGC);
    memcpy(dst, bytes, len);
  }

  JS::RootedObject entry(cx,
      JS_NewObjectWithGivenProto(cx, &CacheEntry::class_, nullptr));
  if (!entry) return nullptr;

  JS::SetReservedSlot(entry, static_cast<uint32_t>(Slot::Bytes),
                      JS::ObjectValue(*byte_array));

  if (!JS_DefineFunctions(cx, entry, CacheEntry::methods)) return nullptr;

  return entry;
}

bool CacheEntry::arrayBuffer(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  if (!args.thisv().isObject()) {
    JS_ReportErrorUTF8(cx, "Invalid CacheEntry");
    return false;
  }
  JS::RootedObject self(cx, &args.thisv().toObject());
  JS::RootedObject bytes_array(cx, cache_entry_bytes(cx, self));
  if (!bytes_array) return false;

  size_t len = JS_GetTypedArrayLength(bytes_array);

  // Allocate a fresh ArrayBuffer and copy the bytes in. We don't share the
  // entry's underlying buffer because callers could otherwise mutate it and
  // corrupt subsequent reads from this same entry.
  JS::RootedObject ab(cx, JS::NewArrayBuffer(cx, len));
  if (!ab) return false;

  if (len > 0) {
    JS::AutoCheckCannotGC noGC(cx);
    bool is_shared;
    void *src = JS_GetArrayBufferViewData(bytes_array, &is_shared, noGC);
    void *dst = JS::GetArrayBufferData(ab, &is_shared, noGC);
    memcpy(dst, src, len);
  }

  JS::RootedValue ab_val(cx, JS::ObjectValue(*ab));
  JS::RootedObject promise(cx, JS::CallOriginalPromiseResolve(cx, ab_val));
  if (!promise) return false;
  args.rval().setObject(*promise);
  return true;
}

bool CacheEntry::text(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  if (!args.thisv().isObject()) {
    JS_ReportErrorUTF8(cx, "Invalid CacheEntry");
    return false;
  }
  JS::RootedObject self(cx, &args.thisv().toObject());
  JS::RootedObject bytes_array(cx, cache_entry_bytes(cx, self));
  if (!bytes_array) return false;

  JS::RootedString str(cx, decode_utf8_string(cx, bytes_array));
  if (!str) return false;

  JS::RootedValue str_val(cx, JS::StringValue(str));
  JS::RootedObject promise(cx, JS::CallOriginalPromiseResolve(cx, str_val));
  if (!promise) return false;
  args.rval().setObject(*promise);
  return true;
}

bool CacheEntry::json(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  if (!args.thisv().isObject()) {
    JS_ReportErrorUTF8(cx, "Invalid CacheEntry");
    return false;
  }
  JS::RootedObject self(cx, &args.thisv().toObject());
  JS::RootedObject bytes_array(cx, cache_entry_bytes(cx, self));
  if (!bytes_array) return false;

  JS::RootedString str(cx, decode_utf8_string(cx, bytes_array));
  if (!str) return false;

  // Parse JSON. On success → resolved Promise; on failure → rejected Promise
  // (matching the standard Body.json() contract; SyntaxError is async, not
  // a synchronous throw).
  JS::RootedValue parsed(cx);
  JS::RootedObject promise(cx);
  if (JS_ParseJSON(cx, str, &parsed)) {
    promise = JS::CallOriginalPromiseResolve(cx, parsed);
  } else {
    JS::RootedValue exc(cx);
    if (!JS_GetPendingException(cx, &exc)) return false;
    JS_ClearPendingException(cx);
    promise = JS::CallOriginalPromiseReject(cx, exc);
  }

  if (!promise) return false;
  args.rval().setObject(*promise);
  return true;
}

const JSFunctionSpec CacheEntry::methods[] = {
    JS_FN("arrayBuffer", CacheEntry::arrayBuffer, 0, JSPROP_ENUMERATE),
    JS_FN("text",        CacheEntry::text,        0, JSPROP_ENUMERATE),
    JS_FN("json",        CacheEntry::json,        0, JSPROP_ENUMERATE),
    JS_FS_END,
};

bool Cache::get(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  if (!args.requireAtLeast(cx, "get", 1)) return false;

  JS::RootedString key_str(cx, JS::ToString(cx, args[0]));
  if (!key_str) return false;
  JS::UniqueChars key = JS_EncodeStringToUTF8(cx, key_str);
  if (!key) return false;

  auto result = host_api::cache_get(key.get());
  if (!result.is_ok()) {
    throw_cache_error(cx, result.unwrap_err());
    return ReturnPromiseRejectedWithPendingError(cx, args);
  }

  auto value_option = result.unwrap();
  if (!value_option.is_some()) {
    JS::RootedValue null_val(cx, JS::NullValue());
    return resolve_with(cx, null_val, args);
  }

  auto bytes = value_option.unwrap();
  JS::RootedObject entry(cx, CacheEntry::create(cx, bytes.ptr, bytes.len));
  if (!entry) return false;

  JS::RootedValue entry_val(cx, JS::ObjectValue(*entry));
  return resolve_with(cx, entry_val, args);
}

bool Cache::exists(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  if (!args.requireAtLeast(cx, "exists", 1)) return false;

  JS::RootedString key_str(cx, JS::ToString(cx, args[0]));
  if (!key_str) return false;
  JS::UniqueChars key = JS_EncodeStringToUTF8(cx, key_str);
  if (!key) return false;

  auto result = host_api::cache_exists(key.get());
  if (!result.is_ok()) {
    throw_cache_error(cx, result.unwrap_err());
    return ReturnPromiseRejectedWithPendingError(cx, args);
  }

  JS::RootedValue rv(cx, JS::BooleanValue(result.unwrap()));
  return resolve_with(cx, rv, args);
}

bool Cache::delete_op(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  if (!args.requireAtLeast(cx, "delete", 1)) return false;

  JS::RootedString key_str(cx, JS::ToString(cx, args[0]));
  if (!key_str) return false;
  JS::UniqueChars key = JS_EncodeStringToUTF8(cx, key_str);
  if (!key) return false;

  auto err = host_api::cache_delete(key.get());
  if (err) {
    throw_cache_error(cx, *err);
    return ReturnPromiseRejectedWithPendingError(cx, args);
  }

  JS::RootedValue undef(cx, JS::UndefinedValue());
  return resolve_with(cx, undef, args);
}

bool Cache::set(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  if (!args.requireAtLeast(cx, "set", 2)) return false;

  // 1. Validate key — sync throw on failure.
  JS::RootedString key_jsstring(cx, JS::ToString(cx, args[0]));
  if (!key_jsstring) return false;

  // 2. Parse options — sync throw on failure.
  std::optional<uint64_t> ttl_ms;
  if (args.length() > 2 && !args[2].isUndefined()) {
    if (!build_ttl_ms(cx, args[2], &ttl_ms)) return false;
  }

  // 3. Build the outer Promise we'll always return.
  JS::RootedObject outer_promise(cx, JS::NewPromiseObject(cx, nullptr));
  if (!outer_promise) return false;

  // 4. Try sync coercion (string / ArrayBuffer / ArrayBufferView).
  std::vector<uint8_t> bytes;
  bool sync_done = false;
  JS::RootedValue value(cx, args[1]);
  if (!try_sync_coerce_bytes(cx, value, &bytes, &sync_done)) {
    // Capture pending exception, reject outer Promise.
    JS::RootedValue exc(cx);
    if (!JS_GetPendingException(cx, &exc)) return false;
    JS_ClearPendingException(cx);
    if (!JS::RejectPromise(cx, outer_promise, exc)) return false;
    args.rval().setObject(*outer_promise);
    return true;
  }

  if (sync_done) {
    // Sync path: do the host call, resolve/reject outer.
    if (!finish_set(cx, outer_promise, key_jsstring,
                    bytes.empty() ? nullptr : bytes.data(), bytes.size(),
                    ttl_ms)) {
      return false;
    }
    args.rval().setObject(*outer_promise);
    return true;
  }

  // 5. Async path. If value is a ReadableStream, wrap it in a Response so
  //    we can use the unified `value.arrayBuffer()` path below. Anything
  //    else (Response, Blob, anything with `arrayBuffer()`) goes through as-is.
  if (!value.isObject()) {
    JS_ReportErrorUTF8(cx, "set: value must be a string, ArrayBuffer, "
                           "ArrayBufferView, ReadableStream, or Response");
    JS::RootedValue exc(cx);
    if (!JS_GetPendingException(cx, &exc)) return false;
    JS_ClearPendingException(cx);
    if (!JS::RejectPromise(cx, outer_promise, exc)) return false;
    args.rval().setObject(*outer_promise);
    return true;
  }

  JS::RootedObject value_obj(cx, &value.toObject());

  if (JS::IsReadableStream(value_obj)) {
    JS::RootedValue response_ctor_val(cx);
    if (!JS_GetProperty(cx, ENGINE->global(), "Response",
                        &response_ctor_val)) {
      return false;
    }
    JS::RootedValueArray<1> ctor_args(cx);
    ctor_args[0].setObject(*value_obj);
    JS::RootedObject response_obj(cx);
    if (!JS::Construct(cx, response_ctor_val, ctor_args, &response_obj)) {
      JS::RootedValue exc(cx);
      if (!JS_GetPendingException(cx, &exc)) return false;
      JS_ClearPendingException(cx);
      if (!JS::RejectPromise(cx, outer_promise, exc)) return false;
      args.rval().setObject(*outer_promise);
      return true;
    }
    value_obj = response_obj;
    value.setObject(*value_obj);
  }

  // Call `value.arrayBuffer()`. We expect it to exist and return a
  // Promise<ArrayBuffer>; if not, the call (or the resulting Promise)
  // surfaces the error which we forward via the catch handler.
  JS::RootedValue inner_promise_val(cx);
  if (!JS::Call(cx, value_obj, "arrayBuffer", JS::HandleValueArray::empty(),
                &inner_promise_val)) {
    JS::RootedValue exc(cx);
    if (!JS_GetPendingException(cx, &exc)) return false;
    JS_ClearPendingException(cx);
    if (!JS::RejectPromise(cx, outer_promise, exc)) return false;
    args.rval().setObject(*outer_promise);
    return true;
  }

  if (!inner_promise_val.isObject()) {
    JS_ReportErrorUTF8(cx, "set: value.arrayBuffer() did not return a Promise");
    JS::RootedValue exc(cx);
    if (!JS_GetPendingException(cx, &exc)) return false;
    JS_ClearPendingException(cx);
    if (!JS::RejectPromise(cx, outer_promise, exc)) return false;
    args.rval().setObject(*outer_promise);
    return true;
  }
  JS::RootedObject inner_promise(cx, &inner_promise_val.toObject());

  // Build the state object passed to the async then-handler.
  JS::RootedObject state(cx, JS_NewPlainObject(cx));
  if (!state) return false;
  JS::RootedValue key_val(cx, JS::StringValue(key_jsstring));
  JS::RootedValue ttl_val(cx, JS::NumberValue(
      ttl_ms.has_value() ? static_cast<double>(*ttl_ms) : -1.0));
  if (!JS_DefineProperty(cx, state, "key", key_val, 0)) return false;
  if (!JS_DefineProperty(cx, state, "ttlMs", ttl_val, 0)) return false;
  JS::RootedValue extra(cx, JS::ObjectValue(*state));

  JS::RootedObject then_handler(cx, create_internal_method<Cache::set_then>(
                                        cx, outer_promise, extra));
  if (!then_handler) return false;
  JS::RootedObject catch_handler(cx, create_internal_method<Cache::set_catch>(
                                         cx, outer_promise));
  if (!catch_handler) return false;

  if (!JS::AddPromiseReactions(cx, inner_promise, then_handler, catch_handler)) {
    return false;
  }

  args.rval().setObject(*outer_promise);
  return true;
}

bool Cache::getOrSet(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  if (!args.requireAtLeast(cx, "getOrSet", 2)) return false;

  // 1. Validate key — sync throw.
  JS::RootedString key_jsstring(cx, JS::ToString(cx, args[0]));
  if (!key_jsstring) return false;
  JS::UniqueChars key_chars = JS_EncodeStringToUTF8(cx, key_jsstring);
  if (!key_chars) return false;

  // 2. Validate populate — must be callable.
  if (!args[1].isObject() || !JS::IsCallable(&args[1].toObject())) {
    JS_ReportErrorUTF8(cx, "getOrSet: populate must be a function");
    return false;
  }
  JS::RootedValue populate_fn(cx, args[1]);

  // 3. Parse options — sync throw on invalid WriteOptions.
  std::optional<uint64_t> ttl_ms;
  if (args.length() > 2 && !args[2].isUndefined()) {
    if (!build_ttl_ms(cx, args[2], &ttl_ms)) return false;
  }

  // 4. Cache hit fast path: return resolved Promise<CacheEntry>.
  auto cache_result = host_api::cache_get(key_chars.get());
  if (!cache_result.is_ok()) {
    throw_cache_error(cx, cache_result.unwrap_err());
    return ReturnPromiseRejectedWithPendingError(cx, args);
  }
  auto opt = cache_result.unwrap();
  if (opt.is_some()) {
    auto bytes = opt.unwrap();
    JS::RootedObject entry(cx, CacheEntry::create(cx, bytes.ptr, bytes.len));
    if (!entry) return false;
    JS::RootedValue entry_val(cx, JS::ObjectValue(*entry));
    return resolve_with(cx, entry_val, args);
  }

  // 5. Coalesce: if a populator is already running for this key, return
  //    that pending Promise.
  JS::RootedObject existing(cx, inflight_get(cx, key_jsstring));
  if (existing) {
    args.rval().setObject(*existing);
    return true;
  }

  // 6. Create the outer Promise we'll return; register it in inflight so
  //    concurrent callers join us.
  JS::RootedObject outer_promise(cx, JS::NewPromiseObject(cx, nullptr));
  if (!outer_promise) return false;
  if (!inflight_set(cx, key_jsstring, outer_promise)) return false;

  // 7. Build the state passed through reactions: { key, ttlMs }.
  //    ttlMs == -1.0 is the sentinel for "no expiry".
  JS::RootedObject state(cx, JS_NewPlainObject(cx));
  if (!state) {
    inflight_delete(cx, key_jsstring);
    return false;
  }
  JS::RootedValue key_val(cx, JS::StringValue(key_jsstring));
  JS::RootedValue ttl_val(cx, JS::NumberValue(
      ttl_ms.has_value() ? static_cast<double>(*ttl_ms) : -1.0));
  if (!JS_DefineProperty(cx, state, "key", key_val, 0) ||
      !JS_DefineProperty(cx, state, "ttlMs", ttl_val, 0)) {
    inflight_delete(cx, key_jsstring);
    return false;
  }
  JS::RootedValue extra(cx, JS::ObjectValue(*state));

  // 8. Call populate(). Synchronous throws are converted into outer-Promise
  //    rejections so the caller experience is consistent with async throws.
  JS::RootedValue populate_result(cx);
  JS::RootedObject this_obj(cx);  // null this
  if (!JS::Call(cx, this_obj, populate_fn, JS::HandleValueArray::empty(),
                &populate_result)) {
    if (!reject_and_finish(cx, outer_promise, key_jsstring, args)) return false;
    args.rval().setObject(*outer_promise);
    return true;
  }

  // 9. Promise.resolve(populate_result) — handles raw values and Promises
  //    uniformly.
  JS::RootedObject populate_promise(cx,
      JS::CallOriginalPromiseResolve(cx, populate_result));
  if (!populate_promise) {
    inflight_delete(cx, key_jsstring);
    return false;
  }

  // 10. Chain reactions on the populator's Promise. The then/catch handlers
  //     drive the rest of the lifecycle.
  JS::RootedObject then_h(cx,
      create_internal_method<Cache::getOrSet_populate_then>(cx, outer_promise,
                                                            extra));
  if (!then_h) {
    inflight_delete(cx, key_jsstring);
    return false;
  }
  JS::RootedObject catch_h(cx,
      create_internal_method<Cache::getOrSet_populate_catch>(cx, outer_promise,
                                                             extra));
  if (!catch_h) {
    inflight_delete(cx, key_jsstring);
    return false;
  }
  if (!JS::AddPromiseReactions(cx, populate_promise, then_h, catch_h)) {
    inflight_delete(cx, key_jsstring);
    return false;
  }

  args.rval().setObject(*outer_promise);
  return true;
}

bool Cache::expire(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  if (!args.requireAtLeast(cx, "expire", 2)) return false;

  JS::RootedString key_str(cx, JS::ToString(cx, args[0]));
  if (!key_str) return false;
  JS::UniqueChars key = JS_EncodeStringToUTF8(cx, key_str);
  if (!key) return false;

  std::optional<uint64_t> ttl_ms;
  if (!build_ttl_ms(cx, args[1], &ttl_ms)) return false;
  if (!ttl_ms) {
    JS_ReportErrorUTF8(cx, "expire: WriteOptions must specify ttl, ttlMs, or expiresAt");
    return false;
  }

  auto result = host_api::cache_expire(key.get(), *ttl_ms);
  if (!result.is_ok()) {
    throw_cache_error(cx, result.unwrap_err());
    return ReturnPromiseRejectedWithPendingError(cx, args);
  }

  JS::RootedValue rv(cx, JS::BooleanValue(result.unwrap()));
  return resolve_with(cx, rv, args);
}

// Try to coerce `value` to bytes synchronously.
//
// On success: *done = true and *out is filled.
// On unsupported type: *done = false (caller should try async path).
// On error: returns false with a pending JS exception.
bool try_sync_coerce_bytes(JSContext *cx, JS::HandleValue value,
                           std::vector<uint8_t> *out, bool *done) {
  *done = false;

  if (value.isString()) {
    JS::RootedString str(cx, value.toString());
    JS::UniqueChars utf8 = JS_EncodeStringToUTF8(cx, str);
    if (!utf8) return false;
    // Use the encoded UTF-8 byte length, not strlen — values are raw bytes
    // and may legitimately contain embedded NULs.
    JSLinearString *linear = JS_EnsureLinearString(cx, str);
    if (!linear) return false;
    size_t len = JS::GetDeflatedUTF8StringLength(linear);
    out->assign(reinterpret_cast<uint8_t *>(utf8.get()),
                reinterpret_cast<uint8_t *>(utf8.get()) + len);
    *done = true;
    return true;
  }

  if (!value.isObject()) {
    return true;  // not sync-coercible (e.g., number, bool); caller decides
  }

  JS::RootedObject obj(cx, &value.toObject());

  if (JS::IsArrayBufferObject(obj)) {
    size_t len = JS::GetArrayBufferByteLength(obj);
    out->resize(len);
    if (len > 0) {
      JS::AutoCheckCannotGC noGC(cx);
      bool is_shared;
      void *src = JS::GetArrayBufferData(obj, &is_shared, noGC);
      memcpy(out->data(), src, len);
    }
    *done = true;
    return true;
  }

  if (JS_IsArrayBufferViewObject(obj)) {
    size_t len = JS_GetArrayBufferViewByteLength(obj);
    out->resize(len);
    if (len > 0) {
      JS::AutoCheckCannotGC noGC(cx);
      bool is_shared;
      void *src = JS_GetArrayBufferViewData(obj, &is_shared, noGC);
      memcpy(out->data(), src, len);
    }
    *done = true;
    return true;
  }

  return true;  // async path (Response, ReadableStream, etc.)
}

// Capture the pending JS exception, remove `key` from the inflight map,
// reject `outer_promise` with the captured exception, and clear `args.rval()`.
// Used by the getOrSet reaction handlers for any error path.
bool reject_and_finish(JSContext *cx, JS::HandleObject outer_promise,
                       JS::HandleString key_jsstring, JS::CallArgs &args) {
  JS::RootedValue exc(cx);
  if (!JS_GetPendingException(cx, &exc)) {
    inflight_delete(cx, key_jsstring);
    return false;
  }
  JS_ClearPendingException(cx);
  inflight_delete(cx, key_jsstring);
  args.rval().setUndefined();
  return JS::RejectPromise(cx, outer_promise, exc);
}

JSObject *inflight_get(JSContext *cx, JS::HandleString key) {
  if (!INFLIGHT_MAP) return nullptr;
  JS::RootedObject map(cx, *INFLIGHT_MAP);
  JS::RootedId id(cx);
  if (!JS_StringToId(cx, key, &id)) return nullptr;

  bool found;
  if (!JS_HasOwnPropertyById(cx, map, id, &found)) return nullptr;
  if (!found) return nullptr;

  JS::RootedValue val(cx);
  if (!JS_GetPropertyById(cx, map, id, &val)) return nullptr;
  if (!val.isObject()) return nullptr;
  return &val.toObject();
}

bool inflight_set(JSContext *cx, JS::HandleString key, JS::HandleObject promise) {
  if (!INFLIGHT_MAP) return false;
  JS::RootedObject map(cx, *INFLIGHT_MAP);
  JS::RootedId id(cx);
  if (!JS_StringToId(cx, key, &id)) return false;
  JS::RootedValue val(cx, JS::ObjectValue(*promise));
  return JS_SetPropertyById(cx, map, id, val);
}

void inflight_delete(JSContext *cx, JS::HandleString key) {
  if (!INFLIGHT_MAP) return;
  JS::RootedObject map(cx, *INFLIGHT_MAP);
  JS::RootedId id(cx);
  if (!JS_StringToId(cx, key, &id)) return;  // best-effort cleanup
  JS::ObjectOpResult result;
  (void)JS_DeletePropertyById(cx, map, id, result);
}

// Finalise an in-flight populate: cache_set the bytes, build a CacheEntry,
// resolve the outer Promise with the entry, and remove `key` from inflight.
// On any failure: reject the outer Promise (still removes from inflight).
bool getOrSet_finalize(JSContext *cx, JS::HandleObject outer_promise,
                       JS::HandleString key_jsstring,
                       std::optional<uint64_t> ttl_ms, const uint8_t *bytes,
                       size_t len) {
  JS::UniqueChars key_chars = JS_EncodeStringToUTF8(cx, key_jsstring);
  if (!key_chars) {
    inflight_delete(cx, key_jsstring);
    return false;
  }

  host_api::CacheBytesView view{bytes, len};
  auto err = host_api::cache_set(key_chars.get(), view, ttl_ms);
  if (err) {
    throw_cache_error(cx, *err);
    JS::RootedValue exc(cx);
    if (!JS_GetPendingException(cx, &exc)) {
      inflight_delete(cx, key_jsstring);
      return false;
    }
    JS_ClearPendingException(cx);
    inflight_delete(cx, key_jsstring);
    return JS::RejectPromise(cx, outer_promise, exc);
  }

  JS::RootedObject entry(cx, CacheEntry::create(cx, bytes, len));
  if (!entry) {
    JS::RootedValue exc(cx);
    if (!JS_GetPendingException(cx, &exc)) {
      inflight_delete(cx, key_jsstring);
      return false;
    }
    JS_ClearPendingException(cx);
    inflight_delete(cx, key_jsstring);
    return JS::RejectPromise(cx, outer_promise, exc);
  }

  JS::RootedValue entry_val(cx, JS::ObjectValue(*entry));
  inflight_delete(cx, key_jsstring);
  return JS::ResolvePromise(cx, outer_promise, entry_val);
}

// Issues the host_api::cache_set call and resolves `outer_promise`, or
// rejects it with a CacheError. The pending JS exception (if any) is
// captured into the rejection.
bool finish_set(JSContext *cx, JS::HandleObject outer_promise,
                JS::HandleString key_jsstring, const uint8_t *bytes,
                size_t len, std::optional<uint64_t> ttl_ms) {
  JS::UniqueChars key_chars = JS_EncodeStringToUTF8(cx, key_jsstring);
  if (!key_chars) return false;

  host_api::CacheBytesView view{bytes, len};
  auto err = host_api::cache_set(key_chars.get(), view, ttl_ms);
  if (err) {
    throw_cache_error(cx, *err);
    JS::RootedValue exc(cx);
    if (!JS_GetPendingException(cx, &exc)) return false;
    JS_ClearPendingException(cx);
    return JS::RejectPromise(cx, outer_promise, exc);
  }

  JS::RootedValue undef(cx, JS::UndefinedValue());
  return JS::ResolvePromise(cx, outer_promise, undef);
}

}  // namespace (local helpers above)

// Async then-handler: receives the resolved ArrayBuffer from
// value.arrayBuffer(), copies it out, performs the host_api::cache_set,
// resolves or rejects the outer Promise.
//
// receiver = outer Promise
// extra    = { key: string, ttlMs: number | -1 (sentinel: no expiry) }
bool Cache::set_then(JSContext *cx, JS::HandleObject outer_promise,
                     JS::HandleValue extra, JS::CallArgs args) {
  // args[0] is the resolved ArrayBuffer (or ArrayBufferView from a transformed body).
  if (!args.get(0).isObject()) {
    JS_ReportErrorUTF8(cx, "set: expected ArrayBuffer from value.arrayBuffer()");
    JS::RootedValue exc(cx);
    if (!JS_GetPendingException(cx, &exc)) return false;
    JS_ClearPendingException(cx);
    return JS::RejectPromise(cx, outer_promise, exc);
  }

  JS::RootedObject ab(cx, &args[0].toObject());
  std::vector<uint8_t> bytes;
  if (JS::IsArrayBufferObject(ab)) {
    size_t len = JS::GetArrayBufferByteLength(ab);
    bytes.resize(len);
    if (len > 0) {
      JS::AutoCheckCannotGC noGC(cx);
      bool is_shared;
      void *src = JS::GetArrayBufferData(ab, &is_shared, noGC);
      memcpy(bytes.data(), src, len);
    }
  } else if (JS_IsArrayBufferViewObject(ab)) {
    size_t len = JS_GetArrayBufferViewByteLength(ab);
    bytes.resize(len);
    if (len > 0) {
      JS::AutoCheckCannotGC noGC(cx);
      bool is_shared;
      void *src = JS_GetArrayBufferViewData(ab, &is_shared, noGC);
      memcpy(bytes.data(), src, len);
    }
  } else {
    JS_ReportErrorUTF8(cx, "set: unexpected non-buffer body resolution");
    JS::RootedValue exc(cx);
    if (!JS_GetPendingException(cx, &exc)) return false;
    JS_ClearPendingException(cx);
    return JS::RejectPromise(cx, outer_promise, exc);
  }

  // Unpack extra: { key, ttlMs }
  JS::RootedObject state(cx, &extra.toObject());
  JS::RootedValue key_val(cx);
  JS::RootedValue ttl_val(cx);
  if (!JS_GetProperty(cx, state, "key", &key_val)) return false;
  if (!JS_GetProperty(cx, state, "ttlMs", &ttl_val)) return false;

  JS::RootedString key_jsstring(cx, key_val.toString());

  std::optional<uint64_t> ttl_ms;
  double ttl_n = ttl_val.toNumber();
  if (ttl_n >= 0.0) ttl_ms = static_cast<uint64_t>(ttl_n);

  args.rval().setUndefined();
  return finish_set(cx, outer_promise, key_jsstring,
                    bytes.empty() ? nullptr : bytes.data(), bytes.size(),
                    ttl_ms);
}

// Async catch-handler: forwards the inner Promise's rejection reason to
// the outer Promise.
bool Cache::set_catch(JSContext *cx, JS::HandleObject outer_promise,
                      JS::HandleValue extra, JS::CallArgs args) {
  JS::RootedValue reason(cx, args.get(0));
  args.rval().setUndefined();
  return JS::RejectPromise(cx, outer_promise, reason);
}

// getOrSet then-handler on the populator's Promise. Receives the populator's
// resolved CacheValue and either finalises immediately (sync coercion) or
// chains to bytes_then via value.arrayBuffer() (async coercion).
//
// receiver = outer Promise; extra = { key, ttlMs }.
bool Cache::getOrSet_populate_then(JSContext *cx,
                                   JS::HandleObject outer_promise,
                                   JS::HandleValue extra, JS::CallArgs args) {
  JS::RootedObject state(cx, &extra.toObject());

  JS::RootedValue key_val(cx);
  JS::RootedValue ttl_val(cx);
  if (!JS_GetProperty(cx, state, "key", &key_val) ||
      !JS_GetProperty(cx, state, "ttlMs", &ttl_val)) {
    return false;
  }
  JS::RootedString key_jsstring(cx, key_val.toString());

  std::optional<uint64_t> ttl_ms;
  double ttl_n = ttl_val.toNumber();
  if (ttl_n >= 0.0) ttl_ms = static_cast<uint64_t>(ttl_n);

  JS::RootedValue value(cx, args.get(0));

  // Sync coercion (string / ArrayBuffer / ArrayBufferView).
  std::vector<uint8_t> bytes;
  bool sync_done = false;
  if (!try_sync_coerce_bytes(cx, value, &bytes, &sync_done)) {
    return reject_and_finish(cx, outer_promise, key_jsstring, args);
  }
  if (sync_done) {
    args.rval().setUndefined();
    return getOrSet_finalize(cx, outer_promise, key_jsstring, ttl_ms,
                             bytes.empty() ? nullptr : bytes.data(),
                             bytes.size());
  }

  // Async coercion. Reject for primitives that aren't sync-coercible.
  if (!value.isObject()) {
    JS_ReportErrorUTF8(cx,
        "getOrSet: populate must return string, ArrayBuffer, ArrayBufferView, "
        "ReadableStream, or Response");
    return reject_and_finish(cx, outer_promise, key_jsstring, args);
  }

  JS::RootedObject value_obj(cx, &value.toObject());

  // Wrap raw ReadableStream in a Response so the unified arrayBuffer() path
  // covers it.
  if (JS::IsReadableStream(value_obj)) {
    JS::RootedValue response_ctor_val(cx);
    if (!JS_GetProperty(cx, ENGINE->global(), "Response",
                        &response_ctor_val)) {
      return reject_and_finish(cx, outer_promise, key_jsstring, args);
    }
    JS::RootedValueArray<1> ctor_args(cx);
    ctor_args[0].setObject(*value_obj);
    JS::RootedObject response_obj(cx);
    if (!JS::Construct(cx, response_ctor_val, ctor_args, &response_obj)) {
      return reject_and_finish(cx, outer_promise, key_jsstring, args);
    }
    value_obj = response_obj;
  }

  // value.arrayBuffer() → Promise<ArrayBuffer>.
  JS::RootedValue inner_promise_val(cx);
  if (!JS::Call(cx, value_obj, "arrayBuffer", JS::HandleValueArray::empty(),
                &inner_promise_val)) {
    return reject_and_finish(cx, outer_promise, key_jsstring, args);
  }
  if (!inner_promise_val.isObject()) {
    JS_ReportErrorUTF8(cx, "getOrSet: arrayBuffer() did not return a Promise");
    return reject_and_finish(cx, outer_promise, key_jsstring, args);
  }
  JS::RootedObject inner_promise(cx, &inner_promise_val.toObject());

  // Chain to bytes_then. populate_catch handles inner-promise rejection
  // (it cleans up the inflight entry the same way).
  JS::RootedObject bytes_then_h(cx,
      create_internal_method<Cache::getOrSet_bytes_then>(cx, outer_promise,
                                                         extra));
  if (!bytes_then_h) return false;
  JS::RootedObject bytes_catch_h(cx,
      create_internal_method<Cache::getOrSet_populate_catch>(cx, outer_promise,
                                                             extra));
  if (!bytes_catch_h) return false;

  if (!JS::AddPromiseReactions(cx, inner_promise, bytes_then_h, bytes_catch_h)) {
    return false;
  }
  args.rval().setUndefined();
  return true;
}

// getOrSet catch-handler. Forwards rejection to the outer Promise and removes
// the inflight entry so the next caller can populate again.
bool Cache::getOrSet_populate_catch(JSContext *cx,
                                    JS::HandleObject outer_promise,
                                    JS::HandleValue extra, JS::CallArgs args) {
  JS::RootedObject state(cx, &extra.toObject());
  JS::RootedValue key_val(cx);
  if (JS_GetProperty(cx, state, "key", &key_val) && key_val.isString()) {
    JS::RootedString key_jsstring(cx, key_val.toString());
    inflight_delete(cx, key_jsstring);
  }
  args.rval().setUndefined();
  JS::RootedValue reason(cx, args.get(0));
  return JS::RejectPromise(cx, outer_promise, reason);
}

// getOrSet bytes-then handler: receives the resolved ArrayBuffer (from the
// async coercion path), extracts the bytes, and finalises.
bool Cache::getOrSet_bytes_then(JSContext *cx, JS::HandleObject outer_promise,
                                JS::HandleValue extra, JS::CallArgs args) {
  JS::RootedObject state(cx, &extra.toObject());
  JS::RootedValue key_val(cx);
  JS::RootedValue ttl_val(cx);
  if (!JS_GetProperty(cx, state, "key", &key_val) ||
      !JS_GetProperty(cx, state, "ttlMs", &ttl_val)) {
    return false;
  }
  JS::RootedString key_jsstring(cx, key_val.toString());

  std::optional<uint64_t> ttl_ms;
  double ttl_n = ttl_val.toNumber();
  if (ttl_n >= 0.0) ttl_ms = static_cast<uint64_t>(ttl_n);

  if (!args.get(0).isObject()) {
    JS_ReportErrorUTF8(cx, "getOrSet: arrayBuffer() resolved to a non-object");
    return reject_and_finish(cx, outer_promise, key_jsstring, args);
  }

  JS::RootedObject ab(cx, &args[0].toObject());
  std::vector<uint8_t> bytes;
  if (JS::IsArrayBufferObject(ab)) {
    size_t len = JS::GetArrayBufferByteLength(ab);
    bytes.resize(len);
    if (len > 0) {
      JS::AutoCheckCannotGC noGC(cx);
      bool is_shared;
      void *src = JS::GetArrayBufferData(ab, &is_shared, noGC);
      memcpy(bytes.data(), src, len);
    }
  } else if (JS_IsArrayBufferViewObject(ab)) {
    size_t len = JS_GetArrayBufferViewByteLength(ab);
    bytes.resize(len);
    if (len > 0) {
      JS::AutoCheckCannotGC noGC(cx);
      bool is_shared;
      void *src = JS_GetArrayBufferViewData(ab, &is_shared, noGC);
      memcpy(bytes.data(), src, len);
    }
  } else {
    JS_ReportErrorUTF8(cx, "getOrSet: arrayBuffer() resolved to a non-buffer");
    return reject_and_finish(cx, outer_promise, key_jsstring, args);
  }

  args.rval().setUndefined();
  return getOrSet_finalize(cx, outer_promise, key_jsstring, ttl_ms,
                           bytes.empty() ? nullptr : bytes.data(),
                           bytes.size());
}

namespace {
bool incr_common(JSContext *cx, JS::CallArgs &args, const char *fn_name,
                 bool negate) {
  if (!args.requireAtLeast(cx, fn_name, 1)) return false;

  JS::RootedString key_str(cx, JS::ToString(cx, args[0]));
  if (!key_str) return false;
  JS::UniqueChars key = JS_EncodeStringToUTF8(cx, key_str);
  if (!key) return false;

  int64_t delta = 1;
  if (args.length() > 1 && !args[1].isUndefined()) {
    double d;
    if (!JS::ToNumber(cx, args[1], &d)) return false;
    if (!std::isfinite(d)) {
      JS_ReportErrorUTF8(cx, "%s: delta must be a finite number", fn_name);
      return false;
    }
    if (std::trunc(d) != d) {
      JS_ReportErrorUTF8(cx, "%s: delta must be an integer", fn_name);
      return false;
    }
    // Beyond Number.MAX_SAFE_INTEGER, JS Numbers can't represent integers
    // exactly. The bound also keeps `-delta` (decr path) and the int64 cast
    // safe — INT64_MIN/MAX would otherwise be reachable as UB.
    constexpr double max_safe = 9007199254740991.0;  // 2^53 - 1
    if (d > max_safe || d < -max_safe) {
      JS_ReportErrorUTF8(cx,
          "%s: delta must be within ±Number.MAX_SAFE_INTEGER", fn_name);
      return false;
    }
    delta = static_cast<int64_t>(d);
  }
  if (negate) delta = -delta;

  auto result = host_api::cache_incr(key.get(), delta);
  if (!result.is_ok()) {
    throw_cache_error(cx, result.unwrap_err());
    return ReturnPromiseRejectedWithPendingError(cx, args);
  }

  JS::RootedValue rv(cx, JS::NumberValue(static_cast<double>(result.unwrap())));
  return resolve_with(cx, rv, args);
}
}  // namespace

bool Cache::incr(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  return incr_common(cx, args, "incr", /*negate=*/false);
}

bool Cache::decr(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  return incr_common(cx, args, "decr", /*negate=*/true);
}

const JSFunctionSpec cache_methods[] = {
    JS_FN("get",      Cache::get,       1, JSPROP_ENUMERATE),
    JS_FN("exists",   Cache::exists,    1, JSPROP_ENUMERATE),
    JS_FN("set",      Cache::set,       2, JSPROP_ENUMERATE),
    JS_FN("delete",   Cache::delete_op, 1, JSPROP_ENUMERATE),
    JS_FN("expire",   Cache::expire,    2, JSPROP_ENUMERATE),
    JS_FN("incr",     Cache::incr,      1, JSPROP_ENUMERATE),
    JS_FN("decr",     Cache::decr,      1, JSPROP_ENUMERATE),
    JS_FN("getOrSet", Cache::getOrSet,  2, JSPROP_ENUMERATE),
    JS_FS_END,
};

bool install(api::Engine *engine) {
  ENGINE = engine;

  // Inflight map for getOrSet coalescing — a JSObject with no prototype so
  // user keys cannot collide with inherited names like "constructor".
  // Persistent-rooted for the engine's lifetime.
  JS::RootedObject inflight_obj(engine->cx(), JS_NewPlainObject(engine->cx()));
  if (!inflight_obj) return false;
  if (!JS_SetPrototype(engine->cx(), inflight_obj, nullptr)) return false;
  INFLIGHT_MAP =
      new JS::PersistentRooted<JSObject *>(engine->cx(), inflight_obj);

  JS::RootedObject cache_obj(engine->cx(), JS_NewPlainObject(engine->cx()));
  if (!cache_obj) return false;

  if (!JS_DefineFunctions(engine->cx(), cache_obj, cache_methods)) {
    return false;
  }

  if (!JS_DefineProperty(engine->cx(), engine->global(), "Cache", cache_obj, 0)) {
    return false;
  }

  return true;
}

}  // namespace fastedge::cache
