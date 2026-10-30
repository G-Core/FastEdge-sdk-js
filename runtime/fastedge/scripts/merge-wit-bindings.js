#!/usr/bin/env node
/* eslint-disable no-console */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Only 0.2.3: the async gcore:db interfaces use wasi:io/poll@0.2.3, deduplicated below against
// StarlingMonkey's own wasi:io, which must be the same version.
const HOST_VERSIONS = ['0.2.3'];
const dirname = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../');
const witDir = path.join(dirname, 'host-api/wit');
const starlingHostApisDir = path.resolve(dirname, '../StarlingMonkey/host-apis');
const fastedgeWitDir = path.resolve(dirname, '../FastEdge-wit');
// http* interfaces are Rust-specific (we use wasi-http).
const fastedgeDepsToRemove = ['http-client', 'http-handler', 'http'];
// FastEdge-wit deps already provided by StarlingMonkey's host-apis (wasi-io-<version>).
const fastedgeNestedDepsProvided = ['io'];

function clearExistingWitFiles() {
  // Remove all files from the ./wit directory
  if (fs.existsSync(witDir)) {
    fs.rmSync(witDir, { recursive: true, force: true });
  }
  fs.mkdirSync(witDir, { recursive: true });
}

function copyFilesRecursively(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir) || !fs.existsSync(targetDir)) {
    return;
  }
  for (const file of fs.readdirSync(sourceDir)) {
    const sourceFilePath = path.join(sourceDir, file);
    const targetFilePath = path.join(targetDir, file);
    if (fs.lstatSync(sourceFilePath).isDirectory()) {
      fs.mkdirSync(targetFilePath, { recursive: true });
      copyFilesRecursively(sourceFilePath, targetFilePath);
    } else {
      fs.copyFileSync(sourceFilePath, targetFilePath);
    }
  }
}

function copyWitFilesFromHostApi(wasiHostVersion) {
  // Copy files from host-apis/wasi-<version>/wit to ./wit
  const hostApiWitDir = path.join(starlingHostApisDir, `wasi-${wasiHostVersion}`, 'wit');
  copyFilesRecursively(hostApiWitDir, witDir);
}

function removeFastEdgeDepsWeDontUse(fastedgeDepsDir) {
  const fastedgeWorldWitFile = path.join(fastedgeDepsDir, 'world.wit');
  const fastedgeWorldWitContent = fs.readFileSync(fastedgeWorldWitFile, 'utf-8');

  let worldWitContentLines = fastedgeWorldWitContent.split('\n');

  for (const dep of fastedgeDepsToRemove) {
    // Remove the file for the given dependency.
    fs.unlinkSync(path.join(fastedgeDepsDir, `${dep}.wit`));
    //Remove its import/export inclusion in the world.
    worldWitContentLines = worldWitContentLines.filter((line) => {
      return !line.includes(` ${dep};`);
    });
  }
  fs.writeFileSync(fastedgeWorldWitFile, worldWitContentLines.join('\n'), 'utf-8');
}

function mergeFastEdgeWitFiles() {
  // Copy files from FastEdge-wit submodule to deps/fastedge
  const fastedgeDepsDir = path.join(witDir, 'deps/fastedge');
  fs.mkdirSync(fastedgeDepsDir, { recursive: true });
  copyFilesRecursively(fastedgeWitDir, fastedgeDepsDir);
  // FastEdge-wit's own deps (e.g. gcore:db) must sit at wit/deps/ for wit-bindgen to resolve them.
  const nestedDepsDir = path.join(fastedgeDepsDir, 'deps');
  if (fs.existsSync(nestedDepsDir)) {
    for (const dep of fastedgeNestedDepsProvided) {
      fs.rmSync(path.join(nestedDepsDir, dep), { recursive: true, force: true });
    }
    copyFilesRecursively(nestedDepsDir, path.join(witDir, 'deps'));
    fs.rmSync(nestedDepsDir, { recursive: true });
  }
  // Remove the files we dont use in FastEdge-sdk-js
  removeFastEdgeDepsWeDontUse(fastedgeDepsDir);
  // Remove extra files from submodule
  fs.unlinkSync(path.join(fastedgeDepsDir, 'LICENSE'));
  fs.unlinkSync(path.join(fastedgeDepsDir, 'README.md'));

  // Edit ./wit/main.wit to include the fastedge deps
  const mainWitFile = path.join(witDir, 'main.wit');
  const mainWitContent = fs.readFileSync(mainWitFile, 'utf-8');

  const updatedMainWitContent = mainWitContent.replace(
    'world bindings {\n',
    `world bindings {\n  include gcore:fastedge/reactor-async;\n`,
  );
  fs.writeFileSync(mainWitFile, updatedMainWitContent, 'utf-8');
  console.log(`WIT files successfully created in ${witDir}`);
}

function main() {
  const wasiHostVersion = process.argv[2] ?? '0.2.3';
  if (!HOST_VERSIONS.includes(wasiHostVersion)) {
    console.warn(
      `Unsupported host version: ${wasiHostVersion} -> please use ${HOST_VERSIONS.join(', ')}`,
    );
    process.exit(1);
  }
  clearExistingWitFiles();
  copyWitFilesFromHostApi(wasiHostVersion);
  mergeFastEdgeWitFiles();
}

main();
