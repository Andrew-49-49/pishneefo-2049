import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { withApi, freePort, waitFor, stop, run } from '../../backend/tests/test-server.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
for (const suite of ['admin-test.mjs', 'backend-test.mjs']) {
  await withApi(async api => {
    const port = await freePort();
    const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host=127.0.0.1', `--port=${port}`, '--strictPort'], {
      cwd: root, stdio: ['ignore', 'inherit', 'inherit'], env: { ...process.env, VITE_API_PROXY_TARGET: api },
    });
    try {
      const base = `http://127.0.0.1:${port}`;
      await waitFor(base, vite);
      assert.equal((await fetch(`${base}/api/health`)).status, 200);
      await run(process.execPath, [`tests/${suite}`], { cwd: root, env: { ...process.env, FRONTEND_URL: base } });
    } finally { await stop(vite); }
  });
}
