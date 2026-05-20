import { getSecret, getSecretEffectiveAt } from 'fastedge::secret';

function app(event) {
  const { request } = event;

  // Read the slot from the x-slot header, defaulting to the current unix timestamp.
  // Slots can be interpreted either as indices (0, 1, 2...) or as unix timestamps;
  // the host returns the value from the highest slot <= this number.
  const slotHeader = request.headers.get('x-slot');
  const slot =
    slotHeader !== null ? Number.parseInt(slotHeader, 10) : Math.floor(Date.now() / 1000);

  if (!Number.isFinite(slot) || slot < 0) {
    return new Response('x-slot header must be a non-negative integer', { status: 400 });
  }

  const secretName = request.headers.get('x-secret-name') ?? 'TOKEN_SECRET';

  const current = getSecret(secretName);
  const effective = getSecretEffectiveAt(secretName, slot);

  const body = JSON.stringify({
    secret_name: secretName,
    slot,
    current,
    effective_at_slot: effective,
    is_same: current === effective,
  });

  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

addEventListener('fetch', (event) => {
  event.respondWith(app(event));
});
