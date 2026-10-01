/**
 * Jest configuration for every backend unit test (apps, libs, prisma seed).
 * Coverage goes to backend/coverage (lcov for SonarQube, plus a text summary).
 */
module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  roots: ['<rootDir>/apps', '<rootDir>/libs', '<rootDir>/prisma', '<rootDir>/tools'],
  testMatch: ['**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '<rootDir>/apps/agent/'],
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/apps/agent/'],
  // Type errors are caught by `npm run typecheck`; tests only transpile (much faster).
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json', isolatedModules: true }],
  },
  moduleNameMapper: {
    '^@lodestar/(prisma|odata|security|platform)$': '<rootDir>/libs/$1/src',
  },
  collectCoverageFrom: [
    'apps/**/src/**/*.ts',
    'libs/**/src/**/*.ts',
    'prisma/seed/**/*.ts',
    'prisma/scenario.ts',
    '!**/*.spec.ts',
    '!**/main.ts',
    '!**/index.ts',
    '!apps/agent/**',
    '!prisma/seed/testing/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['lcov', 'text-summary', 'json-summary'],
};
