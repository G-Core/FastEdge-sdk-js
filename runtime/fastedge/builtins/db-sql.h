#pragma once

#include "builtin.h"

namespace fastedge::db_sql {

// `fastedge::db/sql`: SQL database bound by name (`gcore:db/sql-sync@0.1.0`).
class SqlDatabase : public builtins::BuiltinNoConstructor<SqlDatabase> {
public:
  static constexpr const char *class_name = "SqlDatabase";

  static bool open(JSContext *cx, unsigned argc, JS::Value *vp);
  static bool query(JSContext *cx, unsigned argc, JS::Value *vp);
  static bool batch(JSContext *cx, unsigned argc, JS::Value *vp);

  static const JSClass class_;
  static const JSFunctionSpec static_methods[];
  static const JSFunctionSpec methods[];
};

// Shared with `fastedge::db/kv`.

// Defines global `name` as an Error subclass that only the host creates; `*proto` is set to its
// prototype.
bool define_error_class(api::Engine *engine, const char *name,
                        JS::PersistentRooted<JSObject *> **proto);

// A real Error (message, stack) re-parented to `proto`, with `kind`.
JSObject *new_error(JSContext *cx, JS::HandleObject proto, const char *kind,
                    JS::HandleString message);

// Settles the returned Promise: `value` on success, the pending exception otherwise.
bool settle(JSContext *cx, JS::CallArgs &args, bool ok, JS::HandleValue value);

} // namespace fastedge::db_sql
