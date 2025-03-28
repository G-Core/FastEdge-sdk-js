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
   * Information about the downstream client that made the request
   */
  readonly client: ClientInfo;
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
 */
declare interface ClientInfo {
  /**
   * A string representation of the IPv4 or IPv6 address of the downstream client.
   */
  readonly address: string;
  readonly tlsJA3MD5: string;
  readonly tlsCipherOpensslName: string;
  readonly tlsProtocol: string;
  readonly tlsClientCertificate: ArrayBuffer;
  readonly tlsClientHello: ArrayBuffer;
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
declare type BodyInit = ReadableStream | ArrayBufferView | ArrayBuffer | URLSearchParams | string;

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
  // blob(): Promise<Blob>;
  // formData(): Promise<FormData>;
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
 * This contains information to send along with the request (Headers, body, etc...), as well as
 * Fastly specific information.
 * @group Fetch API
 */
declare interface RequestInit {
  /** A BodyInit object or null to set request's body. */
  body?: BodyInit | null;
  // /** A string indicating how the request will interact with the browser's cache to set request's cache. */
  // cache?: RequestCache;
  // /** A string indicating whether credentials will be sent with the request always, never, or only when sent to a same-origin URL. Sets request's credentials. */
  // credentials?: RequestCredentials;
  /** A Headers object, an object literal, or an array of two-item arrays to set request's headers. */
  headers?: HeadersInit;
  // /** A cryptographic hash of the resource to be fetched by request. Sets request's integrity. */
  // integrity?: string;
  // /** A boolean to set request's keepalive. */
  // keepalive?: boolean;
  /** A string to set request's method. */
  method?: string;
  // /** A string to indicate whether the request will use CORS, or will be restricted to same-origin URLs. Sets request's mode. */
  // mode?: RequestMode;
  // /** A string indicating whether request follows redirects, results in an error upon encountering a redirect, or returns the redirect (in an opaque fashion). Sets request's redirect. */
  // redirect?: RequestRedirect;
  // /** A string whose value is a same-origin URL, "about:client", or the empty string, to set request's referrer. */
  // referrer?: string;
  // /** A referrer policy to set request's referrerPolicy. */
  // referrerPolicy?: ReferrerPolicy;
  // /** An AbortSignal to set request's signal. */
  // signal?: AbortSignal | null;
  // /** Can only be null. Used to disassociate request from any Window. */
  // window?: null;

  /** The Fastly configured backend the request should be sent to. */
  backend?: string;
  cacheOverride?: import('fastly:cache-override').CacheOverride;
  cacheKey?: string;
  fastly?: {
    decompressGzip?: boolean;
  };
  manualFramingHeaders?: boolean;
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
  // /** Returns the cache mode associated with request, which is a string indicating how the request will interact with the browser's cache when fetching. */
  // readonly cache: RequestCache;
  // /** Returns the credentials mode associated with request, which is a string indicating whether credentials will be sent with the request always, never, or only when sent to a same-origin URL. */
  // readonly credentials: RequestCredentials;
  // /** Returns the kind of resource requested by request, e.g., "document" or "script". */
  // readonly destination: RequestDestination;
  /** Returns a Headers object consisting of the headers associated with request. */
  readonly headers: Headers;
  // /** Returns request's subresource integrity metadata, which is a cryptographic hash of the resource being fetched. Its value consists of multiple hashes separated by whitespace. [SRI] */
  // readonly integrity: string;
  // /** Returns a boolean indicating whether or not request can outlive the global in which it was created. */
  // readonly keepalive: boolean;
  /** Returns request's HTTP method, which is "GET" by default. */
  readonly method: string;
  // /** Returns the mode associated with request, which is a string indicating whether the request will use CORS, or will be restricted to same-origin URLs. */
  // readonly mode: RequestMode;
  // /** Returns the redirect mode associated with request, which is a string indicating how redirects for the request will be handled during fetching. A request will follow redirects by default. */
  // readonly redirect: RequestRedirect;
  // /** Returns the referrer of request. Its value can be a same-origin URL if explicitly set in init, the empty string to indicate no referrer, and "about:client" when defaulting to the global's default. This is used during fetching to determine the value of the `Referer` header of the request being made. */
  // readonly referrer: string;
  // /** Returns the referrer policy associated with request. This is used during fetching to compute the value of the request's referrer. */
  // readonly referrerPolicy: ReferrerPolicy;
  // /** Returns the signal associated with request, which is an AbortSignal object indicating whether or not request has been aborted, and its abort event handler. */
  // readonly signal: AbortSignal;
  /** Returns the URL of request as a string. */
  readonly url: string;

  // /** Creates a copy of the current Request object. */
  clone(): Request;

  // Fastly extensions
  backend?: string;
  setCacheOverride(override: import('fastly:cache-override').CacheOverride): void;
  setCacheKey(key: string): void;
  setManualFramingHeaders(manual: boolean): void;
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
  manualFramingHeaders?: boolean;
}

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
  // readonly redirected: boolean;
  readonly status: number;
  readonly statusText: string;
  // readonly type: ResponseType;
  readonly url: string;
  /**
   * Fastly-specific property - obtain the IP address used for the request
   *
   * Undefined for user-created responses and when the response is returned from the cache.
   * Set cacheOverride: new CacheOverride("pass") to ensure a value.
   */
  readonly ip: string | undefined;
  /**
   * Fastly-specific property - Obtain the port used for the request
   *
   * Undefined for user-created responses and when the response is returned from the cache.
   * Set cacheOverride: new CacheOverride("pass") to ensure a value.
   */
  readonly port: number | undefined;
  // clone(): Response;
  setManualFramingHeaders(manual: boolean): void;
}

/**
 * @group Fetch API
 */
declare var Response: {
  prototype: Response;
  new (body?: BodyInit | null, init?: ResponseInit): Response;
  // error(): Response;
  redirect(url: string | URL, status?: number): Response;
  json(data: any, init?: ResponseInit): Response;
};

/**
 * @group Streams API
 */
type ReadableStreamReader<T> = ReadableStreamDefaultReader<T>;
// type ReadableStreamReader<T> = ReadableStreamDefaultReader<T> | ReadableStreamBYOBReader;
/**
 * @group Streams API
 */
type ReadableStreamController<T> = ReadableStreamDefaultController<T>;
// type ReadableStreamController<T> = ReadableStreamDefaultController<T> | ReadableByteStreamController;

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
 * @group Streams API
 */
interface StreamPipeOptions {
  preventAbort?: boolean;
  preventCancel?: boolean;
  /**
   * Pipes this readable stream to a given writable stream destination. The way in which the piping process behaves under various error conditions can be customized with a number of passed options. It returns a promise that fulfills when the piping process completes successfully, or rejects if any errors were encountered.
   *
   * Piping a stream will lock it for the duration of the pipe, preventing any other consumer from acquiring a reader.
   *
   * Errors and closures of the source and destination streams propagate as follows:
   *
   * An error in this source readable stream will abort destination, unless preventAbort is truthy. The returned promise will be rejected with the source's error, or with any error that occurs during aborting the destination.
   *
   * An error in destination will cancel this source readable stream, unless preventCancel is truthy. The returned promise will be rejected with the destination's error, or with any error that occurs during canceling the source.
   *
   * When this source readable stream closes, destination will be closed, unless preventClose is truthy. The returned promise will be fulfilled once this process completes, unless an error is encountered while closing the destination, in which case it will be rejected with that error.
   *
   * If destination starts out closed or closing, this source readable stream will be canceled, unless preventCancel is true. The returned promise will be rejected with an error indicating piping to a closed stream failed, or with any error that occurs during canceling the source.
   *
   * The signal option can be set to an AbortSignal to allow aborting an ongoing pipe operation via the corresponding AbortController. In this case, this source readable stream will be canceled, and destination aborted, unless the respective options preventCancel or preventAbort are set.
   */
  preventClose?: boolean;
  // signal?: AbortSignal;
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
   * Creates a new ByteLengthQueuingStrategy with the provided high water mark.
   *
   * Note that the provided high water mark will not be validated ahead of time. Instead, if it is negative, NaN, or not a number, the resulting ByteLengthQueuingStrategy will cause the corresponding stream constructor to throw.
   */
  highWaterMark: number;
}

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
 * **Note**: Fastly Compute requires all outgoing requests to go to a predefined
 * {@link https://developer.fastly.com/reference/glossary#term-backend | backend}, passed in
 * via the {@link RequestInit.backend | backend} property on the `init` object.
 *
 * **Note**: Can only be used when processing requests, not during build-time initialization.
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
type Transferable = ArrayBuffer;
// type Transferable = ArrayBuffer | MessagePort | ImageBitmap;

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
  // decrypt(algorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams, key: CryptoKey, data: BufferSource): Promise<ArrayBuffer>;
  // deriveBits(algorithm: AlgorithmIdentifier | EcdhKeyDeriveParams | HkdfParams | Pbkdf2Params, baseKey: CryptoKey, length: number): Promise<ArrayBuffer>;
  // deriveKey(algorithm: AlgorithmIdentifier | EcdhKeyDeriveParams | HkdfParams | Pbkdf2Params, baseKey: CryptoKey, derivedKeyType: AlgorithmIdentifier | AesDerivedKeyParams | HmacImportParams | HkdfParams | Pbkdf2Params, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKey>;
  digest(algorithm: AlgorithmIdentifier, data: BufferSource): Promise<ArrayBuffer>;
  // encrypt(algorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams, key: CryptoKey, data: BufferSource): Promise<ArrayBuffer>;
  // exportKey(format: "jwk", key: CryptoKey): Promise<JsonWebKey>;
  // exportKey(format: Exclude<KeyFormat, "jwk">, key: CryptoKey): Promise<ArrayBuffer>;
  // generateKey(algorithm: RsaHashedKeyGenParams | EcKeyGenParams, extractable: boolean, keyUsages: ReadonlyArray<KeyUsage>): Promise<CryptoKeyPair>;
  // generateKey(algorithm: AesKeyGenParams | HmacKeyGenParams | Pbkdf2Params, extractable: boolean, keyUsages: ReadonlyArray<KeyUsage>): Promise<CryptoKey>;
  // generateKey(algorithm: AlgorithmIdentifier, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKeyPair | CryptoKey>;
  // importKey(format: "jwk", keyData: JsonWebKey, algorithm: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams | HmacImportParams | AesKeyAlgorithm, extractable: boolean, keyUsages: ReadonlyArray<KeyUsage>): Promise<CryptoKey>;
  importKey(
    format: 'jwk',
    keyData: JsonWebKey,
    algorithm: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams,
    extractable: boolean,
    keyUsages: ReadonlyArray<KeyUsage>,
  ): Promise<CryptoKey>;
  importKey(
    format: Exclude<KeyFormat, 'jwk'>,
    keyData: BufferSource,
    algorithm:
      | AlgorithmIdentifier
      | RsaHashedImportParams
      // | EcKeyImportParams
      | HmacImportParams,
    // | AesKeyAlgorithm
    extractable: boolean,
    keyUsages: KeyUsage[],
  ): Promise<CryptoKey>;
  // sign(algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams, key: CryptoKey, data: BufferSource): Promise<ArrayBuffer>;
  sign(algorithm: AlgorithmIdentifier, key: CryptoKey, data: BufferSource): Promise<ArrayBuffer>;
  // unwrapKey(format: KeyFormat, wrappedKey: BufferSource, unwrappingKey: CryptoKey, unwrapAlgorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams, unwrappedKeyAlgorithm: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams | HmacImportParams | AesKeyAlgorithm, extractable: boolean, keyUsages: KeyUsage[]): Promise<CryptoKey>;
  // verify(algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams, key: CryptoKey, signature: BufferSource, data: BufferSource): Promise<boolean>;
  verify(
    algorithm: AlgorithmIdentifier,
    key: CryptoKey,
    signature: BufferSource,
    data: BufferSource,
  ): Promise<boolean>;
  // wrapKey(format: KeyFormat, key: CryptoKey, wrappingKey: CryptoKey, wrapAlgorithm: AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams): Promise<ArrayBuffer>;
}

interface HmacImportParams extends Algorithm {
  hash: HashAlgorithmIdentifier;
  length?: number;
}

interface RsaHashedImportParams extends Algorithm {
  hash: HashAlgorithmIdentifier;
}
type HashAlgorithmIdentifier = AlgorithmIdentifier;

interface EcKeyImportParams {
  name: 'ECDSA';
  namedCurve: 'P-256' | 'P-384' | 'P-521';
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

type KeyFormat =
  | 'jwk'
  // | "pkcs8"
  | 'raw';
// | "spki";
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
 * EventTarget is a DOM interface implemented by objects that can receive events and may have listeners for them.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/EventTarget)
 * @group DOM Events
 */
interface EventTarget {
  //addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void;
  //dispatchEvent(event: Event): boolean;
  //removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void;
}

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
0;
