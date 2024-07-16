const removeDotSlashPrefix = (str) => str.replace(/^\.\//u, '');
const removeTrailingSlash = (str) => str.replace(/\/+$/u, '');

function normalizePath(path) {
  let normalizedPath = removeDotSlashPrefix(path);
  normalizedPath = removeTrailingSlash(normalizedPath);
  // Add a preceding slash if it does not exist
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = `/${normalizedPath}`;
  }
  return normalizedPath;
}

export { normalizePath };
