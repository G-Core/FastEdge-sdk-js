// `fastedge::db/kv`: `KvDatabase` + `KvError` over `gcore:db/kv@0.1.0` (async).
// Each method starts the host call and returns a Promise; an AsyncTask settles it when the host
// future's pollable is ready, so calls run concurrently with each other and with `fetch`.
#include "cache.h"
#include "db-sql.h"
#include "encode.h"
#include "../host-api/bindings/bindings.h"

#include <cmath>
#include <optional>
#include <vector>

#include <js/Array.h>
#include <js/Promise.h>
#include <js/TracingAPI.h>

namespace {

// `KvError.prototype`; inherits `Error.prototype`.
JS::PersistentRooted<JSObject *> *kv_error_proto;

const JSClass kv_database_class = {"KvDatabase", JSCLASS_HAS_RESERVED_SLOTS(1)};

// Keys and values passed to the host, owned until the call returns. Growing the vectors moves
// the owners, not the heap buffers the bindings point at.
struct Keep {
  std::vector<host_api::HostString> strings;
  std::vector<std::vector<uint8_t>> bytes;
};

JSString *new_string(JSContext *cx, const uint8_t *ptr, size_t len) {
  return JS_NewStringCopyUTF8N(cx, JS::UTF8Chars(reinterpret_cast<const char *>(ptr), len));
}

// Host error -> pending KvError exception. Always returns false.
bool throw_kv_error(JSContext *cx, gcore_db_kv_types_error_t &err) {
  static const char *KINDS[] = {"config", "access-denied", "config",    "connection",
                                "timeout", "limit",        "operation", "internal"};
  static const char *MESSAGES[] = {"no such database", "access denied", "", "",
                                   "timeout",          "",              "", "internal error"};
  const bindings_string_t *text = err.tag == GCORE_DB_KV_TYPES_ERROR_CONFIG ? &err.val.config
                                  : err.tag == GCORE_DB_KV_TYPES_ERROR_CONNECTION
                                      ? &err.val.connection
                                  : err.tag == GCORE_DB_KV_TYPES_ERROR_LIMIT ? &err.val.limit
                                  : err.tag == GCORE_DB_KV_TYPES_ERROR_OPERATION
                                      ? &err.val.operation.message
                                      : nullptr;
  JS::RootedString message(cx, text ? new_string(cx, text->ptr, text->len)
                                    : JS_NewStringCopyZ(cx, MESSAGES[err.tag]));
  JS::RootedObject obj(
      cx, message ? fastedge::db_sql::new_error(cx, *kv_error_proto, KINDS[err.tag], message)
                  : nullptr);
  bool ok = obj != nullptr;
  if (err.tag == GCORE_DB_KV_TYPES_ERROR_OPERATION) {
    auto &op = err.val.operation;
    JS::RootedValue v(cx);
    if (ok && op.code.is_some) {
      JSString *code = new_string(cx, op.code.val.ptr, op.code.val.len);
      ok = code != nullptr;
      if (ok) {
        v.setString(code);
        ok = JS_SetProperty(cx, obj, "code", v);
      }
    }
    if (ok && op.op_index.is_some) {
      v.setNumber(op.op_index.val);
      ok = JS_SetProperty(cx, obj, "opIndex", v);
    }
    // The generated op_error_free (wit-bindgen 0.52) doesn't free `code`.
    bindings_option_string_free(&op.code);
  }
  gcore_db_kv_types_error_free(&err);
  if (ok) {
    JS::RootedValue exc(cx, JS::ObjectValue(*obj));
    JS_SetPendingException(cx, exc);
  }
  return false;
}

bool to_key(JSContext *cx, JS::HandleValue v, bindings_string_t &out, Keep &keep) {
  JS::RootedString str(cx, JS::ToString(cx, v));
  if (!str) return false;
  auto &s = keep.strings.emplace_back(core::encode(cx, str));
  if (!s) return false;
  out = {(uint8_t *)s.ptr.get(), s.len};
  return true;
}

// string | ArrayBuffer | ArrayBufferView -> bytes.
bool to_value(JSContext *cx, JS::HandleValue v, gcore_db_kv_types_kv_value_t &out, Keep &keep) {
  auto &buf = keep.bytes.emplace_back();
  bool done = false;
  if (!fastedge::cache::value_bytes(cx, v, &buf, &done)) return false;
  if (!done) {
    JS_ReportErrorUTF8(cx, "value must be a string, ArrayBuffer or ArrayBufferView");
    return false;
  }
  out = {buf.data(), buf.size()};
  return true;
}

// `{ ttl | ttlMs | expiresAt, ifNotExists, ifExists }`
bool to_set_options(JSContext *cx, JS::HandleValue v, gcore_db_kv_types_set_options_t &out) {
  std::optional<uint64_t> ttl_ms;
  if (!fastedge::cache::ttl_ms_option(cx, v, &ttl_ms)) return false;
  out.ttl_ms = {ttl_ms.has_value(), ttl_ms.value_or(0)};
  out.condition = GCORE_DB_KV_TYPES_SET_CONDITION_ALWAYS;
  if (!v.isObject()) return true;
  JS::RootedObject opts(cx, &v.toObject());
  JS::RootedValue if_not_exists(cx), if_exists(cx);
  if (!JS_GetProperty(cx, opts, "ifNotExists", &if_not_exists) ||
      !JS_GetProperty(cx, opts, "ifExists", &if_exists)) {
    return false;
  }
  if (JS::ToBoolean(if_not_exists) && JS::ToBoolean(if_exists)) {
    JS_ReportErrorUTF8(cx, "pass only one of ifNotExists, ifExists");
    return false;
  }
  if (JS::ToBoolean(if_not_exists)) out.condition = GCORE_DB_KV_TYPES_SET_CONDITION_IF_NOT_EXISTS;
  if (JS::ToBoolean(if_exists)) out.condition = GCORE_DB_KV_TYPES_SET_CONDITION_IF_EXISTS;
  return true;
}

// Integer within ±Number.MAX_SAFE_INTEGER; `undefined` -> 1.
bool to_delta(JSContext *cx, JS::HandleValue v, int64_t &out) {
  out = 1;
  if (v.isUndefined()) return true;
  double d;
  if (!JS::ToNumber(cx, v, &d)) return false;
  constexpr double max_safe = 9007199254740991.0; // 2^53 - 1
  if (!std::isfinite(d) || std::trunc(d) != d || d > max_safe || d < -max_safe) {
    JS_ReportErrorUTF8(cx, "incr: delta must be an integer within ±Number.MAX_SAFE_INTEGER");
    return false;
  }
  out = static_cast<int64_t>(d);
  return true;
}

// One operation from its parts. `tag` is a GCORE_DB_KV_TYPES_OP_* value; `value`, `options`
// and `delta` are read only by the ops that take them.
bool to_op(JSContext *cx, uint8_t tag, JS::HandleValue key, JS::HandleValue value,
           JS::HandleValue options, JS::HandleValue delta, gcore_db_kv_types_op_t &op,
           Keep &keep) {
  op.tag = tag;
  switch (tag) {
  case GCORE_DB_KV_TYPES_OP_GET:
    return to_key(cx, key, op.val.get, keep);
  case GCORE_DB_KV_TYPES_OP_EXISTS:
    return to_key(cx, key, op.val.exists, keep);
  case GCORE_DB_KV_TYPES_OP_DELETE:
    return to_key(cx, key, op.val.delete_, keep);
  case GCORE_DB_KV_TYPES_OP_SET:
    return to_key(cx, key, op.val.set.key, keep) &&
           to_value(cx, value, op.val.set.value, keep) &&
           to_set_options(cx, options, op.val.set.options);
  case GCORE_DB_KV_TYPES_OP_INCR:
    return to_key(cx, key, op.val.incr.key, keep) && to_delta(cx, delta, op.val.incr.delta);
  default: { // expire
    std::optional<uint64_t> ttl_ms;
    if (!to_key(cx, key, op.val.expire.key, keep) ||
        !fastedge::cache::ttl_ms_option(cx, options, &ttl_ms)) {
      return false;
    }
    if (!ttl_ms) {
      JS_ReportErrorUTF8(cx, "expire: options must set ttl, ttlMs or expiresAt");
      return false;
    }
    op.val.expire.ttl_ms = *ttl_ms;
    return true;
  }
  }
}

// Op result -> JS: get -> KvEntry | null, incr -> number, the rest -> boolean.
bool from_result(JSContext *cx, const gcore_db_kv_types_op_result_t &r,
                 JS::MutableHandleValue out) {
  switch (r.tag) {
  case GCORE_DB_KV_TYPES_OP_RESULT_GET: {
    if (!r.val.get.is_some) {
      out.setNull();
      return true;
    }
    JSObject *entry = fastedge::cache::new_entry(cx, r.val.get.val.ptr, r.val.get.val.len);
    if (!entry) return false;
    out.setObject(*entry);
    return true;
  }
  case GCORE_DB_KV_TYPES_OP_RESULT_INCR:
    out.setNumber(static_cast<double>(r.val.incr));
    return true;
  default: // exists, set, delete, expire: same bool layout
    out.setBoolean(r.val.exists);
    return true;
  }
}

bool this_handle(JSContext *cx, JS::CallArgs &args, gcore_db_kv_borrow_database_t &out) {
  JS::RootedObject self(cx, args.thisv().isObject() ? &args.thisv().toObject() : nullptr);
  // The exported KvDatabase object shares the class but has no handle: require one.
  if (!self || !JS_InstanceOf(cx, self, &kv_database_class, nullptr) ||
      !JS::GetReservedSlot(self, 0).isInt32()) {
    JS_ReportErrorUTF8(cx, "Invalid KvDatabase instance");
    return false;
  }
  out.__handle = JS::GetReservedSlot(self, 0).toInt32();
  return true;
}

// Settles `promise`: `value` on success, the pending exception otherwise.
bool settle_promise(JSContext *cx, JS::HandleObject promise, bool ok, JS::HandleValue value) {
  if (ok) return JS::ResolvePromise(cx, promise, value);
  JS::RootedValue exc(cx);
  if (!JS_GetPendingException(cx, &exc)) return false; // uncatchable (e.g. OOM)
  JS_ClearPendingException(cx);
  return JS::RejectPromise(cx, promise, exc);
}

// A started execute/batch. Holds the host future; settles `promise_` once its pollable is ready.
class KvTask final : public api::AsyncTask {
  JS::Heap<JSObject *> promise_;
  int32_t future_;
  bool batch_;

  void drop_future() {
    if (batch_) {
      gcore_db_kv_future_batch_result_drop_own({future_});
    } else {
      gcore_db_kv_future_op_result_drop_own({future_});
    }
  }

  bool result(JSContext *cx, JS::MutableHandleValue out) {
    if (batch_) {
      gcore_db_kv_result_list_op_result_error_t res{};
      if (!gcore_db_kv_method_future_batch_result_get({future_}, &res)) {
        JS_ReportErrorUTF8(cx, "database result not ready");
        return false;
      }
      if (res.is_err) return throw_kv_error(cx, res.val.err);
      JS::RootedObject arr(cx, JS::NewArrayObject(cx, res.val.ok.len));
      bool ok = arr != nullptr;
      JS::RootedValue v(cx);
      for (size_t i = 0; ok && i < res.val.ok.len; i++) {
        ok = from_result(cx, res.val.ok.ptr[i], &v) && JS_SetElement(cx, arr, i, v);
      }
      gcore_db_kv_list_op_result_free(&res.val.ok);
      if (ok) out.setObject(*arr);
      return ok;
    }
    gcore_db_kv_result_op_result_error_t res{};
    if (!gcore_db_kv_method_future_op_result_get({future_}, &res)) {
      JS_ReportErrorUTF8(cx, "database result not ready");
      return false;
    }
    if (res.is_err) return throw_kv_error(cx, res.val.err);
    bool ok = from_result(cx, res.val.ok, out);
    gcore_db_kv_types_op_result_free(&res.val.ok);
    return ok;
  }

public:
  KvTask(JS::HandleObject promise, int32_t future, bool batch)
      : promise_(promise), future_(future), batch_(batch) {
    handle_ = batch ? gcore_db_kv_method_future_batch_result_subscribe({future}).__handle
                    : gcore_db_kv_method_future_op_result_subscribe({future}).__handle;
  }

  bool run(api::Engine *engine) override {
    JSContext *cx = engine->cx();
    // The pollable is a child of the future: drop it first.
    wasi_io_poll_pollable_drop_own({handle_});
    handle_ = INVALID_POLLABLE_HANDLE;
    JS::RootedObject promise(cx, promise_);
    JS::RootedValue value(cx);
    bool ok = result(cx, &value);
    drop_future();
    return settle_promise(cx, promise, ok, value);
  }

  bool cancel(api::Engine *engine) override {
    if (handle_ != INVALID_POLLABLE_HANDLE) {
      wasi_io_poll_pollable_drop_own({handle_});
      handle_ = INVALID_POLLABLE_HANDLE;
      drop_future();
    }
    return true;
  }

  void trace(JSTracer *trc) override { JS::TraceEdge(trc, &promise_, "KvTask promise"); }
};

// Queues a task for host future `future` and returns its Promise in `args.rval()`.
bool start(JSContext *cx, JS::CallArgs &args, int32_t future, bool batch) {
  JS::RootedObject promise(cx, JS::NewPromiseObject(cx, nullptr));
  if (!promise) {
    // Don't leak the host call: it would otherwise run to completion unobserved.
    if (batch) {
      gcore_db_kv_future_batch_result_drop_own({future});
    } else {
      gcore_db_kv_future_op_result_drop_own({future});
    }
    return false;
  }
  api::Engine::queue_async_task(new KvTask(promise, future, batch));
  args.rval().setObject(*promise);
  return true;
}

// Start one op (`execute`); its result is the op's own result case.
bool start_op(JSContext *cx, JS::CallArgs &args, uint8_t tag, JS::HandleValue value,
              JS::HandleValue options, JS::HandleValue delta) {
  gcore_db_kv_borrow_database_t db;
  if (!this_handle(cx, args, db)) return false;
  Keep keep;
  gcore_db_kv_types_op_t op{};
  if (!to_op(cx, tag, args.get(0), value, options, delta, op, keep)) return false;
  auto future = gcore_db_kv_method_database_execute(db, &op);
  return start(cx, args, future.__handle, false);
}

const char *OP_NAMES[] = {"get", "exists", "set", "delete", "incr", "expire"};

bool start_batch(JSContext *cx, JS::CallArgs &args) {
  gcore_db_kv_borrow_database_t db;
  if (!this_handle(cx, args, db)) return false;
  bool is_array = false;
  JS::RootedObject list(cx, args[0].isObject() ? &args[0].toObject() : nullptr);
  if (!list || !JS::IsArrayObject(cx, list, &is_array) || !is_array) {
    JS_ReportErrorUTF8(cx, "ops must be an array of { op, key, ... }");
    return false;
  }
  uint32_t len = 0;
  if (!JS::GetArrayLength(cx, list, &len)) return false;
  // The host's cap (MAX_BATCH_OPS), checked here before allocating for `len` ops.
  if (len > 50) {
    JS::RootedString msg(cx, JS_NewStringCopyZ(cx, "more than 50 operations in a batch"));
    JS::RootedObject exc(cx,
                         msg ? fastedge::db_sql::new_error(cx, *kv_error_proto, "limit", msg)
                             : nullptr);
    if (exc) {
      JS::RootedValue v(cx, JS::ObjectValue(*exc));
      JS_SetPendingException(cx, v);
    }
    return false;
  }

  Keep keep;
  std::vector<gcore_db_kv_types_op_t> ops(len);
  JS::RootedValue el(cx), name(cx), key(cx), value(cx), options(cx), delta(cx);
  for (uint32_t i = 0; i < len; i++) {
    if (!JS_GetElement(cx, list, i, &el)) return false;
    JS::RootedObject obj(cx, el.isObject() ? &el.toObject() : nullptr);
    if (!obj || !JS_GetProperty(cx, obj, "op", &name)) {
      if (!obj) JS_ReportErrorUTF8(cx, "ops must be an array of { op, key, ... }");
      return false;
    }
    int tag = -1;
    for (int t = 0; t < 6 && name.isString(); t++) {
      bool match = false;
      if (!JS_StringEqualsAscii(cx, name.toString(), OP_NAMES[t], &match)) return false;
      if (match) tag = t;
    }
    if (tag < 0) {
      JS_ReportErrorUTF8(cx, "ops[%u].op must be one of get, exists, set, delete, incr, expire",
                         i);
      return false;
    }
    if (!JS_GetProperty(cx, obj, "key", &key) || !JS_GetProperty(cx, obj, "value", &value) ||
        !JS_GetProperty(cx, obj, "options", &options) ||
        !JS_GetProperty(cx, obj, "delta", &delta) ||
        !to_op(cx, tag, key, value, options, delta, ops[i], keep)) {
      return false;
    }
  }

  gcore_db_kv_list_op_t ops_ws{ops.data(), ops.size()};
  auto future = gcore_db_kv_method_database_batch(db, &ops_ws);
  return start(cx, args, future.__handle, true);
}

// Argument errors reject the returned Promise rather than throw synchronously.
#define KV_METHOD(fn, min, body)                                                                   \
  bool fn(JSContext *cx, unsigned argc, JS::Value *vp) {                                           \
    JS::CallArgs args = JS::CallArgsFromVp(argc, vp);                                              \
    if (!args.requireAtLeast(cx, #fn, min)) return false;                                          \
    JS::RootedValue none(cx);                                                                      \
    return (body) || fastedge::db_sql::settle(cx, args, false, none);                              \
  }

// get(key) -> Promise<KvEntry | null>
KV_METHOD(get, 1, start_op(cx, args, GCORE_DB_KV_TYPES_OP_GET, none, none, none))
// exists(key) -> Promise<boolean>
KV_METHOD(exists, 1, start_op(cx, args, GCORE_DB_KV_TYPES_OP_EXISTS, none, none, none))
// set(key, value, { ttl | ttlMs | expiresAt, ifNotExists, ifExists }?) -> Promise<boolean>
KV_METHOD(set, 2, start_op(cx, args, GCORE_DB_KV_TYPES_OP_SET, args[1], args.get(2), none))
// delete(key) -> Promise<boolean>
KV_METHOD(delete_op, 1, start_op(cx, args, GCORE_DB_KV_TYPES_OP_DELETE, none, none, none))
// incr(key, delta = 1) -> Promise<number>
KV_METHOD(incr, 1, start_op(cx, args, GCORE_DB_KV_TYPES_OP_INCR, none, none, args.get(1)))
// expire(key, { ttl | ttlMs | expiresAt }) -> Promise<boolean>
KV_METHOD(expire, 2, start_op(cx, args, GCORE_DB_KV_TYPES_OP_EXPIRE, none, args[1], none))
// batch([{ op, key, value?, options?, delta? }]) -> Promise<result[]>; atomic.
KV_METHOD(batch, 1, start_batch(cx, args))

const JSFunctionSpec methods[] = {
    JS_FN("get", get, 1, JSPROP_ENUMERATE),       JS_FN("exists", exists, 1, JSPROP_ENUMERATE),
    JS_FN("set", set, 2, JSPROP_ENUMERATE),       JS_FN("delete", delete_op, 1, JSPROP_ENUMERATE),
    JS_FN("incr", incr, 1, JSPROP_ENUMERATE),     JS_FN("expire", expire, 2, JSPROP_ENUMERATE),
    JS_FN("batch", batch, 1, JSPROP_ENUMERATE),   JS_FS_END,
};

// KvDatabase.open(name) -> KvDatabase; throws KvError.
bool open_db(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  if (!args.requireAtLeast(cx, "KvDatabase.open", 1)) return false;
  JS::RootedString name_str(cx, JS::ToString(cx, args[0]));
  if (!name_str) return false;
  auto name = core::encode(cx, name_str);
  if (!name) return false;

  bindings_string_t name_ws{(uint8_t *)name.ptr.get(), name.len};
  gcore_db_kv_own_database_t db{};
  gcore_db_kv_types_error_t err{};
  if (!gcore_db_kv_static_database_open(&name_ws, &db, &err)) return throw_kv_error(cx, err);

  JS::RootedObject obj(cx, JS_NewObjectWithGivenProto(cx, &kv_database_class, nullptr));
  if (!obj || !JS_DefineFunctions(cx, obj, methods)) return false;
  // ponytail: handle never dropped; the host frees it with the request's store.
  JS::SetReservedSlot(obj, 0, JS::Int32Value(db.__handle));
  args.rval().setObject(*obj);
  return true;
}

const JSFunctionSpec static_methods[] = {
    JS_FN("open", open_db, 1, JSPROP_ENUMERATE),
    JS_FS_END,
};

} // namespace

namespace fastedge::db_kv {

bool install(api::Engine *engine) {
  JSContext *cx = engine->cx();
  JS::RootedObject ctor(cx, JS_NewObject(cx, &kv_database_class));
  if (!ctor || !JS_DefineFunctions(cx, ctor, static_methods) ||
      !JS_DefineProperty(cx, engine->global(), "KvDatabase", ctor, 0)) {
    return false;
  }
  return db_sql::define_error_class(engine, "KvError", &kv_error_proto);
}

} // namespace fastedge::db_kv
