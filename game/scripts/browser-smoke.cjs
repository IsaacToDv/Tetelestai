/* Optional diagnostic: uses the execution environment's Playwright and Chromium, not an npm dependency. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
  const report = { errors: [], checks: [], audio: [] };
  const pages = [];
  const origin = process.env.SMOKE_URL || 'http://127.0.0.1:5173';
  async function context(options) {
    const ctx = await browser.newContext({ permissions: ['microphone'], ...options });
    await ctx.addInitScript(() => {
      window.__rtc = []; window.__audios = []; window.__gumCalls = 0; window.__tracks = [];
      const nativePeer = window.RTCPeerConnection;
      window.RTCPeerConnection = new Proxy(nativePeer, { construct(target, args) { const peer = Reflect.construct(target, args); window.__rtc.push(peer); return peer; } });
      const nativeAudio = window.Audio;
      window.Audio = new Proxy(nativeAudio, { construct(target, args) { const audio = Reflect.construct(target, args); window.__audios.push(audio); return audio; } });
      const nativeGum = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async (...args) => { window.__gumCalls++; const stream = await nativeGum(...args); window.__tracks.push(...stream.getTracks()); return stream; };
    });
    const page = await ctx.newPage();
    pages.push(page);
    page.on('pageerror', (error) => report.errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') report.errors.push(message.text()); });
    await page.goto(origin); await page.waitForFunction(() => !document.querySelector('#create').disabled);
    return { ctx, page };
  }
  try {
    const { page: a } = await context({ viewport: { width: 1365, height: 900 } });
    const { page: b } = await context({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    assert.equal(await a.evaluate(() => window.__gumCalls), 0); assert.equal(await b.evaluate(() => window.__gumCalls), 0);
    await a.click('#create'); await a.waitForSelector('#session:visible'); const code = await a.locator('#code').textContent();
    await b.fill('#room-code', code); await b.click('#join'); await b.waitForSelector('#session:visible');
    assert.notEqual(await a.locator('#role').textContent(), await b.locator('#role').textContent());
    report.checks.push('two private roles; microphone never auto-requested');
    await a.screenshot({ path: '/tmp/tetelestai-sprint1-desktop.png' });
    await b.screenshot({ path: '/tmp/tetelestai-sprint1-mobile.png' });
    await a.keyboard.press('Escape'); await a.locator('#game-canvas').click({ position: { x: 200, y: 300 } });
    await a.keyboard.down('KeyD'); await a.waitForTimeout(1050); await a.keyboard.up('KeyD');
    const bounds = await b.locator('[data-direction="left"]').boundingBox();
    const cdp = await b.context().newCDPSession(b);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }] });
    await b.waitForTimeout(1050); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await a.waitForFunction(() => !document.querySelector('#confirm').disabled); await b.waitForFunction(() => !document.querySelector('#confirm').disabled);
    await a.click('#confirm'); await b.click('#confirm'); await a.waitForSelector('#fragment:visible'); await b.waitForSelector('#fragment:visible');
    report.checks.push('keyboard and captured mobile touch movement; shared fragment with two consents');
    await a.locator('#communication summary').click(); await b.locator('#communication summary').click();
    await a.fill('#chat-text', 'Nos reunimos en el campamento.'); await a.click('#send-chat'); await b.waitForFunction(() => document.querySelector('#messages').textContent.includes('Nos reunimos'));
    await a.click('#microphone'); await b.click('#microphone');
    await Promise.all([a, b].map((page) => page.waitForFunction(() => window.__rtc.some((peer) => peer.connectionState === 'connected') || document.querySelector('#voice-status').textContent.includes('políticas'), null, { timeout: 20000 })));
    await a.click('#listen'); await b.click('#listen'); await a.waitForTimeout(1800);
    for (const page of [a, b]) {
      const stats = await page.evaluate(async () => {
        const peer = window.__rtc.at(-1); const stats = await peer.getStats();
        let bytes = 0; let energy = 0; stats.forEach((item) => { if (item.type === 'inbound-rtp' && item.kind === 'audio') { bytes += item.bytesReceived || 0; energy += item.totalAudioEnergy || 0; } });
        return { bytes, energy, volume: window.__audios[0].volume, paused: window.__audios[0].paused, state: peer.connectionState, local: peer.localDescription?.type, remote: peer.remoteDescription?.type, hostCandidates: (peer.localDescription?.sdp.match(/a=candidate/g) || []).length };
      });
      if (stats.bytes > 0) { assert.ok(stats.energy > 0, 'simulated audio must have energy'); assert.equal(stats.paused, false); }
      else { assert.equal(process.env.ALLOW_NO_ICE, '1', 'RTP not verified; set ALLOW_NO_ICE=1 only for the documented managed-browser limitation'); assert.equal(stats.hostCandidates, 0); assert.ok(stats.local && stats.remote, 'offer/answer must still be exchanged'); report.audioLimitation = 'No RTP verification: managed Chromium WebRtcIPHandling=disable_non_proxied_udp; zero native host candidates. SDP signaling and fake microphone tracks tested.'; }
      report.audio.push(stats);
    }
    await a.click('#mute'); assert.equal(await a.evaluate(() => window.__audios[0].muted), true); await a.click('#mute');
    await b.click('#block'); await b.waitForTimeout(350); assert.equal(await b.evaluate(() => window.__rtc.every((peer) => peer.connectionState === 'closed')), true);
    assert.equal(await a.locator('#send-chat').isDisabled(), true); assert.equal((await b.locator('#messages').textContent()).includes('no debe llegar'), false);
    await b.click('#block'); await a.waitForFunction(() => !document.querySelector('#send-chat').disabled);
    await a.click('#microphone'); await b.click('#microphone');
    assert.equal(await a.evaluate(() => window.__tracks.every((track) => track.readyState === 'ended')), true);
    report.checks.push('proximity chat; opt-in fake microphone; offer/answer signaling; mute/block and track cleanup (RTP evidence is in audio field)');
    await a.locator('#communication summary').click(); await b.locator('#communication summary').click();
    await a.click('#ready'); await b.click('#ready'); await a.waitForSelector('#challenge:visible'); await b.waitForSelector('#challenge:visible');
    async function choose(page, places) { for (const place of places) await page.click(`[data-place="${place}"]`); }
    await choose(a, ['siquem', 'haran', 'betel-hai']); await a.click('#submit-answer'); await a.waitForFunction(() => document.querySelector('#answer-status').textContent.includes('no es correcto'));
    await choose(a, ['haran', 'siquem', 'betel-hai']); await choose(b, ['haran', 'siquem', 'betel-hai']);
    await Promise.all([a.click('#submit-answer'), b.click('#submit-answer')]); await a.waitForSelector('#result:visible'); await b.waitForSelector('#result:visible');
    report.result = await a.locator('#result-text').textContent();
    await a.screenshot({ path: '/tmp/tetelestai-sprint1-result.png' });
    await a.click('#retry'); await b.click('#retry'); await a.waitForSelector('#challenge:visible');
    await b.reload(); await a.waitForFunction(() => document.querySelector('#result-text').textContent.includes('cancelada'));
    await b.waitForFunction(() => !document.querySelector('#join').disabled); await b.click('#join'); await b.waitForSelector('#fragment:visible');
    await a.click('#retry'); await b.click('#retry'); await a.waitForSelector('#challenge:visible');
    await a.waitForFunction(() => document.querySelector('#result-text').textContent.includes('agotó'), null, { timeout: 50000 });
    assert.ok((await a.locator('#result-text').textContent()).includes('Harán → Siquem'));
    await a.click('#end'); await b.click('#end'); await a.waitForSelector('#complete:visible'); await b.waitForSelector('#complete:visible');
    await a.click('#leave'); await a.waitForSelector('#lobby:visible'); await a.click('#create'); await a.waitForSelector('#session:visible');
    report.checks.push('wrong-answer retry; result; retry; disconnect cancellation; rejoin with fragment retained; 45s timeout/answer; both conclude; leave/create');
    assert.deepEqual(report.errors, []);
    fs.writeFileSync('/tmp/tetelestai-sprint1-smoke.json', JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    report.diagnostics = await Promise.all(pages.map((page) => page.evaluate(() => ({ status: document.querySelector('#voice-status').textContent, calls: window.__gumCalls, peers: window.__rtc.map((peer) => ({ state: peer.connectionState, ice: peer.iceConnectionState, gathering: peer.iceGatheringState, signaling: peer.signalingState, local: peer.localDescription?.sdp, remote: peer.remoteDescription?.sdp })), tracks: window.__tracks.map((track) => track.readyState) }))));
    fs.writeFileSync('/tmp/tetelestai-sprint1-smoke.json', JSON.stringify(report, null, 2)); throw error;
  }
  finally { await browser.close(); }
})();
