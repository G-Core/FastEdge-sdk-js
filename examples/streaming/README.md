[← Back to examples](../README.md)

# Streaming Response

Generates a response body on the fly — five text chunks, one every 200 ms — using a
`ReadableStream` passed to the `Response` constructor. Each chunk flows to the client as it
is enqueued, not all at once at the end.

Demonstrates `ReadableStream` construction with an async `start()` callback, `TextEncoder`,
and `setTimeout` for per-chunk delays.

## Testing the streaming behaviour

```sh
curl -N https://<your-app>.fastedge.cdn.gc.onl/
```

`-N` disables curl's client-side buffering; without it you won't see chunks appear one at a
time. You should see `chunk 0`…`chunk 4` print at ~200ms intervals.

## Other streaming patterns

- **Pass-through streaming** — `new Response(upstreamResponse.body, { ... })` returns an
  upstream fetch body without buffering.
- **Transform streaming** — `upstreamResponse.body.pipeThrough(new TransformStream({ ... }))`
  to rewrite chunks in flight.
- **Service lifetime** — when the response body is a stream originating in the service (as
  here), the service is kept alive until the stream closes. When the body is a stream from a
  backend fetch, the service is not kept alive for body completion. Use
  [`FetchEvent.waitUntil()`](https://developer.mozilla.org/docs/Web/API/FetchEvent/waitUntil)
  if you need the service to outlive the response.

## Related

Mirror of `FastEdge-sdk-rust/examples/http/wasi/streaming/`.
