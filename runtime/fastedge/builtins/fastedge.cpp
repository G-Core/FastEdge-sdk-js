#include "fastedge.h"

using fastedge::fastedge::FastEdge;

namespace {

bool DEBUG_LOGGING_ENABLED = false;

api::Engine *ENGINE;

static void oom_callback(JSContext *cx, void *data) {
  fprintf(stderr, "Critical Error: out of memory\n");
  fflush(stderr);
}

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



bool FastEdge::getEnv(JSContext* cx, unsigned argc, JS::Value* vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  fprintf(stdout, "farq: getEnv() -> invoked\n");

  if (!args.requireAtLeast(cx, "getEnv", 1)) {
    fprintf(stderr, "Error: getEnv() -> requires at least 1 argument\n");
    return false;
  }

  auto key_chars = core::encode(cx, args[0]);
  auto val_chars = std::getenv(std::string(key_chars).c_str());

  fprintf(stdout, "farq: getEnv() -> %s\n", std::string(val_chars).c_str());

  JS::RootedString jsEnvStr(cx, JS_NewStringCopyZ(cx, std::string(val_chars).c_str()));
  args.rval().setString(jsEnvStr);

  return true;
}

bool FastEdge::readFileSync(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS::CallArgs args = CallArgsFromVp(argc, vp);

  INIT_ONLY("fastedge.readFileSync");
  if (!args.requireAtLeast(cx, "fastedge.readFileSync", 1))
    return false;

  auto path = core::encode(cx, args[0]);
  if (!path) {
    return false;
  }

  std::ifstream file(std::string(path), std::ios::binary | std::ios::ate);
  if (!file) {
    JS_ReportErrorUTF8(cx, "Error opening file: %s", path.begin());
    return false;
  }

  size_t file_size = file.tellg();
  file.seekg(0, std::ios::beg);

  std::vector<char> buffer(file_size);
  if (!file.read(buffer.data(), file_size)) {
    JS_ReportErrorUTF8(cx, "Error reading contents of file: %s", path.begin());
    return false;
  }

  JS::RootedObject byte_array(cx, JS_NewUint8Array(cx, file_size));
  if (!byte_array)
    return false;

  {
    JS::AutoCheckCannotGC noGC(cx);
    bool is_shared;
    void *array_buffer = JS_GetArrayBufferViewData(byte_array, &is_shared, noGC);
    memcpy(array_buffer, buffer.data(), file_size);
  }

  args.rval().setObject(*byte_array);
  return true;
}



bool FastEdge::includeBytes(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS::CallArgs args = CallArgsFromVp(argc, vp);

  INIT_ONLY("fastedge.includeBytes");
  if (!args.requireAtLeast(cx, "fastedge.includeBytes", 1))
    return false;

  auto path = core::encode(cx, args[0]);
  if (!path) {
    return false;
  }

  FILE *fp = fopen(path.begin(), "r");
  if (!fp) {
    fprintf(stdout, "includeBytes() -> Error opening file: %s \n", std::string(path.begin()).c_str());
    fflush(stdout);
    JS_ReportErrorUTF8(cx, "Error opening file %s", path.begin());
    return false;
  }

  fseek(fp, 0L, SEEK_END);
  size_t size = ftell(fp);
  rewind(fp);
  JS::RootedObject typed_array(cx, JS_NewUint8Array(cx, size));
  if (!typed_array)
    return false;

  size_t read_bytes;
  {
    JS::AutoCheckCannotGC noGC(cx);
    bool is_shared;
    void *buffer = JS_GetArrayBufferViewData(typed_array, &is_shared, noGC);
    read_bytes = fread(buffer, 1, size, fp);
  }

  if (read_bytes != size) {
    JS_ReportErrorUTF8(cx, "Failed to read contents of file %s", path.begin());
    return false;
  }

  args.rval().setObject(*typed_array);
  return true;
}


bool install(api::Engine *engine) {
  ENGINE = engine;

  bool ENABLE_EXPERIMENTAL_HIGH_RESOLUTION_TIME_METHODS =
      std::string(std::getenv("ENABLE_EXPERIMENTAL_HIGH_RESOLUTION_TIME_METHODS")) == "1";

  JS::SetOutOfMemoryCallback(engine->cx(), oom_callback, nullptr);

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
      JS_FN("getEnv", FastEdge::getEnv, 1, JSPROP_ENUMERATE),
      // JS_FN("enableDebugLogging", enableDebugLogging, 1, JSPROP_ENUMERATE),
      // JS_FN("getGeolocationForIpAddress", Fastly::getGeolocationForIpAddress, 1, JSPROP_ENUMERATE),
      JS_FN("includeBytes", FastEdge::includeBytes, 1, JSPROP_ENUMERATE),
      JS_FN("readFileSync", FastEdge::readFileSync, 1, JSPROP_ENUMERATE),
      ENABLE_EXPERIMENTAL_HIGH_RESOLUTION_TIME_METHODS ? nowfn : end, end};

  if (!JS_DefineFunctions(engine->cx(), fastedge, methods) ||
      !JS_DefineProperties(engine->cx(), fastedge, FastEdge::properties)) {
    return false;
  }


  // RootedValue test_val(engine->cx(), JS::StringValue(JS_NewStringCopyZ(engine->cx(), "world")));
  // // fastly:env
  // RootedObject test_builtin(engine->cx(), JS_NewObject(engine->cx(), nullptr));
  // if (!JS_SetProperty(engine->cx(), test_builtin, "hello", test_val)) {
  //   return false;
  // }
  // RootedValue test_builtin_val(engine->cx(), JS::ObjectValue(*test_builtin));
  // if (!engine->define_builtin_module("fastedge:test", test_builtin_val)) {
  //   return false;
  // }

  // fastly:experimental
  // RootedObject experimental(engine->cx(), JS_NewObject(engine->cx(), nullptr));
  // RootedValue experimental_val(engine->cx(), JS::ObjectValue(*experimental));
  // RootedValue include_bytes_val(engine->cx());
  // if (!JS_GetProperty(engine->cx(), fastedge, "includeBytes", &include_bytes_val)) {
  //   return false;
  // }
  // if (!JS_GetProperty(engine->cx(), fastedge, "readFileSync", &include_bytes_val)) {
  //   return false;
  // }
  // if (!JS_SetProperty(engine->cx(), experimental, "includeBytes", include_bytes_val)) {
  //   return false;
  // }
  // if (!engine->define_builtin_module("fastly:experimental", experimental_val)) {
  //   return false;
  // }


  return true;
}

} // namespace fastedge::fastedge
