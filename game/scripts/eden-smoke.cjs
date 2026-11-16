/* Uses the environment's Playwright and Chromium, without adding product dependencies. */
const assert = require('node:assert/strict');
const { writeFileSync } = require('node:fs');
const { setTimeout: delay } = require('node:timers/promises');
const { chromium } = require('playwright');

const origin = process.env.SMOKE_URL || 'http://127.0.0.1:5173';
const output = process.env.SMOKE_OUTPUT || '/tmp';
const report = { checks: [], errors: [] };

async function waitFor(read, description) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const value = read();
    if (value) return value;
    await delay(50);
  }
  assert.fail(description);
}

async function client(browser, options) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  let state;
  page.on('console', (message) => {
    if (message.type() === 'error') report.errors.push(message.text());
  });
  page.on('pageerror', (error) => report.errors.push(error.message));
  page.on('websocket', (socket) => {
    socket.on('framereceived', ({ payload }) => {
      const message = JSON.parse(payload.toString());
      if (message.type === 'eden-state') state = message;
      if (message.type === 'left') state = undefined;
      if (message.type === 'error') report.errors.push(message.message);
    });
  });
  await page.goto(origin);
  await page.waitForFunction(() => !document.querySelector('#eden-create').disabled);
  return { page, state: () => state, own: () => state?.players.find(({ id }) => id === state.self) };
}

async function walk(page, key, check) {
  await page.keyboard.down(key);
  try { return await waitFor(check, `Keyboard movement (${key}) did not reach the server`); }
  finally { await page.keyboard.up(key); }
}

async function main() {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });

  try {
    const desktop = await client(browser, { viewport: { width: 1365, height: 900 } });
    const mobile = await client(browser, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const a = desktop.page;
    const b = mobile.page;

    await a.click('#eden-create');
    await a.waitForSelector('#eden-selection:visible');
    const code = await a.locator('#eden-code').textContent();
    assert.match(code, /^[A-F0-9]{12}$/);
    await b.fill('#eden-code-input', code);
    await b.click('#eden-join');
    await b.waitForSelector('#eden-selection:visible');

    await a.click('[data-character=adam]');
    await a.waitForSelector('#eden-canvas[data-orbit]');
    await b.waitForFunction(() => document.querySelector('[data-character=adam]').disabled);
    await b.click('[data-character=eve]');
    await b.waitForSelector('#eden-canvas[data-orbit]');
    await waitFor(() => desktop.state()?.players.some(({ character }) => character === 'eve'), 'Eva did not appear in desktop state');
    assert.equal(desktop.own()?.character, 'adam');
    assert.equal(mobile.own()?.character, 'eve');
    report.checks.push('private code, two clients, exclusive selection');

    const initial = desktop.own();
    await walk(a, 'KeyW', () => desktop.own()?.z < initial.z - 0.5);
    await waitFor(() => mobile.state()?.players.some(({ character, z }) => character === 'adam' && z < initial.z - 0.5), 'Remote movement did not reach mobile');
    await b.screenshot({ path: `${output}/tetelestai-eden-mobile.png` });

    await a.mouse.move(480, 420);
    await a.mouse.down();
    await a.mouse.move(705, 420, { steps: 8 });
    await a.mouse.up();
    const afterDrag = desktop.own();
    await walk(a, 'KeyW', () => desktop.own()?.x > afterDrag.x + 0.5);
    await a.screenshot({ path: `${output}/tetelestai-eden-desktop.png` });
    report.checks.push('keyboard movement replicated remotely, mouse drag changes walking direction');

    const cdp = await b.context().newCDPSession(b);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 76, y: 395 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 301, y: 395 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

    const up = await b.locator('[data-direction=up]').boundingBox();
    const afterSwipe = mobile.own();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: up.x + up.width / 2, y: up.y + up.height / 2 }] });
    try {
      await waitFor(() => mobile.own()?.x > afterSwipe.x + 0.5, 'Touch orbit and movement did not reach the server');
    } finally {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
    report.checks.push('touch drag orbits and touch directional control walks relative to camera');

    await a.click('#eden-leave');
    await a.waitForSelector('#eden-menu:visible');
    assert.equal(await a.locator('#eden-create').evaluate((button) => button === document.activeElement), true);
    await waitFor(() => mobile.state()?.available.includes('adam'), 'Leaving did not release Adam');
    await a.click('#eden-join');
    await a.waitForSelector('#eden-selection:visible');
    await a.click('[data-character=adam]');
    await a.waitForSelector('#eden-canvas[data-orbit]');
    await b.click('#eden-leave');
    await b.waitForSelector('#eden-menu:visible');
    await a.click('#eden-leave');
    await a.waitForSelector('#eden-menu:visible');
    report.checks.push('leave to menu, restore focus, release and reselect character');
    assert.deepEqual(report.errors, []);
  } finally {
    await browser.close();
    writeFileSync(`${output}/tetelestai-eden-smoke.json`, JSON.stringify(report, null, 2) + '\n');
  }
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
