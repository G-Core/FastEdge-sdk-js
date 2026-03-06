[← Back to examples](../README.md)

# KV Store

This application uses query parameters to interact with a KV Store.

It will respond with the data collected as `application/json`

## Query Parameters

`store` - the name of the store you wish to open. This is the name given to a store on the application.

`action` - What you wish to perform. Options are "get", "scan", "zscan", "zrange", "bfExists". ( If no action is provided it will default to "get" )

`key` - The key you wish to access in the KV Store.

`match` - A prefix match pattern, used by "scan" and "zscan". Must include a wildcard. e.g. `foo*`

`min` / `max` - Used by zrange for defining the range of scores you wish to receive results for.

`item` - Used by Bloom Filter exists function.
