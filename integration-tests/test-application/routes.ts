export const ENV            = { name: 'env',            route: '/' };
export const OUTBOUND_FETCH = { name: 'outbound fetch', route: '/fetch' };
export const SECRET         = { name: 'secret',         route: '/secret' };
export const ECHO           = { name: 'request echo',   route: '/echo' };
export const RESPONSE_CLONE = { name: 'Response.clone', route: '/response-clone' };
// Source for the Response.clone guard: serves a multi-chunk streaming body so the clone
// test can exercise a host-backed (HttpIncomingBody), multi-read body. Remove with the guard.
export const MULTI_CHUNK_SOURCE = { name: 'multi-chunk source', route: '/multi-chunk-source' };
