import type { CheckContext } from '../types.js';
import { ECHO } from '../routes.js';

export const name = ECHO.name;

export async function check(appUrl: string, _ctx: CheckContext): Promise<void> {
  const res = await fetch(`${appUrl}${ECHO.route}`, {
    method: 'POST',
    headers: { 'x-test-header': 'hello-fastedge', 'content-type': 'text/plain' },
    body: 'ping',
  });
  if (res.status !== 200) throw new Error(`${ECHO.route}: bad status ${res.status}`);
  const data = (await res.json()) as {
    method: string;
    body: string;
    headers: Record<string, string>;
  };
  if (data.method !== 'POST') throw new Error(`${ECHO.route}: wrong method "${data.method}"`);
  if (data.body !== 'ping') throw new Error(`${ECHO.route}: wrong body "${data.body}"`);
  if (data.headers?.['x-test-header'] !== 'hello-fastedge') {
    throw new Error(`${ECHO.route}: wrong x-test-header "${data.headers?.['x-test-header']}"`);
  }
}
