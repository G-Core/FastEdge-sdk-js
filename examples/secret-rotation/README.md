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
