import { getEnv } from 'fastedge::env';
import { OUTBOUND_FETCH } from '../routes.js';

export const route = OUTBOUND_FETCH.route;

export async function handler(_req: Request): Promise<Response> {
  const targetUrl = getEnv('TEST_FETCH_URL') || 'https://auth.gcore.com/login/assets/config.json';
  const res = await fetch(targetUrl);
  const data = (await res.json()) as { cdnDebugEndpoint?: string };
  return Response.json({ status: res.status, ok: res.ok, cdnDebugEndpoint: data?.cdnDebugEndpoint });
}
