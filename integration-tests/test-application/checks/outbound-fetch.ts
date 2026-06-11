import type { CheckContext } from '../types.js';
import { OUTBOUND_FETCH } from '../routes.js';

export const name = OUTBOUND_FETCH.name;

export async function check(appUrl: string, _ctx: CheckContext): Promise<void> {
  const res = await fetch(`${appUrl}${OUTBOUND_FETCH.route}`);
  if (res.status !== 200) throw new Error(`${OUTBOUND_FETCH.route}: bad status ${res.status}`);
  const data = (await res.json()) as { ok: boolean; status: number; cdnDebugEndpoint?: string };
  if (!data.ok) {
    throw new Error(`${OUTBOUND_FETCH.route}: outbound request failed (ok=${data.ok}, status=${data.status})`);
  }
  if (!data.cdnDebugEndpoint?.includes('.well-known')) {
    throw new Error(`${OUTBOUND_FETCH.route}: missing or invalid cdnDebugEndpoint: "${data.cdnDebugEndpoint}"`);
  }
}
