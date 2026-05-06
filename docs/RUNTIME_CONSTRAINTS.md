<!-- maintenance: hand-authored. Not produced by fastedge-plugin-source/generate-docs.sh. Edit this file directly. -->

# FastEdge JS Runtime — Constraints & Compatibility

This document covers research-derived runtime constraints that affect library compatibility and implementation choices. The actual SDK API surface (available Web APIs, the `crypto.subtle` operation matrix, SDK imports) is documented in the SDK API reference — that doc is auto-generated from `.d.ts` declarations and is the authoritative list of what the runtime exposes.

## Runtime: StarlingMonkey

The FastEdge HTTP App JS SDK (`@gcoredev/fastedge-sdk-js`) runs on
[StarlingMonkey](https://github.com/bytecodealliance/StarlingMonkey) —
a SpiderMonkey-based JS engine targeting the WASI 0.2 Component Model.

It is a **strict WinterCG-style runtime**. It is NOT Node.js and has NO Node.js
compatibility layer (unlike Cloudflare Workers' `nodejs_compat` flag — that
does not exist here). Standard Node built-ins (`node:crypto`, `node:fs`, `node:path`, `node:buffer`, `process`, `require`) are not available, and there is no shim or flag that makes them available. WebSocket and DOM APIs are also absent.

For the full available surface (fetch, streams, crypto.subtle, TextEncoder, SDK imports, etc.), see the SDK API reference.

---

## Why Node.js Crypto Polyfills Don't Work

`esbuild-plugin-polyfill-node` (included in `@gcoredev/fastedge-sdk-js` devDeps)
can substitute `node:crypto` with `crypto-browserify`. However:

1. `crypto-browserify` implements `createSign` / `createVerify` synchronously using
   its own pure-JS RSA — it does **not** delegate to `crypto.subtle`.
2. Even if it did, `crypto.subtle` is async — the sync/async mismatch remains.
3. `crypto-browserify` is disabled by default in the polyfill plugin and requires
   explicit opt-in.
4. **No bundler polyfill can bridge synchronous Node.js crypto calls to async
   Promise-returning Web Crypto.** This is a fundamental impedance mismatch, not
   a configuration problem.

The `crypto.subtle` operations actually exposed by the runtime (HMAC, RSASSA-PKCS1-v1_5, ECDSA sign/verify, digest, raw/JWK/PKCS#8/SPKI importKey) are sufficient for JWT verification, SAML assertion verification, and general signature verification workflows — see the SDK API reference for the exact algorithm matrix. The unavailable operations (`encrypt`, `decrypt`, `generateKey`, `deriveKey`, `deriveBits`, `exportKey`) are the ones that block most Node-style crypto patterns.

---

## SAML on FastEdge

### Why Standard SAML Libraries Don't Work

All mainstream Node.js SAML libraries are incompatible with StarlingMonkey:

| Library | Blocker |
|---|---|
| `samlify` | Depends on `xml-crypto` (sync Node crypto) and `node-rsa` |
| `@node-saml/node-saml` | Deep Node.js `crypto` dependency |
| `@boxyhq/saml20` | `xml-crypto` + `node-forge` |
| `passport-saml` | Node.js `crypto` |

The root cause in all cases is `xml-crypto`, which calls the **synchronous**
Node.js API (`crypto.createVerify()`, `crypto.createSign()`, `crypto.createHash()`).
StarlingMonkey only has the **async** `crypto.subtle` API. No polyfill resolves this.

### Security Note: CVE-2025-29775 (SAMLStorm)

All libraries depending on `xml-crypto < 6.0.1` are affected by SAMLStorm — a
critical authentication bypass via XML comment injection in `DigestValue`. If
implementing custom XML signature verification, strip comments from the
canonicalized element **before** hashing.

### Viable SAML SP Stack

Use WebCrypto-native libraries that have no Node.js dependencies:

| Task | Package | Notes |
|---|---|---|
| XML parsing | `@xmldom/xmldom` | Pure JS, no Node deps |
| XML Digital Signature (XMLDSig) | `xmldsigjs` | Uses `crypto.subtle` natively |
| X.509 cert → CryptoKey | `@peculiar/x509` | Uses Web Crypto internally; documents `node >= 20` but should bundle fine — validate |
| Deflate (SAMLRequest encoding) | Native `CompressionStream("deflate-raw")` or `fflate` | Both work |

**Caveats:**
- `xmldsigjs` is not widely battle-tested in edge/WinterCG environments for SAML
  specifically. There is a known open issue (#81) from a Cloudflare Workers
  developer attempting this. Verify carefully against real IdP responses.
- Bundle size matters: keep the Wasm binary within typical FastEdge limits.
  Check after adding these dependencies.

### XMLDSig Verification Steps (manual reference)

If implementing without `xmldsigjs`:

1. Parse SAMLResponse XML with `@xmldom/xmldom`
2. Locate `<ds:Signature>` inside the `<Assertion>`
3. Extract `<ds:SignedInfo>` — apply **Exclusive C14N** with enveloped-signature
   transform (remove the `<ds:Signature>` element before canonicalizing)
4. `crypto.subtle.digest("SHA-256", c14nBytes)` and compare to `<ds:DigestValue>`
5. `crypto.subtle.verify({ name: "RSASSA-PKCS1-v1_5" }, publicKey, sigBytes, c14nSignedInfoBytes)`

Exclusive C14N is the hardest part to implement from scratch — prefer `xmldsigjs`.

### SAMLRequest Encoding

Use native `CompressionStream("deflate-raw")` — available in StarlingMonkey:

```js
async function deflateRaw(str) {
  const encoded = new TextEncoder().encode(str);
  const cs = new CompressionStream("deflate-raw");
  const writer = cs.writable.getWriter();
  writer.write(encoded);
  writer.close();
  const chunks = [];
  const reader = cs.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return btoa(String.fromCharCode(...out));
}
```

Or use `fflate` (`deflateRawSync`) as a synchronous alternative.
