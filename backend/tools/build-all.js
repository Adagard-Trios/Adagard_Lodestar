#!/usr/bin/env node
/**
 * Builds every NestJS app in the monorepo (nest build <app>), one after another,
 * and fails fast on the first error. Usage: npm run build [-- app1 app2]
 */
const { execSync } = require('child_process');

const ALL = ['auth', 'orders', 'planning', 'fleet', 'outlets', 'trips', 'sync', 'notifications', 'audit'];
const apps = process.argv.slice(2).length ? process.argv.slice(2) : ALL;

for (const app of apps) {
  console.log(`\n▶ nest build ${app}`);
  execSync(`npx nest build ${app}`, { stdio: 'inherit' });
}
console.log(`\n✔ built ${apps.length} app(s): ${apps.join(', ')}`);
