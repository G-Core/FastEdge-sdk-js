declare module 'fastedge::secret' {
  /**
   * Function to get the value for the provided secret variable name.
   *
   * **Note**: The secret variables can only be retrieved when processing requests, not during build-time initialization.
   *
   * @param {string} name - The name of the secret variable.
   * @returns {string} The value of the secret variable.
   *
   * @example
   * ```js
   * /// <reference types="@gcoredev/fastedge-sdk-js" />
   *
   * import { getSecret } from "fastedge::secret";
   *
   * function app(event) {
   *   console.log("PASSWORD:", getSecret("PASSWORD"));
   *   console.log("SECRET_TOKEN", getSecret("SECRET_TOKEN"));
   *
   *   return new Response("", {
   *     status: 200
   *   });
   * }
   *
   * addEventListener("fetch", event => event.respondWith(app(event)));
   * ```
   */
  function getSecret(name: string): string;
}
