import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PREAMBLE = ';{\n// Precompiled JS builtins\n';
const POSTAMBLE = '}\n';

const injectJSBuiltins = (contents) => {
  const jsBuiltinsPath = fileURLToPath(new URL('./lib/js-builtins.js', import.meta.url));
  const internals = readFileSync(jsBuiltinsPath, 'utf8');
  return `${PREAMBLE}${internals}${POSTAMBLE}${contents}`;
};

export { injectJSBuiltins };
