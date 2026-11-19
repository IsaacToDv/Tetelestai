import { createServer } from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import { fileURLToPath, pathToFileURL, URL } from 'node:url';
import { WebSocket, WebSocketServer } from 'ws';
import { EdenRoom } from './eden-room.js';
import { EdenWorldStore } from './eden-world-store.js';
import { Room } from './room.js';

/** @typedef {{id:string, socket:WebSocket, room:Room|EdenRoom|null, count:number, window:number, alive:boolean, lastChat:number}} Client */
/** @param {unknown} value @returns {value is Record<string, unknown>} */
function record(value) { return typeof value === 'object' && value !== null && !Array.isArray(value); }

/** @param {{saveDirectory?:string}} [options] */
export function createGameServer({ saveDirectory = process.env.EDEN_SAVE_DIR ?? fileURLToPath(new URL('../.eden-data/', import.meta.url)) } = {}) {
  const http = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end('{"service":"Tetelestai","status":"ok"}');
  });
  const wss = new WebSocketServer({ server: http, maxPayload: 8192, perMessageDeflate: false });
  /** @type {Map<string, Room|EdenRoom>} */ const rooms = new Map();
  /** @type {Map<string, Client>} */ const clients = new Map();
  const worldStore = new EdenWorldStore(saveDirectory);
  /** @param {string} id @param {object} message */
  const send = (id, message) => {
    const socket = clients.get(id)?.socket;
    if (socket?.readyState === WebSocket.OPEN && socket.bufferedAmount < 65536) socket.send(JSON.stringify(message));
  };
  /** @param {Room|EdenRoom} room */
  const broadcast = (room) => {
    for (const id of room.members.keys()) send(id, room.snapshot(id));
  };
  /** @param {Client} client */
  const leave = (client) => {
    const room = client.room;
    if (!room) return;
    room.leave(client.id); client.room = null;
    if (!room.members.size) {
      if (room instanceof EdenRoom) room.destroy();
      rooms.delete(room.code);
    }
    else if (room instanceof EdenRoom) broadcast(room);
  };
  /** @param {Client} client @param {unknown} raw */
  const handle = (client, raw) => {
    if (!record(raw) || typeof raw.type !== 'string') { send(client.id, { type: 'error', message: 'Mensaje no válido.' }); return; }
    const room = client.room;
    if (raw.type === 'create' || raw.type === 'join' || raw.type === 'resume') {
      if (room) { send(client.id, { type: 'error', message: 'Sal de la sala actual antes de entrar en otra.' }); return; }
      if (raw.mode !== undefined && raw.mode !== 'eden') { send(client.id, { type: 'error', message: 'Modo de juego no reconocido.' }); return; }
      const eden = raw.mode === 'eden';
      if (raw.type === 'resume' && !eden) { send(client.id, { type: 'error', message: 'Modo de juego no reconocido.' }); return; }
      let target;
      let world;
      if (raw.type === 'join') {
        if (typeof raw.code !== 'string' || !/^[A-F0-9]{12}$/.test(raw.code)) { send(client.id, { type: 'error', message: 'Introduce el código privado de 12 caracteres.' }); return; }
        target = rooms.get(raw.code);
      } else {
        try {
          if (raw.type === 'resume') {
            world = worldStore.load(raw.key);
            if (!world) { send(client.id, { type: 'error', message: 'No se encontró un jardín con esa clave.' }); return; }
            const key = world.key;
            target = [...rooms.values()].find((candidate) => candidate instanceof EdenRoom && candidate.world?.key === key);
          }
          if (!target) {
            if (rooms.size >= 100) { send(client.id, { type: 'error', message: 'Servidor ocupado. Inténtalo después.' }); return; }
            let code;
            do { code = randomBytes(6).toString('hex').toUpperCase(); } while (rooms.has(code));
            if (eden) {
              const saved = world ?? worldStore.create();
              world = saved;
              const garden = new EdenRoom(code, Date.now, { ...saved, saveNames: (names) => worldStore.saveNames(saved.key, names) }, (effect) => {
                for (const id of garden.members.keys()) send(id, effect);
              });
              target = garden;
            } else target = new Room(code, send);
            rooms.set(code, target);
          }
        } catch {
          send(client.id, { type: 'error', message: 'No se pudo abrir el jardín guardado.' });
          return;
        }
      }
      if (!target || (target instanceof EdenRoom) !== eden) { send(client.id, { type: 'error', message: 'La sala ya no existe. Crea una nueva.' }); return; }
      try {
        target.join(client.id); client.room = target;
        send(client.id, target.snapshot(client.id));
        if (world) send(client.id, { type: 'eden-world-key', key: world.key });
      }
      catch { send(client.id, { type: 'error', message: 'La sala está llena (2 participantes).' }); }
      return;
    }
    if (raw.type === 'leave') { leave(client); send(client.id, { type: 'left' }); return; }
    if (!room) { send(client.id, { type: 'error', message: 'Primero crea una sala o únete.' }); return; }
    if (raw.type === 'input') {
      if (typeof raw.dx === 'number' && typeof raw.dz === 'number') room.input(client.id, raw.dx, raw.dz);
      return;
    }
    if (room instanceof EdenRoom) {
      if (raw.type === 'select-character') {
        const message = room.select(client.id, raw.character);
        if (message) send(client.id, { type: 'error', message });
        else broadcast(room);
        return;
      }
      if (raw.type === 'visit') {
        if (room.visit(client.id)) broadcast(room);
        else send(client.id, { type: 'error', message: 'Acércate al punto de visita con tu personaje.' });
        return;
      }
      if (raw.type === 'interact') {
        const message = room.interact(client.id, raw.action, raw.target, raw.name);
        if (message) send(client.id, { type: 'error', message });
        else {
          broadcast(room);
          if (raw.action === 'eat') send(client.id, { type: 'eden-feedback', message: 'Has comido un fruto.' });
        }
        return;
      }
      if (!room.members.get(client.id)?.character) return;
    }
    switch (raw.type) {
      case 'block':
        if (typeof raw.value === 'boolean') {
          room.block(client.id, raw.value);
          for (const id of room.members.keys()) send(id, { type: 'communication-reset' });
          if (room instanceof EdenRoom) broadcast(room);
        }
        return;
      case 'voice':
        if (typeof raw.value === 'boolean') {
          room.voice(client.id, raw.value);
          broadcast(room);
        }
        return;
      case 'chat': {
        if (typeof raw.text !== 'string' || !raw.text.trim() || raw.text.length > 300 || Date.now() - client.lastChat < 700) return;
        client.lastChat = Date.now();
        const text = raw.text.trim();
        let delivered = false;
        for (const id of room.members.keys()) {
          if (!room.canCommunicate(client.id, id)) continue;
          send(id, { type: 'chat', text });
          delivered = true;
        }
        if (delivered || room instanceof Room) send(client.id, { type: 'chat', text, own: true });
        return;
      }
      case 'signal': {
        if (typeof raw.to !== 'string' || !room.canCommunicate(client.id, raw.to) || !room.members.get(client.id)?.voice || !room.members.get(raw.to)?.voice || !record(raw.data)) return;
        const data = raw.data;
        const sdp = typeof data.sdp === 'string' && data.sdp.length <= 7000 && (data.type === 'offer' || data.type === 'answer');
        const ice = data.type === 'ice' && record(data.candidate) && typeof data.candidate.candidate === 'string' && data.candidate.candidate.length <= 1500;
        if (sdp || ice) send(raw.to, { type: 'signal', from: client.id, data });
        return;
      }
    }
    if (!(room instanceof Room)) { send(client.id, { type: 'error', message: 'Acción no reconocida.' }); return; }
    switch (raw.type) {
      case 'confirm': room.confirm(client.id); break;
      case 'ready': room.ready(client.id); break;
      case 'answer':
        if (raw.round !== room.round || typeof raw.attempt !== 'string' || !room.answer(client.id, raw.attempt, raw.sequence)) send(client.id, { type: 'error', message: 'Respuesta no válida o ronda terminada.' });
        break;
      case 'end': room.end(client.id); break;
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
      if (ticks % 2 === 0) broadcast(room);
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
      for (const room of rooms.values()) if (room instanceof EdenRoom) room.destroy();
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
