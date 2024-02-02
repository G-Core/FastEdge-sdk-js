#include <algorithm>
#include <array>
#include <cstdio>
#include <sstream>
#include <string>
#include <type_traits>
#include <vector>

#include "fastedge-builtins.h"
#include "wit-interface/fastedge-api.h"
#include "wit-interface/http_reactor.h"

namespace fastedge_api {

//* Http

http_reactor_string_t Http::createHttpReactorString(std::string str) {
  char* my_str = new char[str.length() + 1];
  std::strcpy(my_str, str.c_str());

  http_reactor_string_t myStr = {.ptr = my_str, .len = str.length()};
  return myStr;
}

gcore_fastedge_http_headers_t Http::createHttpHeaders() {
  size_t headersLength = this->headers.size();

  http_reactor_tuple2_string_string_t *tupleStr = new http_reactor_tuple2_string_string_t[headersLength];

  for (size_t i = 0; i < headersLength; i++) {
    std::array<std::string, 2> header = this->headers[i];

    http_reactor_string_t myKey = createHttpReactorString(header[0]);
    http_reactor_string_t myVal = createHttpReactorString(header[1]);

    tupleStr[i].f0 = myKey;
    tupleStr[i].f1 = myVal;
  }

  gcore_fastedge_http_headers_t http_headers = {
    .ptr = tupleStr,
    .len = headersLength,
  };

  return http_headers;
}

http_reactor_option_gcore_fastedge_http_headers_t Http::createOptionalHttpHeaders() {
  http_reactor_option_gcore_fastedge_http_headers_t headers;

  size_t headersLength = this->headers.size();
  headers.is_some = headersLength >= 1;

  if (headers.is_some) {
    headers.val = createHttpHeaders();
  }
  return headers;
}

http_reactor_option_gcore_fastedge_http_body_t Http::createHttpBody() {

  http_reactor_option_gcore_fastedge_http_body_t body;

  if (this->body.empty()) {
    body.is_some = false;
  } else {
    body.is_some = true;
    body.val = {
      .ptr = reinterpret_cast<uint8_t *>(const_cast<char *>(this->body.c_str())),
      .len = this->body.length(),
    };
  }
  return body;
}

std::string Http::retrieveBody(http_reactor_option_gcore_fastedge_http_body_t body) {
  if (body.is_some) {
    return std::string(reinterpret_cast<char*>(body.val.ptr), body.val.len);
  }
  return GCORE_FASTEDGE_NO_BODY;
}

std::string Http::retrieveBody(std::string_view body) {
  if (body.empty()) {
    return GCORE_FASTEDGE_NO_BODY;
  }
  return std::string(body);
}

std::vector<std::array<std::string, 2>> Http::retrieveHeaders(gcore_fastedge_http_headers_t headers) {
  std::vector<std::array<std::string, 2>> headersVector;
  for (size_t i = 0; i < headers.len; i++) {
    std::array<std::string, 2> header;
    header[0] = std::string(headers.ptr[i].f0.ptr, headers.ptr[i].f0.len);
    header[1] = std::string(headers.ptr[i].f1.ptr, headers.ptr[i].f1.len);
    headersVector.push_back(header);
  }
  return headersVector;
}

std::vector<std::array<std::string, 2>> Http::retrieveOptionalHeaders(http_reactor_option_gcore_fastedge_http_headers_t optionalHeaders) {
  if (optionalHeaders.is_some) {
    return retrieveHeaders(optionalHeaders.val);
  }
  std::vector<std::array<std::string, 2>> headersVector;
  return headersVector;
}

std::vector<std::array<std::string, 2>> Http::convertStringToHeaders(std::string_view headersStringV)
{
  //* This requires input with no whitespace
  //* Example: [["content-type","text/plain"],["cache-ttl",500]]
  std::string headersString = std::string(headersStringV);
  std::vector<std::array<std::string, 2>> headers;
  // Remove the outer square brackets from the string
  std::string trimmedString = headersString.substr(1, headersString.length() - 2);
  // Split the string into individual header pairs
  std::istringstream iss(trimmedString);

  int openingSquareBracket = 44;
  int doubleQuote = 34;

  std::string headerPair;
  while (std::getline(iss, headerPair, ']')) {
    // Remove the outer square brackets from each header pair
    std::string trimmedHeaderPair = headerPair.substr(headerPair[0] == openingSquareBracket ? 2 : 1, headerPair.length() - 1);

    // Split the header pair into key and value
    std::istringstream issPair(trimmedHeaderPair);
    std::string key, value;
    std::getline(issPair, key, ',');
    std::getline(issPair, value, ',');

    // Remove the surrounding double quotes from key and value
    key = key.substr(1, key.length() - 2);
    value = value[0] == doubleQuote
      ? value.substr(1, value.length() - 2)
      : value.substr(0, value.length() - 1);
    // Add the header pair to the vector
		printf("TCL: key: %s \n", std::string(key).c_str());
		printf("TCL: value: %s \n", std::string(value).c_str());
    headers.push_back({key, value});
  }
  return headers;
}

std::string Http::convertHeadersToString(std::vector<std::array<std::string, 2>> headers) {
  std::string headersString = "[";
  for (size_t i = 0; i < headers.size(); i++) {
    std::string key = headers[i][0];
    std::string value = headers[i][1];
    headersString += "[\"" + key + "\",\"" + value + "\"]";
    if (i != headers.size() - 1) {
      headersString += ",";
    }
  }
  headersString += "]";
  return headersString;
}

//* Request

std::string Request::retrieveMethod(gcore_fastedge_http_method_t method) {
  switch (method) {
    case GCORE_FASTEDGE_HTTP_METHOD_GET:
      return "GET";
    case GCORE_FASTEDGE_HTTP_METHOD_POST:
      return  "POST";
    case GCORE_FASTEDGE_HTTP_METHOD_PUT:
      return  "PUT";
    case GCORE_FASTEDGE_HTTP_METHOD_DELETE:
      return  "DELETE";
    case GCORE_FASTEDGE_HTTP_METHOD_HEAD:
      return  "HEAD";
    case GCORE_FASTEDGE_HTTP_METHOD_PATCH:
      return  "PATCH";
    case GCORE_FASTEDGE_HTTP_METHOD_OPTIONS:
      return  "OPTIONS";
    default:
      return "UNKNOWN";
  }
}

int Request::retrieveMethod(std::string_view method) {
  if (method == "GET") {
    return GCORE_FASTEDGE_HTTP_METHOD_GET;
  } else if (method == "POST") {
    return GCORE_FASTEDGE_HTTP_METHOD_POST;
  } else if (method == "PUT") {
    return GCORE_FASTEDGE_HTTP_METHOD_PUT;
  } else if (method == "DELETE") {
    return GCORE_FASTEDGE_HTTP_METHOD_DELETE;
  } else if (method == "HEAD") {
    return GCORE_FASTEDGE_HTTP_METHOD_HEAD;
  } else if (method == "PATCH") {
    return GCORE_FASTEDGE_HTTP_METHOD_PATCH;
  } else if (method == "OPTIONS") {
    return GCORE_FASTEDGE_HTTP_METHOD_OPTIONS;
  } else {
    return -1; // Unknown method
  }
}

void DownstreamRequest::initFastEdgeRequest(gcore_fastedge_http_client_request_t *req) {
  req->method = retrieveMethod(std::string_view(this->method));
  req->uri = createHttpReactorString(this->uri);
  req->headers = this->createHttpHeaders();
  req->body = this->createHttpBody();
};

//* Response

void MainResponse::initFastEdgeReturn(gcore_fastedge_http_handler_response_t *ret) {
  ret->status = this->status;
  ret->headers = this->createOptionalHttpHeaders();
  ret->body = this->createHttpBody();
};

} // namespace fastedge_api
