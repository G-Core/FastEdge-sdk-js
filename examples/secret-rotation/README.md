[← Back to examples](../README.md)

# Secret Rotation

Demonstrates slot-based secret retrieval using `getSecretEffectiveAt()` from `fastedge::secret` for
rotation scenarios. Returns the current secret value alongside the value effective at a caller-
supplied slot, plus a boolean indicating whether they match.

## Usage

Request headers:

- `x-secret-name` — secret name to look up (defaults to `TOKEN_SECRET`)
- `x-slot` — slot value to query (defaults to the current unix timestamp)

## How slots work

Slots use a **greatest-matching** rule: the slot with the highest value that is `<=` the requested
`effectiveAt` is returned. This supports both index-based and timestamp-based rotation patterns.

Example secret configuration:

```json
{
  "secret": {
    "name": "TOKEN_SECRET",
    "secret_slots": [
      { "slot": 0, "value": "original_password" },
      { "slot": 1741790697, "value": "new_password" }
    ]
  }
}
```

**Index-based rotation:**

- `getSecretEffectiveAt('TOKEN_SECRET', 0)` → `"original_password"`
- `getSecretEffectiveAt('TOKEN_SECRET', 3)` → `"original_password"` (slot 0 is the highest `<= 3`)
- `getSecretEffectiveAt('TOKEN_SECRET', 1741790697)` → `"new_password"`

**Timestamp-based rotation:**

A token's `iat` (issued-at) claim determines which password to validate against.
`getSecretEffectiveAt('TOKEN_SECRET', iat)` returns the password that was effective when the token
was issued.

## APIs used

- `getSecret(name)` from `fastedge::secret` — reads the current (highest-slot) value of a named secret
- `getSecretEffectiveAt(name, slot)` from `fastedge::secret` — reads the secret value whose slot number is the highest value ≤ the given slot

## Configuring secrets with slots

In the Gcore portal, secrets support multiple versioned slots. Each slot has a numeric value and a
secret value. The example expects a secret named `TOKEN_SECRET` (configurable via `x-secret-name`):

```json
{
  "secret_slots": [
    { "slot": 0,          "value": "original_password" },
    { "slot": 1741790697, "value": "new_password"       }
  ]
}
```

Slots are a platform concept — you define them when creating or updating a secret in the portal or
via the Gcore API. The slot value can be any non-negative integer; unix timestamps work naturally
for time-based rotation.

## Build

```sh
npm run build
```

Output: `dist/secret-rotation.wasm`

## Testing

```sh
# Default: current unix timestamp as slot, secret name TOKEN_SECRET
curl https://<your-app>.fastedge.app/

# Query a specific slot by index
curl -H "x-slot: 0" https://<your-app>.fastedge.app/

# Query a different secret at a specific slot
curl -H "x-secret-name: SIGNING_KEY" -H "x-slot: 1741790697" https://<your-app>.fastedge.app/

# Invalid slot value → 400
curl -H "x-slot: -1" https://<your-app>.fastedge.app/
```

Example response:

```json
{
  "secret_name": "TOKEN_SECRET",
  "slot": 0,
  "current": "new_password",
  "effective_at_slot": "original_password",
  "is_same": false
}
```

`is_same: true` means the secret has not been rotated since the queried slot — the current value and
the historical value are the same.
