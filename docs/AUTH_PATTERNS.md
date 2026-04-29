<!-- maintenance: hand-authored. Not produced by fastedge-plugin-source/generate-docs.sh. Edit this file directly. -->

# Authentication Patterns

Authentication on FastEdge typically combines `getSecret` (for signing keys and shared secrets) with `crypto.subtle` (for HMAC and signature verification). This document covers Bearer-token validation and HMAC-SHA256 JWT verification — the two most common patterns.

## Secrets Setup

Auth credentials must never be hardcoded. Store them as FastEdge secrets and read at request time via `getSecret`:

```typescript
import { getSecret } from "fastedge::secret";

const token = getSecret("API_TOKEN");      // string | null
if (token === null) {
  return new Response("Server misconfigured", { status: 500 });
}
```

`getSecret` returns `null` when the secret is not provisioned. Always handle the null case before using the value.

## Bearer Token Pattern

Extract a Bearer token from the `Authorization` header and compare against a configured shared secret:

```typescript
import { getSecret } from "fastedge::secret";

addEventListener("fetch", (event) => {
  event.respondWith(handle(event.request));
});

async function handle(request) {
  const authHeader = request.headers.get("Authorization") ?? "";
  const match = authHeader.match(/^Bearer\s+(.+)$/iu);
  if (!match) {
    return Response.json(
      { error: "missing or malformed Authorization header" },
      { status: 401 },
    );
  }

  const expected = getSecret("API_TOKEN");
  if (expected === null) {
    return Response.json({ error: "server misconfigured" }, { status: 500 });
  }

  if (match[1] !== expected) {
    return Response.json({ error: "invalid token" }, { status: 403 });
  }

  return Response.json({ ok: true });
}
```

For Hono apps, this pattern is wrapped as middleware:

```typescript
import { Hono } from "hono";
import { getSecret } from "fastedge::secret";

const app = new Hono();

app.use("/api/*", async (c, next) => {
  const auth = c.req.header("Authorization") ?? "";
  const match = auth.match(/^Bearer\s+(.+)$/iu);
  if (!match) return c.json({ error: "missing bearer token" }, 401);

  const expected = getSecret("API_TOKEN");
  if (expected === null) return c.json({ error: "server misconfigured" }, 500);
  if (match[1] !== expected) return c.json({ error: "invalid token" }, 403);

  await next();
});
```

## HMAC-SHA256 JWT Verification

For signed tokens, use `crypto.subtle` to verify the HMAC. The signing secret is loaded via `getSecret`. This is the pattern from `examples/crypto-hmac-jwt/`:

```typescript
import { getSecret } from "fastedge::secret";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64urlToBytes(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/")
    + "=".repeat((4 - (str.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function verifyJwtHs256(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("malformed token");
  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const signature = base64urlToBytes(encodedSignature);
  const signedData = encoder.encode(`${encodedHeader}.${encodedPayload}`);
  const valid = await crypto.subtle.verify("HMAC", key, signature, signedData);
  if (!valid) throw new Error("invalid signature");

  const claims = JSON.parse(decoder.decode(base64urlToBytes(encodedPayload)));
  if (typeof claims.exp === "number" && Math.floor(Date.now() / 1000) >= claims.exp) {
    throw new Error("token expired");
  }
  return claims;
}
```

Use it inside a request handler:

```typescript
async function handle(request) {
  const auth = request.headers.get("Authorization") ?? "";
  const match = auth.match(/^Bearer\s+(.+)$/iu);
  if (!match) {
    return Response.json({ ok: false, error: "missing bearer" }, { status: 401 });
  }

  const secret = getSecret("JWT_SECRET");
  if (!secret) {
    return Response.json({ ok: false, error: "JWT_SECRET not configured" }, { status: 500 });
  }

  try {
    const claims = await verifyJwtHs256(match[1], secret);
    return Response.json({ ok: true, claims });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 401 });
  }
}
```

## Crypto Capabilities

The FastEdge JS runtime supports a subset of `crypto.subtle`:

| Operation | Algorithms supported |
|---|---|
| `digest` | SHA-1, SHA-256, SHA-384, SHA-512, MD5 |
| `sign` / `verify` | RSASSA-PKCS1-v1_5, ECDSA, HMAC |
| `importKey` | JWK, PKCS#8, SPKI, raw (HMAC) |

`encrypt`, `decrypt`, `generateKey`, `deriveKey`, `deriveBits`, and `exportKey` are not implemented. For details on runtime constraints and SAML library compatibility, see the runtime constraints reference.

## Operational Notes

- **Never log secret values.** `console.log` output is captured in app logs.
- **Treat `getSecret` as request-time only.** It is not available during module initialization — call it inside the request handler.
- **Always check for `null`.** A misconfigured app should return 500, not crash with a 531 runtime error.
- **Rotate secrets via the API or portal**, not by redeploying the binary.

## See Also

- `examples/crypto-hmac-jwt/` — complete HMAC JWT verification example with fixtures
- `examples/secret-rotation/` — `getSecretEffectiveAt` slot-based rotation patterns
