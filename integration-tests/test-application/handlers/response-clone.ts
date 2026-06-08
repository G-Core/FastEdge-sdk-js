// Temporary guard: remove once https://github.com/bytecodealliance/StarlingMonkey/pull/312
// merges upstream and the StarlingMonkey submodule is rebased onto a release containing it.
import { RESPONSE_CLONE } from '../routes.js';

export const route = RESPONSE_CLONE.route;

export async function handler(_req: Request): Promise<Response> {
  const original = new Response('clone-body', {
    status: 201,
    headers: { 'x-test': 'value' },
  });
  const cloned = original.clone();

  const [originalText, clonedText] = await Promise.all([original.text(), cloned.text()]);

  let consumedCloneError: string | null = null;
  try {
    original.clone();
  } catch (e) {
    consumedCloneError = e instanceof TypeError ? 'TypeError' : (e as Error).constructor.name;
  }

  return Response.json({
    originalText,
    clonedText,
    originalStatus: original.status,
    clonedStatus: cloned.status,
    originalHeader: original.headers.get('x-test'),
    clonedHeader: cloned.headers.get('x-test'),
    consumedCloneError,
  });
}
