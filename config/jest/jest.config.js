const config = {
  moduleDirectories: ['node_modules'],
  moduleNameMapper: {
    '^~componentize/(.*)$': '<rootDir>/src/componentize/$1',
    '^~constants/(.*)$': '<rootDir>/src/constants/$1',
    '^~fastedge-assets/(.*)$': '<rootDir>/src/cli/fastedge-assets/$1',
    '^~fastedge-build/(.*)$': '<rootDir>/src/cli/fastedge-build/$1',
    '^~fastedge-init/(.*)$': '<rootDir>/src/cli/fastedge-init/$1',
    '^~static-assets/(.*)$': '<rootDir>/src/server/static-assets/$1',
    '^~utils/(.*)$': '<rootDir>/src/utils/$1',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: process.cwd(),
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    'node_modules',
    'dist',
    'docs',
    'runtime/StarlingMonkey/',
    'runtime/fastedge/deps',
  ],
  transform: {
    '^.+\\.(ts|js)$': 'babel-jest',
  },
};
export default config;
