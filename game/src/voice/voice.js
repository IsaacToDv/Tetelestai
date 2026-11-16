/** @import {State, Signal} from '../net/connection.js' */

/** Opt-in local WebRTC, with no STUN/TURN service configured. */
export class Voice {
  /** @param {(message:object)=>boolean} send @param {(message:string)=>void} status */
  constructor(send, status) {
    this.send = send; this.status = status;
    /** @type {MediaStream|null} */ this.stream = null;
    /** @type {RTCPeerConnection|null} */ this.peer = null;
    /** @type {State|null} */ this.state = null;
    /** @type {RTCIceCandidateInit[]} */ this.ice = [];
    this.other = ''; this.pending = false; this.muted = false; this.blocked = false;
    this.generation = 0; this.failedPeer = ''; this.destroyed = false;
    this.audio = new Audio(); this.audio.autoplay = true;
    this.audio.setAttribute('playsinline', '');
  }
  async toggle() {
    if (this.stream) { this.stop(); this.status('Micrófono apagado.'); return; }
    if (this.pending || this.destroyed) return;
    this.pending = true; const generation = this.generation;
    this.status('Esperando permiso para el micrófono…');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      if (this.destroyed || generation !== this.generation || !this.state) { stream.getTracks().forEach((track) => track.stop()); return; }
      this.stream = stream; this.send({ type: 'voice', value: true });
      this.status('Micrófono activo. La voz solo se enlaza con ambos participantes cerca y con su micrófono activo.');
    } catch {
      this.status('No se pudo activar el micrófono. Comprueba el permiso y usa el chat de texto.');
    } finally { this.pending = false; }
  }
  /** @param {State} state */
  update(state) {
    this.state = state;
    const own = state.players.find((player) => player.id === state.self);
    const other = state.players.find((player) => player.id !== state.self);
    const distance = own && other ? Math.hypot(own.x - other.x, own.z - other.z) : 100;
    this.audio.volume = this.muted || this.blocked ? 0 : Math.max(0, 1 - distance / 12);
    const eligible = Boolean(this.stream && own?.voice && other?.voice && state.communication && !this.blocked);
    if (!eligible || other?.id !== this.other) this.closePeer();
    if (eligible && other && !this.peer && this.failedPeer !== other.id) {
      this.other = other.id;
      this.createPeer();
      if (state.self < other.id) void this.offer();
    }
    if (!eligible) this.failedPeer = '';
  }
  createPeer() {
    const peer = new RTCPeerConnection({ iceServers: [] }); this.peer = peer;
    let candidates = 0;
    for (const track of this.stream?.getTracks() ?? []) peer.addTrack(track, /** @type {MediaStream} */ (this.stream));
    peer.onicecandidate = (event) => {
      if (peer !== this.peer) return;
      if (event.candidate) { candidates++; this.send({ type: 'signal', to: this.other, data: { type: 'ice', candidate: event.candidate.toJSON() } }); }
      else if (!candidates) {
        this.failedPeer = this.other;
        this.status('El navegador no ofrece una ruta de voz en esta red o por sus políticas. Usa el chat de texto; puedes apagar el micrófono.');
      }
    };
    peer.ontrack = (event) => {
      if (peer !== this.peer) return;
      this.audio.srcObject = event.streams[0] ?? new MediaStream([event.track]);
      void this.audio.play().catch(() => this.status('Pulsa «Escuchar voz» para habilitar el audio del navegador.'));
    };
    peer.onconnectionstatechange = () => {
      if (peer !== this.peer) return;
      if (peer.connectionState === 'connected') this.status('Voz conectada; volumen según distancia.');
      if (peer.connectionState === 'failed') {
        this.failedPeer = this.other; this.closePeer();
        this.status('No se pudo enlazar la voz en esta red sin TURN. Apaga y reactiva el micrófono, o usa texto.');
      }
    };
  }
  async offer() {
    const peer = this.peer;
    if (!peer) return;
    try {
      await peer.setLocalDescription(await peer.createOffer());
      if (peer === this.peer) this.send({ type: 'signal', to: this.other, data: { type: 'offer', sdp: peer.localDescription?.sdp } });
    } catch { if (peer === this.peer) this.status('No se pudo iniciar la voz. Usa el chat o reactiva el micrófono.'); }
  }
  /** @param {string} from @param {Signal} data */
  async signal(from, data) {
    if (this.blocked || !this.stream || (this.failedPeer === from && !this.peer) || !this.state?.communication || !this.state.players.some((player) => player.id === from && player.id !== this.state?.self)) return;
    if (!this.peer) { this.other = from; this.createPeer(); }
    if (from !== this.other) return;
    const peer = this.peer;
    if (!peer) return;
    try {
      if (data.type === 'ice') {
        if (peer.remoteDescription) await peer.addIceCandidate(data.candidate);
        else if (this.ice.length < 100) this.ice.push(data.candidate);
      } else {
        await peer.setRemoteDescription(data);
        if (peer !== this.peer) return;
        for (const candidate of this.ice) await peer.addIceCandidate(candidate);
        this.ice.length = 0;
        if (data.type === 'offer') {
          await peer.setLocalDescription(await peer.createAnswer());
          if (peer === this.peer) this.send({ type: 'signal', to: from, data: { type: 'answer', sdp: peer.localDescription?.sdp } });
        }
      }
    } catch { if (peer === this.peer) this.status('La señal de voz no pudo completarse. Usa texto o reactiva el micrófono.'); }
  }
  listen() { void this.audio.play().catch(() => this.status('El audio estará disponible cuando se conecte el compañero.')); }
  /** @param {boolean} value */
  mute(value) { this.muted = value; this.audio.muted = value || this.blocked; }
  /** @param {boolean} value */
  block(value) { this.blocked = value; this.audio.muted = value || this.muted; if (value) this.closePeer(); }
  closePeer() {
    if (this.peer) {
      this.peer.ontrack = null; this.peer.onicecandidate = null; this.peer.onconnectionstatechange = null;
      this.peer.close(); this.peer = null;
    }
    this.other = ''; this.ice.length = 0; this.audio.pause(); this.audio.srcObject = null;
  }
  stop() {
    this.generation++; this.closePeer(); this.failedPeer = '';
    this.stream?.getTracks().forEach((track) => track.stop()); this.stream = null;
    this.send({ type: 'voice', value: false });
  }
  reset() { this.stop(); this.state = null; this.blocked = false; this.audio.muted = this.muted; }
  destroy() { if (this.destroyed) return; this.destroyed = true; this.reset(); this.audio.remove(); }
}
