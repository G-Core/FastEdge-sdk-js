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
 * A Compute specific implementation of [FetchEvent](https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent/FetchEvent).
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
