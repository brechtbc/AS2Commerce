// Loaded by Mocha (see .mocharc.json) before any spec.
require('dotenv').config({ quiet: true });
const { spawn } = require('child_process');
const path = require('path');

const REQUIRED = ['BASE_URL', 'USER_EMAIL', 'USER_PASSWORD'];
const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length) {
  throw new Error(`Missing environment variables: ${missing.join(', ')}. Copy .env.example to .env.`);
}

let server;

async function isUp(baseUrl) {
  try {
    await fetch(`${baseUrl}/swagger.yaml`);
    return true;
  } catch {
    return false;
  }
}

exports.mochaHooks = {
  async beforeAll() {
    const baseUrl = process.env.BASE_URL;
    if (await isUp(baseUrl)) return;
    if (process.env.START_SERVER_IF_DOWN !== 'true') {
      throw new Error(`API not reachable at ${baseUrl} and START_SERVER_IF_DOWN is not "true".`);
    }
    server = spawn(process.execPath, [path.join(__dirname, '..', '..', 'src', 'server.js')], {
      env: { ...process.env, PORT: new URL(baseUrl).port || '80' },
      stdio: 'ignore',
    });
    for (let i = 0; i < 50; i++) {
      if (await isUp(baseUrl)) return;
      await new Promise((r) => setTimeout(r, 200));
    }
    throw new Error(`API did not start at ${baseUrl}`);
  },
  afterAll() {
    if (server) server.kill();
  },
};
