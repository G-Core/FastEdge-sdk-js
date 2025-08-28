/* eslint-disable require-unicode-regexp */
import { colorLog } from '~utils/prompts.ts';

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
  { test: /.txt$/, contentType: 'text/plain' },
  { test: /.htm(l)?$/, contentType: 'text/html' },
  { test: /.xml$/, contentType: 'application/xml' },
  { test: /.json$/, contentType: 'application/json' },
  { test: /.map$/, contentType: 'application/json' },
  { test: /.js$/, contentType: 'application/javascript' },
  { test: /.css$/, contentType: 'text/css' },
  { test: /.svg$/, contentType: 'image/svg+xml' },
];

/**
 * Binary-based content types.
 */
const binaryFormats: ContentTypeDefinition[] = [
  { test: /.bmp$/, contentType: 'image/bmp' },
  { test: /.png$/, contentType: 'image/png' },
  { test: /.gif$/, contentType: 'image/gif' },
  { test: /.jp(e)?g$/, contentType: 'image/jpeg' },
  { test: /.ico$/, contentType: 'image/vnd.microsoft.icon' },
  { test: /.tif(f)?$/, contentType: 'image/png' },
  { test: /.aac$/, contentType: 'audio/aac' },
  { test: /.mp3$/, contentType: 'audio/mpeg' },
  { test: /.avi$/, contentType: 'video/x-msvideo' },
  { test: /.mp4$/, contentType: 'video/mp4' },
  { test: /.mpeg$/, contentType: 'video/mpeg' },
  { test: /.webm$/, contentType: 'video/webm' },
  { test: /.pdf$/, contentType: 'application/pdf' },
  { test: /.tar$/, contentType: 'application/x-tar' },
  { test: /.zip$/, contentType: 'application/zip' },
  { test: /.eot$/, contentType: 'application/vnd.ms-fontobject' },
  { test: /.otf$/, contentType: 'font/otf' },
  { test: /.ttf$/, contentType: 'font/ttf' },
  { test: /.woff$/, contentType: 'font/woff' },
  { test: /.woff2$/, contentType: 'font/woff2' },
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

  colorLog('info', `Applying ${finalContentTypes.length} custom content type(s).`);

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
    let matched = false;
    contentType.test instanceof RegExp
      ? (matched = contentType.test.test(assetKey))
      : (matched = contentType.test(assetKey));

    if (matched) {
      return { contentType: contentType.contentType };
    }
  }
  return null;
}

export { getKnownContentTypes, testFileContentType };
export type { ContentTypeDefinition };
