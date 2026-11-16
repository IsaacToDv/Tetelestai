import { randomInt } from 'node:crypto';

/** @typedef {'exploration'|'fragment'|'challenge'|'result'|'complete'} Phase */
/** @typedef {{id:string, role:string, x:number,z:number,dx:number,dz:number,lastInput:number,consent:boolean,ready:boolean,blocked:boolean,voice:boolean,water:number,done:boolean}} Member */
/** @typedef {{kind:'winner'|'tie'|'timeout'|'cancelled',winners:string[],solution?:string[]}} Result */
const SOLUTION = ['haran', 'siquem', 'betel-hai'];
const ROLES = ['Abram (Abraham)', 'Lot'];
export const VOICE_DISTANCE = 12;

/** Authoritative room state; role assignments and accepted answers never enter a shared snapshot. */
export class Room {
  /** @param {string} code @param {(id:string,message:object)=>void} emit @param {()=>number} now @param {()=>number} [random] */
  constructor(code, emit, now = Date.now, random = () => randomInt(2) / 2) {
    this.code = code; this.emit = emit; this.now = now; this.random = random;
    /** @type {Map<string,Member>} */ this.members = new Map();
    /** @type {Phase} */ this.phase = 'exploration';
    this.fragmentCompleted = false; this.round = 0; this.deadline = 0;
    /** @type {Result|null} */ this.result = null;
    /** @type {Map<string,number>} */ this.correct = new Map();
    /** @type {Map<string,Map<string,boolean>>} */ this.attempts = new Map();
    this.firstCorrect = 0;
  }
  /** @param {string} id */
  join(id) {
    if (this.members.size >= 2) throw new Error('La sala está llena.');
    const existing = [...this.members.values()][0];
    const role = existing ? ROLES.find((value) => value !== existing.role) : ROLES[Math.floor(this.random() * 2)];
    const x = existing ? (existing.x < 0 ? 4 : -4) : -4;
    this.members.set(id, { id, role: role ?? ROLES[0], x, z: 0, dx: 0, dz: 0, lastInput: this.now(), consent: false, ready: false, blocked: false, voice: false, water: 0, done: false });
    if (this.phase === 'complete') {
      this.phase = this.fragmentCompleted ? 'fragment' : 'exploration';
      for (const member of this.members.values()) { member.done = false; member.ready = false; }
    }
  }
  /** @param {string} id */
  leave(id) {
    if (this.phase === 'challenge') this.finish({ kind: 'cancelled', winners: [] });
    this.members.delete(id);
    for (const member of this.members.values()) { member.consent = false; member.ready = false; member.blocked = false; }
    if (this.phase === 'result' && this.members.size && [...this.members.values()].every((member) => member.done)) this.phase = 'complete';
  }
  /** @param {string} id @param {number} dx @param {number} dz */
  input(id, dx, dz) {
    const member = this.members.get(id);
    if (!member || !Number.isFinite(dx) || !Number.isFinite(dz) || Math.abs(dx) > 1 || Math.abs(dz) > 1) return;
    const length = Math.max(1, Math.hypot(dx, dz));
    member.dx = dx / length; member.dz = dz / length; member.lastInput = this.now();
  }
  /** @param {number} delta */
  tick(delta) {
    const dt = Math.min(0.1, Math.max(0, delta));
    for (const member of this.members.values()) {
      if (this.now() - member.lastInput > 500) { member.dx = 0; member.dz = 0; }
      member.x = Math.max(-11, Math.min(11, member.x + member.dx * 3 * dt));
      member.z = Math.max(-8, Math.min(8, member.z + member.dz * 3 * dt));
      if (Math.hypot(member.x, member.z) > 3) member.consent = false;
    }
    if (this.phase !== 'challenge') return;
    if (this.firstCorrect && this.now() > this.firstCorrect + 250) {
      const winners = [...this.correct.keys()];
      this.finish({ kind: winners.length === 2 ? 'tie' : 'winner', winners });
    } else if (!this.firstCorrect && this.now() >= this.deadline) {
      this.finish({ kind: 'timeout', winners: [], solution: [...SOLUTION] });
    }
  }
  /** @param {string} id */
  confirm(id) {
    if (this.fragmentCompleted || this.members.size !== 2) return;
    const member = this.members.get(id);
    if (!member || Math.hypot(member.x, member.z) > 3) return;
    member.consent = true;
    if ([...this.members.values()].every((player) => player.consent && Math.hypot(player.x, player.z) <= 3)) {
      this.fragmentCompleted = true; this.phase = 'fragment';
    }
  }
  /** @param {string} id */
  ready(id) {
    const member = this.members.get(id);
    if (!member || !this.fragmentCompleted || !['fragment', 'result'].includes(this.phase) || this.members.size !== 2) return;
    member.ready = true;
    if ([...this.members.values()].every((player) => player.ready)) {
      this.round++; this.phase = 'challenge'; this.deadline = this.now() + 45000;
      this.firstCorrect = 0; this.correct.clear(); this.attempts.clear(); this.result = null;
      for (const player of this.members.values()) { player.ready = false; player.done = false; }
    }
  }
  /** @param {string} id @param {string} attempt @param {unknown} sequence */
  answer(id, attempt, sequence) {
    this.tick(0);
    if (!this.members.has(id) || this.phase !== 'challenge' || this.now() > this.deadline || !/^[a-zA-Z0-9-]{1,64}$/.test(attempt)) return false;
    if (!Array.isArray(sequence) || sequence.length !== 3 || new Set(sequence).size !== 3 || !sequence.every((value) => SOLUTION.includes(value))) return false;
    let entries = this.attempts.get(id);
    if (!entries) { entries = new Map(); this.attempts.set(id, entries); }
    if (entries.has(attempt)) { this.emit(id, { type: 'answer', accepted: entries.get(attempt), attempt, round: this.round }); return true; }
    if (entries.size >= 64) return false;
    const accepted = sequence.every((value, index) => value === SOLUTION[index]);
    entries.set(attempt, accepted);
    if (accepted && !this.correct.has(id)) {
      this.correct.set(id, this.now());
      if (!this.firstCorrect) this.firstCorrect = this.now();
    }
    this.emit(id, { type: 'answer', accepted, attempt, round: this.round });
    return true;
  }
  /** @param {Result} result */
  finish(result) {
    if (this.phase !== 'challenge') return;
    this.result = result; this.phase = 'result';
    for (const member of this.members.values()) { member.ready = false; if (result.winners.includes(member.id)) member.water++; }
  }
  /** @param {string} id */
  end(id) {
    const member = this.members.get(id);
    if (member && this.phase === 'result') member.done = true;
    if (this.members.size && [...this.members.values()].every((player) => player.done)) this.phase = 'complete';
  }
  /** @param {string} id @param {boolean} value */
  block(id, value) { const member = this.members.get(id); if (member) member.blocked = value; }
  /** @param {string} id @param {boolean} value */
  voice(id, value) { const member = this.members.get(id); if (member) member.voice = value; }
  /** @param {string} from @param {string} to */
  canCommunicate(from, to) {
    const a = this.members.get(from); const b = this.members.get(to);
    return Boolean(a && b && from !== to && !a.blocked && !b.blocked && Math.hypot(a.x - b.x, a.z - b.z) <= VOICE_DISTANCE);
  }
  /** @param {string} id */
  snapshot(id) {
    const own = this.members.get(id);
    return {
      type: /** @type {const} */ ('state'), code: this.code, self: id, role: own?.role ?? '', phase: this.phase,
      players: [...this.members.values()].map(({ id: playerId, x, z, voice, water }) => ({ id: playerId, x, z, voice, water })),
      fragmentCompleted: this.fragmentCompleted, consent: own?.consent ?? false, ready: own?.ready ?? false,
      blocked: own?.blocked ?? false, done: own?.done ?? false, round: this.round,
      remainingMs: this.phase === 'challenge' ? Math.max(0, this.deadline - this.now()) : 0, result: this.result,
      nearFragment: Boolean(own && Math.hypot(own.x, own.z) <= 3),
      communication: Boolean(own && [...this.members.keys()].some((other) => this.canCommunicate(id, other))),
    };
  }
}
