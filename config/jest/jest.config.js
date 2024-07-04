export default {
  moduleDirectories: ['node_modules'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
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
