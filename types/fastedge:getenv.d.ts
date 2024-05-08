declare module 'feastedge::getenv' {
  /**
   * Function to get the value for the provided environment variable name.
   *
   *
   * **Note**: The environment variables can only be retrieved when processing requests, not during build-time initialization.
   *
   * @param name The name of the environment variable
   *
   * /// <reference types="@gcoredev/fastedge-sdk-js" />
   * import { getEnv } from "fastedge::getenv";
   *
   * function app(event) {
   *   console.log("HOSTNAME:", getEnv("HOSTNAME"));
   *   console.log("TRACE_ID:", getEnv("TRACE_ID"));
   *
   *   return new Response("", {
   *     status: 200
   *   });
   * }
   *
   * addEventListener("fetch", event => event.respondWith(app(event)));
   * ```
   * </noscript>
   */
  function getEnv(name: string): string;
}
