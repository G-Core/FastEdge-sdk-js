function bufferPrefixHex(buf, maxBytes = 32) {
  if (!buf || buf.byteLength === 0) {
    return null;
  }
  const view = new Uint8Array(buf, 0, Math.min(buf.byteLength, maxBytes));
  let hex = '';
  for (const byte of view) {
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex;
}

function describeBuffer(buf) {
  return {
    byteLength: buf?.byteLength ?? 0,
    firstBytesHex: bufferPrefixHex(buf),
  };
}

function app(event) {
  const { client } = event;

  const info = {
    address: client.address,
    tlsProtocol: client.tlsProtocol,
    tlsCipherOpensslName: client.tlsCipherOpensslName,
    tlsJA3MD5: client.tlsJA3MD5,
    tlsClientCertificate: describeBuffer(client.tlsClientCertificate),
    tlsClientHello: describeBuffer(client.tlsClientHello),
  };

  return Response.json(info);
}

addEventListener('fetch', (event) => {
  event.respondWith(app(event));
});
