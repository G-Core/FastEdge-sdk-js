// / <reference types="@gcoredev/fastedge-sdk-js" />

// todo: farq: fix this types for the project
// @ts-ignore
import { readFileSync } from 'fastedge::fs';

import { createEmbeddedStoreEntry } from './embedded-store-entry';

const decoder = new TextDecoder();

// todo: farq: fix this along with compression
/**
 * Used to change out the sourceAndInfo object for the correct encoded version
 * @template SourceAndInfo
 * @param {Array<'br' | 'gzip'> | null} acceptEncodingsGroups
 * @param {SourceAndInfo} defaultSourceAndInfo
 * @param {unknown} sourceAndInfoForEncodingFn
 * @returns {{ sourceAndInfo: SourceAndInfo, contentEncoding: string | null }}
 */
const findMatchingSourceAndInfo = (
  acceptEncodingsGroups,
  defaultSourceAndInfo,
  sourceAndInfoForEncodingFn,
) => {
  const sourceAndInfo = defaultSourceAndInfo;
  const contentEncoding = null;
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
    //     sourceAndInfo: SourceAndInfo<TSource>;
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
  // Fix: sourceAndInfo ??= defaultSourceAndInfo;

  return { sourceAndInfo, contentEncoding };
};

/**
 *
 * @param {import('./static-asset-types.d.ts').StaticAssetMetadata} metadata
 * @returns
 */
const createWasmInlineAsset = (metadata) => {
  const _metadata = { ...metadata };
  const _sourceAndInfo = {
    source: readFileSync(metadata.fileInfo.staticFilePath),
    hash: metadata.fileInfo.hash,
    size: metadata.fileInfo.size,
  };

  const getStoreEntry = async () => {
    const { sourceAndInfo, contentEncoding } = findMatchingSourceAndInfo(
      null, // Fix: acceptEncodingsGroups, :Farq: Compression not yet implemented...
      _sourceAndInfo,
      () => {}, // Fix: (encoding) => this.compressedSourcesAndInfo[encoding]
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
    assetKey: () => _metadata.assetKey,
    getStoreEntry,
    // farq: I think we can remove these, everything is being inlined at present.
    // text/json/bytes etc comes from kvStore implementation
    // isLocal: () => true,
    // getBytes: () => _sourceAndInfo.source,
    // getText,
    // getJson,
    getMetadata: () => _metadata,
  };
};

export { createWasmInlineAsset };
