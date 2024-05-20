// TODO: remove these once the warnings are fixed

#include "fastedge.h"

using fastedge::fastedge::FastEdge;

namespace {

bool DEBUG_LOGGING_ENABLED = false;

} // namespace

bool debug_logging_enabled() { return DEBUG_LOGGING_ENABLED; }

namespace fastedge::fastedge {

// const JSErrorFormatString *FastEdgeGetErrorMessage(void *userRef, unsigned errorNumber) {
//   if (errorNumber > 0 && errorNumber < JSErrNum_Limit) {
//     return &fastedge_ErrorFormatString[errorNumber];
//   }

//   return nullptr;
// }

// namespace {

// bool enableDebugLogging(JSContext *cx, unsigned argc, JS::Value *vp) {
//   JS::CallArgs args = CallArgsFromVp(argc, vp);
//   if (!args.requireAtLeast(cx, __func__, 1))
//     return false;
//   DEBUG_LOGGING_ENABLED = JS::ToBoolean(args[0]);
//   args.rval().setUndefined();
//   return true;
// }

// } // namespace

JS::PersistentRooted<JSObject *> FastEdge::env;


bool FastEdge::now(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS::CallArgs args = CallArgsFromVp(argc, vp);
  args.rval().setNumber(JS_Now());
  return true;
}



const JSPropertySpec FastEdge::properties[] = {
    // JS_PSG("env", env_get, JSPROP_ENUMERATE),
    // JS_PSGS("baseURL", baseURL_get, baseURL_set, JSPROP_ENUMERATE),
    // JS_PSGS("defaultBackend", defaultBackend_get, defaultBackend_set, JSPROP_ENUMERATE),
    // JS_PSGS("allowDynamicBackends", allowDynamicBackends_get, allowDynamicBackends_set,
    //         JSPROP_ENUMERATE),
    // JS_PSG("sdkVersion", version_get, JSPROP_ENUMERATE),
    JS_PS_END};



bool getEnv(JSContext* cx, unsigned argc, JS::Value* vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  fprintf(stdout, "getEnv() -> invoked\n");

  if (!args.requireAtLeast(cx, "getEnv", 1)) {
    fprintf(stderr, "Error: getEnv() -> requires at least 1 argument\n");
    return false;
  }

  auto key_chars = core::encode(cx, args[0]);
  auto val_chars = std::getenv(std::string(key_chars).c_str());

  fprintf(stdout, "getEnv() -> %s\n", std::string(val_chars).c_str());

  JS::RootedString jsEnvStr(cx, JS_NewStringCopyZ(cx, std::string(val_chars).c_str()));
  args.rval().setString(jsEnvStr);

  return true;
}


bool install(api::Engine *engine) {
  bool ENABLE_EXPERIMENTAL_HIGH_RESOLUTION_TIME_METHODS =
      std::string(std::getenv("ENABLE_EXPERIMENTAL_HIGH_RESOLUTION_TIME_METHODS")) == "1";

  JS::RootedObject fastedge(engine->cx(), JS_NewPlainObject(engine->cx()));
  if (!fastedge) {
    return false;
  }

  if (!JS_DefineProperty(engine->cx(), engine->global(), "fastedge", fastedge, 0)) {
    return false;
  }

  JSFunctionSpec nowfn = JS_FN("now", FastEdge::now, 0, JSPROP_ENUMERATE);
  JSFunctionSpec end = JS_FS_END;

  const JSFunctionSpec methods[] = {
      JS_FN("getEnv", getEnv, 1, JSPROP_ENUMERATE),
      // JS_FN("enableDebugLogging", enableDebugLogging, 1, JSPROP_ENUMERATE),
      // JS_FN("getGeolocationForIpAddress", Fastly::getGeolocationForIpAddress, 1, JSPROP_ENUMERATE),
      // JS_FN("includeBytes", Fastly::includeBytes, 1, JSPROP_ENUMERATE),
      ENABLE_EXPERIMENTAL_HIGH_RESOLUTION_TIME_METHODS ? nowfn : end, end};

  if (!JS_DefineFunctions(engine->cx(), fastedge, methods) ||
      !JS_DefineProperties(engine->cx(), fastedge, FastEdge::properties)) {
    return false;
  }


  RootedValue test_val(engine->cx(), JS::StringValue(JS_NewStringCopyZ(engine->cx(), "world")));
  // fastly:env
  RootedObject test_builtin(engine->cx(), JS_NewObject(engine->cx(), nullptr));
  if (!JS_SetProperty(engine->cx(), test_builtin, "hello", test_val)) {
    return false;
  }
  RootedValue test_builtin_val(engine->cx(), JS::ObjectValue(*test_builtin));
  if (!engine->define_builtin_module("fastedge:test", test_builtin_val)) {
    return false;
  }


  return true;
}

} // namespace fastedge::fastedge
