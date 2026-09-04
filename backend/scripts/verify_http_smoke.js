const assert = require('node:assert/strict');
const { createApp } = require('../dist/app');

async function main() {
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  try {
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const health = await fetch(`${baseUrl}/healthz`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).status, 'ok');

    const readiness = await fetch(`${baseUrl}/readyz`);
    assert.equal(readiness.status, 503);
    assert.equal((await readiness.json()).database, 'disconnected');

    const missing = await fetch(`${baseUrl}/api/v1/does-not-exist`);
    assert.equal(missing.status, 404);
    const missingBody = await missing.json();
    assert.equal(missingBody.success, false);
    assert.ok(missingBody.correlationId);

    const unauthenticated = await fetch(`${baseUrl}/api/v1/organizations`);
    assert.equal(unauthenticated.status, 401);

    const treasuryBoundary = await fetch(`${baseUrl}/api/v1/organizations/507f1f77bcf86cd799439011/treasury/accounts`);
    assert.equal(treasuryBoundary.status, 401);

    console.log('HTTP smoke checks passed: health, readiness, 404, authentication, and treasury boundaries.');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
