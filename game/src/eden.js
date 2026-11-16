import { Input } from './core/input.js';
import { Connection } from './net/connection.js';
import { createEdenScene } from './graphics/eden-scene.js';
import { Voice } from './voice/voice.js';
import './eden.css';

/** @import {EdenState, ServerMessage} from './net/connection.js' */

/**
 * @template {HTMLElement} T
 * @param {string} id
 * @param {{new(...args:never[]):T}} type
 */
function element(id, type) {
  const node = document.getElementById(id);
  if (!(node instanceof type)) throw new Error(`Missing Edén element: ${id}`);
  return node;
}

const canvas = element('eden-canvas', HTMLCanvasElement);
const menu = element('eden-menu', HTMLElement);
const selection = element('eden-selection', HTMLElement);
const session = element('eden-session', HTMLElement);
const play = element('eden-play', HTMLElement);
const controls = element('eden-controls', HTMLElement);
const status = element('eden-status', HTMLElement);
const company = element('eden-company', HTMLElement);
const roomCode = element('eden-code', HTMLElement);
const character = element('eden-character', HTMLElement);
const create = element('eden-create', HTMLButtonElement);
const join = element('eden-join', HTMLButtonElement);
const leave = element('eden-leave', HTMLButtonElement);
const codeInput = element('eden-code-input', HTMLInputElement);
const joinForm = element('eden-join-form', HTMLFormElement);
const resume = element('eden-resume', HTMLButtonElement);
const resumeForm = element('eden-resume-form', HTMLFormElement);
const worldInput = element('eden-world-input', HTMLInputElement);
const world = element('eden-world', HTMLDetailsElement);
const worldKey = element('eden-world-key', HTMLElement);
const guide = element('eden-guide', HTMLElement);
const visitButton = element('eden-visit', HTMLButtonElement);
const waterButton = element('eden-water', HTMLButtonElement);
const feedButton = element('eden-feed', HTMLButtonElement);
const mountButton = element('eden-mount', HTMLButtonElement);
const eatButton = element('eden-eat', HTMLButtonElement);
const activityButtons = [visitButton, waterButton, feedButton, mountButton, eatButton];
const animals = element('eden-animals', HTMLDetailsElement);
const animalList = element('eden-animal-list', HTMLElement);
const nameForm = element('eden-name-form', HTMLFormElement);
const nameTarget = element('eden-name-target', window.HTMLSelectElement);
const nameInput = element('eden-name-input', HTMLInputElement);
const communication = element('eden-communication', HTMLDetailsElement);
const proximity = element('eden-proximity', HTMLElement);
const microphone = element('eden-microphone', HTMLButtonElement);
const listen = element('eden-listen', HTMLButtonElement);
const mute = element('eden-mute', HTMLButtonElement);
const block = element('eden-block', HTMLButtonElement);
const voiceStatus = element('eden-voice-status', HTMLElement);
const messages = element('eden-messages', HTMLElement);
const chatForm = element('eden-chat-form', HTMLFormElement);
const chatInput = element('eden-chat-input', HTMLInputElement);
const chatSend = element('eden-chat-send', HTMLButtonElement);
const characterButtons = document.querySelectorAll('button[data-character]');
const listeners = new AbortController();
const events = { signal: listeners.signal };

/** @type {EdenState|null} */ let state = null;
/** @type {Connection|undefined} */ let connection;
/** @type {Input|undefined} */ let input;
/** @type {Voice|undefined} */ let voice;
/** @type {ReturnType<typeof createEdenScene>|undefined} */ let scene;
/** @type {'enter'|'select'|'leave'|null} */ let pending = null;
/** @type {number|null} */ let lookPointer = null;
let lastLookX = 0;
let lastLookY = 0;
let connected = false;
let hasPrivateKey = false;
let animalListText = '';
/** @type {ReturnType<typeof setTimeout>|undefined} */ let feedbackTimer;

/** @param {object} message */
function send(message) { return connection?.send(message) ?? false; }

/** @param {HTMLElement} node @param {string} text */
function writeText(node, text) { if (node.textContent !== text) node.textContent = text; }

/** @param {string} message */
function setStatus(message) {
  clearTimeout(feedbackTimer);
  writeText(status, message);
}

/** @param {EdenState['players'][number]|undefined} self */
function renderActivities(self) {
  if (!state || !self?.character) return;
  const { visit, garden } = state;
  const visited = visit.visited.length === 2;
  const watered = garden.sprouts.every((sprout) => sprout.watered);
  let task = 'Visita el punto señalado con tu amigo y riega los dos brotes del jardín.';
  if (visited && watered) task = 'Tarea completada. Puedes seguir explorando el jardín.';
  else if (visited) task = 'Visita completada. Riega los brotes que faltan.';
  else if (watered) task = 'Riego completado. Registra vuestra visita en el punto señalado.';
  else if (visit.visited.includes(self.character)) task = 'Visita registrada. Tu amigo todavía puede confirmar la suya.';
  writeText(guide, task);

  const riding = garden.animals.find((animal) => animal.rider === self.id);
  /** @param {{x:number,z:number}} target */
  const withinReach = (target) => Math.hypot(target.x - self.x, target.z - self.z) <= 2;
  const sprout = garden.sprouts.find((target) => !target.watered && withinReach(target));
  const animal = garden.animals.find(withinReach);
  visitButton.hidden = !visit.nearby || visit.visited.includes(self.character);
  waterButton.hidden = !sprout;
  waterButton.dataset.target = sprout?.id ?? '';
  feedButton.hidden = !animal || animal.feeds >= 3;
  feedButton.dataset.target = animal?.id ?? '';
  mountButton.hidden = !riding && (!animal || animal.feeds < 3 || Boolean(animal.rider));
  mountButton.dataset.target = riding?.id ?? animal?.id ?? '';
  writeText(mountButton, riding ? 'Desmontar' : 'Montar');
  eatButton.hidden = !garden.fruit.available || !withinReach(garden.fruit);
  nameForm.hidden = self.character !== 'adam';

  const labels = garden.animals.map((item, index) => `${item.name || `Asno ${index + 1}`} · ${item.feeds >= 3 ? 'adulto' : `cría, alimentación ${item.feeds}/3`}`);
  const listKey = JSON.stringify(labels);
  if (animalListText !== listKey) {
    animalListText = listKey;
    animalList.replaceChildren(...labels.map((label) => {
      const item = document.createElement('li');
      item.textContent = label;
      return item;
    }));
  }
}

function showAnimalName() {
  nameInput.value = state?.garden.animals.find((animal) => animal.id === nameTarget.value)?.name ?? '';
}

function renderCommunication() {
  const available = Boolean(state?.communication);
  const blocked = Boolean(state?.blocked);
  writeText(proximity, blocked ? 'Has bloqueado la comunicación.' : available ? 'Tu amigo está al alcance de voz y chat.' : 'Acércate a tu amigo para comunicarte.');
  microphone.disabled = blocked || Boolean(voice?.pending);
  writeText(microphone, voice?.stream ? 'Apagar micrófono' : 'Activar micrófono');
  chatInput.disabled = !available;
  chatSend.disabled = !available;
  block.disabled = state?.players.length !== 2;
  block.setAttribute('aria-pressed', String(blocked));
  writeText(block, blocked ? 'Desbloquear voz y chat' : 'Bloquear voz y chat');
  mute.setAttribute('aria-pressed', String(Boolean(voice?.muted)));
  writeText(mute, voice?.muted ? 'Reactivar voz' : 'Silenciar voz');
}

function resetGardenControls() {
  voice?.reset(false);
  voiceStatus.textContent = 'Micrófono apagado.';
  communication.open = false;
  animals.open = false;
  world.open = false;
  worldKey.textContent = '';
  hasPrivateKey = false;
  nameForm.reset();
  chatForm.reset();
  messages.replaceChildren();
}

function stopLooking() {
  const pointer = lookPointer;
  lookPointer = null;
  if (pointer !== null && canvas.hasPointerCapture(pointer)) canvas.releasePointerCapture(pointer);
}

function render() {
  const self = state?.players.find((player) => player.id === state?.self);
  const ownCharacter = self?.character;
  const playing = Boolean(ownCharacter) && pending !== 'leave';
  menu.hidden = Boolean(state);
  selection.hidden = !state || Boolean(ownCharacter);
  session.hidden = !state;
  world.hidden = !state || !hasPrivateKey;
  play.hidden = !playing;
  canvas.toggleAttribute('data-orbit', playing);
  character.hidden = !ownCharacter;
  character.textContent = ownCharacter === 'adam' ? 'Adán' : ownCharacter === 'eve' ? 'Eva' : '';
  company.textContent = state?.players.length === 2 ? 'Tu amigo está en la sala' : 'Esperando a tu amigo';
  roomCode.textContent = state?.code ?? '';
  create.disabled = !connected || pending !== null;
  join.disabled = create.disabled;
  resume.disabled = create.disabled;
  leave.disabled = pending === 'leave';
  if (playing) {
    renderActivities(self);
    renderCommunication();
  }

  for (const button of characterButtons) {
    if (!(button instanceof HTMLButtonElement)) continue;
    const choice = button.dataset.character;
    const available = (choice === 'adam' || choice === 'eve') && (state?.available.includes(choice) ?? false);
    const label = choice === 'adam' ? 'Adán' : 'Eva';
    button.disabled = !available || pending !== null;
    button.textContent = state && !available && !playing ? `${label} · ocupado` : label;
  }
  if (input && input.active !== playing) {
    input.active = playing;
    if (!playing) input.clear();
  }
  if (!playing) stopLooking();
}

/** @param {ServerMessage} message */
function receive(message) {
  switch (message.type) {
    case 'connected':
      connected = true;
      pending = null;
      setStatus('Crea una sala o entra con el código de tu amigo.');
      break;
    case 'eden-state': {
      const entering = state === null;
      const ownCharacter = message.players.find((player) => player.id === message.self)?.character;
      state = message;
      scene?.setState(message);
      if (ownCharacter && pending !== 'leave') {
        if (voice && voice.blocked !== message.blocked) voice.block(message.blocked);
        voice?.update(message);
      }
      if (pending === 'enter') {
        pending = null;
        codeInput.value = message.code;
      }
      if (pending === 'select' && ownCharacter) {
        pending = null;
        setStatus('');
        showAnimalName();
      } else if (entering) {
        setStatus('Comparte el código para invitar a tu amigo.');
      }
      break;
    }
    case 'left': {
      const willingly = pending === 'leave';
      connected = connection?.socket?.readyState === WebSocket.OPEN;
      state = null;
      pending = null;
      resetGardenControls();
      scene?.setState(null);
      if (willingly) setStatus('Has vuelto al menú.');
      render();
      if (willingly) create.focus();
      return;
    }
    case 'error':
      pending = null;
      setStatus(message.message);
      break;
    case 'eden-world-key':
      hasPrivateKey = true;
      worldKey.textContent = message.key;
      worldInput.value = '';
      break;
    case 'eden-feedback':
      setStatus(message.message);
      feedbackTimer = setTimeout(() => setStatus(''), 3500);
      break;
    case 'chat': {
      if (!state || state.blocked || pending === 'leave') return;
      const item = document.createElement('li');
      item.textContent = `${message.own ? 'Tú' : 'Compañero'}: ${message.text}`;
      messages.append(item);
      if (messages.children.length > 30) messages.firstElementChild?.remove();
      messages.scrollTop = messages.scrollHeight;
      return;
    }
    case 'signal':
      if (pending !== 'leave') void voice?.signal(message.from, message.data);
      return;
    case 'communication-reset':
      voice?.closePeer();
      return;
    default:
      return;
  }
  render();
}

/** @param {object} message @param {'enter'|'select'|'leave'} action */
function request(message, action) {
  if (pending === 'leave' || (pending !== null && action !== 'leave')) return;
  if (!connection?.send(message)) return;
  pending = action;
  if (action === 'leave') voice?.reset(false);
  render();
}

/** @param {{dx:number,dz:number}} direction */
function move({ dx, dz }) {
  const heading = scene?.heading() ?? 0;
  const cosine = Math.cos(heading);
  const sine = Math.sin(heading);
  const length = Math.max(1, Math.hypot(dx, dz));
  return connection?.send({ type: 'input', dx: (dx * cosine + dz * sine) / length, dz: (dz * cosine - dx * sine) / length }) ?? false;
}

function dispose() {
  listeners.abort();
  clearTimeout(feedbackTimer);
  stopLooking();
  input?.destroy();
  voice?.destroy(false);
  connection?.destroy();
  scene?.destroy();
}

try {
  scene = createEdenScene(canvas);
  input = new Input(move, controls);
  connection = new Connection(receive, setStatus);
  voice = new Voice(send, (message) => writeText(voiceStatus, message));
  voiceStatus.textContent = 'Micrófono apagado.';

  create.addEventListener('click', () => request({ type: 'create', mode: 'eden' }, 'enter'), events);
  joinForm.addEventListener('submit', (event) => {
    event.preventDefault();
    request({ type: 'join', mode: 'eden', code: codeInput.value.trim().toUpperCase() }, 'enter');
  }, events);
  resumeForm.addEventListener('submit', (event) => {
    event.preventDefault();
    request({ type: 'resume', mode: 'eden', key: worldInput.value.trim() }, 'enter');
  }, events);
  leave.addEventListener('click', () => request({ type: 'leave' }, 'leave'), events);
  for (const button of characterButtons) {
    if (!(button instanceof HTMLButtonElement)) continue;
    button.addEventListener('click', () => request({ type: 'select-character', character: button.dataset.character }, 'select'), events);
  }

  visitButton.addEventListener('click', () => send({ type: 'visit' }), events);
  for (const [button, action] of [[waterButton, 'water'], [feedButton, 'feed'], [mountButton, 'mount'], [eatButton, 'eat']]) {
    if (button instanceof HTMLButtonElement) button.addEventListener('click', () => send({ type: 'interact', action, target: button.dataset.target }), events);
  }
  window.addEventListener('keydown', (event) => {
    if (play.hidden || event.code !== 'KeyE' || event.repeat || event.target instanceof HTMLInputElement || event.target instanceof window.HTMLSelectElement || event.target instanceof HTMLTextAreaElement) return;
    const action = activityButtons.find((button) => !button.hidden);
    if (action) { event.preventDefault(); action.click(); }
  }, events);
  nameTarget.addEventListener('change', showAnimalName, events);
  nameForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (nameInput.value.trim()) send({ type: 'interact', action: 'name', target: nameTarget.value, name: nameInput.value.trim() });
  }, events);
  microphone.addEventListener('click', () => {
    const change = voice?.toggle();
    renderCommunication();
    void change?.finally(() => renderCommunication());
  }, events);
  listen.addEventListener('click', () => voice?.listen(), events);
  mute.addEventListener('click', () => {
    voice?.mute(!voice.muted);
    renderCommunication();
  }, events);
  block.addEventListener('click', () => {
    if (state && send({ type: 'block', value: !state.blocked }) && !state.blocked) voice?.block(true);
  }, events);
  chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = chatInput.value.trim();
    if (text && state?.communication && send({ type: 'chat', text })) chatInput.value = '';
  }, events);

  canvas.addEventListener('pointerdown', (event) => {
    if (play.hidden || event.button !== 0 || lookPointer !== null) return;
    canvas.setPointerCapture(event.pointerId);
    lookPointer = event.pointerId;
    lastLookX = event.clientX;
    lastLookY = event.clientY;
  }, events);
  canvas.addEventListener('pointermove', (event) => {
    if (lookPointer !== event.pointerId) return;
    scene?.orbit(event.clientX - lastLookX, event.clientY - lastLookY);
    lastLookX = event.clientX;
    lastLookY = event.clientY;
  }, events);
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(type, (event) => {
      if (lookPointer === /** @type {PointerEvent} */ (event).pointerId) stopLooking();
    }, events);
  }
  window.addEventListener('blur', stopLooking, events);
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    dispose();
    connected = false;
    state = null;
    render();
    setStatus('Se perdió el contexto gráfico. Recarga la página para volver al Edén.');
  }, events);
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) window.addEventListener('pageshow', () => location.reload(), { once: true });
    dispose();
  }, events);
} catch (error) {
  dispose();
  setStatus('No se pudo preparar el jardín. Comprueba WebGL 2 y recarga la página.');
  console.error(error);
}

if (import.meta.hot) import.meta.hot.dispose(dispose);
