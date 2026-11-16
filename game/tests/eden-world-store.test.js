import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { EdenWorldStore } from '../server/eden-world-store.js';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'tetelestai-eden-worlds-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const directory = join(root, 'gardens');
  return { directory, store: new EdenWorldStore(directory) };
}

test('garden names survive a new store instance and edits stay in their own garden', (t) => {
  const { directory, store } = fixture(t);
  const first = store.create(); const second = store.create();
  assert.match(first.key, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(first.key, second.key);
  assert.deepEqual(first.names, {});

  store.saveNames(first.key, { 'donkey-1': 'Lucero', 'donkey-2': 'Brisa' });
  const restarted = new EdenWorldStore(directory);
  assert.deepEqual(restarted.load(first.key), { key: first.key, names: { 'donkey-1': 'Lucero', 'donkey-2': 'Brisa' } });
  assert.deepEqual(restarted.load(second.key), second);

  restarted.saveNames(first.key, { 'donkey-1': 'Luz', 'donkey-2': 'Brisa' });
  assert.deepEqual(store.load(first.key)?.names, { 'donkey-1': 'Luz', 'donkey-2': 'Brisa' });
});

test('invalid and unknown keys cannot read or create a garden', (t) => {
  const { directory, store } = fixture(t);
  const { key } = store.create();
  const otherKey = (key.startsWith('A') ? 'B' : 'A') + key.slice(1);
  const noncanonicalKey = key.slice(0, -1) + 'B';
  for (const invalid of [null, '../another-garden', key + '\n', key + '=', noncanonicalKey, otherKey]) {
    assert.equal(store.load(invalid), null);
    assert.throws(() => store.saveNames(invalid, { 'donkey-1': 'Other' }));
  }
  assert.equal(readdirSync(directory).length, 1);
  assert.deepEqual(store.load(key)?.names, {});
});

test('the store writes private hashed files and reports corrupt data', (t) => {
  const { directory, store } = fixture(t);
  const { key } = store.create();
  store.saveNames(key, { 'donkey-1': 'Rocío' });
  const [file] = readdirSync(directory);
  const path = join(directory, file);
  assert.match(file, /^[a-f0-9]{64}\.json$/);
  assert.equal(readFileSync(path, 'utf8').includes(key), false);
  if (process.platform !== 'win32') {
    assert.equal(statSync(directory).mode & 0o077, 0);
    assert.equal(statSync(path).mode & 0o077, 0);
  }
  assert.throws(() => store.saveNames(key, { 'other-animal': 'Unknown' }));
  assert.deepEqual(store.load(key)?.names, { 'donkey-1': 'Rocío' });
  writeFileSync(path, '{"donkey-1":42}');
  assert.throws(() => store.load(key), /Invalid garden names/);
  assert.throws(() => store.saveNames(key, { 'donkey-1': 'Other' }), /Invalid garden names/);
});
