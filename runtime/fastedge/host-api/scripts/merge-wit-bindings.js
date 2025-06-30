#!/usr/bin/env node
/* eslint-disable no-console */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HOST_VERSIONS = ['0.2.0', '0.2.2', '0.2.3'];
const dirname = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../');
const witDir = path.join(dirname, 'wit');
const starlingHostApisDir = path.resolve(dirname, '../../StarlingMonkey/host-apis');

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

function mergeFastEdgeWitFiles() {
  // Copy files from wit-interface/fastedge to ./wit/deps
  const fastedgeDepsDir = path.join(dirname, 'deps');
  copyFilesRecursively(fastedgeDepsDir, path.join(witDir, 'deps'));
  // Edit ./wit/main.wit to include the fastedge deps
  const mainWitFile = path.join(witDir, 'main.wit');
  const mainWitContent = fs.readFileSync(mainWitFile, 'utf-8');

  const updatedMainWitContent = mainWitContent.replace(
    'world bindings {\n',
    `world bindings {\n  include gcore:fastedge/imports;\n`,
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
