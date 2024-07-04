#ifndef FASTEDGE_H
#define FASTEDGE_H

#include "../../StarlingMonkey/runtime/encode.h"
#include "extension-api.h"



namespace fastedge::fastedge {

const JSErrorFormatString *FastEdgeGetErrorMessage(void *userRef, unsigned errorNumber);

class FastEdge : public builtins::BuiltinNoConstructor<FastEdge> {
private:
  // TODO(GB): reimplement
  // static bool log(JSContext *cx, unsigned argc, JS::Value *vp);

public:
  static constexpr const char *class_name = "FastEdge";

  static JS::PersistentRooted<JSObject *> env;

  static const JSPropertySpec properties[];

  static bool now(JSContext *cx, unsigned argc, JS::Value *vp);
  // TODO(GB): reimplement
  // static bool dump(JSContext *cx, unsigned argc, JS::Value *vp);
  // static bool enableDebugLogging(JSContext *cx, unsigned argc, JS::Value *vp);
  // static bool getLogger(JSContext *cx, unsigned argc, JS::Value *vp);

  static bool includeBytes(JSContext *cx, unsigned argc, JS::Value *vp);
  static bool getEnv(JSContext *cx, unsigned argc, JS::Value *vp);

};

JS::Result<std::tuple<JS::UniqueChars, size_t>> convertBodyInit(JSContext *cx,
                                                                JS::HandleValue bodyInit);

} // namespace fastedge::fastedge

#endif
