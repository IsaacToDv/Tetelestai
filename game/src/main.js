import { createApp } from './core/create-app.js';
import { Input } from './core/input.js';
import { Connection } from './net/connection.js';
import { Voice } from './voice/voice.js';
import './style.css';
/** @import {State, ServerMessage} from './net/connection.js' */

/** @template {HTMLElement} T @param {string} selector @param {{new(...args:never[]):T}} type @returns {T} */
function element(selector, type) {
  const found = document.querySelector(selector);
  if (!(found instanceof type)) throw new Error(`Missing element: ${selector}`);
  return found;
}
/** @param {string} id */
const node = (id) => element(`#${id}`, HTMLElement);
/** @param {string} id */
const button = (id) => element(`#${id}`, HTMLButtonElement);
const canvas = element('#game-canvas', HTMLCanvasElement);
const codeInput = element('#room-code', HTMLInputElement);
const chatInput = element('#chat-text', HTMLInputElement);
const fragment = element('#fragment', HTMLDetailsElement);
const status = node('status');
/** @type {State|null} */ let state = null;
/** @type {ReturnType<typeof createApp>|undefined} */ let scene;
/** @type {Connection|undefined} */ let connection;
/** @type {Voice|undefined} */ let voice;
/** @type {Input|undefined} */ let input;
let disposed = false; let connected = false; let joinedCode = ''; let lastPhase = ''; let lastRound = 0;
let accepted = false; let awaiting = false; let blocked = false; let muted = false;
/** @type {string[]} */ let sequence = [];
const labels = new Map([['siquem', 'Siquem'], ['betel-hai', 'Zona entre Betel y Hai'], ['haran', 'Harán']]);
const listeners = new AbortController();
/** @param {string} text */
function setStatus(text) { status.textContent = text; }
/** @param {object} message */
function send(message) { return connection?.send(message) ?? false; }
/** @param {string} id @param {()=>void} handler */
function click(id, handler) { button(id).addEventListener('click', handler, { signal: listeners.signal }); }
/** @param {string} id @param {boolean} show */
function visible(id, show) { node(id).hidden = !show; }

function showSequence() {
  const list = node('sequence'); list.replaceChildren();
  for (const place of sequence) { const item = document.createElement('li'); item.textContent = labels.get(place) ?? ''; list.append(item); }
  document.querySelectorAll('button[data-place]').forEach((item) => {
    if (item instanceof HTMLButtonElement) item.disabled = sequence.includes(item.dataset.place ?? '') || accepted || awaiting;
  });
  button('submit-answer').disabled = sequence.length !== 3 || accepted || awaiting;
  button('reset-sequence').disabled = accepted || awaiting;
}
function resetSequence() { sequence = []; accepted = false; awaiting = false; node('answer-status').textContent = ''; showSequence(); }
function resetSession() {
  state = null; lastPhase = ''; scene?.setState(null); voice?.reset();
  if (input) { input.clear(); input.active = false; }
  visible('session', false); visible('lobby', true);
  node('messages').replaceChildren(); blocked = false; button('block').setAttribute('aria-pressed', 'false'); button('block').textContent = 'Bloquear voz y chat';
  button('microphone').textContent = 'Activar micrófono'; resetSequence();
}
/** @param {State} next */
function render(next) {
  const changed = next.phase !== lastPhase;
  if (next.code !== joinedCode) {
    node('messages').replaceChildren(); joinedCode = next.code;
    codeInput.value = next.code;
    try { sessionStorage.setItem('tetelestai-room', next.code); } catch { /* Storage is optional in private browser modes. */ }
  }
  state = next; scene?.setState(next); voice?.update(next); if (input) input.active = true;
  visible('lobby', false); visible('session', true); node('code').textContent = next.code;
  node('role').textContent = `Tu rol: ${next.role}`;
  node('companionship').textContent = next.players.length === 2 ? 'Compañero presente · su rol permanece privado' : 'Esperando a tu compañero. Comparte el código privado.';
  const own = next.players.find((player) => player.id === next.self);
  node('position').textContent = own ? `Tu posición: ${own.x.toFixed(1)}, ${own.z.toFixed(1)} · Punto de reunión: 0, 0` : '';
  visible('exploration', !next.fragmentCompleted);
  button('confirm').disabled = !next.nearFragment || next.players.length !== 2 || next.consent;
  button('confirm').textContent = next.consent ? 'Confirmado · esperando al compañero' : 'Estoy en el punto de reunión';
  fragment.hidden = !next.fragmentCompleted;
  if (changed && next.phase === 'fragment') fragment.open = true;
  visible('pre-challenge', next.phase === 'fragment');
  button('ready').disabled = next.ready; button('ready').textContent = next.ready ? 'Listo · esperando al compañero' : 'He leído · Iniciar reto';
  visible('challenge', next.phase === 'challenge');
  if (next.phase === 'challenge' && next.round !== lastRound) { resetSequence(); fragment.open = false; }
  node('timer').textContent = `${Math.ceil(next.remainingMs / 1000)} s`;
  visible('result', next.phase === 'result'); visible('complete', next.phase === 'complete');
  if (next.result && next.phase === 'result') {
    const result = next.result;
    let text = result.kind === 'tie' ? 'Empate: ambos acertaron dentro de 250 ms.' : result.kind === 'timeout' ? `Se agotó el tiempo. Orden: ${(result.solution ?? []).map((place) => labels.get(place) ?? place).join(' → ')}. Pueden repetir.` : result.kind === 'cancelled' ? 'Ronda cancelada por desconexión. No hay ganador. El fragmento sigue completado.' : result.winners.includes(next.self) ? 'Tu secuencia llegó primero. Recibes una ficha de agua.' : 'Tu compañero resolvió primero. También puedes concluir el recorrido.';
    if (next.done) text += ' Has concluido; esperando a tu compañero.';
    node('result-text').textContent = text;
    node('water').textContent = `Tus fichas de agua: ${own?.water ?? 0}`;
    button('retry').disabled = next.ready || next.done || next.players.length !== 2;
    button('retry').textContent = next.ready ? 'Listo para repetir · esperando' : 'Repetir reto';
    button('end').disabled = next.done;
  }
  node('proximity').textContent = next.communication ? 'Compañero al alcance. El texto y la voz están disponibles si ambos lo permiten.' : 'Fuera de alcance, sin compañero o comunicación bloqueada.';
  chatInput.disabled = !next.communication || blocked; button('send-chat').disabled = chatInput.disabled;
  button('microphone').disabled = blocked || Boolean(voice?.pending);
  button('microphone').textContent = voice?.stream ? 'Apagar micrófono' : 'Activar micrófono';
  if (changed) setStatus(next.phase === 'exploration' ? 'Reúnanse en el círculo turquesa.' : next.phase === 'fragment' ? 'Fragmento compartido descubierto una sola vez.' : next.phase === 'challenge' ? 'Reto en curso. El servidor decide el resultado.' : next.phase === 'complete' ? 'Ambos han concluido el recorrido.' : 'Ronda terminada. Ambos pueden avanzar.');
  lastPhase = next.phase; lastRound = next.round;
}
/** @param {ServerMessage} message */
function receive(message) {
  if (disposed) return;
  switch (message.type) {
    case 'connected':
      connected = true; button('create').disabled = false; button('join').disabled = false;
      if (joinedCode) { send({ type: 'join', code: joinedCode }); setStatus('Reconectado. Intentando volver a la sala; el rol puede reasignarse.'); }
      break;
    case 'state': render(message); break;
    case 'left': connected = connection?.socket?.readyState === WebSocket.OPEN; button('create').disabled = !connected; button('join').disabled = !connected; resetSession(); break;
    case 'error': setStatus(message.message); break;
    case 'answer':
      if (state?.round !== message.round) break;
      accepted = message.accepted; awaiting = false;
      node('answer-status').textContent = accepted ? 'Respuesta recibida. Espera el resultado del servidor.' : 'Ese orden no es correcto. Reordena y vuelve a intentar.';
      if (!accepted) sequence = [];
      showSequence(); break;
    case 'chat': {
      if (blocked) break;
      const item = document.createElement('li'); item.textContent = `${message.own ? 'Tú' : 'Compañero'}: ${message.text}`;
      const list = node('messages'); list.append(item); if (list.children.length > 30) list.firstElementChild?.remove(); list.scrollTop = list.scrollHeight;
      break;
    }
    case 'signal': void voice?.signal(message.from, message.data); break;
    case 'communication-reset': voice?.closePeer(); break;
  }
}
function dispose() {
  if (disposed) return;
  disposed = true; listeners.abort(); input?.destroy(); voice?.destroy(); connection?.destroy(); scene?.destroy();
}
try {
  scene = createApp(canvas);
  voice = new Voice(send, (text) => { node('voice-status').textContent = text; });
  input = new Input(send, node('controls'));
  connection = new Connection(receive, setStatus);
  try { codeInput.value = sessionStorage.getItem('tetelestai-room') ?? ''; } catch { /* Invitations can still be typed without storage. */ }
  click('create', () => { if (connected) send({ type: 'create' }); });
  element('#join-form', HTMLFormElement).addEventListener('submit', (event) => { event.preventDefault(); if (send({ type: 'join', code: codeInput.value.trim().toUpperCase() })) setStatus('Buscando la sala privada…'); }, { signal: listeners.signal });
  click('leave', () => { joinedCode = ''; send({ type: 'leave' }); resetSession(); setStatus('Has salido. Puedes crear una sala o volver a unirte.'); });
  click('confirm', () => send({ type: 'confirm' })); click('ready', () => send({ type: 'ready' })); click('retry', () => send({ type: 'ready' })); click('end', () => send({ type: 'end' }));
  document.querySelectorAll('button[data-place]').forEach((item) => {
    if (!(item instanceof HTMLButtonElement)) return;
    item.addEventListener('click', () => { const place = item.dataset.place; if (place && !sequence.includes(place) && sequence.length < 3) { sequence.push(place); showSequence(); } }, { signal: listeners.signal });
  });
  click('reset-sequence', resetSequence);
  click('submit-answer', () => { if (state && sequence.length === 3 && send({ type: 'answer', round: state.round, attempt: crypto.randomUUID(), sequence })) { awaiting = true; showSequence(); } });
  click('microphone', () => { void voice?.toggle(); }); click('listen', () => voice?.listen());
  click('mute', () => { muted = !muted; voice?.mute(muted); button('mute').setAttribute('aria-pressed', String(muted)); button('mute').textContent = muted ? 'Reactivar voz' : 'Silenciar voz'; });
  click('block', () => { blocked = !blocked; voice?.block(blocked); send({ type: 'block', value: blocked }); button('block').setAttribute('aria-pressed', String(blocked)); button('block').textContent = blocked ? 'Desbloquear voz y chat' : 'Bloquear voz y chat'; if (state) render(state); });
  element('#chat-form', HTMLFormElement).addEventListener('submit', (event) => { event.preventDefault(); if (!blocked && state?.communication && chatInput.value.trim()) { send({ type: 'chat', text: chatInput.value }); chatInput.value = ''; } }, { signal: listeners.signal });
  canvas.addEventListener('webglcontextlost', (event) => { event.preventDefault(); dispose(); setStatus('Se perdió el contexto gráfico. Vuelve a cargar para regresar a la sala.'); document.body.dataset.state = 'error'; }, { signal: listeners.signal });
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) window.addEventListener('pageshow', () => location.reload(), { once: true });
    dispose();
  }, { signal: listeners.signal });
  document.body.dataset.state = 'ready';
} catch (error) {
  dispose(); document.body.dataset.state = 'error'; setStatus('No se pudo preparar el juego. Comprueba WebGL 2 y vuelve a cargar.'); console.error(error);
}
if (import.meta.hot) import.meta.hot.dispose(dispose);
