#include "fastedge-builtins.h"
#include "wit-interface/fastedge-api.h"
#include "wit-interface/http_reactor.h"

#include <cstdio>
#include <cstring>


int main() { return 0; }

void exports_gcore_fastedge_http_handler_process(gcore_fastedge_http_handler_request_t *req,
                                                 gcore_fastedge_http_handler_response_t *ret) {

  fastedge_api::MainRequest mainRequest{req};

  bool mainIsSuccessful = reactor_main(mainRequest);

  printf("Reactor main is back %d \n", mainIsSuccessful);
  fastedge_api::MainResponse& mainResponse = fastedge_api::MainResponse::getInstance();

  fflush(stdout);
  printf("response.status %d\n", mainResponse.status);
  fflush(stdout);

  if (mainIsSuccessful && mainResponse.status >= 100) {
    if (debug_logging_enabled()) {
      printf("Reactor main was successful\n");
      fflush(stdout);
    }
  } else {
    if (debug_logging_enabled()) {
      printf("Reactor main has failed\n");
      fflush(stdout);
    }
    mainResponse.setStatus(500);
    mainResponse.setHeaders(std::string_view("[[\"content-type\",\"text/plain\"]]"));
    mainResponse.setBody("Error: Internal Server Error");
  }
  mainResponse.initFastEdgeReturn(ret);
}
