import test from 'node:test';
import assert from 'node:assert/strict';
import { Voice } from '../src/voice/voice.js';

class FakeAudio {
  paused = true; volume = 1; muted = false; srcObject = null;
  setAttribute() {} remove() {} pause() { this.paused = true; }
  async play() { this.paused = false; }
}
class FakePeer {
  remoteDescription = null; localDescription = null; connectionState = 'new'; added = [];
  addTrack() {} close() { this.connectionState = 'closed'; }
  async createOffer() { return { type: 'offer', sdp: 'offer' }; }
  async createAnswer() { return { type: 'answer', sdp: 'answer' }; }
  async setLocalDescription(data) { this.localDescription = data; }
  async setRemoteDescription(data) { this.remoteDescription = data; }
  async addIceCandidate(data) { this.added.push(data); }
}
function setup(t) {
  const oldAudio = globalThis.Audio; const oldPeer = globalThis.RTCPeerConnection;
  globalThis.Audio = FakeAudio; globalThis.RTCPeerConnection = FakePeer;
  t.after(() => { globalThis.Audio = oldAudio; globalThis.RTCPeerConnection = oldPeer; });
  const sent = []; const statuses = [];
  const voice = new Voice((message) => { sent.push(message); return true; }, (message) => statuses.push(message));
  const track = { readyState: 'live', stop() { this.readyState = 'ended'; } };
  voice.stream = { getTracks: () => [track] };
  const state = { self: 'b', communication: true, players: [{ id: 'a', x: 0, z: 0, voice: true }, { id: 'b', x: 3, z: 0, voice: true }] };
  return { voice, sent, statuses, state, track };
}
test('voice buffers early ICE, answers offers, attenuates by distance and blocks peer', async (t) => {
  const f = setup(t); f.voice.update(f.state);
  await f.voice.signal('a', { type: 'ice', candidate: { candidate: 'host' } });
  assert.equal(f.voice.ice.length, 1);
  await f.voice.signal('a', { type: 'offer', sdp: 'offer' });
  assert.equal(f.voice.peer.added.length, 1); assert.equal(f.voice.ice.length, 0);
  assert.equal(f.sent.at(-1).data.type, 'answer'); assert.equal(f.voice.audio.volume, 0.75);
  const peer = f.voice.peer; f.voice.block(true);
  assert.equal(peer.connectionState, 'closed'); assert.equal(f.voice.audio.muted, true);
  await f.voice.signal('a', { type: 'offer', sdp: 'offer' }); assert.equal(f.voice.peer, null);
  f.voice.destroy(); assert.equal(f.track.readyState, 'ended');
});
test('voice reports zero ICE routes, suppresses retry loop and releases tracks on reset', (t) => {
  const f = setup(t); f.voice.update(f.state); const peer = f.voice.peer;
  peer.onicecandidate({ candidate: null });
  assert.match(f.statuses.at(-1), /políticas/); assert.equal(f.voice.peer, peer);
  f.voice.update(f.state); assert.equal(f.voice.peer, peer);
  f.voice.reset(); assert.equal(f.track.readyState, 'ended'); assert.equal(f.voice.state, null);
});
test('voice handles microphone permission denial without stopping text session', async (t) => {
  const f = setup(t); f.voice.stream = null; f.voice.state = f.state;
  const previous = Object.getOwnPropertyDescriptor(globalThis.navigator, 'mediaDevices');
  Object.defineProperty(globalThis.navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: async () => { throw new Error('denied'); } } });
  t.after(() => { if (previous) Object.defineProperty(globalThis.navigator, 'mediaDevices', previous); else delete globalThis.navigator.mediaDevices; });
  await f.voice.toggle(); assert.equal(f.voice.stream, null); assert.equal(f.voice.pending, false);
  assert.match(f.statuses.at(-1), /permiso/); assert.ok(f.voice.state);
});
