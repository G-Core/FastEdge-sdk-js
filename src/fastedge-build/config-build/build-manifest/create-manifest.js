import path from 'node:path';

import { getKnownContentTypes, testFileContentType } from '~utils/content-types.js';
import { createFileInfo } from '~utils/file-info.js';
import { getFilesRecursively } from '~utils/file-system.js';
import { colorLog } from '~utils/prompts.js';

/**
 * Create a readable string from an object on a single line.
 * @param {Object} obj
 * @returns {string}
 */
function prettierObjectString(obj) {
  const contentsStr = Object.entries(obj).reduce((acc, [key, value]) => {
    let strVal = value;
    if (typeof value === 'string') {
      strVal = `'${value}'`;
    } else if (typeof value === 'object') {
      if (Array.isArray(value)) {
        // This is not implemented - at present we have no arrays
      } else {
        strVal = prettierObjectString(value);
      }
    }
    return `${acc.length > 0 ? `${acc}, ` : ''}${key}: ${strVal}`;
  }, '');
  return `{ ${contentsStr} }`;
}

/**
 *
 * @param {*} config
 * @returns {import('~static-server/types/assets/static-asset.js').StaticAssetManifest} staticAssetManifest
 */
function createManifestFileMap(config) {
  const publicDirPath = path.resolve(config.publicDir);

  colorLog('info', `Using ${publicDirPath} as public directory`);

  if (config.ignoreDirs.length > 0) {
    colorLog('info', `Ignoring directories:`);
    for (const ignoreDir of config.ignoreDirs) {
      colorLog('info', `    - ${ignoreDir}`);
    }
  }

  const files = getFilesRecursively(publicDirPath, {
    ignoreDirs: config.ignoreDirs,
    ignoreDotFiles: config.ignoreDotFiles,
    ignoreWellKnown: config.ignoreWellKnown,
  });
  config.ignoreDotFiles
    ? colorLog('info', 'Removed dot files (default behavior)')
    : colorLog(
        'warning',
        'Included dot files (Caution!! - .env, .gitignore, etc. may be included)',
      );

  config.ignoreWellKnown
    ? colorLog('warning', 'Ignored .well-known (This may cause issues with web manifests, etc.)')
    : colorLog('info', 'Included .well-known');

  const knownContentTypes = getKnownContentTypes(config.contentTypes);
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
      };
    }

    const fileInfo = createFileInfo(assetKey, config.publicDir, file);

    return {
      assetKey,
      ...contentTypeInfo,
      // fileInfo: createFileInfo(assetKey, config.publicDir, file),
      fileInfo,
      // todo: fix these.. to our shape
      lastModifiedTime: fileInfo.lastModifiedTime,
      type: 'wasm-inline',
    };
  });

  /**
   * @typedef {import('~static-server/types/assets/static-asset.js').StaticAssetManifest} staticAssetManifest
   */
  const staticAssetManifest = {};

  for (const assetInfo of manifestAssets) {
    // todo: Do other build things here??
    // or should the above loop become a reduce?
    staticAssetManifest[assetInfo.assetKey] = assetInfo;
  }

  console.log('Farq: createManifestFileMap -> staticAssetManifest', staticAssetManifest);
  return staticAssetManifest;
}

export { createManifestFileMap, prettierObjectString };
