---
title: getSecretEffectiveAt
description: How to use FastEdge secret variables.
---

### Secret Variables

To access secret variables, set during deployment on the FastEdge network.

```js
import { getSecretEffectiveAt } from 'fastedge::secret';

async function eventHandler(event) {
  const secretToken = getSecretEffectiveAt('MY_SECRET_TOKEN', 1);
  return new Response({ secretToken });
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});
```

```js title="SYNTAX"
getSecretEffectiveAt(secretName, 0);
```

##### Parameters

- `secretName` (required)

  A string containing the name of the key you want to retrieve the value of.

- `effectiveAt` (required)

  A number representing the slot you wish to access.

##### Return Value

A string containing the value of the key. If the key does not exist, null is returned.

### Slots and secret rollover

Using `getSecretEffectiveAt()` to access different slots within a given secret and how to use slots.

The concept of slots allows you to manage secret rollover within your own applications in many
different ways.

##### Example 1 (Slots as indices)

Validating a token against a specific version of a secret.

Having created a secret:

```json
{
  "secret": {
    "comment": "The password to validate the token has been signed with",
    "id": 168,
    "name": "token-secret",
    "secret_slots": [
      {
        "slot": 0,
        "value": "original_password"
      },
      {
        "slot": 5,
        "value": "updated_password"
      }
    ]
  }
}
```

It would now be easy enough to provide the `slot` value within the tokens claims as to which
password it should validate against. This would allow you to slowly roll-over from one password to
another and keep all users able to refresh their tokens without issues. As each users token would
carry the data to know which password was still in use when it was issued.

It always returns `effectiveAt >= secret_slots.slot`

So a request to:

- `getSecretEffectiveAt("token-secret", 3)` would return `original_password`
- `getSecretEffectiveAt("token-secret", 5)` would return `updated_password`

This `>=` logic makes it very easy to implement the following example.

##### Example 2 (Slots as timestamps)

Validating a token against a specific version of a secret using timestamps:

```json
{
  "secret": {
    "comment": "The password to validate the token has been signed with",
    "id": 168,
    "name": "token-secret",
    "secret_slots": [
      {
        "slot": 0,
        "value": "original_password"
      },
      {
        "slot": 1741790697, // Wed Mar 12 2025 14:44:57
        "value": "new_password"
      }
    ]
  }
}
```

As you can see any token being validated with an `iat` claim time before 1741790697 would use the
`original_password` and any token after this time would start to use the `new_password`

This is as simple as using `getSecretEffectiveAt("token-secret", claims.iat)`
