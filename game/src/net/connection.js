/** @typedef {ReturnType<import('../../server/room.js').Room['snapshot']>} State */
/** @typedef {ReturnType<import('../../server/eden-room.js').EdenRoom['snapshot']>} EdenState */
/** @typedef {{type:'offer'|'answer',sdp:string}|{type:'ice',candidate:RTCIceCandidateInit}} Signal */
/** @typedef {{type:'eden-effect',effect:'splash'|'drink'|'feed-fish'|'pet-sheep'|'call-lion'|'feed-giraffe',actor:string,target:string,x:number,z:number}} EdenEffect */
/** @typedef {State|EdenState|EdenEffect|{type:'connected'|'left'|'communication-reset'}|{type:'error'|'eden-feedback',message:string}|{type:'eden-world-key',key:string}|{type:'chat',text:string,own?:boolean}|{type:'answer',accepted:boolean,attempt:string,round:number}|{type:'signal',from:string,data:Signal}} ServerMessage */

export class Connection {
  /** @param {(message:ServerMessage)=>void} receive @param {(status:string)=>void} status */
  constructor(receive, status) {
    this.receive = receive; this.status = status;
    /** @type {WebSocket|null} */ this.socket = null;
    this.destroyed = false; this.attempt = 0;
    /** @type {ReturnType<typeof setTimeout>|undefined} */ this.timer = undefined;
    this.open();
  }
  open() {
    if (this.destroyed) return;
    const scheme = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = import.meta.env.VITE_SERVER_URL || `${scheme}//${location.hostname}:3001`;
    this.status('Conectando al servidor…');
    let socket;
    try { socket = new WebSocket(url); }
    catch { this.status('La URL del servidor no es válida. Revisa VITE_SERVER_URL.'); return; }
    this.socket = socket;
    socket.addEventListener('open', () => { this.attempt = 0; this.status('Conectado. Crea una sala privada o introduce su código.'); });
    socket.addEventListener('message', (event) => {
      if (this.destroyed) return;
      try { this.receive(JSON.parse(event.data)); }
      catch { this.status('El servidor envió un mensaje no válido.'); }
    });
    socket.addEventListener('close', () => {
      if (this.destroyed) return;
      this.status('Conexión perdida. Reconectando…');
      this.receive({ type: 'left' });
      this.timer = setTimeout(() => this.open(), Math.min(8000, 500 * 2 ** this.attempt++));
    });
    socket.addEventListener('error', () => this.status('Servidor no disponible. Inicia npm run server; se reintentará la conexión.'));
  }
  /** @param {object} message */
  send(message) {
    if (this.socket?.readyState !== WebSocket.OPEN) return false;
    this.socket.send(JSON.stringify(message)); return true;
  }
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true; clearTimeout(this.timer);
    this.socket?.close(); this.socket = null;
  }
}
