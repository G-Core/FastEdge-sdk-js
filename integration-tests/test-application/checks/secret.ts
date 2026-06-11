import type { CheckContext } from '../types.js';
import { SECRET } from '../routes.js';

export const name = SECRET.name;

export async function check(appUrl: string, _ctx: CheckContext): Promise<void> {
  const res = await fetch(`${appUrl}${SECRET.route}`);
  if (res.status !== 200) throw new Error(`${SECRET.route}: bad status ${res.status}`);
  const data = (await res.json()) as { value: string };
  if (data.value !== 'hello-from-fastedge-secret') {
    throw new Error(`${SECRET.route}: wrong value "${data.value}"`);
  }
}
