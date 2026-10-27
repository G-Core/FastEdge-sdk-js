// `fastedge::db/sql`: `SqlDatabase` + `SqlError` over `gcore:db/sql@0.1.0`.
// ponytail: host calls are synchronous; query/batch return already-settled Promises (like Cache).
#include "db-sql.h"
#include "encode.h"
#include "../host-api/bindings/bindings.h"

#include <cstring>
#include <string>
#include <vector>

#include <js/Array.h>
#include <js/ArrayBuffer.h>
#include <js/BigInt.h>
#include <js/CallAndConstruct.h>
#include <js/CharacterEncoding.h>
#include <js/Date.h>
#include <js/JSON.h>
#include <js/Promise.h>
#include <js/Realm.h>
#include <js/experimental/TypedData.h>

using fastedge::db_sql::SqlDatabase;

namespace {

// `SqlError.prototype`; inherits `Error.prototype`.
JS::PersistentRooted<JSObject *> *sql_error_proto;

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

// A real Error (message, stack) re-parented to SqlError.prototype, with `kind`.
JSObject *new_sql_error(JSContext *cx, const char *kind, JS::HandleString message) {
  JS::RootedObject error_ctor(cx);
  if (!JS_GetClassObject(cx, JSProto_Error, &error_ctor)) return nullptr;
  JS::RootedValue ctor_val(cx, JS::ObjectValue(*error_ctor));
  JS::RootedValueArray<1> ctor_args(cx);
  ctor_args[0].setString(message);
  JS::RootedObject err(cx);
  if (!JS::Construct(cx, ctor_val, ctor_args, &err)) return nullptr;
  if (!JS_SetPrototype(cx, err, *sql_error_proto)) return nullptr;
  JS::RootedString kind_str(cx, JS_NewStringCopyZ(cx, kind));
  if (!kind_str) return nullptr;
  JS::RootedValue kind_val(cx, JS::StringValue(kind_str));
  if (!JS_SetProperty(cx, err, "kind", kind_val)) return nullptr;
  return err;
}

// Host error -> pending SqlError exception. Always returns false.
bool throw_sql_error(JSContext *cx, gcore_db_sql_error_t &err) {
  static const char *KINDS[] = {"config", "access-denied", "config", "connection",
                                "timeout", "limit",         "query",  "internal"};
  static const char *MESSAGES[] = {"no such database", "access denied", "", "",
                                   "timeout",          "",              "", "internal error"};
  const gcore_db_sql_db_error_t *db_err = err.tag == GCORE_DB_SQL_ERROR_CONFIG  ? &err.val.config
                                          : err.tag == GCORE_DB_SQL_ERROR_QUERY ? &err.val.query
                                                                                : nullptr;
  JS::RootedString message(cx);
  if (db_err) {
    message = new_string(cx, db_err->message.ptr, db_err->message.len);
  } else if (err.tag == GCORE_DB_SQL_ERROR_CONNECTION) {
    message = new_string(cx, err.val.connection.ptr, err.val.connection.len);
  } else if (err.tag == GCORE_DB_SQL_ERROR_LIMIT) {
    message = new_string(cx, err.val.limit.ptr, err.val.limit.len);
  } else {
    message = JS_NewStringCopyZ(cx, MESSAGES[err.tag]);
  }
  JS::RootedObject obj(cx, message ? new_sql_error(cx, KINDS[err.tag], message) : nullptr);
  bool ok = obj != nullptr;
  if (ok && db_err) {
    ok = set_opt_str(cx, obj, "code", db_err->code) &&
         set_opt_str(cx, obj, "detail", db_err->detail) &&
         set_opt_str(cx, obj, "hint", db_err->hint) &&
         set_opt_str(cx, obj, "constraint", db_err->constraint);
  }
  gcore_db_sql_error_free(&err);
  if (ok) {
    JS::RootedValue exc(cx, JS::ObjectValue(*obj));
    JS_SetPendingException(cx, exc);
  }
  return false;
}

// Settles the returned Promise: `value` on success, the pending exception otherwise.
bool settle(JSContext *cx, JS::CallArgs &args, bool ok, JS::HandleValue value) {
  JS::RootedObject promise(cx);
  if (ok) {
    promise = JS::CallOriginalPromiseResolve(cx, value);
  } else {
    JS::RootedValue exc(cx);
    if (!JS_GetPendingException(cx, &exc)) return false; // uncatchable (e.g. OOM)
    JS_ClearPendingException(cx);
    promise = JS::CallOriginalPromiseReject(cx, exc);
  }
  if (!promise) return false;
  args.rval().setObject(*promise);
  return true;
}

bool append_u16(const char16_t *buf, uint32_t len, void *data) {
  static_cast<std::u16string *>(data)->append(buf, len);
  return true;
}

// JS param -> WIT value: null/undefined, boolean, number, bigint (int8), Uint8Array (bytea),
// Date (ISO text), other objects (JSON text), anything else as text. Strings/bytes are owned by
// `keep`/`bytes` until the host call returns.
bool to_value(JSContext *cx, JS::HandleValue v, gcore_db_sql_value_t &out,
              std::vector<host_api::HostString> &keep, std::vector<std::vector<uint8_t>> &bytes) {
  if (v.isNullOrUndefined()) {
    out.tag = GCORE_DB_SQL_VALUE_NULL;
    return true;
  }
  if (v.isBoolean()) {
    out.tag = GCORE_DB_SQL_VALUE_BOOLEAN;
    out.val.boolean = v.toBoolean();
    return true;
  }
  if (v.isInt32()) {
    out.tag = GCORE_DB_SQL_VALUE_INT32;
    out.val.int32 = v.toInt32();
    return true;
  }
  if (v.isNumber()) {
    out.tag = GCORE_DB_SQL_VALUE_FLOAT64;
    out.val.float64 = v.toNumber();
    return true;
  }
  if (v.isBigInt()) {
    out.tag = GCORE_DB_SQL_VALUE_INT64;
    out.val.int64 = JS::ToBigInt64(v.toBigInt());
    return true;
  }
  JS::RootedValue text(cx, v);
  if (v.isObject()) {
    JS::RootedObject obj(cx, &v.toObject());
    if (JS_IsUint8Array(obj)) {
      auto &buf = bytes.emplace_back(JS_GetTypedArrayLength(obj));
      {
        JS::AutoCheckCannotGC noGC(cx);
        bool is_shared;
        std::memcpy(buf.data(), JS_GetArrayBufferViewData(obj, &is_shared, noGC), buf.size());
      }
      out.tag = GCORE_DB_SQL_VALUE_BYTES;
      out.val.bytes = {buf.data(), buf.size()};
      return true;
    }
    bool is_date = false;
    if (!JS::ObjectIsDate(cx, obj, &is_date)) return false;
    if (is_date) {
      if (!JS_CallFunctionName(cx, obj, "toISOString", JS::HandleValueArray::empty(), &text)) {
        return false;
      }
    } else {
      std::u16string json;
      JS::RootedValue val(cx, v);
      if (!JS_Stringify(cx, &val, nullptr, JS::NullHandleValue, append_u16, &json)) return false;
      JSString *json_str = JS_NewUCStringCopyN(cx, json.data(), json.size());
      if (!json_str) return false;
      text.setString(json_str);
    }
  }
  JS::RootedString str(cx, JS::ToString(cx, text));
  if (!str) return false;
  auto &s = keep.emplace_back(core::encode(cx, str));
  if (!s) return false;
  out.tag = GCORE_DB_SQL_VALUE_TEXT;
  out.val.text = {(uint8_t *)s.ptr.get(), s.len};
  return true;
}

bool to_params(JSContext *cx, JS::HandleValue arr_val, std::vector<gcore_db_sql_value_t> &out,
               std::vector<host_api::HostString> &keep,
               std::vector<std::vector<uint8_t>> &bytes) {
  if (arr_val.isUndefined()) return true;
  bool is_array = false;
  JS::RootedObject arr(cx, arr_val.isObject() ? &arr_val.toObject() : nullptr);
  if (!arr || !JS::IsArrayObject(cx, arr, &is_array) || !is_array) {
    JS_ReportErrorUTF8(cx, "params must be an array");
    return false;
  }
  uint32_t len = 0;
  if (!JS::GetArrayLength(cx, arr, &len)) return false;
  out.resize(len);
  JS::RootedValue el(cx);
  for (uint32_t i = 0; i < len; i++) {
    if (!JS_GetElement(cx, arr, i, &el) || !to_value(cx, el, out[i], keep, bytes)) return false;
  }
  return true;
}

// WIT value -> JS, per the `fastedge::db/sql` type mapping: int8 as string (no precision loss),
// json/jsonb parsed, bytea as Uint8Array, numeric/text as string.
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
    JSString *str = JS_NewStringCopyZ(cx, std::to_string(v.val.int64).c_str());
    if (!str) return false;
    out.setString(str);
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
  case GCORE_DB_SQL_VALUE_JSON: {
    JS::RootedString str(cx, new_string(cx, v.val.json.ptr, v.val.json.len));
    return str && JS_ParseJSON(cx, str, out);
  }
  default: { // numeric, text
    JSString *str = new_string(cx, v.val.text.ptr, v.val.text.len);
    if (!str) return false;
    out.setString(str);
    return true;
  }
  }
}

// `{ rows, rowCount, columns: [{ name, typeOid }] }`; rows are objects keyed by column name,
// or arrays in column order with `rowMode: 'array'`.
JSObject *from_result(JSContext *cx, const gcore_db_sql_query_result_t &r, bool array_mode) {
  JS::RootedObject obj(cx, JS_NewPlainObject(cx));
  JS::RootedObject columns(cx, JS::NewArrayObject(cx, r.columns.len));
  JS::RootedObject rows(cx, JS::NewArrayObject(cx, r.rows.len));
  if (!obj || !columns || !rows) return nullptr;

  JS::RootedVector<JS::PropertyKey> names(cx);
  JS::RootedValue v(cx);
  for (size_t i = 0; i < r.columns.len; i++) {
    JS::RootedString name(cx, new_string(cx, r.columns.ptr[i].name.ptr, r.columns.ptr[i].name.len));
    JS::RootedObject col(cx, JS_NewPlainObject(cx));
    JS::RootedId id(cx);
    if (!name || !col || !JS_StringToId(cx, name, &id) || !names.append(id)) return nullptr;
    v.setString(name);
    if (!JS_SetProperty(cx, col, "name", v)) return nullptr;
    v.setNumber(r.columns.ptr[i].type_oid);
    if (!JS_SetProperty(cx, col, "typeOid", v)) return nullptr;
    v.setObject(*col);
    if (!JS_SetElement(cx, columns, i, v)) return nullptr;
  }

  JS::RootedValue cell(cx);
  for (size_t i = 0; i < r.rows.len; i++) {
    const auto &row = r.rows.ptr[i];
    JS::RootedObject out(cx, array_mode ? JS::NewArrayObject(cx, row.len) : JS_NewPlainObject(cx));
    if (!out) return nullptr;
    for (size_t j = 0; j < row.len && j < names.length(); j++) {
      if (!from_value(cx, row.ptr[j], &cell)) return nullptr;
      if (array_mode ? !JS_SetElement(cx, out, j, cell)
                     : !JS_SetPropertyById(cx, out, names[j], cell)) {
        return nullptr;
      }
    }
    v.setObject(*out);
    if (!JS_SetElement(cx, rows, i, v)) return nullptr;
  }

  v.setObject(*rows);
  if (!JS_SetProperty(cx, obj, "rows", v)) return nullptr;
  v.setNumber(static_cast<double>(r.row_count));
  if (!JS_SetProperty(cx, obj, "rowCount", v)) return nullptr;
  v.setObject(*columns);
  if (!JS_SetProperty(cx, obj, "columns", v)) return nullptr;
  return obj;
}

// `options.rowMode === 'array'`
bool array_mode(JSContext *cx, JS::HandleValue options, bool *out) {
  *out = false;
  if (!options.isObject()) return true;
  JS::RootedObject opts(cx, &options.toObject());
  JS::RootedValue mode(cx);
  if (!JS_GetProperty(cx, opts, "rowMode", &mode)) return false;
  return !mode.isString() || JS_StringEqualsLiteral(cx, mode.toString(), "array", out);
}

bool this_handle(JSContext *cx, JS::CallArgs &args, gcore_db_sql_borrow_database_t &out) {
  JS::RootedObject self(cx, args.thisv().isObject() ? &args.thisv().toObject() : nullptr);
  if (!self || !JS_InstanceOf(cx, self, &SqlDatabase::class_, nullptr)) {
    JS_ReportErrorUTF8(cx, "Invalid SqlDatabase instance");
    return false;
  }
  out.__handle = JS::GetReservedSlot(self, 0).toInt32();
  return true;
}

bool run_query(JSContext *cx, JS::CallArgs &args, JS::MutableHandleValue result) {
  gcore_db_sql_borrow_database_t db;
  if (!this_handle(cx, args, db)) return false;
  JS::RootedString sql_str(cx, JS::ToString(cx, args[0]));
  if (!sql_str) return false;
  auto sql = core::encode(cx, sql_str);
  if (!sql) return false;
  bool rows_as_arrays;
  if (!array_mode(cx, args.get(2), &rows_as_arrays)) return false;

  std::vector<gcore_db_sql_value_t> params;
  std::vector<host_api::HostString> keep;
  std::vector<std::vector<uint8_t>> bytes;
  if (!to_params(cx, args.get(1), params, keep, bytes)) return false;

  bindings_string_t sql_ws{(uint8_t *)sql.ptr.get(), sql.len};
  gcore_db_sql_list_value_t params_ws{params.data(), params.size()};
  gcore_db_sql_query_result_t ret{};
  gcore_db_sql_error_t err{};
  if (!gcore_db_sql_method_database_query(db, &sql_ws, &params_ws, &ret, &err)) {
    return throw_sql_error(cx, err);
  }
  JSObject *obj = from_result(cx, ret, rows_as_arrays);
  gcore_db_sql_query_result_free(&ret);
  if (!obj) return false;
  result.setObject(*obj);
  return true;
}

bool run_batch(JSContext *cx, JS::CallArgs &args, JS::MutableHandleValue result) {
  gcore_db_sql_borrow_database_t db;
  if (!this_handle(cx, args, db)) return false;
  bool rows_as_arrays;
  if (!array_mode(cx, args.get(1), &rows_as_arrays)) return false;
  bool is_array = false;
  JS::RootedObject list(cx, args[0].isObject() ? &args[0].toObject() : nullptr);
  if (!list || !JS::IsArrayObject(cx, list, &is_array) || !is_array) {
    JS_ReportErrorUTF8(cx, "statements must be an array of { sql, params }");
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
    JS::RootedObject stmt(cx, el.isObject() ? &el.toObject() : nullptr);
    if (!stmt) {
      JS_ReportErrorUTF8(cx, "statements must be an array of { sql, params }");
      return false;
    }
    if (!JS_GetProperty(cx, stmt, "sql", &sql_val) ||
        !JS_GetProperty(cx, stmt, "params", &params_val)) {
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
    return throw_sql_error(cx, err);
  }
  JS::RootedObject out(cx, JS::NewArrayObject(cx, ret.len));
  bool ok = out != nullptr;
  JS::RootedValue v(cx);
  for (size_t i = 0; ok && i < ret.len; i++) {
    JSObject *obj = from_result(cx, ret.ptr[i], rows_as_arrays);
    ok = obj != nullptr;
    if (ok) {
      v.setObject(*obj);
      ok = JS_SetElement(cx, out, i, v);
    }
  }
  gcore_db_sql_list_query_result_free(&ret);
  if (!ok) return false;
  result.setObject(*out);
  return true;
}

// `new SqlError(...)` is not supported; instances come from the host.
bool sql_error_ctor(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS_ReportErrorUTF8(cx, "Illegal constructor");
  return false;
}

} // namespace

namespace fastedge::db_sql {

const JSClass SqlDatabase::class_ = {"SqlDatabase", JSCLASS_HAS_RESERVED_SLOTS(1)};

const JSFunctionSpec SqlDatabase::static_methods[] = {
    JS_FN("open", SqlDatabase::open, 1, JSPROP_ENUMERATE),
    JS_FS_END,
};

const JSFunctionSpec SqlDatabase::methods[] = {
    JS_FN("query", SqlDatabase::query, 1, JSPROP_ENUMERATE),
    JS_FN("batch", SqlDatabase::batch, 1, JSPROP_ENUMERATE),
    JS_FS_END,
};

bool SqlDatabase::open(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  if (!args.requireAtLeast(cx, "SqlDatabase.open", 1)) return false;
  JS::RootedString name_str(cx, JS::ToString(cx, args[0]));
  if (!name_str) return false;
  auto name = core::encode(cx, name_str);
  if (!name) return false;

  bindings_string_t name_ws{(uint8_t *)name.ptr.get(), name.len};
  gcore_db_sql_own_database_t db{};
  gcore_db_sql_error_t err{};
  if (!gcore_db_sql_static_database_open(&name_ws, &db, &err)) return throw_sql_error(cx, err);

  JS::RootedObject obj(cx, JS_NewObjectWithGivenProto(cx, &SqlDatabase::class_, nullptr));
  if (!obj || !JS_DefineFunctions(cx, obj, SqlDatabase::methods)) return false;
  // ponytail: handle never dropped; the host frees it with the request's store.
  JS::SetReservedSlot(obj, 0, JS::Int32Value(db.__handle));
  args.rval().setObject(*obj);
  return true;
}

// query(sql, params?, { rowMode? }) -> Promise<{ rows, rowCount, columns }>
bool SqlDatabase::query(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  if (!args.requireAtLeast(cx, "query", 1)) return false;
  JS::RootedValue result(cx);
  return settle(cx, args, run_query(cx, args, &result), result);
}

// batch([{ sql, params? }], { rowMode? }) -> Promise<result[]>; one transaction.
bool SqlDatabase::batch(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  if (!args.requireAtLeast(cx, "batch", 1)) return false;
  JS::RootedValue result(cx);
  return settle(cx, args, run_batch(cx, args, &result), result);
}

bool install(api::Engine *engine) {
  JSContext *cx = engine->cx();

  JS::RootedObject ctor(cx, JS_NewObject(cx, &SqlDatabase::class_));
  if (!ctor || !JS_DefineFunctions(cx, ctor, SqlDatabase::static_methods) ||
      !JS_DefineProperty(cx, engine->global(), "SqlDatabase", ctor, 0)) {
    return false;
  }

  // SqlError: `instanceof SqlError` and `instanceof Error` both hold for host errors.
  JS::RootedObject error_proto(cx, JS::GetRealmErrorPrototype(cx));
  JS::RootedObject proto(cx, JS_NewObjectWithGivenProto(cx, nullptr, error_proto));
  JSFunction *fn = JS_NewFunction(cx, sql_error_ctor, 0, JSFUN_CONSTRUCTOR, "SqlError");
  if (!error_proto || !proto || !fn) return false;
  JS::RootedObject error_ctor(cx, JS_GetFunctionObject(fn));
  JS::RootedValue name(cx, JS::StringValue(JS_NewStringCopyZ(cx, "SqlError")));
  if (!JS_DefineProperty(cx, error_ctor, "prototype", proto, 0) ||
      !JS_DefineProperty(cx, proto, "constructor", error_ctor, 0) ||
      !JS_DefineProperty(cx, proto, "name", name, 0) ||
      !JS_DefineProperty(cx, engine->global(), "SqlError", error_ctor, 0)) {
    return false;
  }
  sql_error_proto = new JS::PersistentRooted<JSObject *>(cx, proto);
  return true;
}

} // namespace fastedge::db_sql
