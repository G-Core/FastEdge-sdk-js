// POC: raw `gcore:db/sql@0.1.0` bridge, exposed as `globalThis.__fastedgeDbSql`.
// The public API (`SqlDatabase`, `SqlError`, row objects) is the JS module `fastedge::db/sql`
// (src/componentize/es-bundle.ts); this file only converts values and throws raw error objects.
// ponytail: calls are synchronous host calls; the JS layer wraps them in Promises (like cache).
#include "builtin.h"
#include "encode.h"
#include "../host-api/bindings/bindings.h"

#include <cstring>
#include <vector>

#include <js/Array.h>
#include <js/ArrayBuffer.h>
#include <js/BigInt.h>
#include <js/CharacterEncoding.h>
#include <js/experimental/TypedData.h>

namespace fastedge::db_sql {

namespace {

JSString *new_string(JSContext *cx, const uint8_t *ptr, size_t len) {
  return JS_NewStringCopyUTF8N(cx, JS::UTF8Chars(reinterpret_cast<const char *>(ptr), len));
}

bool set_str(JSContext *cx, JS::HandleObject obj, const char *key, const bindings_string_t &s) {
  JS::RootedString str(cx, new_string(cx, s.ptr, s.len));
  if (!str) return false;
  JS::RootedValue v(cx, JS::StringValue(str));
  return JS_SetProperty(cx, obj, key, v);
}

bool set_opt_str(JSContext *cx, JS::HandleObject obj, const char *key,
                 const bindings_option_string_t &s) {
  return !s.is_some || set_str(cx, obj, key, s.val);
}

// Throws `{ kind, message, code?, detail?, hint?, constraint? }`; the JS layer turns it into SqlError.
bool throw_error(JSContext *cx, gcore_db_sql_error_t &err) {
  static const char *KINDS[] = {"config", "access-denied", "config", "connection",
                                "timeout", "limit",         "query",  "internal"};
  JS::RootedObject obj(cx, JS_NewPlainObject(cx));
  if (!obj) return false;
  JS::RootedString kind(cx, JS_NewStringCopyZ(cx, KINDS[err.tag]));
  if (!kind) return false;
  JS::RootedValue kind_val(cx, JS::StringValue(kind));
  if (!JS_SetProperty(cx, obj, "kind", kind_val)) return false;

  bool ok = true;
  switch (err.tag) {
  case GCORE_DB_SQL_ERROR_NO_SUCH_DATABASE: {
    bindings_string_t msg{(uint8_t *)"no such database", 16};
    ok = set_str(cx, obj, "message", msg);
    break;
  }
  case GCORE_DB_SQL_ERROR_CONFIG:
  case GCORE_DB_SQL_ERROR_QUERY: {
    auto &e = err.tag == GCORE_DB_SQL_ERROR_CONFIG ? err.val.config : err.val.query;
    ok = set_str(cx, obj, "message", e.message) && set_opt_str(cx, obj, "code", e.code) &&
         set_opt_str(cx, obj, "detail", e.detail) && set_opt_str(cx, obj, "hint", e.hint) &&
         set_opt_str(cx, obj, "constraint", e.constraint);
    break;
  }
  case GCORE_DB_SQL_ERROR_CONNECTION:
    ok = set_str(cx, obj, "message", err.val.connection);
    break;
  case GCORE_DB_SQL_ERROR_LIMIT:
    ok = set_str(cx, obj, "message", err.val.limit);
    break;
  default:
    break;
  }
  gcore_db_sql_error_free(&err);
  if (!ok) return false;
  JS::RootedValue exc(cx, JS::ObjectValue(*obj));
  JS_SetPendingException(cx, exc);
  return false;
}

// JS param -> WIT value. Strings/bytes are owned by `keep` until the host call returns.
bool to_value(JSContext *cx, JS::HandleValue v, gcore_db_sql_value_t &out,
              std::vector<host_api::HostString> &keep, std::vector<std::vector<uint8_t>> &bytes) {
  if (v.isNullOrUndefined()) {
    out.tag = GCORE_DB_SQL_VALUE_NULL;
  } else if (v.isBoolean()) {
    out.tag = GCORE_DB_SQL_VALUE_BOOLEAN;
    out.val.boolean = v.toBoolean();
  } else if (v.isInt32()) {
    out.tag = GCORE_DB_SQL_VALUE_INT32;
    out.val.int32 = v.toInt32();
  } else if (v.isNumber()) {
    out.tag = GCORE_DB_SQL_VALUE_FLOAT64;
    out.val.float64 = v.toNumber();
  } else if (v.isBigInt()) {
    out.tag = GCORE_DB_SQL_VALUE_INT64;
    out.val.int64 = JS::ToBigInt64(v.toBigInt());
  } else if (v.isObject() && JS_IsUint8Array(&v.toObject())) {
    JS::RootedObject arr(cx, &v.toObject());
    auto &buf = bytes.emplace_back(JS_GetTypedArrayLength(arr));
    {
      JS::AutoCheckCannotGC noGC(cx);
      bool is_shared;
      std::memcpy(buf.data(), JS_GetArrayBufferViewData(arr, &is_shared, noGC), buf.size());
    }
    out.tag = GCORE_DB_SQL_VALUE_BYTES;
    out.val.bytes = {buf.data(), buf.size()};
  } else {
    JS::RootedString str(cx, JS::ToString(cx, v));
    if (!str) return false;
    auto &s = keep.emplace_back(core::encode(cx, str));
    if (!s) return false;
    out.tag = GCORE_DB_SQL_VALUE_TEXT;
    out.val.text = {(uint8_t *)s.ptr.get(), s.len};
  }
  return true;
}

bool to_params(JSContext *cx, JS::HandleValue arr_val, std::vector<gcore_db_sql_value_t> &out,
               std::vector<host_api::HostString> &keep,
               std::vector<std::vector<uint8_t>> &bytes) {
  if (arr_val.isNullOrUndefined()) return true;
  JS::RootedObject arr(cx, arr_val.isObject() ? &arr_val.toObject() : nullptr);
  uint32_t len = 0;
  bool is_array = false;
  if (!arr || !JS::IsArrayObject(cx, arr, &is_array) || !is_array) {
    JS_ReportErrorUTF8(cx, "params must be an array");
    return false;
  }
  if (!JS::GetArrayLength(cx, arr, &len)) return false;
  out.resize(len);
  JS::RootedValue el(cx);
  for (uint32_t i = 0; i < len; i++) {
    if (!JS_GetElement(cx, arr, i, &el) || !to_value(cx, el, out[i], keep, bytes)) return false;
  }
  return true;
}

// WIT value -> JS. Plain values only; the JS layer applies the type mapping (json, int8).
bool from_value(JSContext *cx, const gcore_db_sql_value_t &v, JS::MutableHandleValue out) {
  switch (v.tag) {
  case GCORE_DB_SQL_VALUE_NULL:
    out.setNull();
    return true;
  case GCORE_DB_SQL_VALUE_BOOLEAN:
    out.setBoolean(v.val.boolean);
    return true;
  case GCORE_DB_SQL_VALUE_INT32:
    out.setInt32(v.val.int32);
    return true;
  case GCORE_DB_SQL_VALUE_FLOAT64:
    out.setDouble(v.val.float64);
    return true;
  case GCORE_DB_SQL_VALUE_INT64: {
    JS::BigInt *bi = JS::NumberToBigInt(cx, v.val.int64);
    if (!bi) return false;
    out.setBigInt(bi);
    return true;
  }
  case GCORE_DB_SQL_VALUE_BYTES: {
    JS::RootedObject arr(cx, JS_NewUint8Array(cx, v.val.bytes.len));
    if (!arr) return false;
    {
      JS::AutoCheckCannotGC noGC(cx);
      bool is_shared;
      std::memcpy(JS_GetArrayBufferViewData(arr, &is_shared, noGC), v.val.bytes.ptr,
                  v.val.bytes.len);
    }
    out.setObject(*arr);
    return true;
  }
  default: { // numeric, text, json: all strings
    const bindings_string_t &s = v.val.text;
    JSString *str = new_string(cx, s.ptr, s.len);
    if (!str) return false;
    out.setString(str);
    return true;
  }
  }
}

// `{ columns: [[name, typeOid]...], rows: [[...]...], rowCount }`
JSObject *from_result(JSContext *cx, const gcore_db_sql_query_result_t &r) {
  JS::RootedObject obj(cx, JS_NewPlainObject(cx));
  JS::RootedObject columns(cx, JS::NewArrayObject(cx, r.columns.len));
  JS::RootedObject rows(cx, JS::NewArrayObject(cx, r.rows.len));
  if (!obj || !columns || !rows) return nullptr;
  JS::RootedValue v(cx);
  for (size_t i = 0; i < r.columns.len; i++) {
    JS::RootedObject col(cx, JS::NewArrayObject(cx, 2));
    JS::RootedString name(cx, new_string(cx, r.columns.ptr[i].name.ptr, r.columns.ptr[i].name.len));
    if (!col || !name) return nullptr;
    v.setString(name);
    if (!JS_SetElement(cx, col, 0, v)) return nullptr;
    v.setNumber(r.columns.ptr[i].type_oid);
    if (!JS_SetElement(cx, col, 1, v)) return nullptr;
    v.setObject(*col);
    if (!JS_SetElement(cx, columns, i, v)) return nullptr;
  }
  for (size_t i = 0; i < r.rows.len; i++) {
    const auto &row = r.rows.ptr[i];
    JS::RootedObject arr(cx, JS::NewArrayObject(cx, row.len));
    if (!arr) return nullptr;
    for (size_t j = 0; j < row.len; j++) {
      if (!from_value(cx, row.ptr[j], &v) || !JS_SetElement(cx, arr, j, v)) return nullptr;
    }
    v.setObject(*arr);
    if (!JS_SetElement(cx, rows, i, v)) return nullptr;
  }
  v.setObject(*columns);
  if (!JS_SetProperty(cx, obj, "columns", v)) return nullptr;
  v.setObject(*rows);
  if (!JS_SetProperty(cx, obj, "rows", v)) return nullptr;
  v.setNumber(static_cast<double>(r.row_count));
  if (!JS_SetProperty(cx, obj, "rowCount", v)) return nullptr;
  return obj;
}

bool get_handle(JSContext *cx, JS::HandleValue v, gcore_db_sql_borrow_database_t &out) {
  if (!v.isInt32()) {
    JS_ReportErrorUTF8(cx, "invalid database handle");
    return false;
  }
  out.__handle = v.toInt32();
  return true;
}

// open(name) -> handle
bool open(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  if (!args.requireAtLeast(cx, "open", 1)) return false;
  JS::RootedString name_str(cx, JS::ToString(cx, args[0]));
  if (!name_str) return false;
  auto name = core::encode(cx, name_str);
  if (!name) return false;
  bindings_string_t name_ws{(uint8_t *)name.ptr.get(), name.len};
  gcore_db_sql_own_database_t db{};
  gcore_db_sql_error_t err{};
  if (!gcore_db_sql_static_database_open(&name_ws, &db, &err)) return throw_error(cx, err);
  // ponytail: handle never dropped; the host frees it with the request's store.
  args.rval().setInt32(db.__handle);
  return true;
}

// query(handle, sql, params) -> raw result
bool query(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  if (!args.requireAtLeast(cx, "query", 2)) return false;
  gcore_db_sql_borrow_database_t db;
  if (!get_handle(cx, args[0], db)) return false;
  JS::RootedString sql_str(cx, JS::ToString(cx, args[1]));
  if (!sql_str) return false;
  auto sql = core::encode(cx, sql_str);
  if (!sql) return false;

  std::vector<gcore_db_sql_value_t> params;
  std::vector<host_api::HostString> keep;
  std::vector<std::vector<uint8_t>> bytes;
  if (!to_params(cx, args.get(2), params, keep, bytes)) return false;

  bindings_string_t sql_ws{(uint8_t *)sql.ptr.get(), sql.len};
  gcore_db_sql_list_value_t params_ws{params.data(), params.size()};
  gcore_db_sql_query_result_t ret{};
  gcore_db_sql_error_t err{};
  if (!gcore_db_sql_method_database_query(db, &sql_ws, &params_ws, &ret, &err)) {
    return throw_error(cx, err);
  }
  JSObject *obj = from_result(cx, ret);
  gcore_db_sql_query_result_free(&ret);
  if (!obj) return false;
  args.rval().setObject(*obj);
  return true;
}

// batch(handle, [[sql, params]...]) -> raw results
bool batch(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  if (!args.requireAtLeast(cx, "batch", 2)) return false;
  gcore_db_sql_borrow_database_t db;
  if (!get_handle(cx, args[0], db)) return false;
  bool is_array = false;
  JS::RootedObject list(cx, args[1].isObject() ? &args[1].toObject() : nullptr);
  if (!list || !JS::IsArrayObject(cx, list, &is_array) || !is_array) {
    JS_ReportErrorUTF8(cx, "statements must be an array");
    return false;
  }
  uint32_t len = 0;
  if (!JS::GetArrayLength(cx, list, &len)) return false;

  std::vector<host_api::HostString> keep;
  std::vector<std::vector<uint8_t>> bytes;
  std::vector<std::vector<gcore_db_sql_value_t>> params(len);
  std::vector<gcore_db_sql_statement_t> stmts(len);
  JS::RootedValue el(cx), sql_val(cx), params_val(cx);
  for (uint32_t i = 0; i < len; i++) {
    if (!JS_GetElement(cx, list, i, &el)) return false;
    JS::RootedObject pair(cx, el.isObject() ? &el.toObject() : nullptr);
    if (!pair) {
      JS_ReportErrorUTF8(cx, "statement must be [sql, params]");
      return false;
    }
    if (!JS_GetElement(cx, pair, 0, &sql_val) || !JS_GetElement(cx, pair, 1, &params_val)) {
      return false;
    }
    JS::RootedString sql_str(cx, JS::ToString(cx, sql_val));
    if (!sql_str) return false;
    auto &sql = keep.emplace_back(core::encode(cx, sql_str));
    if (!sql) return false;
    if (!to_params(cx, params_val, params[i], keep, bytes)) return false;
    stmts[i] = {{(uint8_t *)sql.ptr.get(), sql.len}, {params[i].data(), params[i].size()}};
  }

  gcore_db_sql_list_statement_t stmts_ws{stmts.data(), stmts.size()};
  gcore_db_sql_list_query_result_t ret{};
  gcore_db_sql_error_t err{};
  if (!gcore_db_sql_method_database_batch(db, &stmts_ws, &ret, &err)) {
    return throw_error(cx, err);
  }
  JS::RootedObject out(cx, JS::NewArrayObject(cx, ret.len));
  bool ok = out != nullptr;
  JS::RootedValue v(cx);
  for (size_t i = 0; ok && i < ret.len; i++) {
    JSObject *obj = from_result(cx, ret.ptr[i]);
    ok = obj != nullptr;
    if (ok) {
      v.setObject(*obj);
      ok = JS_SetElement(cx, out, i, v);
    }
  }
  gcore_db_sql_list_query_result_free(&ret);
  if (!ok) return false;
  args.rval().setObject(*out);
  return true;
}

const JSFunctionSpec methods[] = {
    JS_FN("open", open, 1, 0),
    JS_FN("query", query, 3, 0),
    JS_FN("batch", batch, 2, 0),
    JS_FS_END,
};

} // namespace

bool install(api::Engine *engine) {
  JS::RootedObject obj(engine->cx(), JS_NewPlainObject(engine->cx()));
  if (!obj || !JS_DefineFunctions(engine->cx(), obj, methods)) return false;
  return JS_DefineProperty(engine->cx(), engine->global(), "__fastedgeDbSql", obj, 0);
}

} // namespace fastedge::db_sql
