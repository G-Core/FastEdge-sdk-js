import { readFileSync } from 'fastedge::fs';

import { createEmbeddedStoreEntry } from './embedded-store-entry.ts';

import type { StaticAsset, StaticAssetMetadata } from './static-assets.ts';
import type { ContentCompressionTypes } from '../index.ts';

/**
 * Represents the source and metadata of an asset.
 */
interface SourceAndInfo {
  source: Uint8Array;
  hash: string;
  size: number;
}

/**
 * Finds the matching source and info based on accepted encodings.
 *
 * @param acceptEncodingsGroups - The accepted encoding groups.
 * @param defaultSourceAndInfo - The default source and info.
 * @param sourceAndInfoForEncodingFn - A function to retrieve source and info for a specific encoding.
 * @returns The matching source and info along with the content encoding.
 */
const findMatchingSourceAndInfo = (
  acceptEncodingsGroups: Array<ContentCompressionTypes[]> | null,
  defaultSourceAndInfo: SourceAndInfo,
  sourceAndInfoForEncodingFn: (encoding: ContentCompressionTypes) => SourceAndInfo | null,
): { sourceAndInfo: SourceAndInfo; contentEncoding: string | null } => {
  let sourceAndInfo = defaultSourceAndInfo;
  let contentEncoding: string | null = null;

  // Compression logic (currently not implemented)
  if (acceptEncodingsGroups != null) {
    // FARQ: Compression not yet implemented...
    // for (const encodingGroup of acceptEncodingsGroups) {
    //   const sourceAndInfosForEncodingsGroup = encodingGroup
    //     .map((encoding) => ({
    //       encoding,
    //       sourceAndInfo: sourceAndInfoForEncodingFn(encoding),
    //     }))
    //     .filter((x) => x.sourceAndInfo != null) as {
    //     encoding: ContentCompressionTypes;
    //     sourceAndInfo: SourceAndInfo;
    //   }[];
    //   if (sourceAndInfosForEncodingsGroup.length === 0) {
    //     // If no encoding in this group is available then move to next group
    //     continue;
    //   }
    //   // Sort the items, putting the smallest size first
    //   sourceAndInfosForEncodingsGroup.sort(
    //     (a, b) => a.sourceAndInfo.size - b.sourceAndInfo.size
    //   );
    //   // The first item is the one we want.
    //   sourceAndInfo = sourceAndInfosForEncodingsGroup[0].sourceAndInfo;
    //   contentEncoding = sourceAndInfosForEncodingsGroup[0].encoding;
    //   break;
    // }
  }

  return { sourceAndInfo, contentEncoding };
};

/**
 * Creates an inline WASM asset.
 *
 * @param metadata - The metadata of the asset.
 * @returns An object representing the inline WASM asset.
 */
const createWasmInlineAsset = (metadata: StaticAssetMetadata): StaticAsset => {
  const _metadata = { ...metadata };
  const _sourceAndInfo: SourceAndInfo = {
    source: readFileSync(metadata.fileInfo.assetPath),
    hash: metadata.fileInfo.hash,
    size: metadata.fileInfo.size,
  };

  const getStoreEntry = async () => {
    const { sourceAndInfo, contentEncoding } = findMatchingSourceAndInfo(
      null, // Fix: acceptEncodingsGroups, :Farq: Compression not yet implemented...
      _sourceAndInfo,
      () => null, // Fix: (encoding) => this.compressedSourcesAndInfo[encoding]
    );
    const { source, hash, size } = sourceAndInfo;
    return createEmbeddedStoreEntry(source, contentEncoding, hash, size);
  };

  // const getText = () => {
  //   if (!_metadata.text) {
  //     throw new Error("Can't getText() for non-text content");
  //   }
  //   return decoder.decode(_sourceAndInfo.source);
  // };

  // const getJson = () => {
  //   const text = getText();
  //   return JSON.parse(text);
  // };

  return {
    assetKey: _metadata.assetKey,
    // assetKey: () => _metadata.assetKey,
    getMetadata: () => _metadata,
    getStoreEntry,
    // farq: I think we can remove these, everything is being inlined at present.
    // text/json/bytes etc comes from kvStore implementation
    // isLocal: () => true,
    // getBytes: () => _sourceAndInfo.source,
    // getText,
    // getJson,
    type: _metadata.type,
  };
};

export { createWasmInlineAsset };
export type { SourceAndInfo };
