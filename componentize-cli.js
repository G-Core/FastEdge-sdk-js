#!/usr/bin/env node

// src/componentize.js
import { spawnSync as spawnSync2 } from "node:child_process";
import { readFile as readFile3, mkdtemp, writeFile as writeFile2 } from "node:fs/promises";
import { tmpdir } from "node:os";
import { rmSync } from "node:fs";
import { dirname as dirname3, resolve as resolve2, sep, normalize } from "node:path";
import { fileURLToPath as fileURLToPath3 } from "node:url";
import { componentNew } from "@bytecodealliance/jco";
import wizer from "@bytecodealliance/wizer";

// src/add-wasm-metadata.js
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { metadataAdd } from "@bytecodealliance/jco";
var __dirname = dirname(fileURLToPath(import.meta.url));
async function addWasmMetadata(wasmPath) {
  const packageJson = await readFile(join(__dirname, "./package.json"), {
    encoding: "utf-8"
  });
  const { name, version } = JSON.parse(packageJson);
  const metadata = [["processed-by", [[name, version]]]];
  const wasm = await readFile(wasmPath);
  const newWasm = await metadataAdd(wasm, metadata);
  await writeFile(wasmPath, newWasm);
}

// src/get-js-input.js
import { readFile as readFile2 } from "node:fs/promises";

// src/pre-bundle.js
import { build } from "esbuild";
var fastedgePackagePlugin = {
  name: "fastedge-package-plugin",
  setup(build2) {
    build2.onResolve({ filter: /^fastedge::.*/u }, (args2) => ({
      path: args2.path.replace("fastedge::", ""),
      namespace: "fastedge"
    }));
    build2.onLoad({ filter: /^.*/u, namespace: "fastedge" }, async (args2) => {
      switch (args2.path) {
        case "getenv": {
          return { contents: `export const getEnv = globalThis.fastedge.getEnv;` };
        }
        case "includebytes": {
          return { contents: `export const includeBytes = globalThis.fastedge.includeBytes;` };
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
  return readFile2(jsInput, "utf8");
}

// src/input-verification.js
import { spawnSync } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import { dirname as dirname2, resolve } from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";
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
    await mkdir(dirname2(path), {
      recursive: true
    });
  } catch (error) {
    console.error(`Error: Failed to create the "output" (${path}) directory`, error.message);
    process.exit(1);
  }
}
var npxPackagePath = (filePath) => {
  const __dirname2 = dirname2(fileURLToPath2(import.meta.url));
  try {
    return resolve(__dirname2, filePath);
  } catch {
    return null;
  }
};
async function validateFilePaths(input, output, wasmEngine = npxPackagePath("./lib/fastedge-runtime.wasm")) {
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
var PREAMBLE = `;{
  // Precompiled regular expressions
  const precompile = (r) => { r.exec('a'); r.exec('\\u1000'); };`;
var POSTAMBLE = "}";
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
  magicString.prepend(`${PREAMBLE}${precompileCalls.join("\n")}${POSTAMBLE}`);
  return magicString.toString();
}

// src/componentize.js
async function getTmpDir() {
  return await mkdtemp(normalize(tmpdir() + sep));
}
async function componentize(jsInput, output, opts = {}) {
  const {
    debug = false,
    wasmEngine = await npxPackagePath("./lib/fastedge-runtime.wasm"),
    enableStdout = false,
    enablePBL = false,
    preBundleJSInput = true
  } = opts;
  const jsPath = fileURLToPath3(new URL(resolve2(process.cwd(), jsInput), import.meta.url));
  console.log("Farq: componentize -> jsPath", jsPath);
  const wasmOutputDir = fileURLToPath3(new URL(resolve2(process.cwd(), output), import.meta.url));
  await validateFilePaths(jsPath, wasmOutputDir, wasmEngine);
  const contents = await getJsInputContents(jsPath, preBundleJSInput);
  const application = precompile(contents);
  let cleanup = () => {
  };
  const tmpDir = await getTmpDir();
  const outPath = resolve2(tmpDir, "input.js");
  await writeFile2(outPath, application);
  const wizerInput = outPath;
  cleanup = () => {
    rmSync(tmpDir, { recursive: true });
  };
  try {
    const wizerProcess = spawnSync2(
      wizer,
      [
        "--allow-wasi",
        `--wasm-bulk-memory=true`,
        "--inherit-env=true",
        // `--dir=${resolve('/')}`,
        "--dir=.",
        `--dir=${dirname3(wizerInput)}`,
        "-r _start=wizer.resume",
        `-o=${wasmOutputDir}`,
        wasmEngine
      ],
      {
        stdio: [null, process.stdout, process.stderr],
        input: wizerInput,
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
  } finally {
    cleanup();
  }
  const coreComponent = await readFile3(output);
  const adapter = fileURLToPath3(new URL("./lib/preview1-adapter.wasm", import.meta.url));
  const generatedComponent = await componentNew(coreComponent, [
    ["wasi_snapshot_preview1", await readFile3(adapter)]
  ]);
  await writeFile2(output, generatedComponent);
  await addWasmMetadata(output);
}

// src/print-info.js
import { readFileSync } from "node:fs";
var USAGE_TEXT = `Usage: componentize [options] <input-file> <output-file>

Options:

  --help, -h      Print this message
  --version, -v   Print the version number
`;
async function printVersion() {
  const { version } = JSON.parse(readFileSync("./package.json", "utf8"));
  console.log(`FastEdge/js-sdk: ${version}`);
}
function printHelp() {
  console.log(USAGE_TEXT);
}

// src/componentize-cli.js
var args = process.argv.slice(2);
var flags = [];
var inputFileName = "";
var outputFileName = "";
if (args.length === 0) {
  printHelp();
  process.exit(1);
}
for (const arg of args) {
  if (arg.startsWith("-")) {
    flags.push(arg);
  } else if (inputFileName === "") {
    inputFileName = arg;
  } else if (outputFileName === "") {
    outputFileName = arg;
  } else {
    console.log(`Unexpected argument ${arg}`);
    process.exit(1);
  }
}
if (flags.includes("--help") || flags.includes("-h")) {
  printHelp();
  process.exit(0);
}
if (flags.includes("--version") || flags.includes("-v")) {
  printVersion();
  if (!inputFileName || !outputFileName) {
    process.exit(0);
  }
}
if (inputFileName && outputFileName) {
  validateFilePaths(inputFileName, outputFileName);
} else {
  printHelp();
  process.exit(1);
}
if (process.env.NODE_ENV !== "test") {
  await componentize(inputFileName, outputFileName);
}
