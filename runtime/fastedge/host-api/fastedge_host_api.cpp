#include "fastedge_host_api.h"

#include "bindings/bindings.h"
#include <cstring>

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

// KV Store implementations

KvStoreResult<int32_t> kv_store_open(std::string_view name) {
  auto name_str = string_view_to_world_string(name);
  gcore_fastedge_key_value_own_store_t store{};
  gcore_fastedge_key_value_error_t err{};

  // Initialize error struct to zero
  memset(&err, 0, sizeof(err));
  memset(&store, 0, sizeof(store));

  printf("Farq:DEBUG About to call gcore_fastedge_key_value_static_store_open for store: %.*s\n",
         (int)name.length(), name.data());

  bool success = gcore_fastedge_key_value_static_store_open(&name_str, &store, &err);

  printf("Farq:DEBUG WIT call returned success=%s, err.tag=%u, store.__handle=%d\n",
         success ? "true" : "false", err.tag, store.__handle);

  if (success) {
    printf("Farq:DEBUG Success! Returning store handle: %d\n", store.__handle);
    return KvStoreResult<int32_t>::ok(store.__handle);
  } else {
    printf("Farq:DEBUG Error! err.tag=%u (expected: NO_SUCH_STORE=0, ACCESS_DENIED=1, INTERNAL=2, OTHER=3)\n", err.tag);
    KvStoreError error;
    error.tag = static_cast<KvStoreErrorTag>(err.tag);
    if (err.tag == GCORE_FASTEDGE_KEY_VALUE_ERROR_OTHER) {
      error.val.other.ptr = (char*)err.val.other.ptr;
      error.val.other.len = err.val.other.len;
    }
    return KvStoreResult<int32_t>::err(error);
  }
}

KvStoreResult<KvStoreOption<KvStoreValue>> kv_store_get(int32_t store_handle, std::string_view key) {
  auto key_str = string_view_to_world_string(key);
  gcore_fastedge_key_value_borrow_store_t store = {store_handle};
  bindings_option_value_t ret{};
  gcore_fastedge_key_value_error_t err{};

  bool success = gcore_fastedge_key_value_method_store_get(store, &key_str, &ret, &err);

  if (success) {
    if (ret.is_some) {
      KvStoreValue value;
      value.ptr = ret.val.ptr;
      value.len = ret.val.len;
      return KvStoreResult<KvStoreOption<KvStoreValue>>::ok(KvStoreOption<KvStoreValue>::some(value));
    } else {
      return KvStoreResult<KvStoreOption<KvStoreValue>>::ok(KvStoreOption<KvStoreValue>::none());
    }
  } else {
    KvStoreError error;
    error.tag = static_cast<KvStoreErrorTag>(err.tag);
    if (err.tag == GCORE_FASTEDGE_KEY_VALUE_ERROR_OTHER) {
      error.val.other.ptr = (char*)err.val.other.ptr;
      error.val.other.len = err.val.other.len;
    }
    return KvStoreResult<KvStoreOption<KvStoreValue>>::err(error);
  }
}

KvStoreResult<KvStoreStringList> kv_store_scan(int32_t store_handle, std::string_view pattern) {
  auto pattern_str = string_view_to_world_string(pattern);
  gcore_fastedge_key_value_borrow_store_t store = {store_handle};
  bindings_list_string_t ret{};
  gcore_fastedge_key_value_error_t err{};

  bool success = gcore_fastedge_key_value_method_store_scan(store, &pattern_str, &ret, &err);

  if (success) {
    KvStoreStringList result;
    result.ptr = reinterpret_cast<HostString*>(ret.ptr);
    result.len = ret.len;
    return KvStoreResult<KvStoreStringList>::ok(result);
  } else {
    KvStoreError error;
    error.tag = static_cast<KvStoreErrorTag>(err.tag);
    if (err.tag == GCORE_FASTEDGE_KEY_VALUE_ERROR_OTHER) {
      error.val.other.ptr = (char*)err.val.other.ptr;
      error.val.other.len = err.val.other.len;
    }
    return KvStoreResult<KvStoreStringList>::err(error);
  }
}

KvStoreResult<KvStoreList> kv_store_zrange(int32_t store_handle, std::string_view key, double min, double max) {
  auto key_str = string_view_to_world_string(key);
  gcore_fastedge_key_value_borrow_store_t store = {store_handle};
  gcore_fastedge_key_value_list_result_t ret{};
  gcore_fastedge_key_value_error_t err{};

  bool success = gcore_fastedge_key_value_method_store_zrange(store, &key_str, min, max, &ret, &err);

  if (success) {
    KvStoreList result;
    result.ptr = reinterpret_cast<KvStoreValue*>(ret.ptr);
    result.len = ret.len;
    return KvStoreResult<KvStoreList>::ok(result);
  } else {
    KvStoreError error;
    error.tag = static_cast<KvStoreErrorTag>(err.tag);
    if (err.tag == GCORE_FASTEDGE_KEY_VALUE_ERROR_OTHER) {
      error.val.other.ptr = (char*)err.val.other.ptr;
      error.val.other.len = err.val.other.len;
    }
    return KvStoreResult<KvStoreList>::err(error);
  }
}

KvStoreResult<KvStoreZList> kv_store_zscan(int32_t store_handle, std::string_view key, std::string_view pattern) {
  auto key_str = string_view_to_world_string(key);
  auto pattern_str = string_view_to_world_string(pattern);
  gcore_fastedge_key_value_borrow_store_t store = {store_handle};
  gcore_fastedge_key_value_zlist_result_t ret{};
  gcore_fastedge_key_value_error_t err{};

  bool success = gcore_fastedge_key_value_method_store_zscan(store, &key_str, &pattern_str, &ret, &err);

  if (success) {
    KvStoreZList result;
    result.ptr = reinterpret_cast<KvStoreTuple*>(ret.ptr);
    result.len = ret.len;
    return KvStoreResult<KvStoreZList>::ok(result);
  } else {
    KvStoreError error;
    error.tag = static_cast<KvStoreErrorTag>(err.tag);
    if (err.tag == GCORE_FASTEDGE_KEY_VALUE_ERROR_OTHER) {
      error.val.other.ptr = (char*)err.val.other.ptr;
      error.val.other.len = err.val.other.len;
    }
    return KvStoreResult<KvStoreZList>::err(error);
  }
}

KvStoreResult<bool> kv_store_bf_exists(int32_t store_handle, std::string_view key, std::string_view item) {
  auto key_str = string_view_to_world_string(key);
  auto item_str = string_view_to_world_string(item);
  gcore_fastedge_key_value_borrow_store_t store = {store_handle};
  bool ret = false;
  gcore_fastedge_key_value_error_t err{};

  bool success = gcore_fastedge_key_value_method_store_bf_exists(store, &key_str, &item_str, &ret, &err);

  if (success) {
    return KvStoreResult<bool>::ok(ret);
  } else {
    KvStoreError error;
    error.tag = static_cast<KvStoreErrorTag>(err.tag);
    if (err.tag == GCORE_FASTEDGE_KEY_VALUE_ERROR_OTHER) {
      error.val.other.ptr = (char*)err.val.other.ptr;
      error.val.other.len = err.val.other.len;
    }
    return KvStoreResult<bool>::err(error);
  }
}


} // namespace host_api
