import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WebSocket } from 'ws';
import { EdenRoom } from '../server/eden-room.js';
import { createGameServer } from '../server/server.js';

async function setup(t, saveDirectory) {
  const directory = saveDirectory ?? await mkdtemp(join(tmpdir(), 'tetelestai-eden-server-'));
  const server = createGameServer({ saveDirectory: directory });
  t.after(async () => {
    await server.close();
    if (!saveDirectory) await rm(directory, { recursive: true, force: true });
  });
  const address = await server.listen(0);
  return async () => {
    const socket = new WebSocket(`ws://127.0.0.1:${address.port}`);
    const messages = [];
    socket.on('message', (data) => messages.push(JSON.parse(data)));
    await once(socket, 'open');
    return {
      messages,
      send(message) { socket.send(JSON.stringify(message)); },
      async until(predicate) {
        const deadline = Date.now() + 2000;
        while (Date.now() < deadline) {
          const index = messages.findIndex(predicate);
          if (index !== -1) return messages.splice(index, 1)[0];
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
        assert.fail('Timed out waiting for the expected Edén room message');
      },
      async disconnect() {
        const closed = once(socket, 'close');
        socket.close();
        await closed;
      },
    };
  };
}

const edenState = (message) => message.type === 'eden-state';
const error = (message) => message.type === 'error';

test('Edén accepts two participants and keeps character selection exclusive through leave and disconnect', async (t) => {
  const connect = await setup(t);
  const a = await connect(); const b = await connect(); const c = await connect();
  a.send({ type: 'create', mode: 'eden' });
  const first = await a.until(edenState);
  assert.match(first.code, /^[A-F0-9]{12}$/);
  assert.deepEqual(first.available, ['adam', 'eve']);
  assert.deepEqual(first.players.map(({ character }) => character), [null]);
  b.send({ type: 'join', mode: 'eden', code: first.code });
  const second = await b.until(edenState);
  assert.equal(second.players.length, 2);
  c.send({ type: 'join', mode: 'eden', code: first.code });
  assert.match((await c.until(error)).message, /llena/);

  a.send({ type: 'select-character', character: 'adam' });
  b.send({ type: 'select-character', character: 'adam' });
  const selected = await a.until((message) => edenState(message) && message.available.length === 1);
  assert.deepEqual(selected.available, ['eve']);
  assert.equal(selected.players.filter(({ character }) => character === 'adam').length, 1);
  const claimant = selected.players.find(({ character }) => character === 'adam');
  const loser = claimant.id === first.self ? b : a;
  const winner = claimant.id === first.self ? a : b;
  assert.match((await loser.until(error)).message, /no está disponible/);
  loser.send({ type: 'select-character', character: 'eve' });
  const both = await winner.until((message) => edenState(message) && message.available.length === 0);
  assert.deepEqual(both.players.map(({ character }) => character).sort(), ['adam', 'eve']);

  winner.send({ type: 'leave' });
  await winner.until((message) => message.type === 'left');
  await loser.until((message) => edenState(message) && message.players.length === 1 && message.available[0] === 'adam');
  c.send({ type: 'join', mode: 'eden', code: first.code });
  await c.until(edenState);
  c.send({ type: 'select-character', character: 'adam' });
  await c.until((message) => edenState(message) && message.available.length === 0);
  await c.disconnect();
  await loser.until((message) => edenState(message) && message.players.length === 1 && message.available[0] === 'adam');
});

test('Edén moves the selected avatar on the server and ignores invalid input', async (t) => {
  const connect = await setup(t);
  const a = await connect();
  a.send({ type: 'create', mode: 'eden' });
  const initial = await a.until(edenState);
  a.send({ type: 'input', dx: 1, dz: 1 });
  a.send({ type: 'select-character', character: 'adam' });
  const current = await a.until((message) => edenState(message) && message.players[0].character === 'adam');
  assert.equal(current.players[0].x, -4);
  assert.equal(current.players[0].z, 0);
  a.send({ type: 'input', dx: 100, dz: 100 });
  const stationary = await a.until((message) => edenState(message) && message.players[0].character === 'adam');
  assert.deepEqual(stationary.players, current.players);
  a.send({ type: 'input', dx: 1, dz: 1 });
  const moved = await a.until((message) => edenState(message) && message.players[0].x > -4);
  assert.equal(moved.self, initial.self);
  assert.ok(moved.players[0].x < -2.9);
  assert.ok(Math.abs(moved.players[0].x + 4 - moved.players[0].z) < 0.0001);
});

test('Edén clamps coordinates and stops movement when input expires', () => {
  let now = 1000;
  const room = new EdenRoom('EDEN', () => now);
  room.join('a');
  room.select('a', 'eve');
  for (let tick = 0; tick < 40; tick++) {
    room.input('a', 1, 1);
    now += 100;
    room.tick(0.1);
  }
  const [{ x, z }] = room.snapshot('a').players;
  assert.equal(x, 11);
  assert.equal(z, 8);
  room.input('a', -1, -1);
  now += 501;
  room.tick(0.1);
  assert.deepEqual(room.snapshot('a').players, [{ id: 'a', character: 'eve', x, z, voice: false }]);
});

test('Edén only counts an in-range visit once per character, including after reselection', () => {
  let now = 1000;
  const room = new EdenRoom('EDEN', () => now);
  room.join('a'); room.join('b');
  assert.deepEqual(room.snapshot('a').visit, { visited: [], nearby: false });
  assert.equal(room.visit('a'), false);
  room.select('a', 'adam'); room.select('b', 'eve');
  assert.equal(room.visit('a'), false);

  function approach(id, dx) {
    for (let tick = 0; tick < 12; tick++) {
      room.input(id, dx, -1);
      now += 100;
      room.tick(0.1);
    }
    room.input(id, 0, 0);
  }

  approach('a', 1);
  assert.equal(room.snapshot('a').visit.nearby, true);
  assert.equal(room.visit('a'), true);
  assert.equal(room.visit('a'), true);
  assert.deepEqual(room.snapshot('b').visit, { visited: ['adam'], nearby: false });
  room.leave('a'); room.join('replacement'); room.select('replacement', 'adam');
  approach('replacement', 1);
  assert.equal(room.visit('replacement'), true);
  assert.deepEqual(room.snapshot('b').visit.visited, ['adam']);
  approach('b', -1);
  assert.equal(room.visit('b'), true);
  assert.deepEqual(room.snapshot('replacement').visit.visited, ['adam', 'eve']);
});

test('Edén communication depends on both selected avatars, proximity and bilateral blocking', () => {
  let now = 1000;
  const room = new EdenRoom('EDEN', () => now);
  room.join('a'); room.join('b');
  room.select('a', 'adam');
  assert.equal(room.snapshot('a').communication, false);
  room.select('b', 'eve');
  assert.equal(room.snapshot('a').communication, true);
  assert.equal(room.snapshot('b').communication, true);
  for (let tick = 0; tick < 8; tick++) {
    room.input('a', -1, 0); room.input('b', 1, 0);
    now += 100;
    room.tick(0.1);
  }
  assert.equal(room.snapshot('a').communication, false);
  assert.equal(room.snapshot('b').communication, false);
  for (let tick = 0; tick < 8; tick++) {
    room.input('a', 1, 0); room.input('b', -1, 0);
    now += 100;
    room.tick(0.1);
  }
  assert.equal(room.snapshot('a').communication, true);
  room.voice('a', true); room.block('a', true);
  assert.equal(room.snapshot('a').blocked, true);
  assert.equal(room.snapshot('b').blocked, false);
  assert.equal(room.snapshot('a').communication, false);
  assert.equal(room.snapshot('b').communication, false);
  room.leave('b');
  const survivor = room.snapshot('a');
  assert.equal(survivor.blocked, false);
  assert.equal(survivor.players[0].voice, true);
});

test('Garden interactions use range and update watering, animal growth, mounts and fruit', () => {
  let now = 1000;
  const room = new EdenRoom('EDEN', () => now);
  room.join('a'); room.select('a', 'adam');
  room.join('b'); room.select('b', 'eve');
  assert.match(room.interact('a', 'water', 'sprout-1'), /Acércate/);

  function move(id, dx, dz, ticks) {
    for (let tick = 0; tick < ticks; tick++) {
      room.input(id, dx, dz);
      now += 100;
      room.tick(0.1);
    }
    room.input(id, 0, 0);
  }

  move('b', 0, -1, 11);
  assert.equal(room.interact('b', 'water', 'sprout-2'), null);
  assert.equal(room.snapshot('a').garden.sprouts[1].watered, true);
  move('a', -1, 1, 13);
  assert.match(room.interact('a', 'mount', 'donkey-1'), /cría/);
  for (let feed = 0; feed < 4; feed++) assert.equal(room.interact('a', 'feed', 'donkey-1'), null);
  assert.equal(room.snapshot('a').garden.animals[0].feeds, 3);
  assert.equal(room.interact('a', 'mount', 'donkey-1'), null);
  move('a', 1, 0, 4);
  const mounted = room.snapshot('a');
  const animal = mounted.garden.animals[0];
  assert.equal(animal.rider, 'a');
  assert.equal(animal.x, mounted.players[0].x);
  assert.equal(room.interact('a', 'mount', 'donkey-1'), null);
  assert.equal(room.snapshot('a').garden.animals[0].rider, null);
  assert.equal(room.interact('a', 'mount', 'donkey-1'), null);
  room.leave('a');
  assert.equal(room.snapshot('b').garden.animals[0].rider, null);

  assert.match(room.interact('b', 'eat'), /Acércate/);
  move('b', -1, 0, 13);
  move('b', 0, 1, 27);
  assert.equal(room.interact('b', 'eat'), null);
  assert.equal(room.snapshot('b').garden.fruit.available, false);
  assert.match(room.interact('b', 'eat'), /creciendo/);
  now += 29999;
  assert.equal(room.snapshot('b').garden.fruit.available, false);
  now++;
  assert.equal(room.snapshot('b').garden.fruit.available, true);
});

test('Edén only changes the displayed animal name after completing the save', () => {
  let allowWrite = false;
  const world = {
    key: 'PRIVATE', names: { 'donkey-2': 'Brisa' },
    saveNames(names) {
      if (!allowWrite) throw new Error('Write unavailable');
      assert.deepEqual(names, { 'donkey-1': 'Luna', 'donkey-2': 'Brisa' });
    },
  };
  const room = new EdenRoom('EDEN', Date.now, world);
  room.join('a'); room.select('a', 'adam');
  assert.match(room.interact('a', 'name', 'donkey-1', 'Lu\nna'), /nombre válido/);
  assert.match(room.interact('a', 'name', 'donkey-1', 'Luna'), /guardar/);
  assert.deepEqual(room.snapshot('a').garden.animals.map(({ name }) => name), [null, 'Brisa']);
  allowWrite = true;
  assert.equal(room.interact('a', 'name', 'donkey-1', ' Luna '), null);
  assert.deepEqual(room.snapshot('a').garden.animals.map(({ name }) => name), ['Luna', 'Brisa']);
});

test('private Edén and legacy camp codes only work in their own mode', async (t) => {
  const connect = await setup(t);
  const eden = await connect(); const legacy = await connect(); const guest = await connect();
  eden.send({ type: 'create', mode: 'eden' });
  const edenRoom = await eden.until(edenState);
  legacy.send({ type: 'create' });
  const legacyRoom = await legacy.until((message) => message.type === 'state');
  guest.send({ type: 'join', code: edenRoom.code });
  await guest.until(error);
  guest.send({ type: 'join', mode: 'eden', code: legacyRoom.code });
  await guest.until(error);
  guest.send({ type: 'join', mode: 'eden', code: edenRoom.code });
  const joined = await guest.until(edenState);
  assert.equal(joined.code, edenRoom.code);
});

test('Edén relays nearby text and opted-in signaling, and gates peer traffic after a block', async (t) => {
  const connect = await setup(t);
  const a = await connect(); const b = await connect();
  a.send({ type: 'create', mode: 'eden' });
  const first = await a.until(edenState);
  a.send({ type: 'visit' });
  await a.until(error);
  b.send({ type: 'join', mode: 'eden', code: first.code });
  const second = await b.until(edenState);
  a.send({ type: 'select-character', character: 'adam' });
  b.send({ type: 'select-character', character: 'eve' });
  const ready = await a.until((message) => edenState(message) && message.communication);
  assert.ok(ready.players.every(({ voice }) => voice === false));
  a.send({ type: 'visit' });
  assert.match((await a.until(error)).message, /Acércate/);

  const text = '<b>Hola</b>';
  a.send({ type: 'chat', text: ` ${text} ` });
  assert.deepEqual(await a.until((message) => message.type === 'chat'), { type: 'chat', text, own: true });
  assert.deepEqual(await b.until((message) => message.type === 'chat'), { type: 'chat', text });

  a.send({ type: 'signal', to: second.self, data: { type: 'offer', sdp: 'premature' } });
  a.send({ type: 'voice', value: true });
  await b.until((message) => edenState(message) && message.players.some(({ voice }) => voice));
  assert.equal(b.messages.some((message) => message.type === 'signal'), false);
  b.send({ type: 'voice', value: true });
  await a.until((message) => edenState(message) && message.players.every(({ voice }) => voice));
  const data = { type: 'offer', sdp: 'opted-in' };
  a.send({ type: 'signal', to: second.self, data });
  assert.deepEqual(await b.until((message) => message.type === 'signal'), { type: 'signal', from: first.self, data });

  b.send({ type: 'block', value: true });
  await b.until((message) => edenState(message) && message.blocked);
  b.send({ type: 'signal', to: first.self, data });
  b.send({ type: 'chat', text: 'blocked' });
  b.send({ type: 'leave' });
  await b.until((message) => message.type === 'left');
  const survivor = await a.until((message) => edenState(message) && message.players.length === 1 && message.players[0].voice);
  assert.equal(survivor.communication, false);
  assert.equal(a.messages.some((message) => message.type === 'signal' || message.type === 'chat'), false);
});

test('Edén reopens the same garden and persists animal names under the private key', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'tetelestai-eden-resume-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const connect = await setup(t, directory);
  const a = await connect(); const b = await connect();
  a.send({ type: 'create', mode: 'eden' });
  const first = await a.until(edenState);
  const { key } = await a.until((message) => message.type === 'eden-world-key');
  assert.match(key, /^[A-Za-z0-9_-]{43}$/);
  assert.ok(!JSON.stringify(first).includes(key));
  b.send({ type: 'join', mode: 'eden', code: first.code });
  await b.until(edenState);
  assert.ok(!b.messages.some((message) => message.type === 'eden-world-key'));
  a.send({ type: 'select-character', character: 'adam' });
  b.send({ type: 'select-character', character: 'eve' });
  await a.until((message) => edenState(message) && message.available.length === 0);
  b.send({ type: 'interact', action: 'name', target: 'donkey-1', name: 'Luna' });
  assert.match((await b.until(error)).message, /Adán/);
  a.send({ type: 'interact', action: 'name', target: 'donkey-1', name: ' Luna ' });
  await b.until((message) => edenState(message) && message.garden.animals[0].name === 'Luna');
  assert.ok(!b.messages.some((message) => message.type === 'eden-world-key'));
  a.send({ type: 'leave' });
  await a.until((message) => message.type === 'left');
  a.send({ type: 'resume', mode: 'eden', key });
  const active = await a.until((message) => edenState(message) && message.garden.animals[0].name === 'Luna' && message.players.length === 2 && message.available.length === 1);
  assert.equal(active.code, first.code);
  assert.equal((await a.until((message) => message.type === 'eden-world-key')).key, key);

  const reConnect = await setup(t, directory);
  const reopened = await reConnect();
  reopened.send({ type: 'resume', mode: 'eden', key });
  const recovered = await reopened.until(edenState);
  assert.notEqual(recovered.code, first.code);
  assert.equal(recovered.garden.animals[0].name, 'Luna');
  assert.equal(recovered.garden.animals[0].feeds, 0);
  assert.deepEqual(recovered.visit.visited, []);
  assert.equal((await reopened.until((message) => message.type === 'eden-world-key')).key, key);
});
