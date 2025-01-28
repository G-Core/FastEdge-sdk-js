import path from 'node:path';

const npxPackagePath = (filePath) => path.join('root_dir', filePath);

const getTmpDir = async () => 'tmp_dir';

const resolveTmpDir = (filePath) => path.join('temp_root', 'temp.bundle.js');

const resolveOsPath = (base, providedPath) => providedPath;

const useUnixPath = (path) => path;

export { getTmpDir, npxPackagePath, resolveOsPath, resolveTmpDir, useUnixPath };
