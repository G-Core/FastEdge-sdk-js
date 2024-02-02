#include "fastedge-builtins.h"
#include "send-request.h"

namespace fastedge_api {

DownstreamResponse sendRequest(std::string_view method, std::string_view uri, std::string_view headers, std::string_view body) {

  DownstreamRequest request = DownstreamRequest(method, uri, headers, body);

  gcore_fastedge_http_client_request_t req;
  gcore_fastedge_http_client_response_t res;
  gcore_fastedge_http_client_error_t err;

  request.initFastEdgeRequest(&req);

  gcore_fastedge_http_client_send_request(&req, &res, &err);

  //? err = 112 - seems to be a 404
  //? err = 80 - seems to be a success
  //? For now I am ignoring this error code - speak to Ruslan and improve this

  DownstreamResponse response = DownstreamResponse(&res);

  return response;
}

} // namespace fastedge_api
