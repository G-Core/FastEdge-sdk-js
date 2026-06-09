import { Hono } from 'hono';
import * as echo from './handlers/echo.js';
import * as env from './handlers/env.js';
import * as multiChunkSource from './handlers/multi-chunk-source.js';
import * as outboundFetch from './handlers/outbound-fetch.js';
import * as responseClone from './handlers/response-clone.js';
import * as secret from './handlers/secret.js';

const app = new Hono();

const handlers = [env, outboundFetch, secret, echo, responseClone, multiChunkSource];
handlers.forEach((m) => app.all(m.route, (c) => m.handler(c.req.raw)));

addEventListener('fetch', (event) => event.respondWith(app.fetch(event.request)));
