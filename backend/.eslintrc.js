/** ESLint for the NestJS backend (TypeScript). `npm run lint` must pass in CI. */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2021, sourceType: 'module' },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: { node: true, jest: true, es2021: true },
  ignorePatterns: ['dist/', 'coverage/', 'node_modules/', 'apps/agent/', '*.js'],
  rules: {
    // The codebase is deliberately loose about `any` at framework boundaries (Prisma where objects, request bodies).
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unsafe-function-type': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }],
    'no-constant-condition': ['error', { checkLoops: false }],
    eqeqeq: ['error', 'always'],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  overrides: [
    { files: ['**/*.spec.ts', 'prisma/**/*.ts', 'tools/**/*.ts'], rules: { 'no-console': 'off' } },
  ],
};
