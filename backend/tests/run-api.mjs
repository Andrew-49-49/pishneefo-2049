import assert from 'node:assert/strict';
import { withApi, run, backendRoot } from './test-server.mjs';
await withApi(async base => {
  await run('bash', ['tests/api-test.sh'], { cwd: backendRoot, env: { ...process.env, API_URL: `${base}/api` } });
});
await withApi(async base => {
  assert.equal((await fetch(`${base}/api/health`)).status, 200);
  assert.equal((await fetch(`${base}/api/missing`)).status, 401); // Existing auth gate runs before unknown private routes.
  for (const p of ['/', '/admin', '/assets/test.js']) assert.equal((await fetch(base + p)).status, 404);
  const setup = await fetch(`${base}/api/auth/setup`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-Proto': 'https' }, body: JSON.stringify({ username: 'securetest', password: 'Secure2049pass' }) });
  assert.equal(setup.status, 200);
  const cookie = setup.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /Secure/i);
  assert.match(cookie, /SameSite=Strict/i);
  console.log('PASS: production cookies retain HttpOnly, Secure, and SameSite=Strict.');
  console.log('PASS: production API starts independently and does not serve frontend files.');
}, true);
