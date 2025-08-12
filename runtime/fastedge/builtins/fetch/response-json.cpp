#include "../../../StarlingMonkey/builtins/web/fetch/request-response.h"
#include "extension-api.h"
#include "host_api.h"
#include "js/Conversions.h"
#include "js/JSON.h"
#include <iostream>

using std::cerr;
using std::endl;

namespace {
bool DEBUG_LOGGING_ENABLED = false;
api::Engine *ENGINE;

static void oom_callback(JSContext *cx, void *data) {
  cerr << "Critical Error: out of memory" << endl;
}

// JSON stringify callback
bool callbackCalled;
bool write_json_to_buf(const char16_t *str, uint32_t strlen, void *out) {
  callbackCalled = true;
  auto outstr = static_cast<std::u16string *>(out);
  outstr->append(str, strlen);
  return true;
}

} // namespace

namespace builtins::web::fetch {

// Create a standalone json function (not a Response class method)
bool response_json_static(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  if (!args.requireAtLeast(cx, "json", 1)) {
    return false;
  }

  JS::RootedValue data(cx, args.get(0));
  JS::RootedValue init_val(cx, args.get(1));
  JS::RootedObject replacer(cx);
  JS::RootedValue space(cx);

  std::u16string out;

  // 1. Serialize the data to JSON
  callbackCalled = false;
  if (!JS::ToJSON(cx, data, replacer, space, &write_json_to_buf, &out)) {
    return false;
  }
  if (!callbackCalled) {
    return api::throw_error(cx, api::Errors::TypeError, "Response.json", "data", "be a valid JSON value");
  }

  // 2. Parse init object to get status, statusText, and headers
  JS::RootedValue status_val(cx, JS::Int32Value(200));
  uint16_t status = 200;

  JS::RootedValue statusText_val(cx, JS::StringValue(JS_GetEmptyString(cx)));
  JS::RootedString statusText(cx, JS_GetEmptyString(cx));
  JS::RootedValue headers_val(cx);

  if (init_val.isObject()) {
    JS::RootedObject init(cx, init_val.toObjectOrNull());
    if (!JS_GetProperty(cx, init, "status", &status_val) ||
        !JS_GetProperty(cx, init, "statusText", &statusText_val) ||
        !JS_GetProperty(cx, init, "headers", &headers_val)) {
      return false;
    }

    if (!status_val.isUndefined() && !JS::ToUint16(cx, status_val, &status)) {
      return false;
    }

    if (status == 204 || status == 205 || status == 304) {
      auto status_str = std::to_string(status);
      return api::throw_error(cx, FetchErrors::NonBodyResponseWithBody, status_str.c_str());
    }

    if (!statusText_val.isUndefined() && !(statusText = JS::ToString(cx, statusText_val))) {
      return false;
    }

  } else if (!init_val.isNullOrUndefined()) {
    return api::throw_error(cx, FetchErrors::InvalidInitArg, "Response.json");
  }

  // 3. Create the Response JS object
  JS::RootedObject response_obj(cx, Response::create(cx));
  if (!response_obj) {
    return false;
  }

  // 4. Convert JSON string to a proper body value
  JS::RootedString json_string(cx, JS_NewUCStringCopyN(cx, out.c_str(), out.length()));
  if (!json_string) {
    return false;
  }
  JS::RootedValue body_val(cx, JS::StringValue(json_string));

  // 5. Create init object with headers that include content-type
  JS::RootedObject init_obj(cx, JS_NewPlainObject(cx));
  if (!init_obj) {
    return false;
  }

  // Set status and statusText
  if (!JS_DefineProperty(cx, init_obj, "status", status_val, JSPROP_ENUMERATE) ||
      !JS_DefineProperty(cx, init_obj, "statusText", statusText_val, JSPROP_ENUMERATE)) {
    return false;
  }

  // Create headers object and ensure content-type is set
  JS::RootedObject headers_obj(cx);
  if (!headers_val.isUndefined()) {
    headers_obj = Headers::create(cx, headers_val, Headers::HeadersGuard::Response);
  } else {
    headers_obj = Headers::create(cx, Headers::HeadersGuard::Response);
  }
  if (!headers_obj) {
    return false;
  }

  // Set content-type header if not already present
  if (!Headers::set_valid_if_undefined(cx, headers_obj, "Content-Type", "application/json")) {
    return false;
  }

  JS::RootedValue headers_obj_val(cx, JS::ObjectValue(*headers_obj));
  if (!JS_DefineProperty(cx, init_obj, "headers", headers_obj_val, JSPROP_ENUMERATE)) {
    return false;
  }

  JS::RootedValue init_obj_val(cx, JS::ObjectValue(*init_obj));

  // 6. Use the existing initialize method
  if (!Response::initialize(cx, response_obj, body_val, init_obj_val)) {
    return false;
  }

  args.rval().setObject(*response_obj);
  return true;
}

bool register_response_json_method(JSContext* cx) {
  // Get the global object
  JS::RootedObject global(cx, JS::GetNonCCWObjectGlobal(JS::CurrentGlobalOrNull(cx)));
  if (!global) {
    return false;
  }

  // Get the Response constructor from the global object
  JS::RootedValue response_val(cx);
  if (!JS_GetProperty(cx, global, "Response", &response_val)) {
    return false;
  }

  if (!response_val.isObject()) {
    cerr << "Response is not an object" << endl;
    return false;
  }

  JS::RootedObject response_ctor(cx, &response_val.toObject());

  // Create the json function using our standalone function
  JS::RootedFunction json_fn(cx, JS_NewFunction(cx, response_json_static, 1, 0, "json"));
  if (!json_fn) {
    cerr << "Failed to create json function" << endl;
    return false;
  }

  // Convert function to value
  JS::RootedValue json_fn_val(cx, JS::ObjectValue(*JS_GetFunctionObject(json_fn)));

  // Add the json method as a static method on the Response constructor
  if (!JS_DefineProperty(cx, response_ctor, "json", json_fn_val, JSPROP_ENUMERATE)) {
    cerr << "Failed to define json property on Response" << endl;
    return false;
  }

  if (DEBUG_LOGGING_ENABLED) {
    cerr << "Successfully registered Response.json static method" << endl;
  }
  return true;
}

} // namespace builtins::web::fetch

namespace fastedge::response_extensions {

bool install(api::Engine *engine) {
  ENGINE = engine;

  JS::SetOutOfMemoryCallback(engine->cx(), oom_callback, nullptr);

  if (!builtins::web::fetch::register_response_json_method(engine->cx())) {
    cerr << "Failed to register Response.json method" << endl;
    return false;
  }

  DEBUG_LOGGING_ENABLED = engine->debug_logging_enabled();

  cerr << "Response extensions installed successfully" << endl;
  return true;
}

} // namespace fastedge::response_extensions
