import { getEnv } from 'fastedge::env';
import { ENV } from '../routes.js';

export const route = ENV.route;

export async function handler(_req: Request): Promise<Response> {
  const build_sha = getEnv('BUILD_SHA');
  return Response.json({ message: 'app running on production', build_sha: `${build_sha}` });
}
