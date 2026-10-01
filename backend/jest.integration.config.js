/**
 * Jest configuration for the backend INTEGRATION tests (test/integration/*.int-spec.ts).
 *
 * They boot the real Nest app modules (guard, OData engine, entity sets, services)
 * against a real PostgreSQL database named by DATABASE_URL. The database name must
 * end in `_test`: the suite truncates every table between tests. The global setup
 * applies the Prisma migrations (`prisma migrate deploy`) before the first test.
 *
 *   DATABASE_URL=postgresql://lodestar:lodestar-dev-only@localhost:5432/lodestar_test npm run test:int
 *
 * See docs/QA.md (Integration tests) for local and CI provisioning.
 */
const unit = require('./jest.config');

module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  roots: ['<rootDir>/test/integration'],
  testMatch: ['**/*.int-spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: unit.transform,
  moduleNameMapper: unit.moduleNameMapper,
  globalSetup: '<rootDir>/test/integration/global-setup.js',
  // One database: the specs must not run in parallel.
  maxWorkers: 1,
  testTimeout: 60_000,
  collectCoverageFrom: unit.collectCoverageFrom,
  coverageDirectory: '<rootDir>/coverage-int',
  coverageReporters: ['lcov', 'text-summary', 'json-summary'],
};
