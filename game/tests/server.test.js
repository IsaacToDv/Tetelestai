import test from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import { createGameServer } from '../server/server.js';

async function setup(t) {
  const server = createGameServer(); const address = await server.listen(0);
  t.after(() => server.close());
  const connect = async () => {
    const socket = new WebSocket(`ws://127.0.0.1:${address.port}`); const messages = [];
    socket.on('message', (data) => messages.push(JSON.parse(data)));
    await new Promise((resolve) => socket.once('open', resolve));
    const until = async (predicate) => {
      const start = Date.now();
      while (Date.now() - start < 2000) {
        const index = messages.findIndex(predicate);
        if (index !== -1) return messages.splice(index, 1)[0];
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      throw new Error('Timed out waiting for server event');
    };
    return { socket, messages, until, send: (message) => socket.send(JSON.stringify(message)) };
  };
  return { server, connect };
}
test('private rooms: role privacy, max two, invalid code, malformed JSON and stale participant cleanup', async (t) => {
  const { connect, server } = await setup(t); const a = await connect(); const b = await connect(); const c = await connect();
  a.send({ type: 'create' }); const state = await a.until((m) => m.type === 'state');
  assert.match(state.code, /^[A-F0-9]{12}$/);
  b.send({ type: 'join', code: state.code }); const other = await b.until((m) => m.type === 'state');
  assert.notEqual(state.role, other.role);
  assert.equal(JSON.stringify(other.players).includes('role'), false);
  c.send({ type: 'join', code: state.code }); assert.match((await c.until((m) => m.type === 'error')).message, /llena/);
  c.send({ type: 'join', code: 'BAD' }); assert.match((await c.until((m) => m.type === 'error')).message, /12/);
  c.socket.send('{'); assert.match((await c.until((m) => m.type === 'error')).message, /JSON/);
  a.socket.close(); await new Promise((resolve) => a.socket.once('close', resolve));
  const after = await b.until((m) => m.type === 'state' && m.players.length === 1);
  assert.equal(after.players[0].id, other.self);
  b.socket.close(); await new Promise((resolve) => b.socket.once('close', resolve));
  assert.equal(server.rooms.size, 0);
});
test('transport denies cross-room signaling/chat and honors block with safe text', async (t) => {
  const { connect } = await setup(t); const a = await connect(); const b = await connect(); const c = await connect();
  a.send({ type: 'create' }); const state = await a.until((m) => m.type === 'state');
  b.send({ type: 'join', code: state.code }); const other = await b.until((m) => m.type === 'state');
  c.send({ type: 'create' }); const outsider = await c.until((m) => m.type === 'state');
  a.send({ type: 'chat', text: '<script>safe as text</script>' });
  assert.match((await b.until((m) => m.type === 'chat')).text, /script/);
  assert.equal(c.messages.some((m) => m.type === 'chat'), false);
  a.send({ type: 'voice', value: true }); b.send({ type: 'voice', value: true });
  a.send({ type: 'signal', to: outsider.self, data: { type: 'offer', sdp: 'test' } });
  a.send({ type: 'block', value: true }); await b.until((m) => m.type === 'communication-reset');
  b.send({ type: 'signal', to: state.self, data: { type: 'offer', sdp: 'blocked' } });
  b.send({ type: 'chat', text: 'blocked message' });
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(a.messages.some((m) => m.type === 'signal' || (m.type === 'chat' && m.text === 'blocked message')), false);
  assert.equal(c.messages.some((m) => m.type === 'signal'), false);
  assert.notEqual(other.self, state.self);
});
test('rate limiting closes abusive clients and payload limit is enforced', async (t) => {
  const { connect } = await setup(t); const a = await connect();
  const closed = new Promise((resolve) => a.socket.once('close', (code) => resolve(code)));
  for (let i = 0; i < 45; i++) a.send({ type: 'create' });
  assert.equal(await closed, 1008);
  const b = await connect();
  const oversized = new Promise((resolve) => b.socket.once('close', (code) => resolve(code)));
  b.socket.send('x'.repeat(9000)); assert.equal(await oversized, 1009);
});
