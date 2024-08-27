declare module 'fastedge::env' {
  /**
   * Function to get the value for the provided environment variable name.
   *
   * **Note**: The environment variables can only be retrieved when processing requests, not during build-time initialization.
   *
   * @param {string} name - The name of the environment variable.
   * @returns {string} The value of the environment variable.
   *
   * @example
   * ```js
   * /// <reference types="@gcoredev/fastedge-sdk-js" />
   *
   * import { getEnv } from "fastedge::env";
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
   */
  function getEnv(name: string): string;
}
