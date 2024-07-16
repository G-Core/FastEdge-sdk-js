import { writeFileSync } from 'node:fs';
import path from 'node:path';

import { createManifestFileMap, prettierObjectString } from './create-manifest.js';

import { createOutputDirectory } from '~utils/file-system.js';
import { colorLog } from '~utils/prompts.js';

async function createStaticManifest(config) {
  const outputFile = '.fastedge/build/static-server-manifest.js';
  const manifestBuildOutput = path.resolve(outputFile);

  await createOutputDirectory(manifestBuildOutput);

  colorLog('info', `Creating build manifest in ${manifestBuildOutput}`);

  const staticAssetManifest = await createManifestFileMap(config);

  const readableAssetLines = Object.entries(staticAssetManifest).map(
    ([key, value]) => `  '${key}': ${prettierObjectString(value)},`,
  );

  const manifestFileContents = [
    '/*',
    ' * DO NOT EDIT THIS FILE - Generated by @gcoredev/FastEdge-sdk-js',
    ' *',
    ' * It will be overwritten on the next build.',
    ' */',
    '',
    'const staticAssetManifest = {',
    ...readableAssetLines,
    '};',
    '',
    'export { staticAssetManifest  };',
    '',
  ];

  writeFileSync(manifestBuildOutput, manifestFileContents.join('\n'));
}

export { createStaticManifest };
