#include "builtin.h"

#include "../../StarlingMonkey/builtins/web/console.h"
#include <cstdio>

namespace builtins::web::console {

// Override the weak symbol from StarlingMonkey with a strong symbol
// This implementation will be used instead of the default one
void builtin_impl_console_log(Console::LogType log_ty, const char *msg) {
  const char *prefix = nullptr;
  switch (log_ty) {
  case Console::LogType::Log:
    prefix = "Log:";
    break;
  case Console::LogType::Debug:
    prefix = "Debug:";
    break;
  case Console::LogType::Info:
    prefix = "Info:";
    break;
  case Console::LogType::Warn:
    prefix = "Warn:";
    break;
  case Console::LogType::Error:
    prefix = "Error:";
    break;
  default:
    prefix = "Log:";
    break;
  }

  fprintf(stdout, "%s: %s\n", prefix, msg);
  fflush(stdout);
}

} // namespace builtins::web::console

namespace fastedge::console_override {

// This builtin doesn't need to install anything, it just overrides the weak symbol
bool install(api::Engine *engine) {
  return true;
}

} // namespace fastedge::console_override
