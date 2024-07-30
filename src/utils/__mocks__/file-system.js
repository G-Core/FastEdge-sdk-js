import path from 'node:path';

const npxPackagePath = (filePath) => path.join('root_dir', filePath);

const getTmpDir = async () => 'tmp_dir';

const resolveTmpDir = (filePath) => path.join('temp_root', 'temp.bundle.js');

export { getTmpDir, npxPackagePath, resolveTmpDir };
