#include "request-info.h"

#include "builtin.h"

#include "../../StarlingMonkey/builtins/web/fetch/fetch_event.h"
#include "../../StarlingMonkey/builtins/web/fetch/headers.h"
#include "../../StarlingMonkey/builtins/web/fetch/request-response.h"

#include <cmath>
#include <cstdlib>
#include <initializer_list>
#include <optional>
#include <string>
#include <string_view>
#include <tuple>

namespace fastedge::request_info {

using builtins::web::fetch::fetch_event::FetchEvent;
using builtins::web::fetch::Headers;
using builtins::web::fetch::RequestOrResponse;

namespace {

// Read a single header value off the FetchEvent's incoming Request.
// Returns "" if the header isn't present.
std::string read_header(JSContext *cx, JS::HandleObject fetch_event,
                        std::string_view name) {
  JS::Value request_val = JS::GetReservedSlot(
      fetch_event, static_cast<uint32_t>(FetchEvent::Slots::Request));
  if (!request_val.isObject()) return "";
  JS::RootedObject request(cx, &request_val.toObject());
  JS::RootedObject headers(cx, RequestOrResponse::headers(cx, request));
  if (!headers) return "";
  auto idx = Headers::lookup(cx, headers, name);
  if (!idx.has_value()) return "";
  auto entry = Headers::get_index(cx, headers, *idx);
  if (!entry) return "";
  const auto &value = std::get<1>(*entry);
  return std::string(value.ptr.get(), value.len);
}

// Try several header names in order; return the first non-empty value.
// Used for client.address: x-real-ip is the trusted source, x-forwarded-for
// is the fallback when the platform omits x-real-ip on a given pathway.
std::string read_header_fallback(JSContext *cx, JS::HandleObject fetch_event,
                                 std::initializer_list<std::string_view> names) {
  for (auto name : names) {
    auto val = read_header(cx, fetch_event, name);
    if (!val.empty()) return val;
  }
  return "";
}

// Define a read-only string data property on `obj`.
bool define_str(JSContext *cx, JS::HandleObject obj, const char *name,
                std::string_view value) {
  JS::RootedString js_str(cx, JS_NewStringCopyN(cx, value.data(), value.length()));
  if (!js_str) return false;
  JS::RootedValue val(cx, JS::StringValue(js_str));
  return JS_DefineProperty(cx, obj, name, val,
                           JSPROP_READONLY | JSPROP_PERMANENT | JSPROP_ENUMERATE);
}

// Define a `number | null` data property on `obj`.
// Empty / non-finite / unparseable input → null. Otherwise the parsed double.
bool define_decimal_or_null(JSContext *cx, JS::HandleObject obj, const char *name,
                            std::string_view raw) {
  JS::RootedValue val(cx);
  if (raw.empty()) {
    val.setNull();
  } else {
    char *end = nullptr;
    std::string buf(raw);  // strtod needs NUL-terminated input
    double n = std::strtod(buf.c_str(), &end);
    if (end == buf.c_str() || !std::isfinite(n)) {
      val.setNull();
    } else {
      val.setNumber(n);
    }
  }
  return JS_DefineProperty(cx, obj, name, val,
                           JSPROP_READONLY | JSPROP_PERMANENT | JSPROP_ENUMERATE);
}

// Replace this lazy getter with a data property holding `value` on `instance`.
// Subsequent accesses on this instance hit the data property without
// dispatching through the prototype getter.
bool cache_on_instance(JSContext *cx, JS::HandleObject instance,
                       const char *name, JS::HandleValue value) {
  return JS_DefineProperty(cx, instance, name, value,
                           JSPROP_READONLY | JSPROP_PERMANENT | JSPROP_ENUMERATE);
}

// `event.client` getter — installed on FetchEvent.prototype.
bool fetch_event_client_get(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  if (!args.thisv().isObject()) {
    JS_ReportErrorUTF8(cx, "client: receiver must be a FetchEvent");
    return false;
  }
  JS::RootedObject self(cx, &args.thisv().toObject());
  JS::RootedObject info(cx, ClientInfo::create(cx, self));
  if (!info) return false;
  JS::RootedValue value(cx, JS::ObjectValue(*info));
  if (!cache_on_instance(cx, self, "client", value)) return false;
  args.rval().set(value);
  return true;
}

// `event.server` getter — installed on FetchEvent.prototype.
bool fetch_event_server_get(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  if (!args.thisv().isObject()) {
    JS_ReportErrorUTF8(cx, "server: receiver must be a FetchEvent");
    return false;
  }
  JS::RootedObject self(cx, &args.thisv().toObject());
  JS::RootedObject info(cx, ServerInfo::create(cx, self));
  if (!info) return false;
  JS::RootedValue value(cx, JS::ObjectValue(*info));
  if (!cache_on_instance(cx, self, "server", value)) return false;
  args.rval().set(value);
  return true;
}

// `clientInfo.geo` getter — installed on ClientInfo.prototype.
bool client_info_geo_get(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  if (!ClientInfo::check_receiver(cx, args.thisv(), "geo")) return false;
  JS::RootedObject self(cx, &args.thisv().toObject());

  JS::Value fe_val = JS::GetReservedSlot(
      self, static_cast<uint32_t>(ClientInfo::Slots::FetchEvent));
  if (!fe_val.isObject()) {
    JS_ReportErrorUTF8(cx, "ClientInfo.geo: missing FetchEvent reference");
    return false;
  }
  JS::RootedObject fe(cx, &fe_val.toObject());
  JS::RootedObject geo(cx, GeoInfo::create(cx, fe));
  if (!geo) return false;
  JS::RootedValue value(cx, JS::ObjectValue(*geo));
  if (!cache_on_instance(cx, self, "geo", value)) return false;
  args.rval().set(value);
  return true;
}

// `serverInfo.pop` getter — installed on ServerInfo.prototype.
bool server_info_pop_get(JSContext *cx, unsigned argc, JS::Value *vp) {
  JS::CallArgs args = JS::CallArgsFromVp(argc, vp);
  if (!ServerInfo::check_receiver(cx, args.thisv(), "pop")) return false;
  JS::RootedObject self(cx, &args.thisv().toObject());

  JS::Value fe_val = JS::GetReservedSlot(
      self, static_cast<uint32_t>(ServerInfo::Slots::FetchEvent));
  if (!fe_val.isObject()) {
    JS_ReportErrorUTF8(cx, "ServerInfo.pop: missing FetchEvent reference");
    return false;
  }
  JS::RootedObject fe(cx, &fe_val.toObject());
  JS::RootedObject pop(cx, PopInfo::create(cx, fe));
  if (!pop) return false;
  JS::RootedValue value(cx, JS::ObjectValue(*pop));
  if (!cache_on_instance(cx, self, "pop", value)) return false;
  args.rval().set(value);
  return true;
}

}  // namespace

// === ClientInfo ===

const JSFunctionSpec ClientInfo::methods[] = {JS_FS_END};
const JSPropertySpec ClientInfo::properties[] = {
    JS_PSG("geo", client_info_geo_get, JSPROP_ENUMERATE),
    JS_PS_END,
};
const JSFunctionSpec ClientInfo::static_methods[] = {JS_FS_END};
const JSPropertySpec ClientInfo::static_properties[] = {JS_PS_END};

JSObject *ClientInfo::create(JSContext *cx, JS::HandleObject fetch_event) {
  JS::RootedObject self(cx, JS_NewObjectWithGivenProto(cx, &class_, proto_obj));
  if (!self) return nullptr;

  // Back-ref to FetchEvent so the lazy `geo` getter can read headers later.
  JS::SetReservedSlot(self, static_cast<uint32_t>(Slots::FetchEvent),
                      JS::ObjectValue(*fetch_event));

  // Direct fields — eager. Fallback chain on address: x-real-ip is the
  // trusted edge-set value; x-forwarded-for is the fallback if the platform
  // ever stops setting x-real-ip on a given path.
  std::string address =
      read_header_fallback(cx, fetch_event, {"x-real-ip", "x-forwarded-for"});
  if (!define_str(cx, self, "address", address)) return nullptr;
  if (!define_str(cx, self, "tlsJA3MD5", read_header(cx, fetch_event, "x-ja3"))) {
    return nullptr;
  }
  if (!define_str(cx, self, "protocol",
                  read_header(cx, fetch_event, "x-forwarded-proto"))) {
    return nullptr;
  }

  return self;
}

// === GeoInfo ===

const JSFunctionSpec GeoInfo::methods[] = {JS_FS_END};
const JSPropertySpec GeoInfo::properties[] = {JS_PS_END};
const JSFunctionSpec GeoInfo::static_methods[] = {JS_FS_END};
const JSPropertySpec GeoInfo::static_properties[] = {JS_PS_END};

JSObject *GeoInfo::create(JSContext *cx, JS::HandleObject fetch_event) {
  JS::RootedObject self(cx, JS_NewObjectWithGivenProto(cx, &class_, proto_obj));
  if (!self) return nullptr;

  if (!define_str(cx, self, "asn", read_header(cx, fetch_event, "geoip-asn"))) {
    return nullptr;
  }
  if (!define_decimal_or_null(cx, self, "latitude",
                              read_header(cx, fetch_event, "geoip-lat"))) {
    return nullptr;
  }
  if (!define_decimal_or_null(cx, self, "longitude",
                              read_header(cx, fetch_event, "geoip-long"))) {
    return nullptr;
  }
  if (!define_str(cx, self, "region", read_header(cx, fetch_event, "geoip-reg"))) {
    return nullptr;
  }
  if (!define_str(cx, self, "continent",
                  read_header(cx, fetch_event, "geoip-continent"))) {
    return nullptr;
  }
  if (!define_str(cx, self, "countryCode",
                  read_header(cx, fetch_event, "geoip-country-code"))) {
    return nullptr;
  }
  if (!define_str(cx, self, "countryName",
                  read_header(cx, fetch_event, "geoip-country-name"))) {
    return nullptr;
  }
  if (!define_str(cx, self, "city", read_header(cx, fetch_event, "geoip-city"))) {
    return nullptr;
  }

  return self;
}

// === ServerInfo ===

const JSFunctionSpec ServerInfo::methods[] = {JS_FS_END};
const JSPropertySpec ServerInfo::properties[] = {
    JS_PSG("pop", server_info_pop_get, JSPROP_ENUMERATE),
    JS_PS_END,
};
const JSFunctionSpec ServerInfo::static_methods[] = {JS_FS_END};
const JSPropertySpec ServerInfo::static_properties[] = {JS_PS_END};

JSObject *ServerInfo::create(JSContext *cx, JS::HandleObject fetch_event) {
  JS::RootedObject self(cx, JS_NewObjectWithGivenProto(cx, &class_, proto_obj));
  if (!self) return nullptr;

  JS::SetReservedSlot(self, static_cast<uint32_t>(Slots::FetchEvent),
                      JS::ObjectValue(*fetch_event));

  if (!define_str(cx, self, "address",
                  read_header(cx, fetch_event, "server_addr"))) {
    return nullptr;
  }
  if (!define_str(cx, self, "name", read_header(cx, fetch_event, "server_name"))) {
    return nullptr;
  }

  return self;
}

// === PopInfo ===

const JSFunctionSpec PopInfo::methods[] = {JS_FS_END};
const JSPropertySpec PopInfo::properties[] = {JS_PS_END};
const JSFunctionSpec PopInfo::static_methods[] = {JS_FS_END};
const JSPropertySpec PopInfo::static_properties[] = {JS_PS_END};

JSObject *PopInfo::create(JSContext *cx, JS::HandleObject fetch_event) {
  JS::RootedObject self(cx, JS_NewObjectWithGivenProto(cx, &class_, proto_obj));
  if (!self) return nullptr;

  if (!define_decimal_or_null(cx, self, "latitude",
                              read_header(cx, fetch_event, "pop-lat"))) {
    return nullptr;
  }
  if (!define_decimal_or_null(cx, self, "longitude",
                              read_header(cx, fetch_event, "pop-long"))) {
    return nullptr;
  }
  if (!define_str(cx, self, "region", read_header(cx, fetch_event, "pop-reg"))) {
    return nullptr;
  }
  if (!define_str(cx, self, "continent",
                  read_header(cx, fetch_event, "pop-continent"))) {
    return nullptr;
  }
  if (!define_str(cx, self, "countryCode",
                  read_header(cx, fetch_event, "pop-country-code"))) {
    return nullptr;
  }
  if (!define_str(cx, self, "countryName",
                  read_header(cx, fetch_event, "pop-country-name"))) {
    return nullptr;
  }
  if (!define_str(cx, self, "city", read_header(cx, fetch_event, "pop-city"))) {
    return nullptr;
  }

  return self;
}

// === install ===

bool install(api::Engine *engine) {
  JSContext *cx = engine->cx();
  JS::RootedObject global(cx, engine->global());

  // Initialise the four classes. BuiltinNoConstructor::init_class registers
  // the JSClass via JS_InitClass (which creates the prototype) and then
  // removes the class name from globalThis so user code can't `new` them.
  if (!ClientInfo::init_class(cx, global)) return false;
  if (!GeoInfo::init_class(cx, global)) return false;
  if (!ServerInfo::init_class(cx, global)) return false;
  if (!PopInfo::init_class(cx, global)) return false;

  // Patch FetchEvent.prototype with the lazy `client` and `server` getters.
  // FetchEvent itself is a BuiltinNoConstructor, which means its
  // constructor is deleted from globalThis after init_class runs — so we
  // can't reach the prototype via `globalThis.FetchEvent.prototype`.
  // BuiltinImpl exposes the rooted prototype as a static `proto_obj`,
  // which is what we want.
  JS::RootedObject fe_proto(cx, FetchEvent::proto_obj);
  if (!fe_proto) {
    JS_ReportErrorUTF8(cx, "request_info.install: FetchEvent.proto_obj is null");
    return false;
  }

  static const JSPropertySpec fetch_event_extension[] = {
      JS_PSG("client", fetch_event_client_get, JSPROP_ENUMERATE),
      JS_PSG("server", fetch_event_server_get, JSPROP_ENUMERATE),
      JS_PS_END,
  };
  if (!JS_DefineProperties(cx, fe_proto, fetch_event_extension)) return false;

  return true;
}

}  // namespace fastedge::request_info
