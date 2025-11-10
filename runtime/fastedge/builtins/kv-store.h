#pragma once

#include "builtin.h"
#include "../host-api/include/fastedge_host_api.h"

namespace fastedge::kv_store {

class KvStore : public builtins::BuiltinNoConstructor<KvStore> {
public:
  static constexpr const char *class_name = "KvStore";

  static bool open(JSContext *cx, unsigned argc, JS::Value *vp);
  static bool get(JSContext *cx, unsigned argc, JS::Value *vp);
  static bool scan(JSContext *cx, unsigned argc, JS::Value *vp);
  static bool zrange_by_score(JSContext *cx, unsigned argc, JS::Value *vp);
  static bool zscan(JSContext *cx, unsigned argc, JS::Value *vp);
  static bool bf_exists(JSContext *cx, unsigned argc, JS::Value *vp);

  static void finalize(JS::GCContext *gcx, JSObject *obj);

  static const JSClass class_;
  static const JSFunctionSpec static_methods[];
  static const JSFunctionSpec methods[];

private:
  int32_t store_handle_;

  explicit KvStore(int32_t handle) : store_handle_(handle) {}

  static KvStore* get_instance(JSContext *cx, JSObject *obj);
};

} // namespace fastedge::kv_store
