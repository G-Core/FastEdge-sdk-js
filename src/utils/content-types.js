import { colorLog } from 'src/utils/prompts';

const textFormats = [
  // Order is important
  { test: /.txt$/, contentType: 'text/plain' },
  { test: /.htm(l)?$/, contentType: 'text/html' },
  { test: /.xml$/, contentType: 'application/xml' },
  { test: /.json$/, contentType: 'application/json' },
  { test: /.map$/, contentType: 'application/json' },
  { test: /.js$/, contentType: 'application/javascript' },
  { test: /.css$/, contentType: 'text/css' },
  { test: /.svg$/, contentType: 'image/svg+xml' },
];

const binaryFormats = [
  // Order is important
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

const defaultContentTypes = [
  // todo: farq: pretty certain I can remove this text: boolean - kvStore implementation
  ...textFormats.map((contentType) => ({ ...contentType, text: true })),
  ...binaryFormats.map((contentType) => ({ ...contentType, text: false })),
];

function getDefaultContentTypes() {
  return defaultContentTypes;
}

function getKnownContentTypes(customContentTypes) {
  const finalContentTypes = [];

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

      // KvStore Implmentation ??
      // if ('text' in contentType && typeof contentType.text !== 'boolean') {
      //   console.log(`⚠️ Ignoring contentTypes[${index}]: optional 'text' must be a boolean value.`);
      //   invalid = true;
      // }

      if (!invalid) {
        // KvStore Implementation ??
        // const contentTypeDef = {
        //   test: contentType.test,
        //   contentType: contentType.contentType,
        // };
        // if (contentType.text != null) {
        //   contentTypeDef.text = contentType.text;
        // }
        // finalContentTypes.push(contentTypeDef);
        finalContentTypes.push({
          test: contentType.test,
          contentType: contentType.contentType,
        });
      }
    }
  }

  colorLog('caution', `Applying ${finalContentTypes.length} custom content type(s).`);

  // Order matters, the earlier ones have higher precedence.
  // hence customContentTypes first followed by specifically ordered defaultContentTypes
  for (const contentType of defaultContentTypes) {
    finalContentTypes.push(contentType);
  }

  return finalContentTypes;
}

function testFileContentType(contentTypes, assetKey) {
  for (const contentType of contentTypes ?? defaultContentTypes) {
    let matched = false;
    contentType.test instanceof RegExp
      ? (matched = contentType.test.test(assetKey))
      : (matched = contentType.test(assetKey));

    if (matched) {
      // KvStore Implementation ??
      // return { contentType: contentType.contentType, text: Boolean(contentType.text ?? false) };
      return { contentType: contentType.contentType };
    }
  }
  return null;
}

export { getKnownContentTypes, testFileContentType };
