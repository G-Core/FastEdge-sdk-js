#include "host_api.h"

#include "bindings/bindings.h"

namespace host_api {

  namespace {

    template <typename T> HostString to_host_string(T str) {
      return {JS::UniqueChars(reinterpret_cast<char *>(str.ptr)), str.len};
    }

    auto bindings_string_to_host_string = to_host_string<bindings_string_t>;

    template <typename T> T from_string_view(std::string_view str) {
      return T{
          .ptr = (uint8_t *)str.data(),
          .len = str.size(),
      };
    }

    auto string_view_to_world_string = from_string_view<bindings_string_t>;
  } // namespace

// Gcore FastEdge API extensions

/*
// Used for debugging and logging bindings_string_t values
// Un-comment the following code to enable debugging
std::ostream& operator<<(std::ostream& os, const bindings_string_t& str) {
  os << "ptr: ";
  for (size_t i = 0; i < str.len; ++i) {
    os << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(str.ptr[i]) << " ";
  }
  os << std::dec << ", len: " << str.len;
  return os;
}
// */

HostString get_env_vars(std::string_view name) {
  auto name_str = string_view_to_world_string(name);
  bindings_string_t value_str{};
  auto has_value = gcore_fastedge_dictionary_get(&name_str, &value_str);
  if (!has_value) {
    return nullptr;
  }
  return bindings_string_to_host_string(value_str);
}

HostString get_secret_vars(std::string_view name) {
  auto key_str = string_view_to_world_string(name);
  bindings_option_string_t ret{};
  gcore_fastedge_secret_error_t err;
  auto has_value = gcore_fastedge_secret_get(&key_str, &ret, &err);
  if (has_value && ret.is_some) {
    return bindings_string_to_host_string(ret.val);
  }
  return nullptr;
}

HostString get_secret_vars_effective_at(std::string_view name, uint32_t effective_at) {
  auto key_str = string_view_to_world_string(name);
  bindings_option_string_t ret{};
  gcore_fastedge_secret_error_t err;
  auto has_value = gcore_fastedge_secret_get_effective_at(&key_str, effective_at, &ret, &err);
  if (has_value && ret.is_some) {
    return bindings_string_to_host_string(ret.val);
  }
  return nullptr;
}


} // namespace host_api
