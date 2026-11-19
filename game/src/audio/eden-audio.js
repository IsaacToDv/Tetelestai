/// <reference path="./howler.d.ts" />
/* global URL */
import { Howl, Howler } from 'howler';

const LISTENER_SAMPLE_MS = 64;
const RIVER_URLS = [new URL('./assets/river.ogg', import.meta.url).href, new URL('./assets/river.mp3', import.meta.url).href];
const EFFECT_URLS = {
  splash: [new URL('./assets/splash.ogg', import.meta.url).href, new URL('./assets/splash.mp3', import.meta.url).href],
  drink: [new URL('./assets/drink.ogg', import.meta.url).href, new URL('./assets/drink.mp3', import.meta.url).href],
  sheep: [new URL('./assets/sheep.ogg', import.meta.url).href, new URL('./assets/sheep.mp3', import.meta.url).href],
  lion: [new URL('./assets/lion.ogg', import.meta.url).href, new URL('./assets/lion.mp3', import.meta.url).href],
  giraffe: [new URL('./assets/giraffe.ogg', import.meta.url).href, new URL('./assets/giraffe.mp3', import.meta.url).href],
};

/** @typedef {keyof typeof EFFECT_URLS} EdenAudioCue */
/** @typedef {{x:number,y?:number,z:number}} AudioPoint */

/** Room-scoped effects that leave WebRTC audio independent. */
export function createEdenAudio() {
  /** @type {Map<EdenAudioCue,Howl>} */ const effects = new Map();
  const listener = new Float64Array([0, 0, 0, 0, 0, -1, 0, 1, 0]);
  const applied = new Float64Array(9).fill(NaN);
  /** @type {Howl|null} */ let river = null;
  /** @type {ReturnType<typeof setInterval>|null} */ let listenerTimer = null;
  /** @type {number|null} */ let riverRetry = null;
  let active = false;
  let destroyed = false;
  let muted = false;
  let room = 0;

  function sampleListener() {
    if (!Howler.ctx) return;
    if (listener[0] !== applied[0] || listener[1] !== applied[1] || listener[2] !== applied[2]) {
      Howler.pos(listener[0], listener[1], listener[2]);
    }
    if (listener[3] !== applied[3] || listener[4] !== applied[4] || listener[5] !== applied[5]
        || listener[6] !== applied[6] || listener[7] !== applied[7] || listener[8] !== applied[8]) {
      Howler.orientation(listener[3], listener[4], listener[5], listener[6], listener[7], listener[8]);
    }
    applied.set(listener);
  }

  /** @param {string} name @param {string[]} src @param {boolean} loop */
  function createGroup(name, src, loop) {
    const currentRoom = room;
    return new Howl({
      src, loop, mute: muted, volume: loop ? 0.24 : 0.36,
      panningModel: 'equalpower', distanceModel: 'linear', refDistance: 1.5,
      maxDistance: loop ? 22 : 15, rolloffFactor: 1,
      onloaderror(_id, reason) {
        if (room === currentRoom) console.warn(`Edén audio: could not load ${name}.`, reason);
      },
      onplayerror(id, reason) {
        if (room !== currentRoom) return;
        if (loop) riverRetry = id;
        else console.warn(`Edén audio: could not play ${name}.`, reason);
      },
    });
  }

  /** Call from a direct pointer or keyboard gesture. */
  function unlock() {
    if (destroyed) return;
    // The getter initializes Howler's context before a room snapshot arrives.
    Howler.volume();
    const context = Howler.ctx;
    if (context && context.state !== 'running') {
      void context.resume().catch((error) => console.warn('Edén audio: the browser could not resume playback.', error));
    }
    if (river && riverRetry !== null && !muted) {
      const id = riverRetry;
      riverRetry = null;
      river.play(id);
    }
  }

  /** @param {readonly AudioPoint[]} sources */
  function start(sources) {
    if (active || destroyed || Howler.noAudio) return;
    active = true;
    for (const cue of /** @type {EdenAudioCue[]} */ (Object.keys(EFFECT_URLS))) {
      effects.set(cue, createGroup(cue, EFFECT_URLS[cue], false));
    }
    applied.fill(NaN);
    if (Howler.usingWebAudio) {
      sampleListener();
      listenerTimer = setInterval(sampleListener, LISTENER_SAMPLE_MS);
    }
    if (sources.length === 0) return;
    river = createGroup('river', RIVER_URLS, true);
    if (!Howler.usingWebAudio) {
      river.play();
      return;
    }
    for (const source of sources) {
      const id = river.play('__default');
      if (id !== null) river.pos(source.x, source.y ?? 0, source.z, id);
    }
  }

  /** @param {number} x @param {number} y @param {number} z
   * @param {number} fx @param {number} fy @param {number} fz
   * @param {number} ux @param {number} uy @param {number} uz */
  function setListener(x, y, z, fx, fy, fz, ux, uy, uz) {
    listener[0] = x; listener[1] = y; listener[2] = z;
    listener[3] = fx; listener[4] = fy; listener[5] = fz;
    listener[6] = ux; listener[7] = uy; listener[8] = uz;
  }

  /** @param {EdenAudioCue} cue @param {number} x @param {number} y @param {number} z */
  function playAt(cue, x, y, z) {
    if (muted) return;
    const effect = effects.get(cue);
    if (!effect) return;
    const id = effect.play('__default');
    if (id !== null && Howler.usingWebAudio) effect.pos(x, y, z, id);
  }

  /** @param {boolean} value */
  function setMuted(value) {
    muted = value;
    river?.mute(value);
    for (const effect of effects.values()) effect.mute(value);
  }

  function stop() {
    active = false;
    room++;
    if (listenerTimer !== null) clearInterval(listenerTimer);
    listenerTimer = null;
    riverRetry = null;
    river?.off().unload();
    river = null;
    for (const effect of effects.values()) effect.off().unload();
    effects.clear();
  }

  function destroy() {
    destroyed = true;
    stop();
  }

  return { unlock, start, setListener, playAt, setMuted, stop, destroy };
}
