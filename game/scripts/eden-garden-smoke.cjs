/* Browser acceptance for the second Edén delivery. Uses the environment's Playwright. */
const assert = require('node:assert/strict');
const { writeFileSync } = require('node:fs');
const { setTimeout: delay } = require('node:timers/promises');
const { chromium } = require('playwright');

const origin = process.env.SMOKE_URL || 'http://127.0.0.1:5173';
const output = process.env.SMOKE_OUTPUT || '/tmp';
const report = { checks: [], errors: [], audio: [] };

async function until(check, description) {
  const end = Date.now() + 15000;
  while (Date.now() < end) {
    const result = await check();
    if (result) return result;
    await delay(80);
  }
  assert.fail(description);
}

async function connect(browser, options) {
  const context = await browser.newContext({ permissions: ['microphone'], ...options });
  await context.addInitScript(() => {
    window.edenPeers = [];
    window.edenTracks = [];
    const RTC = window.RTCPeerConnection;
    window.RTCPeerConnection = new Proxy(RTC, {
      construct(target, args) {
        const peer = Reflect.construct(target, args);
        window.edenPeers.push(peer);
        return peer;
      },
    });
    const capture = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (...args) => {
      const stream = await capture(...args);
      window.edenTracks.push(...stream.getTracks());
      return stream;
    };
  });
  const page = await context.newPage();
  let state;
  page.on('pageerror', (error) => report.errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') report.errors.push(message.text());
  });
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

async function reach(client, x, z) {
  await client.page.bringToFront();
  for (const [axis, target, positive, negative] of [['x', x, 'KeyD', 'KeyA'], ['z', z, 'KeyS', 'KeyW']]) {
    const initial = client.own()[axis];
    if (Math.abs(initial - target) <= 0.45) continue;
    const step = Math.sign(target - initial);
    const key = step > 0 ? positive : negative;
    await client.page.keyboard.down(key);
    try {
      await until(() => (target - client.own()[axis]) * step < 0.38, `Could not reach ${axis}=${target}`);
    } finally {
      await client.page.keyboard.up(key);
    }
  }
}

async function choose(page, id) {
  await page.click(`[data-character="${id}"]`);
  await page.waitForSelector('#eden-canvas[data-orbit]');
}

async function nameAnimal(page, name) {
  await page.fill('#eden-name-input', name);
  await page.click('#eden-name-form button');
  await page.waitForFunction((value) => document.querySelector('#eden-animal-list').textContent.includes(value), name);
}

async function incomingAudio(page) {
  return until(() => page.evaluate(async () => {
    const peer = window.edenPeers.at(-1);
    if (peer?.connectionState !== 'connected') return null;
    for (const stat of (await peer.getStats()).values()) {
      if (stat.type === 'inbound-rtp' && stat.kind === 'audio' && stat.bytesReceived > 0 && stat.totalAudioEnergy > 0) {
        return { bytes: stat.bytesReceived, energy: stat.totalAudioEnergy };
      }
    }
    return null;
  }), 'No decoded audio in WebRTC stats');
}

async function main() {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    headless: true,
    args: [
      '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
      '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required',
    ],
  });
  try {
    const desktop = await connect(browser, { viewport: { width: 1365, height: 900 } });
    const mobile = await connect(browser, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const a = desktop.page;
    const b = mobile.page;

    await a.click('#eden-create');
    await a.waitForSelector('#eden-selection:visible');
    const code = await a.locator('#eden-code').textContent();
    const key = await until(() => a.locator('#eden-world-key').textContent(), 'Creator did not receive a world key');
    assert.equal(key.length, 43);
    await b.fill('#eden-code-input', code);
    await b.click('#eden-join');
    await b.waitForSelector('#eden-selection:visible');
    assert.equal(await b.locator('#eden-world-key').textContent(), '');
    assert.ok(!JSON.stringify(mobile.state()).includes(key));
    await choose(a, 'adam');
    await choose(b, 'eve');

    await a.click('#eden-communication summary');
    await b.click('#eden-communication summary');
    assert.equal(await a.evaluate(() => window.edenTracks.length), 0);
    assert.equal(await b.evaluate(() => window.edenTracks.length), 0);
    await a.fill('#eden-chat-input', 'Exploramos el jardín.');
    await a.click('#eden-chat-send');
    await b.waitForFunction(() => document.querySelector('#eden-messages').textContent.includes('Exploramos el jardín'));
    await a.click('#eden-microphone');
    await b.click('#eden-microphone');
    report.audio = await Promise.all([incomingAudio(a), incomingAudio(b)]);
    await a.click('#eden-mute');
    assert.equal(await a.locator('#eden-mute').getAttribute('aria-pressed'), 'true');
    await a.click('#eden-mute');
    await b.click('#eden-block');
    await until(() => !desktop.state()?.communication, 'Block did not close communication');
    await b.waitForFunction(() => window.edenPeers.every((peer) => peer.connectionState === 'closed'));
    await b.click('#eden-block');
    await until(() => desktop.state()?.communication, 'Unblocking did not restore communication');
    await a.click('#eden-communication summary');
    await b.click('#eden-communication summary');
    report.checks.push('opt-in voice with decoded audio both ways; proximity text, mute and block');

    await reach(desktop, 0, -3);
    await a.waitForSelector('#eden-visit:visible');
    await a.keyboard.press('KeyE');
    await until(() => mobile.state()?.visit.visited.includes('adam'), 'Adam visit did not sync');
    await a.click('#eden-leave');
    await a.waitForSelector('#eden-menu:visible');
    await a.waitForFunction(() => window.edenTracks.every((track) => track.readyState === 'ended'));
    await a.click('#eden-join');
    await a.waitForSelector('#eden-selection:visible');
    await choose(a, 'adam');
    assert.ok(desktop.state().visit.visited.includes('adam'));
    await reach(mobile, 0, -3);
    await b.tap('#eden-visit');
    await until(() => desktop.state()?.visit.visited.length === 2, 'Visit progress not shared');

    for (const [x, z, index] of [[-5, -4, 0], [5, -4, 1]]) {
      await reach(desktop, x, z);
      await a.click('#eden-water');
      await until(() => mobile.state()?.garden.sprouts[index].watered, 'Watering did not sync');
    }
    for (const page of [a, b]) {
      await page.waitForFunction(() => document.querySelector('#eden-guide').textContent.includes('Tarea completada'));
    }
    await b.screenshot({ path: `${output}/tetelestai-eden-garden-mobile.png` });
    report.checks.push('both visits, retained through rejoin via keyboard and touch; Adam waters both sprouts and both see completion');

    await a.click('#eden-animals summary');
    await nameAnimal(a, 'Alba');
    await nameAnimal(a, 'Estrella');
    await a.click('#eden-animals summary');
    await b.click('#eden-animals summary');
    assert.ok(await b.locator('#eden-name-form').isHidden());
    await b.waitForFunction(() => document.querySelector('#eden-animal-list').textContent.includes('Estrella'));
    await b.click('#eden-animals summary');
    await reach(desktop, -6, 3);
    for (let feeds = 1; feeds <= 3; feeds++) {
      await a.click('#eden-feed');
      await until(() => desktop.state()?.garden.animals[0].feeds === feeds, 'Feeding did not advance exactly once');
    }
    await a.click('#eden-mount');
    await until(() => desktop.state()?.garden.animals[0].rider === desktop.state()?.self, 'Mount was not assigned');
    await reach(desktop, -3.5, 3);
    const { x, z } = desktop.own();
    const remoteMount = await until(() => {
      const animal = mobile.state()?.garden.animals[0];
      return animal && Math.hypot(x - animal.x, z - animal.z) < 0.55 && animal;
    }, 'Mounted movement did not sync');
    assert.ok(remoteMount.rider);
    await a.screenshot({ path: `${output}/tetelestai-eden-garden-desktop.png` });
    await a.getByRole('button', { name: 'Desmontar' }).click();
    await until(() => desktop.state()?.garden.animals[0].rider === null, 'Dismount was not applied');
    await reach(desktop, 0, 5);
    await a.click('#eden-eat');
    await a.waitForFunction(() => document.querySelector('#eden-status').textContent.includes('comido'));
    await until(() => mobile.state()?.garden.fruit.available === false, 'Fruit consumption did not sync');
    report.checks.push('rename and visibility, grow in three feeds, mount and move, dismount, fruit feedback');

    await a.click('#eden-leave');
    await b.click('#eden-leave');
    await b.waitForSelector('#eden-menu:visible');
    await a.waitForSelector('#eden-menu:visible');
    await a.getByText('Reabrir mi jardín', { exact: true }).click();
    await a.fill('#eden-world-input', key);
    await a.click('#eden-resume');
    await a.waitForSelector('#eden-selection:visible');
    await choose(a, 'adam');
    assert.equal(desktop.state().garden.animals[0].name, 'Estrella');
    assert.ok(!JSON.stringify(desktop.state()).includes(key));
    report.checks.push('creator-only reopen key and edited name restored after room emptied');
    assert.deepEqual(report.errors, []);
  } finally {
    await browser.close();
    writeFileSync(`${output}/tetelestai-eden-garden-smoke.json`, JSON.stringify(report, null, 2) + '\n');
  }
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
