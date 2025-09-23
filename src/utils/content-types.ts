import { colorLog } from '~utils/color-log.ts';

/**
 * Represents a content type definition.
 */
interface ContentTypeDefinition {
  test: RegExp | ((assetKey: string) => boolean);
  contentType: string;
  isText: boolean;
}

/**
 * Text-based content types.
 */
const textFormats: ContentTypeDefinition[] = [
  { test: /.txt$/u, contentType: 'text/plain', isText: true },
  { test: /.htm(l)?$/u, contentType: 'text/html', isText: true },
  { test: /.xml$/u, contentType: 'application/xml', isText: true },
  { test: /.json$/u, contentType: 'application/json', isText: true },
  { test: /.map$/u, contentType: 'application/json', isText: true },
  { test: /.js$/u, contentType: 'application/javascript', isText: true },
  { test: /.ts$/u, contentType: 'application/typescript', isText: true },
  { test: /.css$/u, contentType: 'text/css', isText: true },
  { test: /.svg$/u, contentType: 'image/svg+xml', isText: true },
];

/**
 * Binary-based content types.
 */
const binaryFormats: ContentTypeDefinition[] = [
  { test: /.bmp$/u, contentType: 'image/bmp', isText: false },
  { test: /.png$/u, contentType: 'image/png', isText: false },
  { test: /.gif$/u, contentType: 'image/gif', isText: false },
  { test: /.jp(e)?g$/u, contentType: 'image/jpeg', isText: false },
  { test: /.ico$/u, contentType: 'image/vnd.microsoft.icon', isText: false },
  { test: /.tif(f)?$/u, contentType: 'image/png', isText: false },
  { test: /.aac$/u, contentType: 'audio/aac', isText: false },
  { test: /.mp3$/u, contentType: 'audio/mpeg', isText: false },
  { test: /.avi$/u, contentType: 'video/x-msvideo', isText: false },
  { test: /.mp4$/u, contentType: 'video/mp4', isText: false },
  { test: /.mpeg$/u, contentType: 'video/mpeg', isText: false },
  { test: /.webm$/u, contentType: 'video/webm', isText: false },
  { test: /.pdf$/u, contentType: 'application/pdf', isText: false },
  { test: /.tar$/u, contentType: 'application/x-tar', isText: false },
  { test: /.zip$/u, contentType: 'application/zip', isText: false },
  { test: /.eot$/u, contentType: 'application/vnd.ms-fontobject', isText: false },
  { test: /.otf$/u, contentType: 'font/otf', isText: false },
  { test: /.ttf$/u, contentType: 'font/ttf', isText: false },
  { test: /.woff$/u, contentType: 'font/woff', isText: false },
  { test: /.woff2$/u, contentType: 'font/woff2', isText: false },
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
          isText: Boolean(contentType.isText),
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
): { contentType: string; isText: boolean } | null {
  for (const contentType of contentTypes ?? defaultContentTypes) {
    const _assetKey = assetKey.toLowerCase();
    let matched = false;
    contentType.test instanceof RegExp
      ? (matched = contentType.test.test(_assetKey))
      : (matched = contentType.test(_assetKey));

    if (matched) {
      return { contentType: contentType.contentType, isText: contentType.isText };
    }
  }
  return null;
}

export { getKnownContentTypes, testFileContentType };
export type { ContentTypeDefinition };
