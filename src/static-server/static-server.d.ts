import type { StaticAsset } from './assets/static-asset-types.d.ts';
import type { ContentCompressionTypes } from '../constants/compression.js';

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
export type { PublisherServerConfigNormalized } from '../types/config-normalized.js';
