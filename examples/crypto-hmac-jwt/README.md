
[← Back to examples](../README.md)

# Crypto: HMAC JWT Verification

Verifies incoming `Authorization: Bearer <token>` headers as HS256 JWTs using the Web Crypto
API (`crypto.subtle.importKey` + `crypto.subtle.verify`). On success returns the decoded claims;
on failure returns 401 with a reason.

Demonstrates `fastedge::secret` + the Web Crypto surface exposed by the SDK: HMAC key import,
signature verification, base64url decoding, and simple `exp` claim enforcement.

## Configuration

- Secret `JWT_SECRET` — the shared HMAC secret used to mint and verify tokens.

## Request

```
GET /anything
Authorization: Bearer <hs256-jwt>
```

## Responses

- **200 OK** — token verified. Body: `{ "ok": true, "claims": { ... } }`
- **401 Unauthorized** — missing, malformed, expired, or bad-signature token. Body:
  `{ "ok": false, "error": "..." }`
- **500 Internal Server Error** — `JWT_SECRET` is not configured.

## Testing

Mint a test token with any HS256 library using the same `JWT_SECRET`, then:

```sh
curl -H "Authorization: Bearer $TOKEN" https://<your-app>.fastedge.cdn.gc.onl/
```

## Extending

- Swap HS256 for RS256: import an RSA public key with `{ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }`
  via `importKey`, then call `crypto.subtle.verify('RSASSA-PKCS1-v1_5', ...)`. The SDK exposes
  both algorithms.
- Mint tokens with `crypto.subtle.sign` using the same imported HMAC key (supply
  `['sign', 'verify']` as the usages).
