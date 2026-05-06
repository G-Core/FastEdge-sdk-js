/**
 * @group Web APIs
 */
declare var self: typeof globalThis;

/**
 * @group DOM Events
 */
interface EventMap {
  fetch: FetchEvent;
}

/**
 * @group DOM Events
 */
interface EventListenerMap {
  fetch: FetchEventListener;
}

/**
 * @group DOM Events
 */
interface FetchEventListener {
  (this: typeof globalThis, event: FetchEvent): any;
}
/**
 * @group DOM Events
 */
declare var onfetch: FetchEventListener;

/**
 * This is a fetch specific implementation of [addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener), and is very similar to [handling FetchEvent from a Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent/request).
 *
 * @group DOM Events
 */
declare function addEventListener<K extends keyof EventMap>(
  type: K,
  listener: EventListenerMap[K],
): void;

/**
 * A Fastedge specific implementation of [FetchEvent](https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent/FetchEvent).
 * @group DOM Events
 */
declare interface FetchEvent {
  /**
   * Information about the downstream client that made the request,
   * including its IP address, TLS fingerprint and geo (`client.geo`).
   * Lazy: nothing is parsed until first access.
   */
  readonly client: ClientInfo;
  /**
   * Information about the FastEdge POP server handling this request,
   * including its address, name, and POP location (`server.pop`).
   * Lazy: nothing is parsed until first access.
   */
  readonly server: ServerInfo;
  /**
   * The downstream request that came from the client
   */
  readonly request: Request;

  /**
   * Send a response back to the client.
   *
   * **Note**: The service will be kept alive until the response has been fully sent.
   *
   * If the response contains a streaming body created by the service itself, then the service
   * will be kept alive until the body {@link ReadableStream} has been closed or errored.
   *
   * However, if the body is a stream originating in a request to a backend, i.e. if a backend
   * response's {@link Response.body} is passed as input to the {@link Response} constructor, the
   * service will not be kept alive until sending the body has finished.
   *
   * **Note**: If `response` is a `Promise`, the service will be kept alive until the
   * response has been resolved or rejected, and the {@link Response} it resolved to has been
   * fully sent.
   *
   * **Note**: Use {@link FetchEvent.waitUntil} to extend the service's lifetime further if
   * necessary.
   *
   * @param response - Response to send back down to the client
   */
  respondWith(response: Response | PromiseLike<Response>): void;

  /**
   * Extend the service's lifetime to ensure asynchronous operations succeed.
   *
   * By default, a service will shut down as soon as the response passed to
   * {@link FetchEvent.respondWith | respondWith} has been sent. `waitUntil` can be used to
   * ensure that the service will stay alive until additional asynchronous operations have
   * completed, such as sending telemetry data to a separate backend after the response has
   * been sent.
   *
   * @param promise - The `Promise` to wait for
   */
  waitUntil(promise: Promise<any>): void;
}

/**
 * Information about the downstream client making the request.
 *
 * All fields are derived from headers the FastEdge edge POP injects into
 * the request. Direct fields are populated when this object is first
 * accessed; the nested {@link ClientInfo.geo} namespace is populated only
 * if you read it.
 */
declare interface ClientInfo {
  /**
   * Downstream client IP (IPv4 or IPv6). Read from the platform-set
   * `x-real-ip` header, falling back to `x-forwarded-for` if `x-real-ip`
   * is absent. Empty string if neither header is present.
   *
   * Both headers are set by the trusted edge POP and not by the client,
   * so they're safe to use for rate-limiting, geofencing, and similar
   * trust decisions on this platform.
   */
  readonly address: string;
  /**
   * JA3 TLS-handshake fingerprint as an MD5 hex string, from the
   * platform-set `x-ja3` header. Empty string for non-TLS requests or
   * when fingerprinting is unavailable.
   */
  readonly tlsJA3MD5: string;
  /**
   * Protocol family — `"https"` or `"http"`. Sourced from
   * `x-forwarded-proto`. This is *not* the TLS version (e.g. "TLSv1.3");
   * the platform doesn't currently expose that.
   */
  readonly protocol: string;
  /**
   * Client geographic information (lazy; populated on first access).
   */
  readonly geo: GeoInfo;
}

/**
 * Geographic information about the downstream client, derived from the
 * platform's `geoip-*` headers. Populated when {@link ClientInfo.geo} is
 * first accessed.
 */
declare interface GeoInfo {
  /** Autonomous System Number of the client's network as a string. Empty if unavailable. */
  readonly asn: string;
  /** Latitude in decimal degrees, or `null` if unavailable. `0` is a real coordinate, not a sentinel. */
  readonly latitude: number | null;
  /** Longitude in decimal degrees, or `null` if unavailable. */
  readonly longitude: number | null;
  /** Region/state code (subdivision). Empty string if unavailable. */
  readonly region: string;
  /** Continent code (e.g. `"EU"`, `"NA"`). Empty string if unavailable. */
  readonly continent: string;
  /** ISO 3166-1 alpha-2 country code (e.g. `"PT"`). Empty string if unavailable. */
  readonly countryCode: string;
  /** Country name (e.g. `"Portugal"`). Empty string if unavailable. */
  readonly countryName: string;
  /** City name. Empty string when geo lookup didn't resolve a city. */
  readonly city: string;
}

/**
 * Information about the FastEdge POP server handling this request,
 * including its network identity and POP location (`server.pop`).
 */
declare interface ServerInfo {
  /** Server-side IP that received the request (`server_addr` header). */
  readonly address: string;
  /** Server hostname (`server_name` header). */
  readonly name: string;
  /** POP location (lazy; populated on first access). */
  readonly pop: PopInfo;
}

/**
 * Geographic information about the FastEdge POP serving the request,
 * derived from the platform's `pop-*` headers. Populated when
 * {@link ServerInfo.pop} is first accessed.
 */
declare interface PopInfo {
  /** POP latitude in decimal degrees, or `null` if unavailable. */
  readonly latitude: number | null;
  /** POP longitude in decimal degrees, or `null` if unavailable. */
  readonly longitude: number | null;
  /** POP region/state code. Empty string if unavailable. */
  readonly region: string;
  /** POP continent code. Empty string if unavailable. */
  readonly continent: string;
  /** ISO 3166-1 alpha-2 POP country code. Empty string if unavailable. */
  readonly countryCode: string;
  /** POP country name. Empty string if unavailable. */
  readonly countryName: string;
  /** POP city. Empty string when not resolved. */
  readonly city: string;
}

/**
 * The URL class as [specified by WHATWG](https://url.spec.whatwg.org/#url-class)
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/URL | URL on MDN}
 * @group Web APIs
 */
declare class URL {
  constructor(url: string, base?: string | URL);

  get href(): string;
  set href(V: string);

  get origin(): string;

  get protocol(): string;
  set protocol(V: string);

  get username(): string;
  set username(V: string);

  get password(): string;
  set password(V: string);

  get host(): string;
  set host(V: string);

  get hostname(): string;
  set hostname(V: string);

  get port(): string;
  set port(V: string);

  get pathname(): string;
  set pathname(V: string);

  get search(): string;
  set search(V: string);

  get searchParams(): URLSearchParams;

  get hash(): string;
  set hash(V: string);

  toJSON(): string;

  readonly [Symbol.toStringTag]: 'URL';
}

/**
 * The URLSearchParams class as [specified by WHATWG](https://url.spec.whatwg.org/#interface-urlsearchparams)
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams | URLSearchParams on MDN}
 * @group Web APIs
 */
declare class URLSearchParams {
  constructor(
    init?:
      | ReadonlyArray<readonly [name: string, value: string]>
      | Iterable<readonly [name: string, value: string]>
      | { readonly [name: string]: string }
      | string,
  );

  append(name: string, value: string): void;
  delete(name: string): void;
  get(name: string): string | null;
  getAll(name: string): string[];
  has(name: string): boolean;
  set(name: string, value: string): void;
  sort(): void;

  keys(): IterableIterator<string>;
  values(): IterableIterator<string>;
  entries(): IterableIterator<[name: string, value: string]>;
  forEach<THIS_ARG = void>(
    callback: (this: THIS_ARG, value: string, name: string, searchParams: this) => void,
    thisArg?: THIS_ARG,
  ): void;

  readonly [Symbol.toStringTag]: 'URLSearchParams';
  [Symbol.iterator](): IterableIterator<[name: string, value: string]>;
}

/**
 * Interface for logging to stdout for
 *
 * **Note**: This implementation accepts any number of arguments. String representations of each object are appended
 * together in the order listed and output. Unlike the `Console` built-in in browsers and Node.js, this implementation
 * does not perform string substitution.
 *
 * @group Console API
 */
interface Console {
  assert(condition?: boolean, ...data: any[]): void;
  clear(): void;
  count(label?: string): void;
  countReset(label?: string): void;
  debug(...data: any[]): void;
  dir(item?: any, options?: any): void;
  dirxml(...data: any[]): void;
  error(...data: any[]): void;
  group(...data: any[]): void;
  groupCollapsed(...data: any[]): void;
  groupEnd(): void;
  info(...data: any[]): void;
  log(...data: any[]): void;
  table(tabularData?: any, properties?: string[]): void;
  time(label?: string): void;
  timeEnd(label?: string): void;
  timeLog(label?: string, ...data: any[]): void;
  trace(...data: any[]): void;
  warn(...data: any[]): void;
}

/**
 * The global {@linkcode Console} instance
 * @group Console API
 */
declare var console: Console;

// Note: the contents below here are, partially modified, copies of content from TypeScript's
// `lib.dom.d.ts` file.
// We used to keep them in a separate file, referenced using a `/// reference path="..."`
// directive, but that causes the defined types to be absent from TypeDoc output.

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

/*!
 * This file is largely a subset of TypeScript's lib.dom.d.ts file, with some
 * Fastly Compute-specific additions and modifications. Those modifications are
 * Copyright (c) Fastly Corporation, under the same license as the rest of the file.
 */

/**
 * Used within the
 * [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request) and
 * [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response/Response) constructors.
 * ({@linkcode Request}, and {@linkcode Response})
 * @group Fetch API
 */
declare type BodyInit =
  | ReadableStream
  | ArrayBufferView
  | ArrayBuffer
  | Blob
  | FormData
  | URLSearchParams
  | string;

/**
 * Body for Fetch HTTP Requests and Responses
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#Body | Body on MDN}
 * @group Fetch API
 */
declare interface Body {
  readonly body: ReadableStream<Uint8Array> | null;
  readonly bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  blob(): Promise<Blob>;
  formData(): Promise<FormData>;
  json(): Promise<any>;
  text(): Promise<string>;
}

/**
 * Constructor parameter for
 * [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request)
 *
 * Usually this a URL to the resource you are requesting.
 * @group Fetch API
 */
declare type RequestInfo = Request | string;

/**
 * Constructor parameter for
 * [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request)
 *
 * This contains information to send along with the request (Headers, body, etc...),
 * @group Fetch API
 */
declare interface RequestInit {
  /** A BodyInit object or null to set request's body. */
  body?: BodyInit | null;
  /** A Headers object, an object literal, or an array of two-item arrays to set request's headers. */
  headers?: HeadersInit;
  /** A string to set request's method. */
  method?: string;
  /** An AbortSignal to set request's signal. */
  signal?: AbortSignal | null;

  // ---------------------------------------------------------------------------
  // Spec fields not implemented by the StarlingMonkey runtime
  // ---------------------------------------------------------------------------
  // The Request constructor only parses method/headers/body/signal. The fields
  // below are part of the WHATWG Fetch spec but are silently dropped at runtime
  // if passed. They will be uncommented when the runtime adds parsing and a
  // matching property getter on Request. See:
  //   runtime/StarlingMonkey/builtins/web/fetch/request-response.cpp
  //
  // cache?: RequestCache;
  // credentials?: RequestCredentials;
  // integrity?: string;
  // keepalive?: boolean;
  // mode?: RequestMode;
  // redirect?: RequestRedirect;
  // referrer?: string;
  // referrerPolicy?: ReferrerPolicy;
  // window?: null;
}

/**
 * The Request class as [specified by WHATWG](https://fetch.spec.whatwg.org/#ref-for-dom-request%E2%91%A0)
 *
 * **Note**: Can only be used when processing requests, not during build-time initialization.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Request | Request on MDN}
 * @group Fetch API
 */
interface Request extends Body {
  /** Returns a Headers object consisting of the headers associated with request. */
  readonly headers: Headers;
  /** Returns request's HTTP method, which is "GET" by default. */
  readonly method: string;
  /** Returns the signal associated with request, which is an AbortSignal object indicating whether or not request has been aborted, and its abort event handler. */
  readonly signal: AbortSignal;
  /** Returns the URL of request as a string. */
  readonly url: string;

  /** Creates a copy of the current Request object. */
  clone(): Request;

  // ---------------------------------------------------------------------------
  // Spec properties not implemented by the StarlingMonkey runtime
  // ---------------------------------------------------------------------------
  // No corresponding property getter is registered on the Request class, so
  // these accessors are unavailable at runtime. They will be uncommented when
  // the runtime exposes them. See:
  //   runtime/StarlingMonkey/builtins/web/fetch/request-response.cpp
  //
  // readonly cache: RequestCache;
  // readonly credentials: RequestCredentials;
  // readonly destination: RequestDestination;
  // readonly integrity: string;
  // readonly keepalive: boolean;
  // readonly mode: RequestMode;
  // readonly redirect: RequestRedirect;
  // readonly referrer: string;
  // readonly referrerPolicy: ReferrerPolicy;
}

/**
 * @group Fetch API
 */
declare var Request: {
  prototype: Request;
  new (input: RequestInfo | URL, init?: RequestInit): Request;
};

/**
 * Constructor parameter for the [Fetch API Response](https://developer.mozilla.org/en-US/docs/Web/API/Response)
 * This contains information to send along with the response.
 * @group Fetch API
 */
declare interface ResponseInit {
  headers?: HeadersInit;
  status?: number;
  statusText?: string;
}

/**
 * @group Fetch API
 */
type ResponseType = 'basic' | 'cors' | 'default' | 'error' | 'opaque' | 'opaqueredirect';

/**
 * The Response class as [specified by WHATWG](https://fetch.spec.whatwg.org/#ref-for-dom-response%E2%91%A0)
 *
 * **Note**: Can only be used when processing requests, not during build-time initialization.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Response | Response on MDN}
 * @group Fetch API
 */
interface Response extends Body {
  readonly headers: Headers;
  readonly ok: boolean;
  readonly redirected: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly type: ResponseType;
  readonly url: string;
}

/**
 * @group Fetch API
 */
declare var Response: {
  prototype: Response;
  new (body?: BodyInit | null, init?: ResponseInit): Response;
  redirect(url: string | URL, status?: number): Response;
  json(data: any, init?: ResponseInit): Response;

  // ---------------------------------------------------------------------------
  // Spec static methods not implemented by the StarlingMonkey runtime
  // ---------------------------------------------------------------------------
  // Will be uncommented when the runtime exposes them. See:
  //   runtime/StarlingMonkey/builtins/web/fetch/request-response.cpp
  //
  // error(): Response;
};

/**
 * @group Streams API
 */
type ReadableStreamReader<T> = ReadableStreamDefaultReader<T> | ReadableStreamBYOBReader;

/**
 * @group Streams API
 */
type ReadableStreamController<T> =
  | ReadableStreamDefaultController<T>
  | ReadableByteStreamController;

/**
 * @group Streams API
 */
interface UnderlyingSinkAbortCallback {
  (reason?: any): void | PromiseLike<void>;
}

/**
 * @group Streams API
 */
interface UnderlyingSinkCloseCallback {
  (): void | PromiseLike<void>;
}

/**
 * @group Streams API
 */
interface UnderlyingSinkStartCallback {
  (controller: WritableStreamDefaultController): any;
}

/**
 * @group Streams API
 */
interface UnderlyingSinkWriteCallback<W> {
  (chunk: W, controller: WritableStreamDefaultController): void | PromiseLike<void>;
}

/**
 * @group Streams API
 */
interface UnderlyingSourceCancelCallback {
  (reason?: any): void | PromiseLike<void>;
}

/**
 * @group Streams API
 */
interface UnderlyingSourcePullCallback<R> {
  (controller: ReadableStreamController<R>): void | PromiseLike<void>;
}

/**
 * @group Streams API
 */
interface UnderlyingSourceStartCallback<R> {
  (controller: ReadableStreamController<R>): any;
}

/**
 * @group Streams API
 */
interface UnderlyingSink<W = any> {
  abort?: UnderlyingSinkAbortCallback;
  close?: UnderlyingSinkCloseCallback;
  start?: UnderlyingSinkStartCallback;
  type?: undefined;
  write?: UnderlyingSinkWriteCallback<W>;
}

/**
 * @group Streams API
 */
interface UnderlyingSource<R = any> {
  autoAllocateChunkSize?: number;
  cancel?: UnderlyingSourceCancelCallback;
  pull?: UnderlyingSourcePullCallback<R>;
  start?: UnderlyingSourceStartCallback<R>;
  type?: ReadableStreamType;
}

/**
 * @group Streams API
 */
type ReadableStreamType = 'bytes';

/**
 * Options for {@linkcode ReadableStream.pipeTo} and {@linkcode ReadableStream.pipeThrough}.
 *
 * The behaviour of the piping process under various error conditions can be
 * customised with these options. It returns a promise that fulfills when the
 * piping process completes successfully, or rejects if any errors were
 * encountered.
 *
 * Piping a stream will lock it for the duration of the pipe, preventing any
 * other consumer from acquiring a reader.
 *
 * Errors and closures of the source and destination streams propagate as
 * follows:
 *
 * - An error in the source readable stream will abort destination, unless
 *   `preventAbort` is truthy. The returned promise will be rejected with the
 *   source's error, or with any error that occurs during aborting the
 *   destination.
 * - An error in destination will cancel the source readable stream, unless
 *   `preventCancel` is truthy. The returned promise will be rejected with the
 *   destination's error, or with any error that occurs during canceling the
 *   source.
 * - When the source readable stream closes, destination will be closed,
 *   unless `preventClose` is truthy. The returned promise will be fulfilled
 *   once this process completes, unless an error is encountered while
 *   closing the destination, in which case it will be rejected with that
 *   error.
 * - If destination starts out closed or closing, the source readable stream
 *   will be canceled, unless `preventCancel` is true. The returned promise
 *   will be rejected with an error indicating piping to a closed stream
 *   failed, or with any error that occurs during canceling the source.
 * - The `signal` option can be set to an {@linkcode AbortSignal} to allow
 *   aborting an ongoing pipe operation via the corresponding
 *   {@linkcode AbortController}. In this case, the source readable stream
 *   will be canceled, and destination aborted, unless the respective options
 *   `preventCancel` or `preventAbort` are set.
 *
 * @group Streams API
 */
interface StreamPipeOptions {
  preventAbort?: boolean;
  preventCancel?: boolean;
  preventClose?: boolean;
  signal?: AbortSignal;
}

/**
 * @group Streams API
 */
interface QueuingStrategySize<T = any> {
  (chunk: T): number;
}

/**
 * @group Streams API
 */
interface QueuingStrategy<T = any> {
  highWaterMark?: number;
  size?: QueuingStrategySize<T>;
}

/**
 * @group Streams API
 */
interface QueuingStrategyInit {
  /**
   * The provided high water mark is not validated ahead of time. If it is
   * negative, `NaN`, or not a number, the resulting strategy will cause the
   * corresponding stream constructor to throw.
   */
  highWaterMark: number;
}

/**
 * A queuing strategy that counts byte length. Used as the
 * `queuingStrategy` argument when constructing a {@linkcode ReadableStream}
 * or {@linkcode WritableStream} of byte data.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/ByteLengthQueuingStrategy)
 * @group Streams API
 */
interface ByteLengthQueuingStrategy extends QueuingStrategy<ArrayBufferView> {
  readonly highWaterMark: number;
  readonly size: QueuingStrategySize<ArrayBufferView>;
}

/**
 * @group Streams API
 */
declare var ByteLengthQueuingStrategy: {
  prototype: ByteLengthQueuingStrategy;
  new (init: QueuingStrategyInit): ByteLengthQueuingStrategy;
};

/**
 * A queuing strategy that counts each chunk as a single unit.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/CountQueuingStrategy)
 * @group Streams API
 */
interface CountQueuingStrategy extends QueuingStrategy {
  readonly highWaterMark: number;
  readonly size: QueuingStrategySize;
}

/**
 * @group Streams API
 */
declare var CountQueuingStrategy: {
  prototype: CountQueuingStrategy;
  new (init: QueuingStrategyInit): CountQueuingStrategy;
};

/**
 * @group Streams API
 */
interface ReadableStreamDefaultReadDoneResult {
  done: true;
  value?: undefined;
}

/**
 * @group Streams API
 */
interface ReadableStreamDefaultReadValueResult<T> {
  done: false;
  value: T;
}

/**
 * @group Streams API
 */
type ReadableStreamDefaultReadResult<T> =
  | ReadableStreamDefaultReadValueResult<T>
  | ReadableStreamDefaultReadDoneResult;

/**
 * @group Streams API
 */
interface ReadableWritablePair<R = any, W = any> {
  readable: ReadableStream<R>;
  /**
   * Provides a convenient, chainable way of piping this readable stream through a transform stream (or any other \{ writable, readable \} pair). It simply pipes the stream into the writable side of the supplied pair, and returns the readable side for further use.
   *
   * Piping a stream will lock it for the duration of the pipe, preventing any other consumer from acquiring a reader.
   */
  writable: WritableStream<W>;
}

/**
 * This Streams API interface represents a readable stream of byte data. The Fetch API offers a concrete instance of a ReadableStream through the body property of a Response object.
 * @group Streams API
 */
interface ReadableStream<R = any> {
  readonly locked: boolean;
  cancel(reason?: any): Promise<void>;
  getReader(): ReadableStreamDefaultReader<R>;
  getReader(options: { mode: 'byob' }): ReadableStreamBYOBReader;
  getReader(options?: ReadableStreamGetReaderOptions): ReadableStreamReader<R>;
  pipeThrough<T>(
    transform: ReadableWritablePair<T, R>,
    options?: StreamPipeOptions,
  ): ReadableStream<T>;
  pipeTo(dest: WritableStream<R>, options?: StreamPipeOptions): Promise<void>;
  tee(): [ReadableStream<R>, ReadableStream<R>];
}

/**
 * The ReadableStream class as [specified by WHATWG](https://streams.spec.whatwg.org/#rs-class)
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream | ReadableStream on MDN}
 * @group Streams API
 */
declare var ReadableStream: {
  prototype: ReadableStream;
  new <R = any>(
    underlyingSource?: UnderlyingSource<R>,
    strategy?: QueuingStrategy<R>,
  ): ReadableStream<R>;
};

/**
 * @group Streams API
 */
interface ReadableStreamDefaultController<R = any> {
  readonly desiredSize: number | null;
  close(): void;
  enqueue(chunk: R): void;
  error(e?: any): void;
}

/**
 * @group Streams API
 */
declare var ReadableStreamDefaultController: {
  prototype: ReadableStreamDefaultController;
  new (): ReadableStreamDefaultController;
};

/**
 * @group Streams API
 */
interface ReadableStreamDefaultReader<R = any> extends ReadableStreamGenericReader {
  read(): Promise<ReadableStreamDefaultReadResult<R>>;
  releaseLock(): void;
}

/**
 * @group Streams API
 */
declare var ReadableStreamDefaultReader: {
  prototype: ReadableStreamDefaultReader;
  new <R = any>(stream: ReadableStream<R>): ReadableStreamDefaultReader<R>;
};

/**
 * @group Streams API
 */
interface ReadableStreamGenericReader {
  readonly closed: Promise<undefined>;
  cancel(reason?: any): Promise<void>;
}

/**
 * @group Streams API
 */
interface ReadableStreamGetReaderOptions {
  mode?: 'byob';
}

/**
 * @group Streams API
 */
interface ReadableStreamBYOBReaderReadOptions {
  /** Minimum number of elements to read before resolving. Default 1. */
  min?: number;
}

/**
 * Reader for a "byte" {@linkcode ReadableStream}, allowing the consumer to
 * supply the buffer that the stream writes into (Bring-Your-Own-Buffer).
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/ReadableStreamBYOBReader)
 * @group Streams API
 */
interface ReadableStreamBYOBReader extends ReadableStreamGenericReader {
  read<T extends ArrayBufferView>(
    view: T,
    options?: ReadableStreamBYOBReaderReadOptions,
  ): Promise<ReadableStreamDefaultReadResult<T>>;
  releaseLock(): void;
}

/**
 * @group Streams API
 */
declare var ReadableStreamBYOBReader: {
  prototype: ReadableStreamBYOBReader;
  new (stream: ReadableStream<Uint8Array>): ReadableStreamBYOBReader;
};

/**
 * Represents a "pull-into" descriptor passed to a {@linkcode ReadableByteStreamController}.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/ReadableStreamBYOBRequest)
 * @group Streams API
 */
interface ReadableStreamBYOBRequest {
  readonly view: ArrayBufferView | null;
  respond(bytesWritten: number): void;
  respondWithNewView(view: ArrayBufferView): void;
}

/**
 * @group Streams API
 */
declare var ReadableStreamBYOBRequest: {
  prototype: ReadableStreamBYOBRequest;
  new (): ReadableStreamBYOBRequest;
};

/**
 * Controller for a "byte" {@linkcode ReadableStream} (i.e. one constructed
 * with `{ type: 'bytes' }`).
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/ReadableByteStreamController)
 * @group Streams API
 */
interface ReadableByteStreamController {
  readonly byobRequest: ReadableStreamBYOBRequest | null;
  readonly desiredSize: number | null;
  close(): void;
  enqueue(chunk: ArrayBufferView): void;
  error(e?: any): void;
}

/**
 * @group Streams API
 */
declare var ReadableByteStreamController: {
  prototype: ReadableByteStreamController;
  new (): ReadableByteStreamController;
};

/**
 * This Streams API interface provides a standard abstraction for writing streaming data to a destination, known as a sink. This object comes with built-in backpressure and queuing.
 * @group Streams API
 */
interface WritableStream<W = any> {
  readonly locked: boolean;
  abort(reason?: any): Promise<void>;
  getWriter(): WritableStreamDefaultWriter<W>;
}

/**
 * The WritableStream class as [specified by WHATWG](https://streams.spec.whatwg.org/#ws-class)
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WritableStream | WritableStream on MDN}
 * @group Streams API
 */
declare var WritableStream: {
  prototype: WritableStream;
  new <W = any>(
    underlyingSink?: UnderlyingSink<W>,
    strategy?: QueuingStrategy<W>,
  ): WritableStream<W>;
};

/**
 * This Streams API interface represents a controller allowing control of a WritableStream's state. When constructing a WritableStream, the underlying sink is given a corresponding WritableStreamDefaultController instance to manipulate.
 * @group Streams API
 */
interface WritableStreamDefaultController {
  error(e?: any): void;
}

/**
 * @group Streams API
 */
declare var WritableStreamDefaultController: {
  prototype: WritableStreamDefaultController;
  new (): WritableStreamDefaultController;
};

/**
 * This Streams API interface is the object returned by WritableStream.getWriter() and once created locks the < writer to the WritableStream ensuring that no other streams can write to the underlying sink.
 * @group Streams API
 */
interface WritableStreamDefaultWriter<W = any> {
  readonly closed: Promise<undefined>;
  readonly desiredSize: number | null;
  readonly ready: Promise<undefined>;
  abort(reason?: any): Promise<void>;
  close(): Promise<void>;
  releaseLock(): void;
  write(chunk: W): Promise<void>;
}

/**
 * @group Streams API
 */
declare var WritableStreamDefaultWriter: {
  prototype: WritableStreamDefaultWriter;
  new <W = any>(stream: WritableStream<W>): WritableStreamDefaultWriter<W>;
};

/**
 * @group Streams API
 */
interface TransformStream<I = any, O = any> {
  readonly readable: ReadableStream<O>;
  readonly writable: WritableStream<I>;
}

/**
 * The TransformStream class as [specified by WHATWG](https://streams.spec.whatwg.org/#ts-class)
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/TransformStream | TransformStream on MDN}
 * @group Streams API
 */

declare var TransformStream: {
  prototype: TransformStream;
  new <I = any, O = any>(
    transformer?: Transformer<I, O>,
    writableStrategy?: QueuingStrategy<I>,
    readableStrategy?: QueuingStrategy<O>,
  ): TransformStream<I, O>;
};

/**
 * @group Streams API
 */
interface TransformStreamDefaultController<O = any> {
  readonly desiredSize: number | null;
  enqueue(chunk?: O): void;
  error(reason?: any): void;
  terminate(): void;
}

/**
 * @group Streams API
 */
declare var TransformStreamDefaultController: {
  prototype: TransformStreamDefaultController;
  new (): TransformStreamDefaultController;
};

/**
 * @group Streams API
 */
interface Transformer<I = any, O = any> {
  flush?: TransformerFlushCallback<O>;
  readableType?: undefined;
  start?: TransformerStartCallback<O>;
  transform?: TransformerTransformCallback<I, O>;
  writableType?: undefined;
}

/**
 * @group Streams API
 */
interface TransformerFlushCallback<O> {
  (controller: TransformStreamDefaultController<O>): void | PromiseLike<void>;
}

/**
 * @group Streams API
 */
interface TransformerStartCallback<O> {
  (controller: TransformStreamDefaultController<O>): void | PromiseLike<void>;
}

/**
 * @group Streams API
 */
interface TransformerTransformCallback<I, O> {
  (chunk: I, controller: TransformStreamDefaultController<O>): void | PromiseLike<void>;
}

/**
 * Compression formats accepted by {@linkcode CompressionStream} and
 * {@linkcode DecompressionStream}.
 *
 * @group Compression Streams API
 */
type CompressionFormat = 'deflate' | 'deflate-raw' | 'gzip';

/**
 * Compresses a stream of data using the specified format.
 *
 * Used as a {@linkcode TransformStream}: write uncompressed bytes to its
 * `writable` side and read compressed bytes from its `readable` side.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/CompressionStream)
 * @group Compression Streams API
 */
interface CompressionStream {
  readonly readable: ReadableStream<Uint8Array>;
  readonly writable: WritableStream<BufferSource>;
}

/**
 * @group Compression Streams API
 */
declare var CompressionStream: {
  prototype: CompressionStream;
  new (format: CompressionFormat): CompressionStream;
};

/**
 * Decompresses a stream of data compressed in the specified format.
 *
 * Used as a {@linkcode TransformStream}: write compressed bytes to its
 * `writable` side and read uncompressed bytes from its `readable` side.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/DecompressionStream)
 * @group Compression Streams API
 */
interface DecompressionStream {
  readonly readable: ReadableStream<Uint8Array>;
  readonly writable: WritableStream<BufferSource>;
}

/**
 * @group Compression Streams API
 */
declare var DecompressionStream: {
  prototype: DecompressionStream;
  new (format: CompressionFormat): DecompressionStream;
};

/**
 * @group Fetch API
 */
type HeadersInit = Headers | string[][] | Record<string, string>;

/**
 * The Headers class as [specified by WHATWG](https://fetch.spec.whatwg.org/#headers-class)
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Headers | Headers on MDN}
 * @group Fetch API
 */
interface Headers {
  append(name: string, value: string): void;
  delete(name: string): void;
  get(name: string): string | null;
  getSetCookie(): string[];
  has(name: string): boolean;
  set(name: string, value: string): void;
  forEach(callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any): void;
  // Iterable methods
  entries(): IterableIterator<[string, string]>;
  keys(): IterableIterator<string>;
  values(): IterableIterator<string>;
  [Symbol.iterator](): Iterator<[string, string]>;
}

/**
 * @group Fetch API
 */
declare var Headers: {
  prototype: Headers;
  new (init?: HeadersInit): Headers;
};

/**
 * The atob() function decodes a string of data which has been encoded using Base64 encoding.
 *
 * @param data A binary string (i.e., a string in which each character in the string is treated as a byte of binary data) containing base64-encoded data.
 * @returns An ASCII string containing decoded data from `data`.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/atob | atob on MDN}
 * @group Encoding API
 */
declare function atob(data: string): string;

/**
 *  The btoa() method creates a Base64-encoded ASCII string from a binary string (i.e., a string in which each character in the string is treated as a byte of binary data).
 * @param data The binary string to encode.
 * @returns  An ASCII string containing the Base64 representation of `data`.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/btoa | btoa on MDN}
 * @group Encoding API
 */
declare function btoa(data: string): string;

/**
 * The setTimeout() method sets a timer which calls a function once the timer expires.
 *
 * @param callback A function to be called after the timer expires.
 * @param delay The time, in milliseconds, that the timer should wait before calling the specified function. Defaults to 0 if not specified.
 * @param args Additional arguments which are passed through to the callback function.
 * @returns A numeric, non-zero value which identifies the timer created; this value can be passed to clearTimeout() to cancel the timeout.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/setTimeout | setTimeout on MDN}
 * @group Timers
 */
declare function setTimeout<TArgs extends any[]>(
  callback: (...args: TArgs) => void,
  delay?: number,
  ...args: TArgs
): number;

/**
 * The clearTimeout() method cancels a timeout previously established by calling setTimeout(). If the parameter provided does not identify a previously established action, this method does nothing.
 * @param timeoutID The identifier of the timeout you want to cancel. This ID was returned by the corresponding call to setTimeout().
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/clearTimeout | clearTimeout on MDN}
 * @group Timers
 */
declare function clearTimeout(timeoutID?: number): void;

/**
 * The setInterval() method repeatedly calls a function, with a fixed time delay between each call.
 * This method returns an interval ID which uniquely identifies the interval, so you can remove it later by calling clearInterval().
 *
 * @param callback A function to be called every delay milliseconds. The first call happens after delay milliseconds.
 * @param delay The time, in milliseconds, that the timer should delay in between calls of the specified function. Defaults to 0 if not specified.
 * @param args Additional arguments which are passed through to the callback function.
 * @returns A numeric, non-zero value which identifies the timer created; this value can be passed to clearInterval() to cancel the interval.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/setInterval | setInterval on MDN}
 * @group Timers
 */
declare function setInterval<TArgs extends any[]>(
  callback: (...args: TArgs) => void,
  delay?: number,
  ...args: TArgs
): number;

/**
 * The clearInterval() method cancels a timed, repeating action which was previously established by a call to setInterval(). If the parameter provided does not identify a previously established action, this method does nothing.
 * @param intervalID The identifier of the repeated action you want to cancel. This ID was returned by the corresponding call to setInterval().
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/clearInterval | clearInterval on MDN}
 * @group Timers
 */
declare function clearInterval(intervalID?: number): void;

/**
 * Fetch resources from backends.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch | fetch on MDN}
 *
 * @param resource - The resource to fetch, either a URL string or a {@link Request} object
 * @param init - An object containing settings to apply to the request
 * @group Fetch API
 */
declare function fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;

/**
 * @group Scheduling
 */
interface VoidFunction {
  (): void;
}

/**
 * @group Scheduling
 */
declare function queueMicrotask(callback: VoidFunction): void;

/**
 * @group DOM APIs
 */
declare function structuredClone(value: any, options?: StructuredSerializeOptions): any;

/**
 * @group DOM APIs
 */
interface StructuredSerializeOptions {
  transfer?: Transferable[];
}

/**
 * @group DOM APIs
 */
// The full WHATWG type is `ArrayBuffer | MessagePort | ImageBitmap`. The
// StarlingMonkey runtime exposes neither MessagePort (no Worker API) nor
// ImageBitmap (no Canvas API), so only ArrayBuffer can be transferred via
// structuredClone. See runtime/StarlingMonkey/builtins/web/structured-clone.cpp
type Transferable = ArrayBuffer;

/**
 * @group Web APIs
 */
interface WorkerLocation {
  readonly hash: string;
  readonly host: string;
  readonly hostname: string;
  readonly href: string;
  toString(): string;
  readonly origin: string;
  readonly pathname: string;
  readonly port: string;
  readonly protocol: string;
  readonly search: string;
}

/**
 * The WorkerLocation class as [specified by WHATWG](https://html.spec.whatwg.org/multipage/workers.html#worker-locations)
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WorkerLocation | WorkerLocation on MDN}
 * @group Web APIs
 */
declare var WorkerLocation: {
  prototype: WorkerLocation;
  new (): WorkerLocation;
};

/**
 * @group Web APIs
 */
declare var location: WorkerLocation;

interface Algorithm {
  name: string;
}

type AlgorithmIdentifier = Algorithm | string;

type BufferSource = ArrayBufferView | ArrayBuffer;

declare class SubtleCrypto {
  constructor();

  /**
   * Computes a digest (hash) of the given data. Supported algorithms:
   * `SHA-1`, `SHA-256`, `SHA-384`, `SHA-512`.
   */
  digest(algorithm: AlgorithmIdentifier, data: BufferSource): Promise<ArrayBuffer>;

  /**
   * Imports a key from external key material. Supported algorithms:
   * `HMAC`, `RSASSA-PKCS1-v1_5`, `ECDSA`.
   *
   * Supported (algorithm, format) combinations:
   * - `HMAC` — `'raw'`, `'jwk'`
   * - `RSASSA-PKCS1-v1_5` — `'jwk'`, `'spki'`, `'pkcs8'`
   * - `ECDSA` — `'jwk'`, `'raw'`, `'spki'`, `'pkcs8'`
   */
  importKey(
    format: 'jwk',
    keyData: JsonWebKey,
    algorithm:
      | AlgorithmIdentifier
      | HmacImportParams
      | RsaHashedImportParams
      | EcKeyImportParams,
    extractable: boolean,
    keyUsages: ReadonlyArray<KeyUsage>,
  ): Promise<CryptoKey>;
  importKey(
    format: Exclude<KeyFormat, 'jwk'>,
    keyData: BufferSource,
    algorithm:
      | AlgorithmIdentifier
      | HmacImportParams
      | RsaHashedImportParams
      | EcKeyImportParams,
    extractable: boolean,
    keyUsages: KeyUsage[],
  ): Promise<CryptoKey>;

  /**
   * Signs data with a private (or symmetric) key. Supported algorithms:
   * `HMAC`, `RSASSA-PKCS1-v1_5`, `ECDSA`. ECDSA requires {@link EcdsaParams}
   * (`{ name: 'ECDSA', hash: ... }`) so the hash function can be specified.
   */
  sign(
    algorithm: AlgorithmIdentifier | EcdsaParams,
    key: CryptoKey,
    data: BufferSource,
  ): Promise<ArrayBuffer>;

  /**
   * Verifies a signature against the original data. Supported algorithms:
   * `HMAC`, `RSASSA-PKCS1-v1_5`, `ECDSA`. ECDSA requires {@link EcdsaParams}.
   */
  verify(
    algorithm: AlgorithmIdentifier | EcdsaParams,
    key: CryptoKey,
    signature: BufferSource,
    data: BufferSource,
  ): Promise<boolean>;

  // ---------------------------------------------------------------------------
  // Spec methods not implemented by the StarlingMonkey runtime
  // ---------------------------------------------------------------------------
  // The runtime currently implements only `digest`, `importKey`, `sign`, and
  // `verify`. The methods below are part of the WebCrypto spec but throw
  // `TypeError` at runtime if called. See:
  //   runtime/StarlingMonkey/builtins/web/crypto/subtle-crypto.cpp
  //
  // decrypt(algorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams, key: CryptoKey, data: BufferSource): Promise<ArrayBuffer>;
  // deriveBits(algorithm: AlgorithmIdentifier | EcdhKeyDeriveParams | HkdfParams | Pbkdf2Params, baseKey: CryptoKey, length: number): Promise<ArrayBuffer>;
  // deriveKey(algorithm: AlgorithmIdentifier | EcdhKeyDeriveParams | HkdfParams | Pbkdf2Params, baseKey: CryptoKey, derivedKeyType: AlgorithmIdentifier | AesDerivedKeyParams | HmacImportParams | HkdfParams | Pbkdf2Params, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKey>;
  // encrypt(algorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams, key: CryptoKey, data: BufferSource): Promise<ArrayBuffer>;
  // exportKey(format: 'jwk', key: CryptoKey): Promise<JsonWebKey>;
  // exportKey(format: Exclude<KeyFormat, 'jwk'>, key: CryptoKey): Promise<ArrayBuffer>;
  // generateKey(algorithm: RsaHashedKeyGenParams | EcKeyGenParams, extractable: boolean, keyUsages: ReadonlyArray<KeyUsage>): Promise<CryptoKeyPair>;
  // generateKey(algorithm: AesKeyGenParams | HmacKeyGenParams | Pbkdf2Params, extractable: boolean, keyUsages: ReadonlyArray<KeyUsage>): Promise<CryptoKey>;
  // generateKey(algorithm: AlgorithmIdentifier, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKeyPair | CryptoKey>;
  // unwrapKey(format: KeyFormat, wrappedKey: BufferSource, unwrappingKey: CryptoKey, unwrapAlgorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams, unwrappedKeyAlgorithm: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams | HmacImportParams | AesKeyAlgorithm, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKey>;
  // wrapKey(format: KeyFormat, key: CryptoKey, wrappingKey: CryptoKey, wrapAlgorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams): Promise<ArrayBuffer>;
  //
  // The following algorithm-parameter unions are intentionally absent from the
  // live overloads because the underlying algorithms are not registered in
  // crypto-algorithm.cpp:
  //
  //   `RsaPssParams` (RSA-PSS) — sign/verify
  //   `RsaOaepParams` (RSA-OAEP) — encrypt/decrypt/wrap/unwrap
  //   `AesCtrParams`, `AesCbcParams`, `AesGcmParams`, `AesKeyAlgorithm`,
  //     `AesKeyGenParams`, `AesDerivedKeyParams` (all AES variants)
  //   `EcdhKeyDeriveParams` (ECDH) — deriveBits/deriveKey
  //   `HkdfParams`, `Pbkdf2Params` (HKDF, PBKDF2) — deriveBits/deriveKey
  //   `HmacKeyGenParams`, `RsaHashedKeyGenParams`, `EcKeyGenParams` —
  //     generateKey
}

interface HmacImportParams extends Algorithm {
  hash: HashAlgorithmIdentifier;
  length?: number;
}

interface RsaHashedImportParams extends Algorithm {
  hash: HashAlgorithmIdentifier;
}
type HashAlgorithmIdentifier = AlgorithmIdentifier;

interface EcKeyImportParams extends Algorithm {
  name: 'ECDSA';
  namedCurve: 'P-256' | 'P-384' | 'P-521';
}

/**
 * Parameter dictionary for {@linkcode SubtleCrypto.sign} and
 * {@linkcode SubtleCrypto.verify} when using ECDSA.
 */
interface EcdsaParams extends Algorithm {
  name: 'ECDSA';
  hash: HashAlgorithmIdentifier;
}

interface JsonWebKey {
  alg?: string;
  crv?: string;
  d?: string;
  dp?: string;
  dq?: string;
  e?: string;
  ext?: boolean;
  k?: string;
  key_ops?: string[];
  kty?: string;
  n?: string;
  oth?: RsaOtherPrimesInfo[];
  p?: string;
  q?: string;
  qi?: string;
  use?: string;
  x?: string;
  y?: string;
}

interface RsaOtherPrimesInfo {
  d?: string;
  r?: string;
  t?: string;
}

/**
 * The Crypto interface as [specified by WHATWG](https://w3c.github.io/webcrypto/#crypto-interface)
 * Basic cryptography features available in the current context. It allows access to a cryptographically strong random number generator and to cryptographic primitives.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Crypto | Crypto on MDN}
 * @group Web Crypto APIs
 */
interface Crypto {
  readonly subtle: SubtleCrypto;
  getRandomValues<T extends ArrayBufferView | null>(array: T): T;
  randomUUID(): string;
}

/**
 * @group Web Crypto APIs
 */
declare var Crypto: {
  prototype: Crypto;
  new (): Crypto;
};

/**
 * @group Web Crypto APIs
 */
declare var crypto: Crypto;

/**
 * The CryptoKey dictionary of the Web Crypto API represents a cryptographic key.
 * Available only in secure contexts.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/CryptoKey)
 */
interface CryptoKey {
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/CryptoKey/algorithm) */
  readonly algorithm: KeyAlgorithm;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/CryptoKey/extractable) */
  readonly extractable: boolean;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/CryptoKey/type) */
  readonly type: KeyType;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/CryptoKey/usages) */
  readonly usages: KeyUsage[];
}

declare var CryptoKey: {
  prototype: CryptoKey;
  new (): CryptoKey;
};

interface KeyAlgorithm {
  name: string;
}

type KeyFormat = 'jwk' | 'pkcs8' | 'raw' | 'spki';
type KeyType = 'private' | 'public' | 'secret';
type KeyUsage =
  | 'decrypt'
  | 'deriveBits'
  | 'deriveKey'
  | 'encrypt'
  | 'sign'
  | 'unwrapKey'
  | 'verify'
  | 'wrapKey';

/**
 * @group DOM Events
 */
interface EventInit {
  bubbles?: boolean;
  cancelable?: boolean;
  composed?: boolean;
}

/**
 * An event which takes place in the DOM.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Event)
 * @group DOM Events
 */
interface Event {
  readonly bubbles: boolean;
  readonly cancelable: boolean;
  readonly composed: boolean;
  readonly currentTarget: EventTarget | null;
  readonly defaultPrevented: boolean;
  readonly eventPhase: number;
  readonly isTrusted: boolean;
  readonly srcElement: EventTarget | null;
  readonly target: EventTarget | null;
  readonly timeStamp: DOMHighResTimeStamp;
  readonly type: string;
  returnValue: boolean;
  composedPath(): EventTarget[];
  initEvent(type: string, bubbles?: boolean, cancelable?: boolean): void;
  preventDefault(): void;
  stopImmediatePropagation(): void;
  stopPropagation(): void;
  readonly NONE: 0;
  readonly CAPTURING_PHASE: 1;
  readonly AT_TARGET: 2;
  readonly BUBBLING_PHASE: 3;
}

/**
 * @group DOM Events
 */
declare var Event: {
  prototype: Event;
  new (type: string, eventInitDict?: EventInit): Event;
  readonly NONE: 0;
  readonly CAPTURING_PHASE: 1;
  readonly AT_TARGET: 2;
  readonly BUBBLING_PHASE: 3;
};

/**
 * @group DOM Events
 */
interface CustomEventInit<T = any> extends EventInit {
  detail?: T;
}

/**
 * Events initialised by an application for any purpose.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/CustomEvent)
 * @group DOM Events
 */
interface CustomEvent<T = any> extends Event {
  readonly detail: T;
}

/**
 * @group DOM Events
 */
declare var CustomEvent: {
  prototype: CustomEvent;
  new <T>(type: string, eventInitDict?: CustomEventInit<T>): CustomEvent<T>;
};

/**
 * @group DOM Events
 */
interface EventListener {
  (evt: Event): void;
}

/**
 * @group DOM Events
 */
interface EventListenerObject {
  handleEvent(object: Event): void;
}

/**
 * @group DOM Events
 */
type EventListenerOrEventListenerObject = EventListener | EventListenerObject;

/**
 * @group DOM Events
 */
interface EventListenerOptions {
  capture?: boolean;
}

/**
 * @group DOM Events
 */
interface AddEventListenerOptions extends EventListenerOptions {
  once?: boolean;
  passive?: boolean;
  signal?: AbortSignal;
}

/**
 * EventTarget is an interface implemented by objects that can receive events and may have listeners for them.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/EventTarget)
 * @group DOM Events
 */
interface EventTarget {
  addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean,
  ): void;
  dispatchEvent(event: Event): boolean;
  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean,
  ): void;
}

/**
 * @group DOM Events
 */
declare var EventTarget: {
  prototype: EventTarget;
  new (): EventTarget;
};

/**
 * Provides access to performance-related information for the current page. It's part of the High Resolution Time API, but is enhanced by the Performance Timeline API, the Navigation Timing API, the User Timing API, and the Resource Timing API.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Performance)
 * @group Performance APIs
 */
interface Performance extends EventTarget {
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Performance/timeOrigin) */
  readonly timeOrigin: DOMHighResTimeStamp;
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Performance/now) */
  now(): DOMHighResTimeStamp;
}

/**
 * @group Performance APIs
 */
declare var Performance: {
  prototype: Performance;
  new (): Performance;
};

/**
 * @group Performance APIs
 */
declare var performance: Performance;

type DOMHighResTimeStamp = number;

// ---------------------------------------------------------------------------
// Abort API
// ---------------------------------------------------------------------------

/**
 * @group Abort API
 */
interface AbortSignalEventMap {
  abort: Event;
}

/**
 * A signal object that allows you to communicate with a request and abort it
 * if required via an {@linkcode AbortController}.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/AbortSignal)
 * @group Abort API
 */
interface AbortSignal extends EventTarget {
  /** Whether the request has been aborted. */
  readonly aborted: boolean;
  /** The reason the signal aborted, if any. */
  readonly reason: any;
  onabort: ((this: AbortSignal, ev: Event) => any) | null;
  /** Throws the signal's abort `reason` if the signal has been aborted. */
  throwIfAborted(): void;
}

/**
 * @group Abort API
 */
declare var AbortSignal: {
  prototype: AbortSignal;
  new (): AbortSignal;
  /** Returns an `AbortSignal` instance that is already aborted. */
  abort(reason?: any): AbortSignal;
  /** Returns an `AbortSignal` that aborts after `milliseconds` have elapsed. */
  timeout(milliseconds: number): AbortSignal;
  /** Returns an `AbortSignal` that aborts when any of the supplied signals abort. */
  any(signals: AbortSignal[]): AbortSignal;
};

/**
 * A controller object that allows you to abort one or more requests as
 * desired through an associated {@linkcode AbortSignal}.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/AbortController)
 * @group Abort API
 */
interface AbortController {
  /** The {@linkcode AbortSignal} associated with this controller. */
  readonly signal: AbortSignal;
  /** Causes the signal to transition to its aborted state. */
  abort(reason?: any): void;
}

/**
 * @group Abort API
 */
declare var AbortController: {
  prototype: AbortController;
  new (): AbortController;
};

// ---------------------------------------------------------------------------
// Encoding API (TextEncoder / TextDecoder)
// ---------------------------------------------------------------------------

/**
 * @group Encoding API
 */
interface TextDecoderOptions {
  fatal?: boolean;
  ignoreBOM?: boolean;
}

/**
 * @group Encoding API
 */
interface TextDecodeOptions {
  stream?: boolean;
}

/**
 * Decodes a stream of bytes (e.g. {@linkcode ArrayBuffer} or
 * {@linkcode Uint8Array}) into a string using a given encoding.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/TextDecoder)
 * @group Encoding API
 */
interface TextDecoder {
  readonly encoding: string;
  readonly fatal: boolean;
  readonly ignoreBOM: boolean;
  decode(input?: BufferSource, options?: TextDecodeOptions): string;
}

/**
 * @group Encoding API
 */
declare var TextDecoder: {
  prototype: TextDecoder;
  new (label?: string, options?: TextDecoderOptions): TextDecoder;
};

/**
 * @group Encoding API
 */
interface TextEncoderEncodeIntoResult {
  read: number;
  written: number;
}

/**
 * Encodes a string into a stream of UTF-8 bytes.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/TextEncoder)
 * @group Encoding API
 */
interface TextEncoder {
  /** Always `"utf-8"`. */
  readonly encoding: string;
  encode(input?: string): Uint8Array;
  encodeInto(source: string, destination: Uint8Array): TextEncoderEncodeIntoResult;
}

/**
 * @group Encoding API
 */
declare var TextEncoder: {
  prototype: TextEncoder;
  new (): TextEncoder;
};

// ---------------------------------------------------------------------------
// Blob / File / FormData
// ---------------------------------------------------------------------------

/**
 * @group File API
 */
type EndingType = 'native' | 'transparent';

/**
 * @group File API
 */
type BlobPart = BufferSource | Blob | string;

/**
 * @group File API
 */
interface BlobPropertyBag {
  endings?: EndingType;
  type?: string;
}

/**
 * A file-like object of immutable, raw data. Blobs represent data that isn't
 * necessarily in a JavaScript-native format.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Blob)
 * @group File API
 */
interface Blob {
  readonly size: number;
  readonly type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
  bytes(): Promise<Uint8Array>;
  slice(start?: number, end?: number, contentType?: string): Blob;
  stream(): ReadableStream<Uint8Array>;
  text(): Promise<string>;
}

/**
 * @group File API
 */
declare var Blob: {
  prototype: Blob;
  new (blobParts?: BlobPart[], options?: BlobPropertyBag): Blob;
};

/**
 * @group File API
 */
interface FilePropertyBag extends BlobPropertyBag {
  lastModified?: number;
}

/**
 * Provides information about files and allows JavaScript to access their
 * content.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/File)
 * @group File API
 */
interface File extends Blob {
  readonly lastModified: number;
  readonly name: string;
}

/**
 * @group File API
 */
declare var File: {
  prototype: File;
  new (fileBits: BlobPart[], fileName: string, options?: FilePropertyBag): File;
};

/**
 * @group File API
 */
type FormDataEntryValue = File | string;

/**
 * Provides a way to easily construct a set of key/value pairs representing
 * form fields and their values.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/FormData)
 * @group File API
 */
interface FormData {
  append(name: string, value: string | Blob, fileName?: string): void;
  delete(name: string): void;
  get(name: string): FormDataEntryValue | null;
  getAll(name: string): FormDataEntryValue[];
  has(name: string): boolean;
  set(name: string, value: string | Blob, fileName?: string): void;
  forEach(
    callbackfn: (value: FormDataEntryValue, key: string, parent: FormData) => void,
    thisArg?: any,
  ): void;
  entries(): IterableIterator<[string, FormDataEntryValue]>;
  keys(): IterableIterator<string>;
  values(): IterableIterator<FormDataEntryValue>;
  [Symbol.iterator](): IterableIterator<[string, FormDataEntryValue]>;
}

/**
 * @group File API
 */
declare var FormData: {
  prototype: FormData;
  new (): FormData;
};

0;
