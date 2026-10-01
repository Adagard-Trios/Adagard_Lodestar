// Integration-test global setup: refuse anything but a *_test database, then apply the migrations.
const { execSync } = require('child_process');
const path = require('path');

module.exports = async () => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Integration tests need DATABASE_URL (a PostgreSQL database whose name ends in _test)');
  const name = new URL(url).pathname.replace(/^\//, '');
  if (!/_test$/.test(name)) {
    throw new Error(`Refusing to run integration tests against database "${name}": its name must end in _test (tables are truncated)`);
  }
  execSync('npx prisma migrate deploy', { cwd: path.resolve(__dirname, '../..'), stdio: 'inherit', env: process.env });
};
