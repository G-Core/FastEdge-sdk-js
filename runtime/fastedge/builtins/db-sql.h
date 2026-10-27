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

} // namespace fastedge::db_sql
