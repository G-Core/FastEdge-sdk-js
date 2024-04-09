#include <arpa/inet.h>
#include <chrono>
#include <cmath>
#include <iostream>
#include <list>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <vector>

#include "fastedge-builtins.h"
#include "host-api/send-request.h"
#include "rust-url/rust-url.h"

#include "js/Array.h"
#include "js/ArrayBuffer.h"
#include "js/Conversions.h"
#include "mozilla/Result.h"

// TODO: remove these once the warnings are fixed
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Winvalid-offsetof"
#pragma clang diagnostic pop

#include "js/JSON.h"
#include "js/Value.h"
#include "js/shadow/Object.h"
#include "zlib.h"

#include "builtin.h"
#include "core/encode.h"
#include "wit-interface/fastedge-api.h"

using namespace std::literals;

using std::chrono::ceil;
using std::chrono::milliseconds;
using std::chrono::system_clock;

// using builtins::Console;

using JS::CallArgs;
using JS::CallArgsFromVp;
using JS::UniqueChars;

using JS::ObjectOrNullValue;
using JS::ObjectValue;
using JS::PrivateValue;
using JS::Value;

using JS::RootedObject;
using JS::RootedString;
using JS::RootedValue;

using JS::HandleObject;
using JS::HandleString;
using JS::HandleValue;
using JS::HandleValueArray;
using JS::MutableHandleValue;

using JS::PersistentRooted;

const JSErrorFormatString *GetErrorMessage(void *userRef, unsigned errorNumber) {
  if (errorNumber > 0 && errorNumber < JSErrNum_Limit) {
    return &js_ErrorFormatString[errorNumber];
  }

  return nullptr;
}

enum class Mode { PreWizening, PostWizening };

Mode execution_mode = Mode::PreWizening;

bool hasWizeningFinished() { return execution_mode == Mode::PostWizening; }

bool isWizening() { return execution_mode == Mode::PreWizening; }

void markWizeningAsFinished() { execution_mode = Mode::PostWizening; }

template <InternalMethod fun>
bool enqueue_internal_method(JSContext *cx, HandleObject receiver,
                             HandleValue extra = JS::UndefinedHandleValue, unsigned int nargs = 0,
                             const char *name = "") {
  RootedObject method(cx, create_internal_method<fun>(cx, receiver, extra, nargs, name));
  if (!method) {
    return false;
  }

  RootedObject promise(cx, JS::CallOriginalPromiseResolve(cx, JS::UndefinedHandleValue));
  if (!promise) {
    return false;
  }

  return JS::AddPromiseReactions(cx, promise, method, nullptr);
}

using jsurl::SpecSlice, jsurl::SpecString, jsurl::JSUrl, jsurl::JSUrlSearchParams,
    jsurl::JSSearchParam;

namespace GlobalProperties {

JS::Result<std::string> convertJSValueToByteString(JSContext *cx, JS::Handle<JS::Value> v) {
  JS::RootedString s(cx);
  if (v.isString()) {
    s = v.toString();
  } else {
    s = JS::ToString(cx, v);
    if (!s) {
      JS_ReportErrorNumberUTF8(cx, GetErrorMessage, nullptr, JSMSG_INVALID_CHARACTER_ERROR);
      return JS::Result<std::string>(JS::Error());
    }
  }

  // Conversion from JavaScript string to ByteString is only valid if all
  // characters < 256. This is always the case for Latin1 strings.
  size_t length;
  if (!JS::StringHasLatin1Chars(s)) {
    // Creating an exception can GC, so we first scan the string for bad chars
    // and report the error outside the AutoCheckCannotGC scope.
    bool foundBadChar = false;
    {
      JS::AutoCheckCannotGC nogc;
      const char16_t *chars = JS_GetTwoByteStringCharsAndLength(cx, nogc, s, &length);
      if (!chars) {
        JS_ReportErrorNumberUTF8(cx, GetErrorMessage, nullptr, JSMSG_INVALID_CHARACTER_ERROR);
        return JS::Result<std::string>(JS::Error());
      }

      for (size_t i = 0; i < length; i++) {
        if (chars[i] > 255) {
          foundBadChar = true;
          break;
        }
      }
    }

    if (foundBadChar) {
      JS_ReportErrorNumberUTF8(cx, GetErrorMessage, nullptr, JSMSG_INVALID_CHARACTER_ERROR);
      return JS::Result<std::string>(JS::Error());
    }
  } else {
    length = JS::GetStringLength(s);
  }

  UniqueChars result = JS_EncodeStringToLatin1(cx, s);
  if (!result) {
    return JS::Result<std::string>(JS::Error());
  }
  std::string byteString(result.get(), length);
  return byteString;
}

JS::Result<std::string> convertJSValueToByteString(JSContext *cx, std::string v) {
  JS::RootedValue s(cx);
  s.setString(JS_NewStringCopyN(cx, v.c_str(), v.length()));
  return convertJSValueToByteString(cx, s);
}

// Maps an encoded character to a value in the Base64 alphabet, per
// RFC 4648, Table 1. Invalid input characters map to UINT8_MAX.
// https://datatracker.ietf.org/doc/html/rfc4648#section-4

constexpr uint8_t nonAlphabet = 255;

// clang-format off
const uint8_t base64DecodeTable[128] = {
  /* 0 */    nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet,
  /* 8 */    nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet,
  /* 16 */   nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet,
  /* 24 */   nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet,
  /* 32 */   nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet,
  /* 40 */   nonAlphabet, nonAlphabet, nonAlphabet,          62, nonAlphabet, nonAlphabet, nonAlphabet,          63,
  /* 48 */            52,          53,          54,          55,          56,          57,          58,          59,
  /* 56 */            60,          61, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet,
  /* 64 */   nonAlphabet,           0,           1,           2,           3,           4,           5,           6,
  /* 72 */             7,           8,           9,          10,          11,          12,          13,          14,
  /* 80 */            15,          16,          17,          18,          19,          20,          21,          22,
  /* 88 */            23,          24,          25, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet,
  /* 96 */   nonAlphabet,          26,          27,          28,          29,          30,          31,          32,
  /* 104 */           33,          34,          35,          36,          37,          38,          39,          40,
  /* 112 */           41,          42,          43,          44,          45,          46,          47,          48,
  /* 120 */           49,          50,          51, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet
};

const uint8_t base64URLDecodeTable[128] = {
  /* 0 */    nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet,
  /* 8 */    nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet,
  /* 16 */   nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet,
  /* 24 */   nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet,
  /* 32 */   nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet,
  /* 40 */   nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet,          62, nonAlphabet, nonAlphabet,
  /* 48 */            52,          53,          54,          55,          56,          57,          58,          59,
  /* 56 */            60,          61, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet,
  /* 64 */   nonAlphabet,           0,           1,           2,           3,           4,           5,           6,
  /* 72 */             7,           8,           9,          10,          11,          12,          13,          14,
  /* 80 */            15,          16,          17,          18,          19,          20,          21,          22,
  /* 88 */            23,          24,          25, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet,          63,
  /* 96 */   nonAlphabet,          26,          27,          28,          29,          30,          31,          32,
  /* 104 */           33,          34,          35,          36,          37,          38,          39,          40,
  /* 112 */           41,          42,          43,          44,          45,          46,          47,          48,
  /* 120 */           49,          50,          51, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet, nonAlphabet
};

const char base64EncodeTable[65] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                      "abcdefghijklmnopqrstuvwxyz"
                      "0123456789+/";

const char base64URLEncodeTable[65] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                      "abcdefghijklmnopqrstuvwxyz"
                      "0123456789-_";

// clang-format on

bool base64CharacterToValue(char character, uint8_t *value, const uint8_t *decodeTable) {
  static const size_t mask = 127;
  auto index = static_cast<size_t>(character);

  if (index & ~mask) {
    return false;
  }
  *value = decodeTable[index & mask];

  return *value != 255;
}

inline JS::Result<mozilla::Ok> base64Decode4to3(std::string_view input, std::string &output,
                                                const uint8_t *decodeTable) {
  uint8_t w, x, y, z;
  // 8.1 Find the code point pointed to by position in the second column of Table 1: The Base 64
  // Alphabet of RFC 4648. Let n be the number given in the first cell of the same row. [RFC4648]
  if (!base64CharacterToValue(input[0], &w, decodeTable) ||
      !base64CharacterToValue(input[1], &x, decodeTable) ||
      !base64CharacterToValue(input[2], &y, decodeTable) ||
      !base64CharacterToValue(input[3], &z, decodeTable)) {
    return JS::Result<mozilla::Ok>(JS::Error());
  }

  // 8.3 If buffer has accumulated 24 bits, interpret them as three 8-bit big-endian numbers. Append
  // three bytes with values equal to those numbers to output, in the same order, and then empty
  // buffer.
  output += (uint8_t(w << 2 | x >> 4));
  output += (uint8_t(x << 4 | y >> 2));
  output += (uint8_t(y << 6 | z));
  return mozilla::Ok();
}

inline JS::Result<mozilla::Ok> base64Decode3to2(std::string_view input, std::string &output,
                                                const uint8_t *decodeTable) {
  uint8_t w, x, y;
  // 8.1 Find the code point pointed to by position in the second column of Table 1: The Base 64
  // Alphabet of RFC 4648. Let n be the number given in the first cell of the same row. [RFC4648]
  if (!base64CharacterToValue(input[0], &w, decodeTable) ||
      !base64CharacterToValue(input[1], &x, decodeTable) ||
      !base64CharacterToValue(input[2], &y, decodeTable)) {
    return JS::Result<mozilla::Ok>(JS::Error());
  }
  // 9. If buffer is not empty, it contains either 12 or 18 bits. If it contains 12 bits, then
  // discard the last four and interpret the remaining eight as an 8-bit big-endian number. If it
  // contains 18 bits, then discard the last two and interpret the remaining 16 as two 8-bit
  // big-endian numbers. Append the one or two bytes with values equal to those one or two numbers
  // to output, in the same order.
  output += (uint8_t(w << 2 | x >> 4));
  output += (uint8_t(x << 4 | y >> 2));
  return mozilla::Ok();
}

inline JS::Result<mozilla::Ok> base64Decode2to1(std::string_view input, std::string &output,
                                                const uint8_t *decodeTable) {
  uint8_t w, x;
  // 8.1 Find the code point pointed to by position in the second column of Table 1: The Base 64
  // Alphabet of RFC 4648. Let n be the number given in the first cell of the same row. [RFC4648]
  if (!base64CharacterToValue(input[0], &w, decodeTable) ||
      !base64CharacterToValue(input[1], &x, decodeTable)) {
    return JS::Result<mozilla::Ok>(JS::Error());
  }
  // 9. If buffer is not empty, it contains either 12 or 18 bits. If it contains 12 bits, then
  // discard the last four and interpret the remaining eight as an 8-bit big-endian number. If it
  // contains 18 bits, then discard the last two and interpret the remaining 16 as two 8-bit
  // big-endian numbers. Append the one or two bytes with values equal to those one or two numbers
  // to output, in the same order.
  output += (uint8_t(w << 2 | x >> 4));
  return mozilla::Ok();
}

bool isAsciiWhitespace(char c) {
  switch (c) {
  case '\t':
  case '\n':
  case '\f':
  case '\r':
  case ' ':
    return true;
  default:
    return false;
  }
}

// https://infra.spec.whatwg.org/#forgiving-base64-decode
JS::Result<std::string> forgivingBase64Decode(std::string_view data,
                                              const uint8_t *decodeTable = base64DecodeTable) {
  // 1. Remove all ASCII whitespace from data.
  // ASCII whitespace is U+0009 TAB, U+000A LF, U+000C FF, U+000D CR, or U+0020 SPACE.
  auto hasWhitespace = std::find_if(data.begin(), data.end(), &isAsciiWhitespace);
  std::string dataWithoutAsciiWhitespace;

  if (hasWhitespace) {
    dataWithoutAsciiWhitespace = data;
    dataWithoutAsciiWhitespace.erase(std::remove_if(dataWithoutAsciiWhitespace.begin() +
                                                        std::distance(data.begin(), hasWhitespace),
                                                    dataWithoutAsciiWhitespace.end(),
                                                    &isAsciiWhitespace),
                                     dataWithoutAsciiWhitespace.end());
    data = dataWithoutAsciiWhitespace;
  }
  std::string_view data_view(data);
  size_t length = data_view.length();

  // 2. If data’s code point length divides by 4 leaving no remainder, then:
  if (length && (length % 4 == 0)) {
    // 2.1 If data ends with one or two U+003D (=) code points, then remove them from data.
    if (data_view.at(length - 1) == '=') {
      if (data_view.at(length - 2) == '=') {
        data_view.remove_suffix(2);
      } else {
        data_view.remove_suffix(1);
      }
    }
  }

  // 3. If data’s code point length divides by 4 leaving a remainder of 1, then return failure.
  if ((data_view.length() % 4 == 1)) {
    return JS::Result<std::string>(JS::Error());
  }

  // 4. If data contains a code point that is not one of
  //    U+002B (+)
  //    U+002F (/)
  //    ASCII alphanumeric
  // then return failure.

  // Step 4 is handled within the calls below to
  // base64Decode4to3, base64Decode3to2, and base64Decode2to1

  // 5. Let output be an empty byte sequence.
  std::string output = "";
  output.reserve(data_view.length() / 3);

  // 6. Let buffer be an empty buffer that can have bits appended to it.

  // Step 6 is handled within the calls below to
  // base64Decode4to3, base64Decode3to2, and base64Decode2to1

  // 7. Let position be a position variable for data, initially pointing at the start of data.

  // We don't use a position variable, instead we remove_prefix from the `data` each time we have
  // dealt with some characters.

  while (data_view.length() >= 4) {
    MOZ_TRY(base64Decode4to3(data_view, output, decodeTable));
    data_view.remove_prefix(4);
  }

  switch (data_view.length()) {
  case 3: {
    MOZ_TRY(base64Decode3to2(data_view, output, decodeTable));
    break;
  }
  case 2: {
    MOZ_TRY(base64Decode2to1(data_view, output, decodeTable));
    break;
  }
  case 1:
    return JS::Result<std::string>(JS::Error());
  case 0:
    break;
  default:
    MOZ_CRASH("Too many characters leftover");
  }

  return output;
}

// https://html.spec.whatwg.org/multipage/webappapis.html#dom-atob
bool atob(JSContext *cx, unsigned argc, Value *vp) {
  CallArgs args = CallArgsFromVp(argc, vp);
  if (!args.requireAtLeast(cx, "atob", 1)) {
    return false;
  }
  auto dataResult = convertJSValueToByteString(cx, args.get(0));
  if (dataResult.isErr()) {
    return false;
  }
  auto data = dataResult.unwrap();

  // 1. Let decodedData be the result of running forgiving-base64 decode on data.
  auto decoded_result = forgivingBase64Decode(data);
  // 2. If decodedData is failure, then throw an "InvalidCharacterError" DOMException.
  if (decoded_result.isErr()) {
    JS_ReportErrorNumberUTF8(cx, GetErrorMessage, nullptr, JSMSG_INVALID_CHARACTER_ERROR);
    return false;
  }
  auto decoded = decoded_result.unwrap();
  RootedString decodedData(cx, JS_NewStringCopyN(cx, decoded.c_str(), decoded.length()));
  if (!decodedData) {
    return false;
  }

  // 3. Return decodedData.
  args.rval().setString(decodedData);
  return true;
}

inline uint8_t CharTo8Bit(char character) { return uint8_t(character); }
inline void base64Encode3to4(std::string_view data, std::string &output, const char *encodeTable) {
  uint32_t b32 = 0;
  int i, j = 18;

  for (i = 0; i < 3; ++i) {
    b32 <<= 8;
    b32 |= CharTo8Bit(data[i]);
  }

  for (i = 0; i < 4; ++i) {
    output += encodeTable[(uint32_t)((b32 >> j) & 0x3F)];
    j -= 6;
  }
}

inline void base64Encode2to4(std::string_view data, std::string &output, const char *encodeTable) {
  uint8_t src0 = CharTo8Bit(data[0]);
  uint8_t src1 = CharTo8Bit(data[1]);
  output += encodeTable[(uint32_t)((src0 >> 2) & 0x3F)];
  output += encodeTable[(uint32_t)(((src0 & 0x03) << 4) | ((src1 >> 4) & 0x0F))];
  output += encodeTable[(uint32_t)((src1 & 0x0F) << 2)];
  output += '=';
}

inline void base64Encode1to4(std::string_view data, std::string &output, const char *encodeTable) {
  uint8_t src0 = CharTo8Bit(data[0]);
  output += encodeTable[(uint32_t)((src0 >> 2) & 0x3F)];
  output += encodeTable[(uint32_t)((src0 & 0x03) << 4)];
  output += '=';
  output += '=';
}

// https://infra.spec.whatwg.org/#forgiving-base64-encode
// To forgiving-base64 encode given a byte sequence data, apply the base64 algorithm defined in
// section 4 of RFC 4648 to data and return the result. [RFC4648] Note: This is named
// forgiving-base64 encode for symmetry with forgiving-base64 decode, which is different from the
// RFC as it defines error handling for certain inputs.
std::string forgivingBase64Encode(std::string_view data, const char *encodeTable) {
  int length = data.length();
  std::string output = "";
  // The Base64 version of a string will be at least 133% the size of the string.
  output.reserve(length * 1.33);
  while (length >= 3) {
    base64Encode3to4(data, output, encodeTable);
    data.remove_prefix(3);
    length -= 3;
  }

  switch (length) {
  case 2:
    base64Encode2to4(data, output, encodeTable);
    break;
  case 1:
    base64Encode1to4(data, output, encodeTable);
    break;
  case 0:
    break;
  default:
    MOZ_ASSERT_UNREACHABLE("coding error");
  }
  return output;
}

// The btoa(data) method must throw an "InvalidCharacterError" DOMException
// if data contains any character whose code point is greater than U+00FF.
// Otherwise, the user agent must convert data to a byte sequence whose
// nth byte is the eight-bit representation of the nth code point of data,
// and then must apply forgiving-base64 encode to that byte sequence and return the result.
bool btoa(JSContext *cx, unsigned argc, Value *vp) {
  CallArgs args = CallArgsFromVp(argc, vp);

  if (!args.requireAtLeast(cx, "btoa", 1)) {
    return false;
  }

  auto data = args.get(0);
  auto out = args.rval();
  // Note: We do not check if data contains any character whose code point is greater than U+00FF
  // before calling convertJSValueToByteString as convertJSValueToByteString does the same check
  auto byteStringResult = convertJSValueToByteString(cx, data);
  if (byteStringResult.isErr()) {
    return false;
  }
  auto byteString = byteStringResult.unwrap();

  auto result = forgivingBase64Encode(byteString, GlobalProperties::base64EncodeTable);

  JSString *str = JS_NewStringCopyN(cx, result.c_str(), result.length());
  if (!str) {
    JS_ReportErrorNumberUTF8(cx, GetErrorMessage, nullptr, JSMSG_INVALID_CHARACTER_ERROR);

    return false;
  }

  out.setString(str);
  return true;
}

bool self_get(JSContext *cx, unsigned argc, Value *vp) {
  CallArgs args = CallArgsFromVp(argc, vp);
  args.rval().setObject(*JS::CurrentGlobalOrNull(cx));
  return true;
}

bool self_set(JSContext *cx, unsigned argc, Value *vp) {
  CallArgs args = CallArgsFromVp(argc, vp);
  if (!args.requireAtLeast(cx, "globalThis.self setter", 1)) {
    return false;
  }

  RootedObject global(cx, JS::CurrentGlobalOrNull(cx));
  if (args.thisv() != ObjectValue(*global)) {
    JS_ReportErrorLatin1(cx, "globalThis.self setter can only be called on the global object");
    return false;
  }

  if (!JS_DefineProperty(cx, global, "self", args[0], JSPROP_ENUMERATE)) {
    return false;
  }

  args.rval().setUndefined();
  return true;
}

// Magic number used in structured cloning as a tag to identify a
// URLSearchParam.
#define SCTAG_DOM_URLSEARCHPARAMS JS_SCTAG_USER_MIN


/* GCORE INSERTS */

template <bool is_error> bool logOutput(JSContext* cx, unsigned argc, JS::Value* vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);

  if (!args.requireAtLeast(cx, "logOutput", 1)) {
    fprintf(stderr, "Error: console.fn() -> requires at least 1 argument\n");
    return false;
  }

  auto msg_chars = core::encode(cx, args[0]);
  if (!msg_chars) {
    fprintf(stderr, "Error: console.fn() -> requires at least 1 argument\n");
    return false;
  }

  std::string_view msg_str = msg_chars;
  fprintf(is_error ? stderr : stdout, "%.*s\n", static_cast<int>(msg_str.size()), msg_str.data());
  fflush(is_error ? stderr : stdout);

  args.rval().setUndefined();
  return true;
}

bool getEnv(JSContext* cx, unsigned argc, JS::Value* vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);

  if (!args.requireAtLeast(cx, "getEnv", 1)) {
    fprintf(stderr, "Error: getEnv() -> requires at least 1 argument\n");
    return false;
  }

  auto key_chars = core::encode(cx, args[0]);
  auto val_chars = std::getenv(std::string(key_chars).c_str());

  JS::RootedString jsEnvStr(cx, JS_NewStringCopyZ(cx, std::string(val_chars).c_str()));
  args.rval().setString(jsEnvStr);

  return true;
}

bool sendRequest(JSContext* cx, unsigned argc, JS::Value* vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);

  if (!args.requireAtLeast(cx, "sendRequest", 1)) {
    fprintf(stderr, "Error: fastedge.sendRequest -> requires at least 4 arguments\n");
    return false;
  }

  auto method_chars = core::encode(cx, args[0]);
  if (!method_chars) {
    fprintf(stderr, "Error: fastedge.sendRequest -> requires a method argument\n");
    return false;
  }

  auto url_chars = core::encode(cx, args[1]);
  if (!url_chars) {
    fprintf(stderr, "Error: fastedge.sendRequest -> requires a url argument\n");
    return false;
  }

  auto headers_chars = core::encode(cx, args[2]);
  if (!headers_chars) {
    fprintf(stderr, "Error: fastedge.sendRequest -> requires a headers argument\n");
    return false;
  }

  auto body_chars = core::encode(cx, args[3]);
  if (!body_chars) {
    fprintf(stderr, "Error: fastedge.sendRequest -> requires a body argument\n");
    return false;
  }

  fastedge_api::DownstreamResponse response = fastedge_api::sendRequest(method_chars, url_chars, headers_chars, body_chars);

  // Create a new JavaScript object
  JS::RootedObject jsResponse(cx, JS_NewPlainObject(cx));
  if (!jsResponse) {
    return false;  // Out of memory
  }

  // Set the "status" property
  JS::RootedValue jsStatus(cx, JS::Int32Value(response.status));
  if (!JS_SetProperty(cx, jsResponse, "status", jsStatus)) {
    return false;  // Error setting property
  }

  // Set the "headers" property
  JS::RootedValue jsHeaders(cx, JS::StringValue(JS_NewStringCopyZ(cx, response.convertHeadersToString(response.headers).c_str())));
  if (!JS_SetProperty(cx, jsResponse, "headers", jsHeaders)) {
    return false;  // Error setting property
  }

  // Set the "body" property
  JS::RootedValue jsBody(cx, JS::StringValue(JS_NewStringCopyZ(cx, response.body.c_str())));
  if (!JS_SetProperty(cx, jsResponse, "body", jsBody)) {
    return false;  // Error setting property
  }

  // Set the return value to the new JavaScript object
  args.rval().setObject(*jsResponse);

  return true;
}

bool sendResponse(JSContext* cx, unsigned argc, JS::Value* vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);

  if (!args.requireAtLeast(cx, "sendResponse", 3)) {
    fprintf(stderr, "Error: fastedge.sendResponse -> requires at least 3 arguments\n");
    return false;
  }

  printf("fastedge.sendResponse -> status %d  \n", args[0].toInt32());

  auto header_chars = core::encode(cx, args[1]);
  if (!header_chars) {
    fprintf(stderr, "Error: fastedge.sendResponse -> requires a header argument\n");
    return false;
  }
  printf("fastedge.sendResponse -> header_chars: %s\n", std::string(header_chars).c_str());

  auto body_chars = core::encode(cx, args[2]);
  if (!body_chars) {
    fprintf(stderr, "Error: fastedge.sendResponse -> requires a body argument\n");
    return false;
  }
  // printf("fastedge.sendResponse -> body_chars: %s\n", std::string(body_chars).c_str());
  fflush(stdout);

  fastedge_api::MainResponse& mainResponse = fastedge_api::MainResponse::getInstance();
  mainResponse.setStatus(args[0].toInt32());
  mainResponse.setHeaders(header_chars);
  mainResponse.setBody(body_chars);

  args.rval().setUndefined();
  return true;
}

/* GCORE INSERTS END */

const JSFunctionSpec globalMethods[] = {
    JS_FN("atob", atob, 1, JSPROP_ENUMERATE),
    JS_FN("btoa", btoa, 1, JSPROP_ENUMERATE),
    // JS_FN("clearInterval", clearTimeout_or_interval<true>, 1, JSPROP_ENUMERATE),
    // JS_FN("clearTimeout", clearTimeout_or_interval<false>, 1, JSPROP_ENUMERATE),
    // JS_FN("setInterval", setTimeout_or_interval<true>, 1, JSPROP_ENUMERATE),
    // JS_FN("setTimeout", setTimeout_or_interval<false>, 1, JSPROP_ENUMERATE),
    JS_FS_END};

/*
* These are all the cbindings interface methods. They should not pollute the global namespace.
* They are only used by the fastedge js code to interact with this runtime.
* come preview_adapter_3 we will remove these and use jsbindings instead.
*/
const JSFunctionSpec fastedgeMethods[] = {
    JS_FN("consoleLog", logOutput<false>, 1, JSPROP_ENUMERATE),
    JS_FN("consoleError", logOutput<true>, 1, JSPROP_ENUMERATE),
    JS_FN("sendResponse", sendResponse, 1, JSPROP_ENUMERATE),
    JS_FN("sendRequest", sendRequest, 1, JSPROP_ENUMERATE),
    JS_FN("getEnv", getEnv, 1, JSPROP_ENUMERATE),
    JS_FS_END};

const JSPropertySpec properties[] = {JS_PSGS("self", self_get, self_set, JSPROP_ENUMERATE),
                                     JS_PS_END};

static bool init(JSContext *cx, HandleObject global) {
  JS::RootedObject fastedge(cx, JS_NewPlainObject(cx));
  if (!JS_DefineFunctions(cx, fastedge, fastedgeMethods)) {
    return false;
  }
  if (!JS_DefineProperty(cx, global, "fastedge", fastedge, JSPROP_ENUMERATE)) {
    return false;
  }
  return JS_DefineFunctions(cx, global, globalMethods) && JS_DefineProperties(cx, global, properties);
}


} // namespace GlobalProperties

bool define_fastedge_runner(JSContext *cx, HandleObject global) {
  return GlobalProperties::init(cx, global);
}

UniqueChars stringify_value(JSContext *cx, JS::HandleValue value) {
  JS::RootedString str(cx, JS_ValueToSource(cx, value));
  if (!str)
    return nullptr;

  return JS_EncodeStringToUTF8(cx, str);
}

bool debug_logging_enabled() { return true; }

bool dump_value(JSContext *cx, JS::Value val, FILE *fp) {
  RootedValue value(cx, val);
  UniqueChars utf8chars = stringify_value(cx, value);
  if (!utf8chars) {
    return false;
  }

  fprintf(fp, "%s\n", utf8chars.get());
  return true;
}

bool print_stack(JSContext *cx, HandleObject stack, FILE *fp) {
  RootedString stackStr(cx);
  if (!BuildStackString(cx, nullptr, stack, &stackStr, 2)) {
    return false;
  }

  auto utf8chars = core::encode(cx, stackStr);
  if (!utf8chars) {
    return false;
  }

  fprintf(fp, "%s\n", utf8chars.begin());
  return true;
}

void dump_promise_rejection(JSContext *cx, HandleValue reason, HandleObject promise, FILE *fp) {
  bool reported = false;
  RootedObject stack(cx);

  if (reason.isObject()) {
    RootedObject err(cx, &reason.toObject());
    JSErrorReport *report = JS_ErrorFromException(cx, err);
    if (report) {
      fprintf(stderr, "%s\n", report->message().c_str());
      reported = true;
    }

    stack = JS::ExceptionStackOrNull(err);
  }

  // If the rejection reason isn't an `Error` object, we just dump the value
  // as-is.
  if (!reported) {
    dump_value(cx, reason, stderr);
  }

  // If the rejection reason isn't an `Error` object, we can't get an exception
  // stack from it. In that case, fall back to getting the stack from the
  // promise resolution site. These should be identical in many cases, such as
  // for exceptions thrown in async functions, but for some reason the
  // resolution site stack seems to sometimes be wrong, so we only fall back to
  // it as a last resort.
  if (!stack) {
    stack = JS::GetPromiseResolutionSite(promise);
  }

  if (stack) {
    fprintf(stderr, "Stack:\n");
    print_stack(cx, stack, stderr);
  }
}

bool print_stack(JSContext *cx, FILE *fp) {
  RootedObject stackp(cx);
  if (!JS::CaptureCurrentStack(cx, &stackp))
    return false;
  return print_stack(cx, stackp, fp);
}
