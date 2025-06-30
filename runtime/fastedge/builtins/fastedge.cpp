#include "fastedge.h"

#include <cstdlib>

#include "../host-api/include/fastedge_host_api.h"


using fastedge::fastedge::FastEdge;

namespace {

bool DEBUG_LOGGING_ENABLED = false;

api::Engine *ENGINE;

static void oom_callback(JSContext *cx, void *data) {
  cerr << "Critical Error: out of memory" << endl;
}

} // namespace

bool debug_logging_enabled() { return DEBUG_LOGGING_ENABLED; }

namespace fastedge::fastedge {

JS::PersistentRooted<JSObject *> FastEdge::env;
JS::PersistentRooted<JSObject *> FastEdge::fs;
JS::PersistentRooted<JSObject *> FastEdge::secret;

bool FastEdge::getEnv(JSContext* cx, unsigned argc, JS::Value* vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  if (!args.requireAtLeast(cx, "getEnv", 1)) {
    JS_ReportErrorUTF8(cx, "getEnv() -> requires at least 1 argument");
    return false;
  }
  // Convert the first argument to a string
  JS::RootedString jsKey(cx, JS::ToString(cx, args[0]));
  if (!jsKey) {
    return false;
  }
  // Encode the JS string to a C++ string
  JS::UniqueChars keyChars = JS_EncodeStringToUTF8(cx, jsKey);
  if (!keyChars) {
    return false;
  }
  auto envValue = host_api::get_env_vars(keyChars.get());
  if (!envValue.size()) {
    args.rval().setNull();
    return true;
  }

  JS::RootedString envValueStr(cx, JS_NewStringCopyUTF8N(cx, JS::UTF8Chars(envValue.begin(), envValue.size())));
  args.rval().setString(envValueStr);
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

bool FastEdge::getSecret(JSContext* cx, unsigned argc, JS::Value* vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  if (!args.requireAtLeast(cx, "getSecret", 1)) {
    JS_ReportErrorUTF8(cx, "getSecret() -> requires at least 1 argument");
    return false;
  }
  // Convert the first argument to a string
  JS::RootedString jsKey(cx, JS::ToString(cx, args[0]));
  if (!jsKey) {
    return false;
  }
  // Encode the JS string to a C++ string
  JS::UniqueChars keyChars = JS_EncodeStringToUTF8(cx, jsKey);
  if (!keyChars) {
    return false;
  }
  auto secretValue = host_api::get_secret_vars(keyChars.get());
  if (!secretValue.size()) {
    args.rval().setNull();
    return true;
  }

  JS::RootedString secretValueStr(cx, JS_NewStringCopyUTF8N(cx, JS::UTF8Chars(secretValue.begin(), secretValue.size())));
  args.rval().setString(secretValueStr);
  return true;
}

bool FastEdge::getSecretEffectiveAt(JSContext* cx, unsigned argc, JS::Value* vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  if (!args.requireAtLeast(cx, "getSecretEffectiveAt", 2)) {
    JS_ReportErrorUTF8(cx, "getSecretEffectiveAt() -> requires at least 2 arguments");
    return false;
  }
  // Convert the first argument to a string
  JS::RootedString jsKey(cx, JS::ToString(cx, args[0]));
  if (!jsKey) {
    return false;
  }
  // Encode the JS string to a C++ string
  JS::UniqueChars keyChars = JS_EncodeStringToUTF8(cx, jsKey);
  if (!keyChars) {
    return false;
  }

  // Convert the second argument to a number
  int32_t effective_at = 0;
  if (args.length() > 1 && !JS::ToInt32(cx, args.get(1), &effective_at)) {
    return false;
  }
  if (effective_at < 0) {
    effective_at = 0;
  }

  auto secretValue = host_api::get_secret_vars_effective_at(keyChars.get(), effective_at);
  if (!secretValue.size()) {
    args.rval().setNull();
    return true;
  }

  JS::RootedString secretValueStr(cx, JS_NewStringCopyUTF8N(cx, JS::UTF8Chars(secretValue.begin(), secretValue.size())));
  args.rval().setString(secretValueStr);
  return true;
}


const JSPropertySpec FastEdge::properties[] = {
    JS_PSG("env", getEnv, JSPROP_ENUMERATE),
    JS_PS_END
};

bool install(api::Engine *engine) {
  ENGINE = engine;

  JS::SetOutOfMemoryCallback(engine->cx(), oom_callback, nullptr);

  JS::RootedObject fastedge(engine->cx(), JS_NewPlainObject(engine->cx()));
  if (!fastedge) {
    return false;
  }

  if (!JS_DefineProperty(engine->cx(), engine->global(), "fastedge", fastedge, 0)) {
    return false;
  }

  const JSFunctionSpec methods[] = {
      JS_FN("getEnv", FastEdge::getEnv, 1, JSPROP_ENUMERATE),
      JS_FN("readFileSync", FastEdge::readFileSync, 1, JSPROP_ENUMERATE),
      JS_FN("getSecret", FastEdge::getSecret, 1, JSPROP_ENUMERATE),
      JS_FN("getSecretEffectiveAt", FastEdge::getSecretEffectiveAt, 1, JSPROP_ENUMERATE),
      JS_FS_END
  };

  if (!JS_DefineFunctions(engine->cx(), fastedge, methods) ||
      !JS_DefineProperties(engine->cx(), fastedge, FastEdge::properties)) {
    return false;
  }


  // Ensure that the fastedge objects are not garbage collected and modules are defined
  // fastedge:env
  RootedValue get_env_val(engine->cx());
  if (!JS_GetProperty(engine->cx(), fastedge, "getEnv", &get_env_val)) {
    return false;
  }
  RootedObject env_builtin(engine->cx(), JS_NewObject(engine->cx(), nullptr));
  if (!JS_SetProperty(engine->cx(), env_builtin, "getEnv", get_env_val)) {
    return false;
  }
  RootedValue env_builtin_val(engine->cx(), JS::ObjectValue(*env_builtin));
  if (!engine->define_builtin_module("fastedge::env", env_builtin_val)) {
    return false;
  }

  // fastedge:fs
  RootedValue read_file_sync_val(engine->cx());
  if (!JS_GetProperty(engine->cx(), fastedge, "readFileSync", &read_file_sync_val)) {
    return false;
  }
  RootedObject fs_builtin(engine->cx(), JS_NewObject(engine->cx(), nullptr));
  if (!JS_SetProperty(engine->cx(), fs_builtin, "readFileSync", read_file_sync_val)) {
    return false;
  }
  RootedValue fs_builtin_val(engine->cx(), JS::ObjectValue(*fs_builtin));
  if (!engine->define_builtin_module("fastedge::fs", fs_builtin_val)) {
    return false;
  }

  // fastedge:secret
  RootedValue get_secret_val(engine->cx());
  if (!JS_GetProperty(engine->cx(), fastedge, "getSecret", &get_secret_val)) {
    return false;
  }
  RootedValue get_secret_val_effective_at(engine->cx());
  if (!JS_GetProperty(engine->cx(), fastedge, "getSecretEffectiveAt", &get_secret_val_effective_at)) {
    return false;
  }

  RootedObject secret_builtin(engine->cx(), JS_NewObject(engine->cx(), nullptr));
  if (!JS_SetProperty(engine->cx(), secret_builtin, "getSecret", get_secret_val)) {
    return false;
  }
  if (!JS_SetProperty(engine->cx(), secret_builtin, "getSecretEffectiveAt", get_secret_val_effective_at)) {
    return false;
  }

  RootedValue secret_builtin_val(engine->cx(), JS::ObjectValue(*secret_builtin));
  if (!engine->define_builtin_module("fastedge::secret", secret_builtin_val)) {
    return false;
  }

  return true;
}

} // namespace fastedge::fastedge
