import { readFileSync } from 'node:fs';

const PREAMBLE = ';{\n// Precompiled JS builtins\n';
const POSTAMBLE = '}\n';

const injectJSBuiltins = (contents) => {
  const internals = readFileSync('./lib/js-builtins.js', 'utf8');
  return `${PREAMBLE}${internals}${POSTAMBLE}${contents}`;
};

export { injectJSBuiltins };
