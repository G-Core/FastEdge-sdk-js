export default {
  moduleDirectories: ['node_modules'],
  moduleNameMapper: {
    '^~utils/(.*)$': '<rootDir>/src/utils/$1',
    '^~fastedge-build/(.*)$': '<rootDir>/src/fastedge-build/$1',
    '^~fastedge-init/(.*)$': '<rootDir>/src/fastedge-init/$1',
    '^~static-server/(.*)$': '<rootDir>/src/static-server/$1',
    '^~constants/(.*)$': '<rootDir>/src/constants/$1',
  },
  rootDir: process.cwd(),
  testEnvironment: 'node',
  testPathIgnorePatterns: ['node_modules', 'dist', 'docs', 'runtime/StarlingMonkey/'],
  testTimeout: 7000,
  transform: {
    '^.+\\.(js)$': 'babel-jest',
  },
  verbose: true,
};
