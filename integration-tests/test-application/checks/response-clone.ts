// Temporary guard: remove once https://github.com/bytecodealliance/StarlingMonkey/pull/312
// merges upstream and the StarlingMonkey submodule is rebased onto a release containing it.
import type { CheckContext } from '../types.js';
import { RESPONSE_CLONE } from '../routes.js';

export const name = RESPONSE_CLONE.name;

export async function check(appUrl: string, _ctx: CheckContext): Promise<void> {
  const res = await fetch(`${appUrl}${RESPONSE_CLONE.route}`);
  if (res.status !== 200) throw new Error(`${RESPONSE_CLONE.route}: bad status ${res.status}`);
  const data = (await res.json()) as {
    originalText: string;
    clonedText: string;
    originalStatus: number;
    clonedStatus: number;
    originalHeader: string | null;
    clonedHeader: string | null;
    consumedCloneError: string | null;
  };
  if (data.originalText !== 'clone-body')
    throw new Error(`${RESPONSE_CLONE.route}: originalText wrong "${data.originalText}"`);
  if (data.clonedText !== 'clone-body')
    throw new Error(`${RESPONSE_CLONE.route}: clonedText wrong "${data.clonedText}"`);
  if (data.originalStatus !== 201)
    throw new Error(`${RESPONSE_CLONE.route}: originalStatus wrong ${data.originalStatus}`);
  if (data.clonedStatus !== 201)
    throw new Error(`${RESPONSE_CLONE.route}: clonedStatus wrong ${data.clonedStatus}`);
  if (data.originalHeader !== 'value')
    throw new Error(`${RESPONSE_CLONE.route}: originalHeader wrong "${data.originalHeader}"`);
  if (data.clonedHeader !== 'value')
    throw new Error(`${RESPONSE_CLONE.route}: clonedHeader wrong "${data.clonedHeader}"`);
  if (data.consumedCloneError !== 'TypeError')
    throw new Error(
      `${RESPONSE_CLONE.route}: expected TypeError on consumed clone, got "${data.consumedCloneError}"`,
    );
}
