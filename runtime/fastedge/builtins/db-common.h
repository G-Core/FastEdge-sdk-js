#pragma once

// Helpers shared by the `gcore:db` builtins (`fastedge::db/sql`, `fastedge::db/kv`).
// Header-only so neither builtin depends on the other.
#include "builtin.h"

#include <js/CallAndConstruct.h>
#include <js/Promise.h>
#include <js/Realm.h>

namespace fastedge::db {

namespace detail {

// `new SqlError(...)` / `new KvError(...)` are not supported; instances come from the host.
inline bool error_ctor(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS_ReportErrorUTF8(cx, "Illegal constructor");
  return false;
}

} // namespace detail

// A real Error (message, stack) re-parented to `proto`, with `kind`.
inline JSObject *new_error(JSContext *cx, JS::HandleObject proto, const char *kind,
                           JS::HandleString message) {
  JS::RootedObject error_ctor(cx);
  if (!JS_GetClassObject(cx, JSProto_Error, &error_ctor)) return nullptr;
  JS::RootedValue ctor_val(cx, JS::ObjectValue(*error_ctor));
  JS::RootedValueArray<1> ctor_args(cx);
  ctor_args[0].setString(message);
  JS::RootedObject err(cx);
  if (!JS::Construct(cx, ctor_val, ctor_args, &err)) return nullptr;
  if (!JS_SetPrototype(cx, err, proto)) return nullptr;
  JS::RootedString kind_str(cx, JS_NewStringCopyZ(cx, kind));
  if (!kind_str) return nullptr;
  JS::RootedValue kind_val(cx, JS::StringValue(kind_str));
  if (!JS_SetProperty(cx, err, "kind", kind_val)) return nullptr;
  return err;
}

// Settles the returned Promise: `value` on success, the pending exception otherwise.
inline bool settle(JSContext *cx, JS::CallArgs &args, bool ok, JS::HandleValue value) {
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

// `instanceof <name>` and `instanceof Error` both hold for host errors.
inline bool define_error_class(api::Engine *engine, const char *name,
                               JS::PersistentRooted<JSObject *> **out) {
  JSContext *cx = engine->cx();
  JS::RootedObject error_proto(cx, JS::GetRealmErrorPrototype(cx));
  JS::RootedObject proto(cx, JS_NewObjectWithGivenProto(cx, nullptr, error_proto));
  JSFunction *fn = JS_NewFunction(cx, detail::error_ctor, 0, JSFUN_CONSTRUCTOR, name);
  if (!error_proto || !proto || !fn) return false;
  JS::RootedObject ctor(cx, JS_GetFunctionObject(fn));
  JS::RootedValue name_val(cx, JS::StringValue(JS_NewStringCopyZ(cx, name)));
  if (!JS_DefineProperty(cx, ctor, "prototype", proto, 0) ||
      !JS_DefineProperty(cx, proto, "constructor", ctor, 0) ||
      !JS_DefineProperty(cx, proto, "name", name_val, 0) ||
      !JS_DefineProperty(cx, engine->global(), name, ctor, 0)) {
    return false;
  }
  *out = new JS::PersistentRooted<JSObject *>(cx, proto);
  return true;
}

} // namespace fastedge::db
