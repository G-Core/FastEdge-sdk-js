import type { AssetCacheConfig, StaticAssetManifest } from './types.ts';

import { colorLog } from '~utils/color-log.ts';
import { getKnownContentTypes, testFileContentType } from '~utils/content-types.ts';
import { createFileInfo } from '~utils/file-info.ts';
import { getFilesRecursively, resolveOsPath } from '~utils/file-system.ts';

/**
 * Create a readable string from an object on a single line.
 * @param obj - The object to stringify.
 * @returns The stringified object.
 */
function prettierObjectString(obj: object): string {
  const contentsStr = Object.entries(obj).reduce((acc, [key, value]) => {
    let strVal = value;
    if (typeof value === 'string') {
      strVal = `'${value}'`;
    } else if (typeof value === 'object') {
      if (Array.isArray(value)) {
        // This is not implemented - at present we have no arrays
      } else {
        strVal = prettierObjectString(value as Record<string, unknown>);
      }
    }
    return `${acc.length > 0 ? `${acc}, ` : ''}${key}: ${strVal}`;
  }, '');
  return `{ ${contentsStr} }`;
}

/**
 * Creates a manifest file map based on the provided configuration.
 * @param config - The configuration for creating the manifest file map.
 * @returns The static asset manifest.
 */
function createManifestFileMap(asssetCacheConfig: AssetCacheConfig): StaticAssetManifest {
  // Need to make this recursive to support multiple input paths
  const { contentTypes, ignoreDirs, ignoreDotFiles, ignorePaths, ignoreWellKnown, publicDir } =
    asssetCacheConfig;
  const publicDirPath = resolveOsPath(`./${publicDir}`);

  colorLog('info', `Using ${publicDirPath} as public directory`);

  const ignoreDirPaths = [
    ...(Array.isArray(ignoreDirs) ? ignoreDirs : []),
    ...(Array.isArray(ignorePaths) ? ignorePaths : []),
  ];

  if ((ignoreDirPaths ?? []).length > 0) {
    colorLog('info', `Ignoring directories:`);
    for (const ignoreDir of ignoreDirPaths ?? []) {
      colorLog('info', `    - ${ignoreDir}`);
    }
  }

  const files = getFilesRecursively(publicDirPath, {
    ignoreDirs: ignorePaths,
    ignoreDotFiles,
    ignoreWellKnown,
  });

  ignoreDotFiles
    ? colorLog('info', 'Removed dot files (default behavior)')
    : colorLog(
        'warning',
        'Included dot files (Caution!! - .env, .gitignore, etc. may be included)',
      );

  ignoreWellKnown
    ? colorLog('warning', 'Ignored .well-known (This may cause issues with web manifests, etc.)')
    : colorLog('info', 'Included .well-known');

  const knownContentTypes = getKnownContentTypes(contentTypes ?? []);
  colorLog('info', 'Creating build manifest...');

  const manifestAssets = files.map((file) => {
    const assetKey = file.replace(publicDirPath, '');
    let contentTypeInfo = testFileContentType(knownContentTypes, assetKey);

    if (!contentTypeInfo) {
      colorLog(
        'caution',
        `Unknown content type for ${assetKey}. Defaulting to application/octet-stream`,
      );
      contentTypeInfo = {
        contentType: 'application/octet-stream',
        isText: false,
      };
    }

    const fileInfo = createFileInfo(assetKey, publicDir, file);

    return {
      assetKey,
      ...contentTypeInfo,
      fileInfo,
      lastModifiedTime: fileInfo.lastModifiedTime,
      type: 'wasm-inline',
    };
  });

  const staticAssetManifest: StaticAssetManifest = {};

  for (const assetInfo of manifestAssets) {
    staticAssetManifest[assetInfo.assetKey] = assetInfo;
  }

  return staticAssetManifest;
}

export { createManifestFileMap, prettierObjectString };
