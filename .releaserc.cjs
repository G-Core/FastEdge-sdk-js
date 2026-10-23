const packageJson = require('./package.json');

module.exports = {
  branches: [
    '+([0-9])?(.{+([0-9]),x}).x',
    'main',
    'next',
    'next-major',
    { name: 'beta', prerelease: true },
    { name: 'alpha', prerelease: true },
  ],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/github',
      {
        assets: [
          // Release assets are named by file name alone, so vendor/ (two LICENSE files) is left
          // out; it ships in the npm package.
          ...packageJson.files
            .filter((fileGlob) => fileGlob !== 'types' && !fileGlob.startsWith('vendor/'))
            .map((fileGlob) => {
              return {
                path: fileGlob,
              };
            }),
        ],
      },
    ],
    '@semantic-release/npm',
  ],
};
