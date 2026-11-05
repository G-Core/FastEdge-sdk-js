#pragma once

#include "builtin.h"

namespace fastedge::db_postgres {

// `fastedge::db/postgres`: PostgreSQL database bound by name (`gcore:db/postgres@0.1.0`, async).
class PostgresDatabase : public builtins::BuiltinNoConstructor<PostgresDatabase> {
public:
  static constexpr const char *class_name = "PostgresDatabase";

  static bool open(JSContext *cx, unsigned argc, JS::Value *vp);
  static bool query(JSContext *cx, unsigned argc, JS::Value *vp);
  static bool batch(JSContext *cx, unsigned argc, JS::Value *vp);

  static const JSClass class_;
  static const JSFunctionSpec static_methods[];
  static const JSFunctionSpec methods[];
};

} // namespace fastedge::db_postgres
