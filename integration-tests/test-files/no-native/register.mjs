// Preload (`node --import`) for the "no native modules" build test. Makes every
// native load fail, as it would from a node_modules installed by another OS
// (e.g. a macOS-installed project built in the FastEdge MCP server's Linux container).
import { register } from 'node:module';

// Every napi addon (.node file) loads through process.dlopen.
process.dlopen = (_module, filename) => {
  throw new Error(`native addon blocked: ${filename}`);
};

register('./hooks.mjs', import.meta.url);
