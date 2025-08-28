/// <reference path="fastedge-env.d.ts" />
/// <reference path="fastedge-fs.d.ts" />
/// <reference path="fastedge-secret.d.ts" />
/// <reference path="globals.d.ts" />

/// <reference path="fastedge-env.d.ts" />
/// <reference path="fastedge-fs.d.ts" />
/// <reference path="fastedge-secret.d.ts" />
/// <reference path="globals.d.ts" />

import { createStaticServer } from './server/static-assets/index.d.ts';

/* SAMPLE CODE FOLLOWS */
/*

import { getEnv } from "fastedge::env";
import { getSecret } from "fastedge::secret";

import {  createStaticServer } from "@gcoredev/fastedge-sdk-js/server";

const staticAssetManifest: StaticAssetManifest = {};

const server = createStaticServer(staticAssetManifest, {});

async function eventHandler(event: FetchEvent): Promise<Response> {
  const request = event.request;
  // console.log("SECRET_VAR_1: ", getSecret("SECRET_VAR_1"));
  // console.log("SECRET_VAR_2: ", getSecret("SECRET_VAR_2"));
  return new Response(
    `Main Workspace Project: You made a request to ${
      request.url
    } TS::>> 1.2.0 \n
    ENV_VAR_1: ${getEnv("ENV_VAR_1")} \n
    ENV_VAR_2: ${getEnv("ENV_VAR_2")} \n
    SECRET_VAR_1: ${getSecret("SECRET_VAR_1")} \n
    SECRET_VAR_2: ${getSecret("SECRET_VAR_2")} \n
    `
  );
}

addEventListener("fetch", (event: FetchEvent) => {
  event.respondWith(eventHandler(event));
});



TODO: Follow this startegy to set up your package.json and tsconfig.json properly.
I want to be able to use createStaticServer from a folder destination. How do I need to setup my repo to achieve this?
>>
To use createStaticServer from a folder destination (e.g. import { createStaticServer } from '@gcoredev/fastedge-sdk-js/server';), you need to set up your repo as a proper npm package with an entry point that re-exports this function.


main concept:

{
  "name": "@gcoredev/fastedge-sdk-js",
  "exports": {
    "./server": {
      "import": "./src/server/index.js",
      "require": "./src/server/index.js"
    }
  },
  "main": "./src/server/index.js",
  // ...other fields...
}

If you use TypeScript, make sure your build outputs .js files to the same structure (e.g. with "outDir": "./dist" in your tsconfig.json).

*/
