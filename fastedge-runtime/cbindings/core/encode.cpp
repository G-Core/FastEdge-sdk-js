#include "core/encode.h"

// TODO: remove these once the warnings are fixed
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Winvalid-offsetof"
#include "js/Conversions.h"
#include "rust-url/rust-url.h"
#pragma clang diagnostic pop

namespace core
{
  fastedge_api::JsStringHandler encode(JSContext *cx, JS::HandleString str)
  {
    fastedge_api::JsStringHandler res;
    res.ptr = JS_EncodeStringToUTF8(cx, str);
    if (res.ptr)
    {
      // This shouldn't fail, since the encode operation ensured `str` is linear.
      JSLinearString *linear = JS_EnsureLinearString(cx, str);
      res.len = JS::GetDeflatedUTF8StringLength(linear);
    }

    return res;
  }

  fastedge_api::JsStringHandler encode(JSContext *cx, JS::HandleValue val)
  {
    JS::RootedString str(cx, JS::ToString(cx, val));
    if (!str)
    {
      return fastedge_api::JsStringHandler{};
    }

    return encode(cx, str);
  }

}  // namespace core

