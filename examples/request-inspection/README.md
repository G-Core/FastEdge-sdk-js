[← Back to examples](../README.md)

# Request Inspection

Echoes the request method, URL, downstream client address, and all headers to the response body
as plain text. Useful for debugging and understanding what a FastEdge handler receives.

Demonstrates reading `event.request` (method, url, headers) and `event.client.address` from the
`FetchEvent`.
