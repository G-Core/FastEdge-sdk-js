import type { CheckContext } from '../types.js';
import { ENV } from '../routes.js';

export const name = ENV.name;

export async function check(appUrl: string, ctx: CheckContext): Promise<void> {
  const res = await fetch(`${appUrl}${ENV.route}`);
  if (res.status !== 200) throw new Error(`${ENV.route}: bad status ${res.status}`);
  const data = (await res.json()) as { build_sha: string };
  if (data.build_sha !== ctx.buildSha) {
    throw new Error(`${ENV.route}: build_sha mismatch: expected ${ctx.buildSha}, got ${data.build_sha}`);
  }
}
