import assert from 'node:assert/strict';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { Howl, Howler } from 'howler';
import { createEdenAudio } from '../src/audio/eden-audio.js';

function fakeAudio(t, spatial = true) {
  const previous = { ctx: Howler.ctx, noAudio: Howler.noAudio, usingWebAudio: Howler.usingWebAudio };
  let resumes = 0;
  Howler.ctx = spatial ? { state: 'suspended', async resume() { resumes++; this.state = 'running'; } } : null;
  Howler.noAudio = false;
  Howler.usingWebAudio = spatial;
  t.after(() => Object.assign(Howler, previous));

  const groups = [];
  t.mock.method(Howler, 'volume', () => 1);
  const listenerPos = t.mock.method(Howler, 'pos', () => {});
  const listenerOrientation = t.mock.method(Howler, 'orientation', () => {});
  t.mock.method(Howl.prototype, 'init', function (options) {
    this.group = { options, plays: [], positions: [], muted: options.mute, off: false, unloaded: false };
    groups.push(this.group);
  });
  t.mock.method(Howl.prototype, 'play', function () {
    const id = this.group.plays.length + 1;
    this.group.plays.push(id);
    return id;
  });
  t.mock.method(Howl.prototype, 'pos', function (...args) { this.group.positions.push(args); });
  t.mock.method(Howl.prototype, 'mute', function (value) { this.group.muted = value; });
  t.mock.method(Howl.prototype, 'off', function () { this.group.off = true; return this; });
  t.mock.method(Howl.prototype, 'unload', function () { this.group.unloaded = true; });
  return { groups, listenerPos, listenerOrientation, resumes: () => resumes };
}

test('Edén activates spatial sounds by gesture, mutes locally and releases each room', async (t) => {
  const f = fakeAudio(t);
  const audio = createEdenAudio();
  t.after(() => audio.destroy());
  audio.unlock();
  assert.equal(f.resumes(), 1);
  audio.setListener(4, 2, 8, 0, 0, -1, 0, 1, 0);
  assert.equal(f.listenerPos.mock.callCount(), 0);

  const sources = [{ x: 5, z: 8 }, { x: -10, y: 0.2, z: 8 }];
  audio.start(sources);
  audio.start(sources);
  const river = f.groups.find((group) => group.options.loop);
  assert.equal(f.groups.filter((group) => group.options.loop).length, 1);
  assert.deepEqual(river.plays, [1, 2]);
  assert.deepEqual(river.positions, [[5, 0, 8, 1], [-10, 0.2, 8, 2]]);
  assert.deepEqual(f.listenerPos.mock.calls.at(-1).arguments, [4, 2, 8]);

  const sheep = f.groups.find((group) => group.options.src[0].includes('/sheep.'));
  audio.playAt('sheep', 1, 0, 3);
  assert.deepEqual(sheep.positions, [[1, 0, 3, 1]]);
  audio.setMuted(true);
  assert.ok(f.groups.every((group) => group.muted));
  audio.playAt('sheep', 2, 0, 3);
  assert.deepEqual(sheep.plays, [1]);
  audio.setMuted(false);

  const listenerCalls = f.listenerPos.mock.callCount();
  audio.setListener(5, 2, 8, 0, 0, 1, 0, 1, 0);
  assert.equal(f.listenerPos.mock.callCount(), listenerCalls);
  await delay(100);
  assert.deepEqual(f.listenerPos.mock.calls.at(-1).arguments, [5, 2, 8]);
  assert.deepEqual(f.listenerOrientation.mock.calls.at(-1).arguments, [0, 0, 1, 0, 1, 0]);

  audio.stop();
  assert.ok(f.groups.every((group) => group.off && group.unloaded));
  const firstRoomGroups = f.groups.length;
  audio.start(sources);
  assert.ok(f.groups.length > firstRoomGroups);
  audio.destroy();
  assert.ok(f.groups.every((group) => group.unloaded));
  const finalGroups = f.groups.length;
  audio.start(sources);
  assert.equal(f.groups.length, finalGroups);
});

test('Edén uses one river loop when the browser lacks Web Audio', (t) => {
  const f = fakeAudio(t, false);
  const audio = createEdenAudio();
  t.after(() => audio.destroy());
  audio.unlock();
  audio.start([{ x: 5, z: 8 }, { x: -10, z: 8 }]);
  const river = f.groups.find((group) => group.options.loop);
  assert.deepEqual(river.plays, [1]);
  assert.deepEqual(river.positions, []);
  assert.equal(f.listenerPos.mock.callCount(), 0);
});
