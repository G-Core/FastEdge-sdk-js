[← Back to examples](../README.md)

# TLS Client Info

Returns a JSON summary of everything `event.client` exposes about the incoming TLS connection:
the client IP, negotiated protocol, cipher suite, JA3 fingerprint, and the raw client
certificate and ClientHello bytes (reported as byte length plus the first 32 bytes as hex).

Demonstrates the `ClientInfo` surface available on every `FetchEvent`.

## Sample response

```json
{
  "address": "203.0.113.17",
  "tlsProtocol": "TLSv1.3",
  "tlsCipherOpensslName": "TLS_AES_128_GCM_SHA256",
  "tlsJA3MD5": "cd08e31494f9531f560d64c695473da9",
  "tlsClientCertificate": { "byteLength": 0, "firstBytesHex": null },
  "tlsClientHello": { "byteLength": 512, "firstBytesHex": "010001fc0303..." }
}
```

## Notes

- TLS fields are only populated on HTTPS requests. Over plain HTTP, `tlsProtocol` and the rest
  are empty strings and the byte buffers have `byteLength === 0`.
- `tlsClientCertificate` is non-empty only when mTLS is configured and the client presents a
  certificate during the handshake. Parse it as DER with your cert library of choice.
- `tlsJA3MD5` is a client fingerprint derived from the ClientHello (version, ciphers,
  extensions, curves, formats). It's commonly used for bot detection — maintain an allowlist or
  denylist of known-good fingerprints.

## Use-case sketches

- **Bot detection:** Compare `tlsJA3MD5` against a list of known-good browser fingerprints.
- **mTLS authorization:** Require `tlsClientCertificate.byteLength > 0` and validate the
  certificate against a trusted CA before allowing access.
- **Protocol enforcement:** Reject requests where `tlsProtocol` isn't `"TLSv1.3"`.
