#ifndef FASTEDGE_HOST_API_H
#define FASTEDGE_HOST_API_H

#include <cstdint>
#include <memory>
#include <optional>
#include <span>
#include <string>
#include <string_view>
#include <variant>
#include <vector>

#include "extension-api.h"
#include "host_api.h"
#include "js/TypeDecls.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Winvalid-offsetof"
#include "js/Utility.h"
#include "js/Result.h"
#include "jsapi.h"
#pragma clang diagnostic pop

#include <iostream>
#include <string>


typedef uint32_t FastEdgeHandle;
struct JSErrorFormatString;

namespace host_api {

HostString get_env_vars(std::string_view name);
HostString get_secret_vars(std::string_view name);

} // namespace host_api

#endif
