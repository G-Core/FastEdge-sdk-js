import { getSecret } from 'fastedge::secret';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64urlToBytes(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (str.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function verifyJwtHs256(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('malformed token: expected three segments');
  }
  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const signature = base64urlToBytes(encodedSignature);
  const signedData = encoder.encode(`${encodedHeader}.${encodedPayload}`);

  const valid = await crypto.subtle.verify('HMAC', key, signature, signedData);
  if (!valid) {
    throw new Error('invalid signature');
  }

  const claims = JSON.parse(decoder.decode(base64urlToBytes(encodedPayload)));

  if (typeof claims.exp === 'number' && Math.floor(Date.now() / 1000) >= claims.exp) {
    throw new Error('token expired');
  }

  return claims;
}

async function app(event) {
  const auth = event.request.headers.get('authorization') ?? '';
  const match = auth.match(/^Bearer\s+(.+)$/iu);
  if (!match) {
    return Response.json(
      { ok: false, error: 'missing or malformed Authorization header' },
      { status: 401 },
    );
  }

  const secret = getSecret('JWT_SECRET');
  if (!secret) {
    return Response.json({ ok: false, error: 'JWT_SECRET is not configured' }, { status: 500 });
  }

  try {
    const claims = await verifyJwtHs256(match[1], secret);
    return Response.json({ ok: true, claims });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 401 });
  }
}

addEventListener('fetch', (event) => {
  event.respondWith(app(event));
});
