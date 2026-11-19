import test from 'node:test';
import assert from 'node:assert/strict';
import { createEdenSwimPhysics } from '../server/eden-swim-physics.js';

function readPosition(swim, id) {
  const position = { x: 0, y: 0, z: 0 };
  assert.equal(swim.read(id, position), true);
  assert.ok(Object.values(position).every(Number.isFinite));
  return position;
}

function advance(swim, seconds, ticksPerSecond) {
  for (let tick = 0; tick < seconds * ticksPerSecond; tick += 1) {
    swim.step(1 / ticksPerSecond);
  }
}

test('swim stays near the surface and follows horizontal input at different tick rates', (t) => {
  const first = createEdenSwimPhysics();
  const second = createEdenSwimPhysics();
  t.after(() => { first.destroy(); second.destroy(); });

  first.enter('player', 4, -7, 3);
  second.enter('player', 4, -7, 3);
  first.setInput('player', 2, -1);
  second.setInput('player', 2, -1);
  advance(first, 3, 20);
  advance(second, 3, 60);

  const position = readPosition(first, 'player');
  assert.ok(position.x > 9 && position.x < 10.1);
  assert.ok(position.z > -10.1 && position.z < -9.5);
  assert.ok(Math.abs(position.y - 3) < 0.45);
  const other = readPosition(second, 'player');
  for (const axis of ['x', 'y', 'z']) assert.ok(Math.abs(position[axis] - other[axis]) < 0.001);
});

test('swimmers settle horizontally when input ends and do not push one another', (t) => {
  const swim = createEdenSwimPhysics();
  t.after(() => swim.destroy());
  swim.enter('moving', -2, 1, 0);
  swim.enter('idle', 0, 1, 0);
  swim.setInput('moving', 2, 0);
  advance(swim, 2, 20);
  assert.ok(readPosition(swim, 'moving').x > 1);
  const idle = readPosition(swim, 'idle');
  assert.equal(idle.x, 0);
  assert.equal(idle.z, 1);

  swim.setInput('moving', 0, 0);
  advance(swim, 2, 20);
  const settled = readPosition(swim, 'moving');
  advance(swim, 2, 20);
  const later = readPosition(swim, 'moving');
  assert.ok(Math.abs(later.x - settled.x) < 0.001);
  assert.ok(Math.abs(later.y - settled.y) < 0.02);
});

test('the swim world releases a player and accepts reentry without retaining input', (t) => {
  const swim = createEdenSwimPhysics();
  t.after(() => swim.destroy());
  swim.enter('player', 1, 2, 3);
  swim.setInput('player', 2, 0);
  advance(swim, 1, 20);
  swim.leave('player');
  swim.leave('player');
  const position = { x: 7, y: 8, z: 9 };
  assert.equal(swim.read('player', position), false);
  assert.deepEqual(position, { x: 7, y: 8, z: 9 });

  for (let index = 0; index < 20; index += 1) {
    swim.enter('player', 12, -13, 4);
    swim.setInput('player', NaN, Infinity);
    swim.step(NaN);
    advance(swim, 1, 20);
    const reentered = readPosition(swim, 'player');
    assert.equal(reentered.x, 12);
    assert.equal(reentered.z, -13);
    swim.leave('player');
  }

  swim.enter('player', 1, 2, 3);
  swim.destroy();
  swim.destroy();
  assert.equal(swim.read('player', position), false);
});

test('a shoreline correction moves the physics body without changing buoyant height', (t) => {
  const swim = createEdenSwimPhysics();
  t.after(() => swim.destroy());
  swim.enter('player', 8, 1, 3);
  advance(swim, 2, 20);
  const before = readPosition(swim, 'player');
  swim.constrain('player', 7, 2);
  swim.constrain('player', NaN, 5);
  const corrected = readPosition(swim, 'player');
  assert.deepEqual(corrected, { x: 7, y: before.y, z: 2 });
  advance(swim, 1, 20);
  const after = readPosition(swim, 'player');
  assert.equal(after.x, 7);
  assert.equal(after.z, 2);
  assert.ok(Math.abs(after.y - before.y) < 0.02);
});
