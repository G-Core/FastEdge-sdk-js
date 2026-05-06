#ifndef FASTEDGE_BUILTINS_REQUEST_INFO_H
#define FASTEDGE_BUILTINS_REQUEST_INFO_H

#include "builtin.h"

namespace fastedge::request_info {

// Lazy `event.client` namespace.
// Direct fields (address, tlsJA3MD5, protocol) are populated as data
// properties when the instance is constructed; the nested `geo` namespace
// is a separate getter on this class's prototype that builds GeoInfo on
// first access and replaces itself with a data property on the instance.
class ClientInfo final : public ::builtins::BuiltinNoConstructor<ClientInfo> {
public:
  static constexpr const char *class_name = "ClientInfo";

  enum class Slots : uint8_t {
    FetchEvent,  // Back-reference; needed by the lazy `geo` getter.
    Count,
  };

  static const JSFunctionSpec methods[];
  static const JSPropertySpec properties[];
  static const JSFunctionSpec static_methods[];
  static const JSPropertySpec static_properties[];

  static JSObject *create(JSContext *cx, JS::HandleObject fetch_event);
};

// Lazy `event.client.geo` namespace.
// All eight geo fields are eagerly populated when the instance is built —
// once a caller has asked for any geo data they typically read several
// fields, so reading the geo headers in one batch is cheaper than
// per-field laziness.
class GeoInfo final : public ::builtins::BuiltinNoConstructor<GeoInfo> {
public:
  static constexpr const char *class_name = "GeoInfo";

  enum class Slots : uint8_t {
    Count,
  };

  static const JSFunctionSpec methods[];
  static const JSPropertySpec properties[];
  static const JSFunctionSpec static_methods[];
  static const JSPropertySpec static_properties[];

  static JSObject *create(JSContext *cx, JS::HandleObject fetch_event);
};

// Lazy `event.server` namespace.
// Direct fields (address, name) populated eagerly; nested `pop` namespace
// is lazy on first access.
class ServerInfo final : public ::builtins::BuiltinNoConstructor<ServerInfo> {
public:
  static constexpr const char *class_name = "ServerInfo";

  enum class Slots : uint8_t {
    FetchEvent,  // Back-reference; needed by the lazy `pop` getter.
    Count,
  };

  static const JSFunctionSpec methods[];
  static const JSPropertySpec properties[];
  static const JSFunctionSpec static_methods[];
  static const JSPropertySpec static_properties[];

  static JSObject *create(JSContext *cx, JS::HandleObject fetch_event);
};

// Lazy `event.server.pop` namespace.
class PopInfo final : public ::builtins::BuiltinNoConstructor<PopInfo> {
public:
  static constexpr const char *class_name = "PopInfo";

  enum class Slots : uint8_t {
    Count,
  };

  static const JSFunctionSpec methods[];
  static const JSPropertySpec properties[];
  static const JSFunctionSpec static_methods[];
  static const JSPropertySpec static_properties[];

  static JSObject *create(JSContext *cx, JS::HandleObject fetch_event);
};

bool install(api::Engine *engine);

}  // namespace fastedge::request_info

#endif
