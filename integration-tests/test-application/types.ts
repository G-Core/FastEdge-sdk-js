export interface CheckContext {
  buildSha: string;
}

export interface HandlerModule {
  route: string;
  handler: (req: Request) => Promise<Response>;
}

export interface CheckModule {
  name: string;
  check: (appUrl: string, ctx: CheckContext) => Promise<void>;
}
