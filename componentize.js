// src/componentize.js
import { spawnSync as spawnSync2 } from "node:child_process";
import { readFile as readFile2, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { componentNew, preview1AdapterReactorPath } from "@bytecodealliance/jco";
import wizer from "@bytecodealliance/wizer";

// src/get-js-input.js
import { readFile } from "node:fs/promises";

// src/pre-bundle.js
import { build } from "esbuild";
var fastedgePackagePlugin = {
  name: "fastedge-package-plugin",
  setup(build2) {
    build2.onResolve({ filter: /^fastedge::.*/u }, (args) => ({
      path: args.path.replace("fastedge::", ""),
      namespace: "fastedge"
    }));
    build2.onLoad({ filter: /^.*/u, namespace: "fastedge" }, async (args) => {
      switch (args.path) {
        case "getenv": {
          return { contents: `export const getEnv = globalThis.fastedge.getEnv;` };
        }
        default: {
          return { contents: "" };
        }
      }
    });
  }
};
async function preBundle(input) {
  const contents = await build({
    entryPoints: [input],
    bundle: true,
    write: false,
    tsconfig: void 0,
    plugins: [fastedgePackagePlugin]
  });
  return contents.outputFiles[0].text;
}

// src/get-js-input.js
async function getJsInputContents(jsInput, preBundleJSInput) {
  if (preBundleJSInput) {
    return preBundle(jsInput);
  }
  return readFile(jsInput, "utf8");
}

// src/inject-js-builtins.js
import { readFileSync } from "node:fs";
var PREAMBLE = ";{\n// Precompiled JS builtins\n";
var POSTAMBLE = "}\n";
var injectJSBuiltins = (contents) => {
  const internals = readFileSync("./lib/js-builtins.js", "utf8");
  return `${PREAMBLE}${internals}${POSTAMBLE}${contents}`;
};

// src/input-verification.js
import { spawnSync } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import { dirname } from "node:path";
function containsSyntaxErrors(jsInput) {
  const nodeProcess = spawnSync(`"${process.execPath}"`, ["--check", jsInput], {
    stdio: [null, null, null],
    shell: true,
    encoding: "utf-8"
  });
  if (nodeProcess.status === 0) {
    return false;
  }
  console.error(
    `${nodeProcess.stderr.split("\nSyntaxError: Invalid or unexpected token\n")[0]}
SyntaxError: Invalid or unexpected token
`
  );
  return true;
}
async function isFile(path, allowNonexistent = false) {
  try {
    const stats = await stat(path);
    return stats.isFile();
  } catch (error) {
    if (error.code === "ENOENT") {
      return allowNonexistent;
    }
    throw error;
  }
}
async function createOutputDirectory(path) {
  try {
    await mkdir(dirname(path), {
      recursive: true
    });
  } catch (error) {
    console.error(`Error: Failed to create the "output" (${path}) directory`, error.message);
    process.exit(1);
  }
}
async function validateFilePaths(input, output, wasmEngine = "./lib/fastedge-runtime.wasm") {
  if (!await isFile(input)) {
    console.error(`Error: Input "${input}" is not a file`);
    process.exit(1);
  }
  if (output.slice(-5) !== ".wasm") {
    console.error(`Error: Output ${output} must be a .wasm file path`);
    process.exit(1);
  }
  if (!await isFile(output)) {
    createOutputDirectory(output);
    if (!await isFile(
      output,
      /* AllowNonexistent */
      true
    )) {
      console.error(`Error: "${output}" path does not exist`);
      process.exit(1);
    }
  }
  if (!await isFile(wasmEngine)) {
    console.error(`Error: "${wasmEngine}" is not a file`);
    process.exit(1);
  }
  if (containsSyntaxErrors(input)) {
    console.error(`Error: "${input}" contains JS Errors`);
    process.exit(1);
  }
}

// src/precompile.js
import { parse } from "acorn";
import { simple as simpleWalk } from "acorn-walk";
import MagicString from "magic-string";
import regexpuc from "regexpu-core";
var PREAMBLE2 = `;{
  // Precompiled regular expressions
  const precompile = (r) => { r.exec('a'); r.exec('\\u1000'); };`;
var POSTAMBLE2 = "}";
function precompile(source, filename = "<input>") {
  const magicString = new MagicString(source, {
    filename
  });
  const ast = parse(source, {
    ecmaVersion: "latest",
    sourceType: "script"
  });
  const precompileCalls = [];
  simpleWalk(ast, {
    Literal(node) {
      if (!node.regex)
        return;
      let transpiledPattern;
      try {
        transpiledPattern = regexpuc(node.regex.pattern, node.regex.flags, {
          unicodePropertyEscapes: "transform"
        });
      } catch {
        transpiledPattern = node.regex.pattern;
      }
      const transpiledRegex = `/${transpiledPattern}/${node.regex.flags}`;
      precompileCalls.push(`precompile(${transpiledRegex});`);
      magicString.overwrite(node.start, node.end, transpiledRegex);
    }
  });
  if (precompileCalls.length === 0)
    return source;
  magicString.prepend(`${PREAMBLE2}${precompileCalls.join("\n")}${POSTAMBLE2}`);
  return magicString.toString();
}

// src/componentize.js
async function componentize(jsInput, output, opts = {}) {
  const {
    debug = false,
    wasmEngine = fileURLToPath(new URL("./lib/fastedge-runtime.wasm", import.meta.url)),
    enableStdout = false,
    enablePBL = false,
    preBundleJSInput = true
  } = opts;
  const jsPath = fileURLToPath(new URL(jsInput, import.meta.url));
  const wasmOutputDir = fileURLToPath(new URL(output, import.meta.url));
  await validateFilePaths(jsPath, wasmOutputDir, wasmEngine);
  const contents = await getJsInputContents(jsPath, preBundleJSInput);
  const application = precompile(injectJSBuiltins(contents));
  try {
    const wizerProcess = spawnSync2(
      wizer,
      [
        "--inherit-env=true",
        "--allow-wasi",
        `--dir=.`,
        `--wasm-bulk-memory=true`,
        "-r _start=wizer.resume",
        `-o=${output}`,
        wasmEngine
      ],
      {
        stdio: [null, process.stdout, process.stderr],
        input: application,
        shell: true,
        encoding: "utf-8",
        env: {
          // ENABLE_EXPERIMENTAL_HIGH_RESOLUTION_TIME_METHODS:
          //   enableExperimentalHighResolutionTimeMethods ? "1" : "0",
          ENABLE_PBL: enablePBL ? "1" : "0",
          ...process.env
        }
      }
    );
    if (wizerProcess.status !== 0) {
      throw new Error(`Wizer initialization failure`);
    }
    process.exitCode = wizerProcess.status;
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.error("Error: Failed to compile JavaScript to Wasm:", error.message);
    }
    process.exit(1);
  }
  const coreComponent = await readFile2(output);
  const adapter = fileURLToPath(
    new URL("./lib/wasi_snapshot_preview1.reactor.wasm", import.meta.url)
  );
  const generatedComponent = await componentNew(coreComponent, [
    ["wasi_snapshot_preview1", await readFile2(adapter)]
  ]);
  await writeFile(output, generatedComponent);
}
export {
  componentize
};
