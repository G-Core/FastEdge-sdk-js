#ifndef FASTEDGE_HOST_API_SEND_REQUEST_H
#define FASTEDGE_HOST_API_SEND_REQUEST_H

#include <string>
#include <string_view>

#include "wit-interface/http_reactor.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Winvalid-offsetof"
#pragma clang diagnostic pop


namespace fastedge_api {

DownstreamResponse sendRequest(std::string_view method, std::string_view uri, std::string_view headers, std::string_view body);

} // namespace fastedge_api

#endif
