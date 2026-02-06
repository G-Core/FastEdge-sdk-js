#include "builtin.h"

#include "../../StarlingMonkey/builtins/web/console.h"
#include <cstdio>

namespace builtins::web::console {

/*
The most semantically accurate mapping would be:
TRACE → console.debug()
DEBUG → console.log()
INFO → console.info()
WARN → console.warn()
ERROR/CRITICAL → console.error()
*/


// Override the weak symbol from StarlingMonkey with a strong symbol
// This implementation will be used instead of the default one
void builtin_impl_console_log(Console::LogType log_ty, const char *msg) {
  const char *prefix = nullptr;
  switch (log_ty) {
  case Console::LogType::Log:
    prefix = "[DEBUG]:";
    break;
  case Console::LogType::Debug:
    prefix = "[TRACE]:";
    break;
  case Console::LogType::Info:
    prefix = "[INFO]:";
    break;
  case Console::LogType::Warn:
    prefix = "[WARN]:";
    break;
  case Console::LogType::Error:
    prefix = "[ERROR]:";
    break;
  default:
    prefix = "[DEBUG]:";
    break;
  }

  fprintf(stdout, "%s %s\n", prefix, msg);
  if (log_ty == Console::LogType::Warn || log_ty == Console::LogType::Error) {
    fflush(stdout);
  }
}

} // namespace builtins::web::console

namespace fastedge::console_override {

// This builtin doesn't need to install anything, it just overrides the weak symbol
bool install(api::Engine *engine) {
  return true;
}

} // namespace fastedge::console_override
