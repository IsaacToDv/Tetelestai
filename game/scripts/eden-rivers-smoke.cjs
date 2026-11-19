const assert = require('node:assert/strict');
const { writeFileSync } = require('node:fs');
const { setTimeout: delay } = require('node:timers/promises');
const { chromium } = require('playwright');

const origin = process.env.SMOKE_URL || 'http://127.0.0.1:5173';
const output = process.env.SMOKE_OUTPUT || '/tmp';
const report = { checks: [], errors: [] };

async function until(predicate, description) {
  const end = Date.now() + 22000;
  while (Date.now() < end) {
    if (await predicate()) return;
    await delay(60);
  }
  assert.fail(description);
}

async function player(browser, options) {
  const page = await browser.newPage(options);
  let state;
  const effects = [];
  page.on('pageerror', (error) => report.errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') report.errors.push(message.text());
  });
  page.on('websocket', (socket) => socket.on('framereceived', ({ payload }) => {
    const message = JSON.parse(payload.toString());
    if (message.type === 'eden-state') state = message;
    if (message.type === 'eden-effect') effects.push(message);
    if (message.type === 'error') report.errors.push(message.message);
  }));
  await page.goto(origin);
  await page.locator('#eden-create:enabled').waitFor();
  return { page, own: () => state?.players.find(({ id }) => id === state.self), effects };
}

async function axis(client, coordinate, target) {
  if (Math.abs(target - client.own()[coordinate]) < 0.4) return;
  const sign = Math.sign(target - client.own()[coordinate]);
  const key = coordinate === 'x' ? sign > 0 ? 'KeyD' : 'KeyA' : sign > 0 ? 'KeyS' : 'KeyW';
  await client.page.keyboard.down(key);
  try {
    await until(() => (target - client.own()[coordinate]) * sign < 0.24, `Did not reach ${coordinate}=${target}`);
  } finally {
    await client.page.keyboard.up(key);
  }
  await delay(180);
}

async function main() {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    const desktop = await player(browser, { viewport: { width: 1365, height: 900 } });
    const mobile = await player(browser, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const a = desktop.page;
    const b = mobile.page;
    await a.click('#eden-create');
    await a.waitForFunction(() => /^[A-F0-9]{12}$/.test(document.querySelector('#eden-code').textContent));
    const code = await a.locator('#eden-code').textContent();
    await b.fill('#eden-code-input', code);
    await b.tap('#eden-join');
    await b.tap('[data-character="eve"]');
    await a.click('[data-character="adam"]');
    await until(() => desktop.own()?.character === 'adam' && mobile.own()?.character === 'eve', 'Did not select characters');

    await a.bringToFront();
    await axis(desktop, 'x', 13.6);
    await a.locator('#eden-drink').waitFor();
    await a.keyboard.press('KeyE');
    await until(() => mobile.effects.some(({ effect }) => effect === 'drink'), 'Drink did not sync');
    await a.getByText('Has bebido agua.', { exact: true }).waitFor();
    await axis(desktop, 'x', 16.6);
    assert.equal(desktop.own().swimming, true);
    await until(() => mobile.effects.some(({ effect }) => effect === 'splash'), 'Entering the river did not sync');
    await a.getByText('Río de Edén · Nadando', { exact: true }).waitFor();
    await a.screenshot({ path: `${output}/tetelestai-river-swimming.png` });
    await axis(desktop, 'x', 22);
    assert.equal(desktop.own().swimming, false);
    report.checks.push('Keyboard drinks, crosses the river with Jolt and returns to land. Both effects reach the second session.');

    await b.bringToFront();
    const touch = await b.context().newCDPSession(b);
    const right = await b.getByRole('button', { name: 'Derecha', exact: true }).boundingBox();
    assert.ok(right);
    const point = { x: right.x + right.width / 2, y: right.y + right.height / 2 };
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    try {
      await until(() => mobile.own().swimming, 'Touch did not enter the river');
    } finally {
      await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
    await b.screenshot({ path: `${output}/tetelestai-river-mobile.png` });
    await b.getByText('Ríos de Edén', { exact: true }).tap();
    await b.tap('#eden-effects');
    assert.equal(await b.getAttribute('#eden-effects', 'aria-pressed'), 'true');
    await b.tap('#eden-effects');
    assert.equal(await b.getAttribute('#eden-effects', 'aria-pressed'), 'false');
    report.checks.push('Touch enters the river. Effects switch toggles in the mobile layout.');

    await a.bringToFront();
    await axis(desktop, 'z', -14);
    await axis(desktop, 'x', 24);
    await a.getByRole('button', { name: 'Llamar al león' }).click();
    await until(() => mobile.effects.some(({ effect }) => effect === 'call-lion'), 'Lion interaction did not sync');
    await a.screenshot({ path: `${output}/tetelestai-river-lion.png` });

    await axis(desktop, 'z', -19.65);
    await axis(desktop, 'x', -29);
    await a.getByText('Pisón', { exact: true }).waitFor();
    await a.getByRole('button', { name: 'Dar alimento a los peces' }).click();
    await until(() => mobile.effects.some(({ effect, target }) => effect === 'feed-fish' && target === 'pison'), 'Feeding fish did not sync');
    await delay(900);
    await a.screenshot({ path: `${output}/tetelestai-river-fish.png` });
    report.checks.push('The lion reacts and feeding fish on the Pisón sends a shared effect.');
    await a.click('#eden-leave');
    await b.tap('#eden-leave');
    await a.locator('#eden-create:enabled').waitFor();
    await b.locator('#eden-create:enabled').waitFor();
    assert.deepEqual(report.errors, []);
    report.checks.push('Both sessions return to the menu without console or protocol errors.');
  } finally {
    await browser.close();
    writeFileSync(`${output}/tetelestai-rivers-smoke.json`, JSON.stringify(report, null, 2) + '\n');
  }
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
