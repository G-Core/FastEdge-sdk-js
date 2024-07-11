import type { StaticAsset } from './assets/static-asset-types.d.ts';

type ContentCompressionTypes = 'br' | 'gzip';

export type AssetInit = {
  status?: number;
  headers?: Record<string, string>;
  cache?: 'extended' | 'never' | null;
};

export interface StaticServer {
  getMatchingAsset(pathname: string): StaticAsset | null;
  findAcceptEncodings(request: Request): ContentCompressionTypes[][];
  testExtendedCache(pathname: string): boolean;
  handlePreconditions(
    request: Request,
    asset: StaticAsset,
    responseHeaders: Record<string, string>,
  ): Response | null;
  serveAsset(request: Request, asset: StaticAsset, init?: AssetInit): Promise<Response>;
  serveRequest(request: Request): Promise<Response | null>;
}

export type { ContentCompressionTypes, StaticAsset };
