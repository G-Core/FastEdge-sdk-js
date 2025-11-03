#ifndef FASTEDGE_HOST_API_H
#define FASTEDGE_HOST_API_H

#include "host_api.h"

typedef uint32_t FastEdgeHandle;
struct JSErrorFormatString;

namespace host_api {

// Environment and secrets
HostString get_env_vars(std::string_view name);
HostString get_secret_vars(std::string_view name);
HostString get_secret_vars_effective_at(std::string_view name, uint32_t effective_at);

// KV Store types and enums
enum class KvStoreErrorTag : uint8_t {
    NO_SUCH_STORE = 0,
    ACCESS_DENIED = 1,
    INTERNAL_ERROR = 2,
    OTHER = 3
};

struct KvStoreError {
    KvStoreErrorTag tag;
    union {
        struct {
            char* ptr;
            size_t len;
        } other;
    } val;
};

template<typename T>
class KvStoreResult {
public:
    bool is_ok() const { return ok_; }
    const T& unwrap() const { return value_; }
    const KvStoreError& unwrap_err() const { return error_; }

    static KvStoreResult ok(T value) {
        KvStoreResult result;
        result.ok_ = true;
        result.value_ = std::move(value);
        return result;
    }

    static KvStoreResult err(KvStoreError error) {
        KvStoreResult result;
        result.ok_ = false;
        result.error_ = error;
        return result;
    }

private:
    bool ok_;
    T value_;
    KvStoreError error_;
};

struct KvStoreValue {
    uint8_t* ptr;
    size_t len;
};

template<typename T>
class KvStoreOption {
public:
    bool is_some() const { return has_value_; }
    const T& unwrap() const { return value_; }

    static KvStoreOption some(T value) {
        KvStoreOption option;
        option.has_value_ = true;
        option.value_ = std::move(value);
        return option;
    }

    static KvStoreOption none() {
        KvStoreOption option;
        option.has_value_ = false;
        return option;
    }

private:
    bool has_value_ = false;
    T value_;
};

struct KvStoreList {
    KvStoreValue* ptr;
    size_t len;
};

struct KvStoreTuple {
    KvStoreValue f0;
    double f1;
};

struct KvStoreZList {
    KvStoreTuple* ptr;
    size_t len;
};

struct KvStoreStringList {
    HostString* ptr;
    size_t len;
};

// KV Store functions
KvStoreResult<int32_t> kv_store_open(std::string_view name);
KvStoreResult<KvStoreOption<KvStoreValue>> kv_store_get(int32_t store_handle, std::string_view key);
KvStoreResult<KvStoreStringList> kv_store_scan(int32_t store_handle, std::string_view pattern);
KvStoreResult<KvStoreList> kv_store_zrange(int32_t store_handle, std::string_view key, double min, double max);
KvStoreResult<KvStoreZList> kv_store_zscan(int32_t store_handle, std::string_view key, std::string_view pattern);
KvStoreResult<bool> kv_store_bf_exists(int32_t store_handle, std::string_view key, std::string_view item);

} // namespace host_api

#endif // FASTEDGE_HOST_API_H
