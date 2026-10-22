// Writes stub components (dummy bodies, real types) for the component-imports tests:
//   node make-components.mjs <out-dir>
// greet.wasm exports acme:greet/hello; needs-host.wasm also imports acme:other/thing,
// which FastEdge does not provide; shapes.wasm exports acme:shapes/api, which uses types from
// acme:shapes/types (also exported).
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { componentEmbed, componentNew } from '@bytecodealliance/jco-transpile/wasm-tools';

const wit = `
package acme:greet;
interface hello { greet: func(name: string) -> string; }
world greet { export hello; }
world needs-host { import acme:other/thing; export hello; }

package acme:other { interface thing { ping: func() -> u32; } }

package acme:shapes {
  interface types { record point { x: u32, y: u32 } }
  interface api { use types.{point}; origin: func() -> point; }
  world shapes { export types; export api; }
}
`;

const outDir = process.argv[2];
for (const [file, world] of [
  ['greet.wasm', 'greet'],
  ['needs-host.wasm', 'needs-host'],
  ['shapes.wasm', 'acme:shapes/shapes'],
]) {
  const core = await componentEmbed({ dummy: true, witSource: wit, world });
  await writeFile(join(outDir, file), await componentNew(core));
}
