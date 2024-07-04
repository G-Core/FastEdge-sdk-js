/*
  This source code is licensed under the Apache License 2.0.
  It comes from here: https://github.com/fastly/js-compute-runtime
  There are no modifications made to this source code.
*/

import { parse } from 'acorn';
import { simple as simpleWalk } from 'acorn-walk';
import MagicString from 'magic-string';
import regexpuc from 'regexpu-core';

const PREAMBLE = `;{
  // Precompiled regular expressions
  const precompile = (r) => { r.exec('a'); r.exec('\\u1000'); };`;
const POSTAMBLE = '}';

/// Emit a block of javascript that will pre-compile the regular expressions given. As spidermonkey
/// will intern regular expressions, duplicating them at the top level and testing them with both
/// an ascii and utf8 string should ensure that they won't be re-compiled when run in the fetch
/// handler.
export function precompile(source, filename = '<input>') {
  const magicString = new MagicString(source, {
    filename,
  });

  const ast = parse(source, {
    ecmaVersion: 'latest',
    sourceType: 'script',
  });

  const precompileCalls = [];
  simpleWalk(ast, {
    Literal(node) {
      if (!node.regex) return;
      let transpiledPattern;
      try {
        transpiledPattern = regexpuc(node.regex.pattern, node.regex.flags, {
          unicodePropertyEscapes: 'transform',
        });
      } catch {
        // Swallow regex parse errors here to instead throw them at the engine level
        // this then also avoids regex parser bugs being thrown unnecessarily
        transpiledPattern = node.regex.pattern;
      }
      const transpiledRegex = `/${transpiledPattern}/${node.regex.flags}`;
      precompileCalls.push(`precompile(${transpiledRegex});`);
      magicString.overwrite(node.start, node.end, transpiledRegex);
    },
  });

  if (precompileCalls.length === 0) return source;

  magicString.prepend(`${PREAMBLE}${precompileCalls.join('\n')}${POSTAMBLE}`);

  // When we're ready to pipe in source maps:
  // const map = magicString.generateMap({
  //   source: 'source.js',
  //   file: 'converted.js.map',
  //   includeContent: true
  // });

  return magicString.toString();
}
