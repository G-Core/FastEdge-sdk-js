#ifndef FASTEDGE_RUNTIME_FASTEDGE_API_H
#define FASTEDGE_RUNTIME_FASTEDGE_API_H

#include <array>
#include <iostream>
#include <span>
#include <sstream>
#include <string>
#include <vector>

#include "js/TypeDecls.h"
#include "wit-interface/http_reactor.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Winvalid-offsetof"
#include "js/Utility.h"
#include "jsapi.h"
#pragma clang diagnostic pop

#define GCORE_FASTEDGE_NO_BODY "GCORE_FASTEDGE_NO_BODY"

namespace fastedge_api {

struct JsStringHandler final {
  JS::UniqueChars ptr;
  size_t len;

  JsStringHandler() = default;

  using iterator = char *;
  using const_iterator = const char *;

  size_t size() const { return this->len; }

  iterator begin() { return this->ptr.get(); }
  iterator end() { return this->begin() + this->len; }

  const_iterator begin() const { return this->ptr.get(); }
  const_iterator end() const { return this->begin() + this->len; }

  /// Conversion to a bool, testing for an empty pointer.
  operator bool() const { return this->ptr != nullptr; }

  /// Comparison against nullptr
  bool operator==(std::nullptr_t) { return this->ptr == nullptr; }

  /// Comparison against nullptr
  bool operator!=(std::nullptr_t) { return this->ptr != nullptr; }

  /// Conversion to a `std::string_view`.
  operator std::string_view() const { return std::string_view(this->ptr.get(), this->len); }
};

struct Http {
  std::vector<std::array<std::string, 2>> headers;
  std::string body;

  // helper functions
  std::vector<std::array<std::string, 2>> convertStringToHeaders(std::string_view headersString);
  std::string convertHeadersToString(std::vector<std::array<std::string, 2>> headers);

  protected:
    Http()
      : headers(convertStringToHeaders("[]")),
        body("")
    {};

    Http(
      std::vector<std::array<std::string, 2>> headers,
      std::string body
    ) : headers(headers), body(body) {};

    // create functions - convert object properties to host types
    http_reactor_string_t createHttpReactorString(std::string str);
    http_reactor_option_gcore_fastedge_http_headers_t createOptionalHttpHeaders();
    gcore_fastedge_http_headers_t createHttpHeaders();
    http_reactor_option_gcore_fastedge_http_body_t createHttpBody();

    // retrieve functions - convert host types to object properties
    std::string retrieveBody(http_reactor_option_gcore_fastedge_http_body_t);
    std::string retrieveBody(std::string_view body);
    std::vector<std::array<std::string, 2>> retrieveOptionalHeaders(http_reactor_option_gcore_fastedge_http_headers_t);
    std::vector<std::array<std::string, 2>> retrieveHeaders(gcore_fastedge_http_headers_t);
};

struct Request : public Http {
  std::string method;
  std::string uri;

  protected:
    Request(
      std::string_view method,
      std::string_view uri,
      std::string_view headers,
      std::string_view body
    )
      : Http(),
        method(std::string(method)),
        uri(std::string(uri))
    {
      this->headers = convertStringToHeaders(headers);
      this->body = retrieveBody(body);
    };
    Request(gcore_fastedge_http_handler_request_t *req)
      : Http(),
        method(retrieveMethod(req->method)),
        uri(std::string(req->uri.ptr, req->uri.len))
    {
      this->headers = retrieveHeaders(req->headers);
      this->body = retrieveBody(req->body);
    };

    int retrieveMethod(std::string_view method);
    std::string retrieveMethod(gcore_fastedge_http_method_t);

};

struct MainRequest : public Request {
  // MainRequest() : Response(gcore_fastedge_http_handler_request_t *req) {}
  MainRequest(gcore_fastedge_http_handler_request_t *req)
    : Request(req)
  {};
};

struct DownstreamRequest : public Request {
  DownstreamRequest(
    std::string_view method,
    std::string_view uri,
    std::string_view headers,
    std::string_view body
  )
    : Request(method, uri, headers, body)
  {}

  void initFastEdgeRequest(gcore_fastedge_http_client_request_t *req);
};

struct Response : public Http {
  int status;

  void setStatus(int status) {
    this->status = status;
  }

  void setHeaders(std::string_view headers) {
    this->headers = convertStringToHeaders(headers);
  }

  void setBody(std::string_view body) {
    this->body = std::string(body);
  }

  protected:
    Response() : Http() {}
    Response(gcore_fastedge_http_client_response_t *res)
      : Http(),
        status(res->status)
    {
      this->headers = retrieveOptionalHeaders(res->headers);
      this->body = retrieveBody(res->body);
    }
};


struct MainResponse : public Response {
  // Provide a global point of access to the singleton.
  static MainResponse& getInstance() {
      static MainResponse instance; // Guaranteed to be destroyed, instantiated on first use.
      return instance;
  }

  MainResponse(MainResponse const&) = delete;   // Don't allow copying
  void operator=(MainResponse const&) = delete; // Don't allow assignment

  void initFastEdgeReturn(gcore_fastedge_http_handler_response_t *res);

  private:
    MainResponse() : Response() {} //* SINGLETON - Private constructor only

};

struct DownstreamResponse : public Response {
  // DownstreamResponse can have multiple instances
  DownstreamResponse(gcore_fastedge_http_client_response_t *res)
    : Response(res)
  {};

  // void initFastEdgeResponse(gcore_fastedge_http_client_response_t *res);
};


} // namespace fastedge_api

#endif
