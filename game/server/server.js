import { createServer } from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { WebSocket, WebSocketServer } from 'ws';
import { Room } from './room.js';

/** @typedef {{id:string, socket:WebSocket, room:Room|null, count:number, window:number, alive:boolean, lastChat:number}} Client */
/** @param {unknown} value @returns {value is Record<string, unknown>} */
function record(value) { return typeof value === 'object' && value !== null && !Array.isArray(value); }

/** Local authoritative transport. Codes are bearer invitations; no account or public matchmaking. */
export function createGameServer() {
  const http = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end('{"service":"Tetelestai","status":"ok"}');
  });
  const wss = new WebSocketServer({ server: http, maxPayload: 8192, perMessageDeflate: false });
  /** @type {Map<string, Room>} */ const rooms = new Map();
  /** @type {Map<string, Client>} */ const clients = new Map();
  /** @param {string} id @param {object} message */
  const send = (id, message) => {
    const socket = clients.get(id)?.socket;
    if (socket?.readyState === WebSocket.OPEN && socket.bufferedAmount < 65536) socket.send(JSON.stringify(message));
  };
  /** @param {Client} client */
  const leave = (client) => {
    const room = client.room;
    if (!room) return;
    room.leave(client.id); client.room = null;
    if (!room.members.size) rooms.delete(room.code);
  };
  /** @param {Client} client @param {unknown} raw */
  const handle = (client, raw) => {
    if (!record(raw) || typeof raw.type !== 'string') { send(client.id, { type: 'error', message: 'Mensaje no válido.' }); return; }
    const room = client.room;
    if (raw.type === 'create' || raw.type === 'join') {
      if (room) { send(client.id, { type: 'error', message: 'Sal de la sala actual antes de entrar en otra.' }); return; }
      let target;
      if (raw.type === 'create') {
        if (rooms.size >= 100) { send(client.id, { type: 'error', message: 'Servidor ocupado. Inténtalo después.' }); return; }
        let code;
        do { code = randomBytes(6).toString('hex').toUpperCase(); } while (rooms.has(code));
        target = new Room(code, send); rooms.set(code, target);
      } else {
        if (typeof raw.code !== 'string' || !/^[A-F0-9]{12}$/.test(raw.code)) { send(client.id, { type: 'error', message: 'Introduce el código privado de 12 caracteres.' }); return; }
        target = rooms.get(raw.code);
      }
      if (!target) { send(client.id, { type: 'error', message: 'La sala ya no existe. Crea una nueva.' }); return; }
      try { target.join(client.id); client.room = target; send(client.id, target.snapshot(client.id)); }
      catch { send(client.id, { type: 'error', message: 'La sala está llena (2 participantes).' }); }
      return;
    }
    if (raw.type === 'leave') { leave(client); send(client.id, { type: 'left' }); return; }
    if (!room) { send(client.id, { type: 'error', message: 'Primero crea una sala o únete.' }); return; }
    switch (raw.type) {
      case 'input':
        if (typeof raw.dx === 'number' && typeof raw.dz === 'number') room.input(client.id, raw.dx, raw.dz);
        break;
      case 'confirm': room.confirm(client.id); break;
      case 'ready': room.ready(client.id); break;
      case 'answer':
        if (raw.round !== room.round || typeof raw.attempt !== 'string' || !room.answer(client.id, raw.attempt, raw.sequence)) send(client.id, { type: 'error', message: 'Respuesta no válida o ronda terminada.' });
        break;
      case 'end': room.end(client.id); break;
      case 'block':
        if (typeof raw.value === 'boolean') {
          room.block(client.id, raw.value);
          for (const id of room.members.keys()) send(id, { type: 'communication-reset' });
        }
        break;
      case 'voice':
        if (typeof raw.value === 'boolean') {
          room.voice(client.id, raw.value);
          for (const id of room.members.keys()) send(id, room.snapshot(id));
        }
        break;
      case 'chat': {
        if (typeof raw.text !== 'string' || !raw.text.trim() || raw.text.length > 300 || Date.now() - client.lastChat < 700) break;
        client.lastChat = Date.now();
        for (const id of room.members.keys()) if (room.canCommunicate(client.id, id)) send(id, { type: 'chat', text: raw.text.trim() });
        send(client.id, { type: 'chat', text: raw.text.trim(), own: true });
        break;
      }
      case 'signal': {
        if (typeof raw.to !== 'string' || !room.canCommunicate(client.id, raw.to) || !room.members.get(client.id)?.voice || !room.members.get(raw.to)?.voice || !record(raw.data)) break;
        const data = raw.data;
        const sdp = typeof data.sdp === 'string' && data.sdp.length <= 7000 && (data.type === 'offer' || data.type === 'answer');
        const ice = data.type === 'ice' && record(data.candidate) && typeof data.candidate.candidate === 'string' && data.candidate.candidate.length <= 1500;
        if (sdp || ice) send(raw.to, { type: 'signal', from: client.id, data });
        break;
      }
      default: send(client.id, { type: 'error', message: 'Acción no reconocida.' });
    }
  };
  wss.on('connection', (socket) => {
    if (clients.size >= 128) { socket.close(1013, 'Servidor ocupado'); return; }
    const client = { id: randomUUID(), socket, room: null, count: 0, window: Date.now(), alive: true, lastChat: 0 };
    clients.set(client.id, client);
    send(client.id, { type: 'connected' });
    socket.on('pong', () => { client.alive = true; });
    socket.on('error', () => { socket.close(); });
    socket.on('message', (data, isBinary) => {
      if (Date.now() - client.window >= 1000) { client.count = 0; client.window = Date.now(); }
      if (++client.count > 40 || isBinary) { socket.close(1008, 'Límite de mensajes'); return; }
      try { handle(client, JSON.parse(data.toString())); }
      catch { send(client.id, { type: 'error', message: 'JSON no válido.' }); }
    });
    socket.on('close', () => { leave(client); clients.delete(client.id); });
  });
  let last = Date.now(); let ticks = 0;
  const timer = setInterval(() => {
    const now = Date.now(); const delta = (now - last) / 1000; last = now; ticks++;
    for (const room of rooms.values()) {
      room.tick(delta);
      if (ticks % 2 === 0) for (const id of room.members.keys()) send(id, room.snapshot(id));
    }
  }, 50);
  const heartbeat = setInterval(() => {
    for (const client of clients.values()) {
      if (!client.alive) { client.socket.terminate(); continue; }
      client.alive = false; client.socket.ping();
    }
  }, 15000);
  return {
    http, rooms,
    /** @param {number} [port] @param {string} [host] */
    listen(port = 3001, host = '127.0.0.1') { return new Promise((resolve) => http.listen(port, host, () => resolve(http.address()))); },
    async close() {
      clearInterval(timer); clearInterval(heartbeat);
      for (const client of clients.values()) client.socket.terminate();
      await new Promise((resolve) => wss.close(resolve));
      await new Promise((resolve) => http.close(resolve));
    },
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createGameServer();
  await server.listen(Number(process.env.PORT ?? 3001), process.env.HOST ?? '127.0.0.1');
  console.log(`Tetelestai server: ws://${process.env.HOST ?? '127.0.0.1'}:${process.env.PORT ?? 3001}`);
  const stop = async () => { await server.close(); process.exit(0); };
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
}
