import { getSecret } from 'fastedge::secret';
import { SECRET } from '../routes.js';

export const route = SECRET.route;

export async function handler(_req: Request): Promise<Response> {
  const value = getSecret('test-secret');
  return Response.json({ value });
}
