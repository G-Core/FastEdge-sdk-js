#ifndef FASTEDGE_H
#define FASTEDGE_H

#include <iostream>
#include <fstream>
#include <string>

#include "../../StarlingMonkey/runtime/encode.h"
#include "extension-api.h"

// Bring the names from the std namespace into the global namespace
using std::cerr;
using std::endl;
using std::string;

namespace fastedge::fastedge {

class FastEdge : public builtins::BuiltinNoConstructor<FastEdge> {
private:
  // static bool log(JSContext *cx, unsigned argc, JS::Value *vp);
public:
  static constexpr const char *class_name = "FastEdge";

  static JS::PersistentRooted<JSObject *> env;
  static JS::PersistentRooted<JSObject *> fs;

  static const JSPropertySpec properties[];

  static bool readFileSync(JSContext *cx, unsigned argc, JS::Value *vp);
  static bool getEnv(JSContext *cx, unsigned argc, JS::Value *vp);

};

} // namespace fastedge::fastedge

#endif
