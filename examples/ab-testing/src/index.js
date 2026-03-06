import { getEnv } from 'fastedge::env';

const testConfig = {
  logo: [
    { variant: 'hops', weight: 50 },
    { variant: 'bottle', weight: 50 },
  ],
  font: [
    { variant: 'exo2', weight: 40 },
    { variant: 'gloria', weight: 65 },
    { variant: 'standard', weight: 45 },
  ],
};

async function eventHandler({ request }) {
  const [xid, slicedHeaders] = sliceAbTestIdFromCookie(request);

  const headers = createAbTestHeaders(slicedHeaders, testConfig, xid);

  // This is the URL of the downstream service - i.e. could be a url to your origin
  // e.g. https://template-invoice-ab-test-123456.fastedge.cdn.gc.onl/
  const downstreamUrl = getEnv('DOWNSTREAM_URL');

  const response = await fetch(downstreamUrl, { headers });

  // Request/Response Headers are immutable, so we need to create a new Headers object
  const resHeaders = new Headers(response.headers);
  resHeaders.set('set-cookie', `x-fastedge-abid=${xid}; Max-Age: 31536000; Path=/;`);

  return new Response(response.body, {
    status: response.status,
    headers: resHeaders,
  });
}

addEventListener('fetch', (event) => {
  event.respondWith(eventHandler(event));
});

const sliceAbTestIdFromCookie = ({ headers: reqHeaders }) => {
  // Request/Response Headers are immutable, so we need to create a new Headers object
  const headers = new Headers(reqHeaders);
  const cookie = headers.get('cookie') || '';
  // Read the existing `xid` cookie value.
  const xid = (cookie.match(/(?:^|;) *x-fastedge-abid=((0|1|)\.\d+) *(?:;|$)/) || [])[1];
  if (xid) {
    // Request contains A/B cookie, hide it from the origin
    const newCookie = cookie.replace(/x-fastedge-abid=[^;]+;?\s*/g, '');
    if (newCookie) {
      headers.set('cookie', newCookie);
    } else {
      headers.delete('cookie');
    }
    return [xid, headers];
  }
  const randomXid = `${Math.random()}`.slice(1, 5);
  // Request does not contain A/B cookie, return random number
  return [randomXid, headers];
};

const forceWeightsToPercentages = (testValues) => {
  let total = testValues.reduce((acc, { weight }) => acc + weight, 0);
  return testValues.map(({ variant, weight }) => ({
    variant,
    percentage: (weight / total) * 100,
  }));
};

const createAbTestHeaders = (reqHeaders, testConfig, xid) => {
  const headers = new Headers(reqHeaders);
  Object.keys(testConfig).forEach((testName) => {
    const xidPercentage = parseFloat(xid) * 100;
    const testValues = forceWeightsToPercentages(testConfig[testName]);
    let start = 0;
    for (const { variant, percentage } of testValues) {
      const end = start + percentage;
      if (xidPercentage >= start && xidPercentage < end) {
        headers.set(`ab-test-${testName}`, variant);
        break;
      }
      start = end;
    }
  });
  return headers;
};
