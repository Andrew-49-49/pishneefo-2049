import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';
export const backendRoot = fileURLToPath(new URL('../', import.meta.url));
export async function freePort() {
  const s = net.createServer();
  await new Promise((resolve, reject) => { s.once('error', reject); s.listen(0, '127.0.0.1', resolve); });
  const port = s.address().port;
  await new Promise(resolve => s.close(resolve));
  return port;
}
export async function waitFor(url, child) {
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error(`Server exited with ${child.exitCode}`);
    try { if ((await fetch(url)).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error(`Server did not become ready: ${url}`);
}
export async function stop(child) {
  if (child.exitCode !== null) return;
  await new Promise(resolve => { child.once('exit', resolve); child.kill('SIGTERM'); });
}
export async function run(command, args, options = {}) {
  const child = spawn(command, args, { stdio: 'inherit', ...options });
  const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
  if (code !== 0) throw new Error(`${command} exited with ${code}`);
}
export async function withApi(fn, production = false) {
  const data = await mkdtemp(path.join(tmpdir(), 'pishneefo-test-'));
  const port = await freePort();
  const child = spawn(process.execPath, ['server/index.js'], {
    cwd: backendRoot, stdio: ['ignore', 'inherit', 'inherit'],
    env: { ...process.env, PORT: String(port), DATA_DIR: data, DB_PATH: path.join(data, 'test.db'), NODE_ENV: production ? 'production' : 'test' },
  });
  try { await waitFor(`http://127.0.0.1:${port}/api/health`, child); await fn(`http://127.0.0.1:${port}`); }
  finally { await stop(child); await rm(data, { recursive: true, force: true }); }
}
