import test from 'node:test';
import assert from 'node:assert/strict';
import { Room } from '../server/room.js';

function fixture() {
  let now = 1000;
  const events = [];
  const room = new Room('PRIVATE', (id, message) => events.push({ id, message }), () => now, () => 0.1);
  room.join('a'); room.join('b');
  const moveToCenter = () => {
    room.input('a', 1, 0); room.input('b', -1, 0);
    for (let i = 0; i < 10; i++) { now += 100; room.tick(0.1); }
    room.input('a', 0, 0); room.input('b', 0, 0);
  };
  const start = () => {
    moveToCenter(); room.confirm('a'); room.confirm('b'); room.ready('a'); room.ready('b');
  };
  return { room, events, moveToCenter, start, advance: (ms) => { now += ms; room.tick(0); } };
}

test('snapshots expose only the recipient role, cap room size and randomize roles', () => {
  const { room } = fixture();
  assert.notEqual(room.snapshot('a').role, room.snapshot('b').role);
  assert.deepEqual(Object.keys(room.snapshot('a').players[1]).sort(), ['id', 'voice', 'water', 'x', 'z']);
  assert.throws(() => room.join('c'), /llena/);
  assert.equal(JSON.stringify(room.snapshot('a')).includes('Lot'), room.snapshot('a').role === 'Lot');
});
test('bounded velocity movement cannot teleport and normalizes diagonals', () => {
  const { room } = fixture();
  room.input('a', 1000, 0); room.tick(1);
  assert.equal(room.snapshot('a').players[0].x, -4);
  room.input('a', 1, 1); room.tick(0.1);
  assert.ok(room.snapshot('a').players[0].x < -3.7);
  for (let i = 0; i < 400; i++) room.tick(0.1);
  assert.ok(room.snapshot('a').players[0].x <= 11);
});
test('fragment requires both nearby consents, progresses once and can be reread', () => {
  const f = fixture(); f.room.confirm('a'); f.room.confirm('b');
  assert.equal(f.room.snapshot('a').fragmentCompleted, false);
  f.moveToCenter(); f.room.confirm('a'); f.room.confirm('b'); f.room.confirm('b');
  assert.equal(f.room.snapshot('a').fragmentCompleted, true);
  assert.equal(f.room.snapshot('a').phase, 'fragment');
});
test('challenge rejects invalid/duplicate places, retries wrong answers and keeps correctness private', () => {
  const f = fixture(); f.start();
  assert.equal(f.room.snapshot('a').phase, 'challenge');
  assert.equal(f.room.answer('a', '1', ['haran', 'haran', 'siquem']), false);
  f.room.answer('a', '2', ['siquem', 'haran', 'betel-hai']);
  assert.equal(f.room.snapshot('b').result, null);
  f.room.answer('a', '3', ['haran', 'siquem', 'betel-hai']);
  const privateBefore = JSON.stringify(f.room.snapshot('b'));
  assert.ok(!privateBefore.includes('correct'));
  assert.equal(f.room.answer('a', '3', ['haran', 'siquem', 'betel-hai']), true);
  f.advance(251);
  assert.equal(f.room.snapshot('a').result.kind, 'winner');
  assert.equal(f.room.snapshot('a').players[0].water, 1);
  f.advance(1000);
  assert.equal(f.room.snapshot('a').players[0].water, 1);
});
test('correct answers within 250ms tie and reward both; outside window cannot tie', () => {
  const f = fixture(); f.start();
  f.room.answer('a', 'a', ['haran', 'siquem', 'betel-hai']); f.advance(249);
  f.room.answer('b', 'b', ['haran', 'siquem', 'betel-hai']); f.advance(2);
  assert.equal(f.room.snapshot('a').result.kind, 'tie');
  assert.deepEqual(f.room.snapshot('a').players.map((p) => p.water), [1, 1]);
  const g = fixture(); g.start(); g.room.answer('a', 'a', ['haran', 'siquem', 'betel-hai']); g.advance(251);
  assert.equal(g.room.answer('b', 'b', ['haran', 'siquem', 'betel-hai']), false);
});
test('deadline reveals answer only at result and both can retry', () => {
  const f = fixture(); f.start();
  assert.equal(JSON.stringify(f.room.snapshot('a')).includes('solution'), false);
  f.advance(45000);
  assert.equal(f.room.snapshot('a').result.kind, 'timeout');
  assert.deepEqual(f.room.snapshot('a').result.solution, ['haran', 'siquem', 'betel-hai']);
  f.room.ready('a'); f.room.ready('b');
  assert.equal(f.room.snapshot('a').round, 2);
});
test('tie window includes an answer received exactly 250ms after first correct', () => {
  const f = fixture(); f.start(); f.room.answer('a', 'a', ['haran', 'siquem', 'betel-hai']); f.advance(250);
  f.room.answer('b', 'b', ['haran', 'siquem', 'betel-hai']); f.advance(1);
  assert.equal(f.room.snapshot('a').result.kind, 'tie');
});
test('disconnect during tie window cancels without winner, removes participant and retains shared fragment', () => {
  const f = fixture(); f.start(); f.room.answer('a', 'a', ['haran', 'siquem', 'betel-hai']); f.room.leave('b'); f.advance(300);
  assert.equal(f.room.snapshot('a').result.kind, 'cancelled');
  assert.equal(f.room.snapshot('a').players.length, 1);
  assert.equal(f.room.snapshot('a').players[0].water, 0);
  f.room.join('c'); assert.equal(f.room.snapshot('c').fragmentCompleted, true);
});
test('proximity and bilateral block gate chat and signaling', () => {
  const f = fixture();
  assert.equal(f.room.canCommunicate('a', 'b'), true);
  f.room.block('a', true); assert.equal(f.room.canCommunicate('b', 'a'), false);
  f.room.block('a', false); assert.equal(f.room.canCommunicate('b', 'a'), true);
  f.room.input('a', -1, 0); f.room.input('b', 1, 0);
  for (let i = 0; i < 100; i++) f.room.tick(0.1);
  assert.equal(f.room.canCommunicate('a', 'b'), false);
});
test('surviving participant retains opt-in microphone across partner replacement', () => {
  const { room } = fixture(); room.voice('a', true); room.leave('b'); room.join('c');
  assert.equal(room.snapshot('a').players.find((player) => player.id === 'a').voice, true);
  assert.equal(room.snapshot('c').players.find((player) => player.id === 'c').voice, false);
});
test('concluded survivor completes after partner leaves and can replay with replacement', () => {
  const f = fixture(); f.start(); f.advance(45000); f.room.end('a'); f.room.leave('b');
  assert.equal(f.room.snapshot('a').phase, 'complete');
  f.room.join('c'); assert.equal(f.room.snapshot('a').done, false);
  f.room.ready('a'); f.room.ready('c'); assert.equal(f.room.snapshot('a').phase, 'challenge');
});
