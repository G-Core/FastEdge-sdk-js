import { colorLog } from '~utils/color-log.ts';

/**
 * Represents a content type definition.
 */
interface ContentTypeDefinition {
  test: RegExp | ((assetKey: string) => boolean);
  contentType: string;
}

/**
 * Text-based content types.
 */
const textFormats: ContentTypeDefinition[] = [
  { test: /.txt$/u, contentType: 'text/plain' },
  { test: /.htm(l)?$/u, contentType: 'text/html' },
  { test: /.xml$/u, contentType: 'application/xml' },
  { test: /.json$/u, contentType: 'application/json' },
  { test: /.map$/u, contentType: 'application/json' },
  { test: /.js$/u, contentType: 'application/javascript' },
  { test: /.css$/u, contentType: 'text/css' },
  { test: /.svg$/u, contentType: 'image/svg+xml' },
];

/**
 * Binary-based content types.
 */
const binaryFormats: ContentTypeDefinition[] = [
  { test: /.bmp$/u, contentType: 'image/bmp' },
  { test: /.png$/u, contentType: 'image/png' },
  { test: /.gif$/u, contentType: 'image/gif' },
  { test: /.jp(e)?g$/u, contentType: 'image/jpeg' },
  { test: /.ico$/u, contentType: 'image/vnd.microsoft.icon' },
  { test: /.tif(f)?$/u, contentType: 'image/png' },
  { test: /.aac$/u, contentType: 'audio/aac' },
  { test: /.mp3$/u, contentType: 'audio/mpeg' },
  { test: /.avi$/u, contentType: 'video/x-msvideo' },
  { test: /.mp4$/u, contentType: 'video/mp4' },
  { test: /.mpeg$/u, contentType: 'video/mpeg' },
  { test: /.webm$/u, contentType: 'video/webm' },
  { test: /.pdf$/u, contentType: 'application/pdf' },
  { test: /.tar$/u, contentType: 'application/x-tar' },
  { test: /.zip$/u, contentType: 'application/zip' },
  { test: /.eot$/u, contentType: 'application/vnd.ms-fontobject' },
  { test: /.otf$/u, contentType: 'font/otf' },
  { test: /.ttf$/u, contentType: 'font/ttf' },
  { test: /.woff$/u, contentType: 'font/woff' },
  { test: /.woff2$/u, contentType: 'font/woff2' },
];

/**
 * Default content types combining text and binary formats.
 */
const defaultContentTypes: ContentTypeDefinition[] = [
  ...textFormats.map((contentType) => ({ ...contentType })),
  ...binaryFormats.map((contentType) => ({ ...contentType })),
];

/**
 * Retrieves the default content types.
 * @returns An array of default content type definitions.
 */
// function getDefaultContentTypes(): ContentTypeDefinition[] {
//   return defaultContentTypes;
// }

/**
 * Retrieves known content types, combining custom and default content types.
 * @param customContentTypes - Custom content types to include.
 * @returns An array of known content type definitions.
 */
function getKnownContentTypes(
  customContentTypes: ContentTypeDefinition[],
): ContentTypeDefinition[] {
  const finalContentTypes: ContentTypeDefinition[] = [];

  if (!Array.isArray(customContentTypes)) {
    colorLog('caution', 'customContentTypes not an array, ignoring.');
  } else {
    for (const [index, contentType] of customContentTypes.entries()) {
      let invalid = false;

      if (typeof contentType.test !== 'function' && !(contentType.test instanceof RegExp)) {
        colorLog(
          'caution',
          `Ignoring customContentTypes[${index}]: 'test' must be a function or regular expression.`,
        );
        invalid = true;
      }

      if (typeof contentType.contentType !== 'string' || !contentType.contentType.includes('/')) {
        colorLog(
          'caution',
          `Ignoring customContentTypes[${index}]: 'contentType' must be a valid string.`,
        );
        invalid = true;
      }

      if (!invalid) {
        finalContentTypes.push({
          test: contentType.test,
          contentType: contentType.contentType,
        });
      }
    }
  }

  if (process.env.NODE_ENV !== 'test') {
    colorLog('info', `Applying ${finalContentTypes.length} custom content type(s).`);
  }

  // Order matters: customContentTypes first, followed by defaultContentTypes
  for (const contentType of defaultContentTypes) {
    finalContentTypes.push(contentType);
  }

  return finalContentTypes;
}

/**
 * Tests the content type of a file based on its asset key.
 * @param contentTypes - The content types to test against.
 * @param assetKey - The asset key to test.
 * @returns The matched content type or `null` if no match is found.
 */
function testFileContentType(
  contentTypes: ContentTypeDefinition[] | undefined,
  assetKey: string,
): { contentType: string } | null {
  for (const contentType of contentTypes ?? defaultContentTypes) {
    const _assetKey = assetKey.toLowerCase();
    let matched = false;
    contentType.test instanceof RegExp
      ? (matched = contentType.test.test(_assetKey))
      : (matched = contentType.test(_assetKey));

    if (matched) {
      return { contentType: contentType.contentType };
    }
  }
  return null;
}

export { getKnownContentTypes, testFileContentType };
export type { ContentTypeDefinition };
