#include "../../StarlingMonkey/runtime/encode.h"

#include "extension-api.h"

namespace fastedge::env {

  bool getEnv(JSContext* cx, unsigned argc, JS::Value* vp) {
    JS::CallArgs args = JS::CallArgsFromVp(argc, vp);

    if (!args.requireAtLeast(cx, "getEnv", 1)) {
      fprintf(stderr, "Error: getEnv() -> requires at least 1 argument\n");
      return false;
    }

    auto key_chars = core::encode(cx, args[0]);
    auto val_chars = std::getenv(std::string(key_chars).c_str());

    JS::RootedString jsEnvStr(cx, JS_NewStringCopyZ(cx, std::string(val_chars).c_str()));
    args.rval().setString(jsEnvStr);

    return true;
  }

} // namespace fastedge::env



