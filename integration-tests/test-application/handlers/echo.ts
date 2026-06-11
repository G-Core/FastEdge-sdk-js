import { ECHO } from '../routes.js';

export const route = ECHO.route;

export async function handler(req: Request): Promise<Response> {
  const body = await req.text();
  return Response.json({
    method: req.method,
    headers: Object.fromEntries(req.headers),
    body,
  });
}
