import { getEnv } from "fastedge::env";

async function eventHandler({ request }) {
  const baseOrigin = getEnv("BASE_ORIGIN");

  if (!baseOrigin) {
    return new Response("BASE_ORIGIN environment variable is not set", {
      status: 500,
    });
  }

  const countryCode = request.headers.get("geoip-country-code");

  const customOrigin = getEnv(countryCode);

  const redirectOrigin = customOrigin ?? baseOrigin;

  return Response.redirect(redirectOrigin, 302);
}

addEventListener("fetch", (event) => {
  event.respondWith(eventHandler(event));
});
