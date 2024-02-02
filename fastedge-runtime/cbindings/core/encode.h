#ifndef FASTEDGE_RUNTIME_ENCODE_H
#define FASTEDGE_RUNTIME_ENCODE_H

#include "rust-url/rust-url.h"
#include "wit-interface/fastedge-api.h"


namespace core {

fastedge_api::JsStringHandler encode(JSContext *cx, JS::HandleString str);
fastedge_api::JsStringHandler encode(JSContext *cx, JS::HandleValue val);

} // namespace core


#endif
