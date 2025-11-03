#include "kv-store.h"
#include <cstdlib>

using fastedge::kv_store::KvStore;

namespace {
api::Engine *ENGINE;
}

namespace fastedge::kv_store {

// JSClassOps for KvStore instances
static const JSClassOps kv_store_class_ops = {
    .finalize = KvStore::finalize,
};

// JSClass definition for KvStore instances
const JSClass KvStore::class_ = {
    "KvStore",
    JSCLASS_HAS_RESERVED_SLOTS(1) | JSCLASS_FOREGROUND_FINALIZE,
    &kv_store_class_ops
};

// Static methods for the KvStore constructor
const JSFunctionSpec KvStore::static_methods[] = {
    JS_FN("open", KvStore::open, 1, JSPROP_ENUMERATE),
    JS_FS_END
};

// Instance methods for KvStore objects
const JSFunctionSpec KvStore::methods[] = {
    JS_FN("get", KvStore::get, 1, JSPROP_ENUMERATE),
    JS_FN("scan", KvStore::scan, 1, JSPROP_ENUMERATE),
    JS_FN("zrange", KvStore::zrange, 3, JSPROP_ENUMERATE),
    JS_FN("zscan", KvStore::zscan, 2, JSPROP_ENUMERATE),
    JS_FN("bfExists", KvStore::bf_exists, 2, JSPROP_ENUMERATE),
    JS_FS_END
};

KvStore* KvStore::get_instance(JSContext *cx, JSObject *obj) {
    return static_cast<KvStore*>(JS::GetReservedSlot(obj, 0).toPrivate());
}

void KvStore::finalize(JS::GCContext *gcx, JSObject *obj) {
    KvStore* store = static_cast<KvStore*>(JS::GetReservedSlot(obj, 0).toPrivate());
    if (store) {
        delete store;
    }
}

bool KvStore::open(JSContext *cx, unsigned argc, JS::Value *vp) {
    JS::CallArgs args = JS::CallArgsFromVp(argc, vp);

    if (!args.requireAtLeast(cx, "KvStore.open", 1)) {
        return false;
    }

    // Convert the store name to string
    JS::RootedString store_name_str(cx, JS::ToString(cx, args[0]));
    if (!store_name_str) {
        return false;
    }

    JS::UniqueChars store_name = JS_EncodeStringToUTF8(cx, store_name_str);
    if (!store_name) {
        return false;
    }

    // Call the host API to open the store
    auto result = host_api::kv_store_open(store_name.get());

    // THROW ERRORS...
    if (!result.is_ok()) {
        // Handle error cases
        auto error = result.unwrap_err();
        printf("Farq:DEBUG Opening ERROR Result: >>> %d\n", error.tag);
        switch (error.tag) {
            case host_api::KvStoreErrorTag::NO_SUCH_STORE:
                JS_ReportErrorUTF8(cx, "No such store: %s", store_name.get());
                break;
            case host_api::KvStoreErrorTag::ACCESS_DENIED:
                JS_ReportErrorUTF8(cx, "Access denied to store: %s", store_name.get());
                break;
            case host_api::KvStoreErrorTag::INTERNAL_ERROR:
                JS_ReportErrorUTF8(cx, "Internal error opening store: %s", store_name.get());
                break;
            case host_api::KvStoreErrorTag::OTHER:
                JS_ReportErrorUTF8(cx, "Error opening store %s: %s", store_name.get(), error.val.other.ptr);
                break;
        }
        return false;
    }

    // Error Object
    // if (!result.is_ok()) {
    //     // Handle error cases
    //     auto error = result.unwrap_err();
    //     printf("Farq:DEBUG Opening ERROR Result: >>> %d\n", error.tag);
    //     JS::RootedObject errorObj(cx, JS_NewPlainObject(cx));
    //     const char* msg = nullptr;
    //     switch (error.tag) {
    //         case host_api::KvStoreErrorTag::NO_SUCH_STORE:
    //             msg = "No such store";
    //             break;
    //         case host_api::KvStoreErrorTag::ACCESS_DENIED:
    //             msg = "Access denied";
    //             break;
    //         case host_api::KvStoreErrorTag::INTERNAL_ERROR:
    //             msg = "Internal error";
    //             break;
    //         case host_api::KvStoreErrorTag::OTHER:
    //             msg = error.val.other.ptr ? error.val.other.ptr : "Unknown error";
    //             break;
    //     }
    //     JS::RootedValue msgVal(cx, JS::StringValue(JS_NewStringCopyZ(cx, msg)));
    //     JS_SetProperty(cx, errorObj, "error", msgVal);
    //     args.rval().setObject(*errorObj);
    //     return true;
    // }

    int32_t store_handle = result.unwrap();

    // Create a new KvStore instance
    JS::RootedObject store_obj(cx, JS_NewObjectWithGivenProto(cx, &KvStore::class_, nullptr));
    if (!store_obj) {
        return false;
    }

    // Create the C++ instance and store it in the JS object
    KvStore* store_instance = new KvStore(store_handle);
    JS::SetReservedSlot(store_obj, 0, JS::PrivateValue(store_instance));

    // Define the instance methods
    if (!JS_DefineFunctions(cx, store_obj, KvStore::methods)) {
        delete store_instance;
        return false;
    }

    args.rval().setObject(*store_obj);
    return true;
}

bool KvStore::get(JSContext *cx, unsigned argc, JS::Value *vp) {
    JS::CallArgs args = JS::CallArgsFromVp(argc, vp);

    if (!args.requireAtLeast(cx, "get", 1)) {
        return false;
    }

    // Get the KvStore instance
    JS::RootedObject this_obj(cx, &args.thisv().toObject());
    KvStore* store = get_instance(cx, this_obj);
    if (!store) {
        JS_ReportErrorUTF8(cx, "Invalid KvStore instance");
        return false;
    }

    // Convert the key to string
    JS::RootedString key_str(cx, JS::ToString(cx, args[0]));
    if (!key_str) {
        return false;
    }

    JS::UniqueChars key = JS_EncodeStringToUTF8(cx, key_str);
    if (!key) {
        return false;
    }

    // Call the host API
    auto result = host_api::kv_store_get(store->store_handle_, key.get());

    if (!result.is_ok()) {
        // Handle error
        JS_ReportErrorUTF8(cx, "Error getting key: %s", key.get());
        return false;
    }

    auto value_option = result.unwrap();
    if (!value_option.is_some()) {
        args.rval().setNull();
        return true;
    }

    auto value = value_option.unwrap();

    // Convert the value (list<u8>) to a Uint8Array
    JS::RootedObject byte_array(cx, JS_NewUint8Array(cx, value.len));
    if (!byte_array) {
        return false;
    }

    {
        JS::AutoCheckCannotGC noGC(cx);
        bool is_shared;
        void *array_buffer = JS_GetArrayBufferViewData(byte_array, &is_shared, noGC);
        memcpy(array_buffer, value.ptr, value.len);
    }

    args.rval().setObject(*byte_array);
    return true;
}

bool KvStore::scan(JSContext *cx, unsigned argc, JS::Value *vp) {
    JS::CallArgs args = JS::CallArgsFromVp(argc, vp);

    if (!args.requireAtLeast(cx, "scan", 1)) {
        return false;
    }

    JS::RootedObject this_obj(cx, &args.thisv().toObject());
    KvStore* store = get_instance(cx, this_obj);
    if (!store) {
        JS_ReportErrorUTF8(cx, "Invalid KvStore instance");
        return false;
    }

    JS::RootedString pattern_str(cx, JS::ToString(cx, args[0]));
    if (!pattern_str) {
        return false;
    }

    JS::UniqueChars pattern = JS_EncodeStringToUTF8(cx, pattern_str);
    if (!pattern) {
        return false;
    }

    auto result = host_api::kv_store_scan(store->store_handle_, pattern.get());

    if (!result.is_ok()) {
        JS_ReportErrorUTF8(cx, "Error scanning with pattern: %s (Only prefix matching is supported. e.g. 'foo*')", pattern.get());
        return false;
    }

    auto keys = result.unwrap();

    // Create a JavaScript array
    JS::RootedObject keys_array(cx, JS::NewArrayObject(cx, keys.len));
    if (!keys_array) {
        return false;
    }

    for (size_t i = 0; i < keys.len; i++) {
        JS::RootedString key_str(cx, JS_NewStringCopyUTF8N(cx,
            JS::UTF8Chars(keys.ptr[i].begin(), keys.ptr[i].size())));
        if (!key_str) {
            return false;
        }

        JS::RootedValue key_val(cx, JS::StringValue(key_str));
        if (!JS_SetElement(cx, keys_array, i, key_val)) {
            return false;
        }
    }

    args.rval().setObject(*keys_array);
    return true;
}

bool KvStore::zrange(JSContext *cx, unsigned argc, JS::Value *vp) {
    JS::CallArgs args = JS::CallArgsFromVp(argc, vp);

    if (!args.requireAtLeast(cx, "zrange", 3)) {
        return false;
    }

    JS::RootedObject this_obj(cx, &args.thisv().toObject());
    KvStore* store = get_instance(cx, this_obj);
    if (!store) {
        JS_ReportErrorUTF8(cx, "Invalid KvStore instance");
        return false;
    }

    // Convert arguments
    JS::RootedString key_str(cx, JS::ToString(cx, args[0]));
    if (!key_str) {
        return false;
    }

    JS::UniqueChars key = JS_EncodeStringToUTF8(cx, key_str);
    if (!key) {
        return false;
    }

    double min, max;
    if (!JS::ToNumber(cx, args[1], &min) || !JS::ToNumber(cx, args[2], &max)) {
        return false;
    }

    auto result = host_api::kv_store_zrange(store->store_handle_, key.get(), min, max);

    if (!result.is_ok()) {
        JS_ReportErrorUTF8(cx, "Error in zrange for key: %s", key.get());
        return false;
    }

    auto values = result.unwrap();

    // Create JavaScript array of Uint8Arrays
    JS::RootedObject values_array(cx, JS::NewArrayObject(cx, values.len));
    if (!values_array) {
        return false;
    }

    for (size_t i = 0; i < values.len; i++) {
        JS::RootedObject byte_array(cx, JS_NewUint8Array(cx, values.ptr[i].len));
        if (!byte_array) {
            return false;
        }

        {
            JS::AutoCheckCannotGC noGC(cx);
            bool is_shared;
            void *array_buffer = JS_GetArrayBufferViewData(byte_array, &is_shared, noGC);
            memcpy(array_buffer, values.ptr[i].ptr, values.ptr[i].len);
        }

        JS::RootedValue value_val(cx, JS::ObjectValue(*byte_array));
        if (!JS_SetElement(cx, values_array, i, value_val)) {
            return false;
        }
    }

    args.rval().setObject(*values_array);
    return true;
}

bool KvStore::zscan(JSContext *cx, unsigned argc, JS::Value *vp) {
    JS::CallArgs args = JS::CallArgsFromVp(argc, vp);

    if (!args.requireAtLeast(cx, "zscan", 2)) {
        return false;
    }

    JS::RootedObject this_obj(cx, &args.thisv().toObject());
    KvStore* store = get_instance(cx, this_obj);
    if (!store) {
        JS_ReportErrorUTF8(cx, "Invalid KvStore instance");
        return false;
    }

    JS::RootedString key_str(cx, JS::ToString(cx, args[0]));
    if (!key_str) {
        return false;
    }

    JS::UniqueChars key = JS_EncodeStringToUTF8(cx, key_str);
    if (!key) {
        return false;
    }

    JS::RootedString pattern_str(cx, JS::ToString(cx, args[1]));
    if (!pattern_str) {
        return false;
    }

    JS::UniqueChars pattern = JS_EncodeStringToUTF8(cx, pattern_str);
    if (!pattern) {
        return false;
    }

    auto result = host_api::kv_store_zscan(store->store_handle_, key.get(), pattern.get());

    if (!result.is_ok()) {
        JS_ReportErrorUTF8(cx, "Error in zscan for key: %s", key.get());
        return false;
    }

    auto tuples = result.unwrap();

    // Create array of [value, score] tuples
    JS::RootedObject tuples_array(cx, JS::NewArrayObject(cx, tuples.len));
    if (!tuples_array) {
        return false;
    }

    for (size_t i = 0; i < tuples.len; i++) {
        // Create the value Uint8Array
        JS::RootedObject byte_array(cx, JS_NewUint8Array(cx, tuples.ptr[i].f0.len));
        if (!byte_array) {
            return false;
        }

        {
            JS::AutoCheckCannotGC noGC(cx);
            bool is_shared;
            void *array_buffer = JS_GetArrayBufferViewData(byte_array, &is_shared, noGC);
            memcpy(array_buffer, tuples.ptr[i].f0.ptr, tuples.ptr[i].f0.len);
        }

        // Create tuple [value, score]
        JS::RootedObject tuple(cx, JS::NewArrayObject(cx, 2));
        if (!tuple) {
            return false;
        }

        JS::RootedValue value_val(cx, JS::ObjectValue(*byte_array));
        JS::RootedValue score_val(cx, JS::DoubleValue(tuples.ptr[i].f1));

        if (!JS_SetElement(cx, tuple, 0, value_val) ||
            !JS_SetElement(cx, tuple, 1, score_val)) {
            return false;
        }

        JS::RootedValue tuple_val(cx, JS::ObjectValue(*tuple));
        if (!JS_SetElement(cx, tuples_array, i, tuple_val)) {
            return false;
        }
    }

    args.rval().setObject(*tuples_array);
    return true;
}

bool KvStore::bf_exists(JSContext *cx, unsigned argc, JS::Value *vp) {
    JS::CallArgs args = JS::CallArgsFromVp(argc, vp);

    if (!args.requireAtLeast(cx, "bfExists", 2)) {
        return false;
    }

    JS::RootedObject this_obj(cx, &args.thisv().toObject());
    KvStore* store = get_instance(cx, this_obj);
    if (!store) {
        JS_ReportErrorUTF8(cx, "Invalid KvStore instance");
        return false;
    }

    JS::RootedString key_str(cx, JS::ToString(cx, args[0]));
    if (!key_str) {
        return false;
    }

    JS::UniqueChars key = JS_EncodeStringToUTF8(cx, key_str);
    if (!key) {
        return false;
    }

    JS::RootedString item_str(cx, JS::ToString(cx, args[1]));
    if (!item_str) {
        return false;
    }

    JS::UniqueChars item = JS_EncodeStringToUTF8(cx, item_str);
    if (!item) {
        return false;
    }

    auto result = host_api::kv_store_bf_exists(store->store_handle_, key.get(), item.get());

    if (!result.is_ok()) {
        JS_ReportErrorUTF8(cx, "Error checking bloom filter for key: %s", key.get());
        return false;
    }

    args.rval().setBoolean(result.unwrap());
    return true;
}

bool install(api::Engine *engine) {
    ENGINE = engine;

    // Create the KvStore constructor function
    JS::RootedObject kv_store_ctor(engine->cx(),
        JS_NewObject(engine->cx(), &KvStore::class_));
    if (!kv_store_ctor) {
        return false;
    }

    // Add static methods to the constructor
    if (!JS_DefineFunctions(engine->cx(), kv_store_ctor, KvStore::static_methods)) {
        return false;
    }

    // Define KvStore on the global object
    if (!JS_DefineProperty(engine->cx(), engine->global(), "KvStore", kv_store_ctor, 0)) {
        return false;
    }

    return true;
}

} // namespace fastedge::kv_store
