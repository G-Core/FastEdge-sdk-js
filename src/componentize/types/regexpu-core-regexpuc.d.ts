/* eslint-disable import-x/no-default-export, import-x/unambiguous */
declare module 'regexpu-core' {
  const regexpuc: (pattern: string, flags: string, options: Record<string, string>) => string;
  export default regexpuc;
}
