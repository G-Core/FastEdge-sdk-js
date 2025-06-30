#ifndef FASTEDGE_HOST_API_H
#define FASTEDGE_HOST_API_H

#include "host_api.h"

typedef uint32_t FastEdgeHandle;
struct JSErrorFormatString;

namespace host_api {

HostString get_env_vars(std::string_view name);
HostString get_secret_vars(std::string_view name);
HostString get_secret_vars_effective_at(std::string_view name, uint32_t effective_at);

} // namespace host_api

#endif
