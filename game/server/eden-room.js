import { VOICE_DISTANCE } from './room.js';
import { EDEN_BOUNDS, EDEN_RIVERS, EDEN_WATER_Y, EDEN_WILDLIFE, edenRiverShore, isEdenWater } from '../data/eden-rivers.js';
import { createEdenSwimPhysics } from './eden-swim-physics.js';

/** @typedef {'adam'|'eve'} Character */
/** @typedef {{character:Character|null,x:number,y:number,z:number,swimming:boolean,shoreReleased:boolean,dx:number,dz:number,lastInput:number,blocked:boolean,voice:boolean}} Explorer */
/** @typedef {{id:string,x:number,y:number,z:number,swimming:boolean,alert:boolean,feeds:number,name:string|null,rider:string|null}} Animal */
/** @typedef {{id:string,x:number,z:number,watered:boolean}} Sprout */
/** @typedef {{key:string,names:Record<string,string>,saveNames:(names:Record<string,string>)=>void}} World */
/** @typedef {'splash'|'drink'|'feed-fish'|'pet-sheep'|'call-lion'|'feed-giraffe'} Effect */
/** @typedef {{type:'eden-effect',effect:Effect,actor:string,target:string,x:number,z:number}} EdenEffect */

/** @type {readonly Character[]} */
const CHARACTERS = ['adam', 'eve'];
const WALK_SPEED = 3;
const VISIT_Z = -3;
const VISIT_RADIUS = 2;
const INTERACTION_RADIUS = 2;
const ADULT_FEEDS = 3;
const FRUIT_RESPAWN_MS = 30000;

/** @param {Explorer|undefined} member */
function nearVisit(member) {
  return Boolean(member?.character && Math.hypot(member.x, member.z - VISIT_Z) <= VISIT_RADIUS);
}

/** Private exploration room. Character selection and movement are server-authoritative. */
export class EdenRoom {
  /** @param {string} code @param {()=>number} [now] @param {World} [world] @param {(effect:EdenEffect)=>void} [onEffect] */
  constructor(code, now = Date.now, world, onEffect = () => {}) {
    this.code = code;
    this.now = now;
    this.world = world;
    this.onEffect = onEffect;
    this.physics = createEdenSwimPhysics();
    this.swimPosition = { x: 0, y: 0, z: 0 };
    /** @type {Map<string,Explorer>} */ this.members = new Map();
    /** @type {Set<Character>} */ this.visited = new Set();
    /** @type {Sprout[]} */ this.sprouts = [
      { id: 'sprout-1', x: -5, z: -4, watered: false },
      { id: 'sprout-2', x: 5, z: -4, watered: false },
    ];
    /** @type {Animal[]} */ this.animals = [
      { id: 'donkey-1', x: -6, y: 0, z: 3, swimming: false, alert: false, feeds: 0, name: world?.names['donkey-1'] ?? null, rider: null },
      { id: 'donkey-2', x: 6, y: 0, z: 3, swimming: false, alert: false, feeds: 0, name: world?.names['donkey-2'] ?? null, rider: null },
    ];
    this.fruit = { x: 0, z: 5, readyAt: 0 };
  }

  /** @param {string} id */
  join(id) {
    if (this.members.size >= 2) throw new Error('La sala está llena.');
    this.members.set(id, { character: null, x: 0, y: 0, z: 0, swimming: false, shoreReleased: false, dx: 0, dz: 0, lastInput: this.now(), blocked: false, voice: false });
  }

  /** @param {string} id */
  leave(id) {
    if (!this.members.has(id)) return;
    for (const animal of this.animals) if (animal.rider === id) this.releaseMount(animal);
    this.members.delete(id);
    this.physics.leave(id);
    for (const member of this.members.values()) member.blocked = false;
  }

  /** @param {string} id @param {unknown} character */
  select(id, character) {
    const member = this.members.get(id);
    if (!member || (character !== 'adam' && character !== 'eve')) return 'Elige un personaje válido.';
    if (member.character === character) return null;
    if (member.character) return 'Ya elegiste un personaje en esta sala.';
    for (const other of this.members.values()) {
      if (other.character === character) return 'Ese personaje ya no está disponible.';
    }
    member.character = character;
    member.x = character === 'adam' ? -4 : 4;
    return null;
  }

  /** @param {string} id @param {number} dx @param {number} dz */
  input(id, dx, dz) {
    const member = this.members.get(id);
    if (!member?.character || !Number.isFinite(dx) || !Number.isFinite(dz) || Math.abs(dx) > 1 || Math.abs(dz) > 1) return;
    const length = Math.max(1, Math.hypot(dx, dz));
    member.dx = dx / length;
    member.dz = dz / length;
    member.lastInput = this.now();
    if (dx === 0 && dz === 0) {
      for (const animal of this.animals) {
        if (animal.rider === id && animal.alert) member.shoreReleased = true;
      }
    }
  }

  /** @param {number} delta */
  tick(delta) {
    if (!Number.isFinite(delta)) return;
    const elapsed = Math.min(0.1, Math.max(0, delta));
    const distance = WALK_SPEED * elapsed;
    const now = this.now();
    for (const [id, member] of this.members) {
      if (!member.character) continue;
      const active = now - member.lastInput <= 500;
      const dx = active ? member.dx : 0;
      const dz = active ? member.dz : 0;
      if (member.swimming) {
        this.physics.setInput(id, dx * WALK_SPEED, dz * WALK_SPEED);
        continue;
      }
      const x = Math.max(EDEN_BOUNDS.minX, Math.min(EDEN_BOUNDS.maxX, member.x + dx * distance));
      const z = Math.max(EDEN_BOUNDS.minZ, Math.min(EDEN_BOUNDS.maxZ, member.z + dz * distance));
      let mount = null;
      for (const animal of this.animals) if (animal.rider === id) mount = animal;
      if (isEdenWater(x, z)) {
        if (mount && !member.shoreReleased) {
          mount.alert = true;
          continue;
        }
        member.swimming = true;
        member.y = EDEN_WATER_Y;
        this.physics.enter(id, x, z, EDEN_WATER_Y);
        this.emit('splash', id, id, x, z);
      }
      if (mount && (dx !== 0 || dz !== 0)) mount.alert = false;
      if (dx !== 0 || dz !== 0) member.shoreReleased = false;
      member.x = x;
      member.z = z;
    }
    this.physics.step(elapsed);
    for (const [id, member] of this.members) {
      if (!member.swimming || !this.physics.read(id, this.swimPosition)) continue;
      this.applySwimPosition(id, member);
    }
    for (const animal of this.animals) {
      const rider = animal.rider && this.members.get(animal.rider);
      if (rider) {
        animal.x = rider.x; animal.y = rider.y; animal.z = rider.z;
        animal.swimming = rider.swimming;
      } else if (animal.swimming && this.physics.read(animal.id, this.swimPosition)) {
        this.applySwimPosition(animal.id, animal);
      }
    }
  }

  /** @param {string} id @param {{x:number,y:number,z:number,swimming:boolean}} swimmer */
  applySwimPosition(id, swimmer) {
    const position = this.swimPosition;
    const x = Math.max(EDEN_BOUNDS.minX, Math.min(EDEN_BOUNDS.maxX, position.x));
    const z = Math.max(EDEN_BOUNDS.minZ, Math.min(EDEN_BOUNDS.maxZ, position.z));
    if (x !== position.x || z !== position.z) this.physics.constrain(id, x, z);
    swimmer.x = x; swimmer.z = z; swimmer.y = position.y;
    if (!isEdenWater(x, z)) {
      swimmer.swimming = false;
      swimmer.y = 0;
      this.physics.leave(id);
    }
  }

  /** @param {Animal} animal */
  releaseMount(animal) {
    animal.rider = null;
    animal.alert = false;
    if (animal.swimming) this.physics.enter(animal.id, animal.x, animal.z, EDEN_WATER_Y);
  }

  /** @param {Effect} effect @param {string} actor @param {string} target @param {number} x @param {number} z */
  emit(effect, actor, target, x, z) {
    this.onEffect({ type: 'eden-effect', effect, actor, target, x, z });
  }

  destroy() {
    this.physics.destroy();
  }

  /** @param {string} id */
  visit(id) {
    const member = this.members.get(id);
    if (!member?.character || !nearVisit(member)) return false;
    this.visited.add(member.character);
    return true;
  }

  /** @param {string} id @param {unknown} action @param {unknown} target @param {unknown} name */
  interact(id, action, target, name) {
    const member = this.members.get(id);
    if (!member?.character) return 'Elige un personaje antes de interactuar.';
    if (action === 'drink' || action === 'feed-fish') {
      const shore = !member.swimming && edenRiverShore(member.x, member.z);
      if (!shore) return 'Acércate a la orilla para interactuar con el río.';
      if (action === 'feed-fish' && !EDEN_RIVERS.some((river) => river.id === shore.riverId)) return 'Acércate a la orilla de un ramal para dar alimento a los peces.';
      this.emit(action, id, shore.riverId, shore.x, shore.z);
      return null;
    }
    if (action === 'pet-sheep' || action === 'call-lion' || action === 'feed-giraffe') {
      const wildlife = EDEN_WILDLIFE.find((animal) => animal.id === target && animal.action === action);
      if (!wildlife) return 'Elige un animal válido para esa acción.';
      if (member.swimming || isEdenWater(member.x, member.z) || Math.hypot(wildlife.x - member.x, wildlife.z - member.z) > INTERACTION_RADIUS) return 'Acércate a ese animal desde tierra.';
      this.emit(action, id, wildlife.id, wildlife.x, wildlife.z);
      return null;
    }
    if (action === 'water') {
      const sprout = this.sprouts.find((item) => item.id === target);
      if (!sprout || Math.hypot(sprout.x - member.x, sprout.z - member.z) > INTERACTION_RADIUS) return 'Acércate a ese brote.';
      sprout.watered = true;
      return null;
    }
    if (action === 'eat') {
      const fruit = this.fruit;
      if (Math.hypot(fruit.x - member.x, fruit.z - member.z) > INTERACTION_RADIUS) return 'Acércate al fruto.';
      const now = this.now();
      if (fruit.readyAt > now) return 'El fruto está creciendo de nuevo.';
      fruit.readyAt = now + FRUIT_RESPAWN_MS;
      return null;
    }
    if (action !== 'feed' && action !== 'mount' && action !== 'name') return 'Acción no reconocida.';
    const animal = this.animals.find((item) => item.id === target);
    if (!animal) return 'Elige un animal válido.';
    if (action === 'name') {
      if (member.character !== 'adam') return 'Adán puede editar los nombres de los animales.';
      const label = typeof name === 'string' ? name.trim() : '';
      if (!label || label.length > 32 || /[\p{C}\p{Zl}\p{Zp}]/u.test(label)) return 'Escribe un nombre válido de hasta 32 caracteres.';
      const world = this.world;
      if (!world) return 'No se pudo guardar el nombre del animal.';
      const names = { ...world.names, [animal.id]: label };
      try { world.saveNames(names); }
      catch { return 'No se pudo guardar el nombre del animal.'; }
      world.names = names;
      animal.name = label;
      return null;
    }
    if (action === 'mount' && animal.rider === id) {
      this.releaseMount(animal);
      member.shoreReleased = false;
      return null;
    }
    if (Math.hypot(animal.x - member.x, animal.z - member.z) > INTERACTION_RADIUS) return 'Acércate a ese animal.';
    if (action === 'feed') {
      animal.feeds = Math.min(ADULT_FEEDS, animal.feeds + 1);
      return null;
    }
    if (animal.feeds < ADULT_FEEDS) return 'El animal todavía es una cría.';
    if (animal.rider || this.animals.some((item) => item.rider === id)) return 'La monta no está disponible.';
    animal.rider = id;
    animal.x = member.x; animal.z = member.z;
    animal.alert = false;
    animal.swimming = member.swimming;
    animal.y = member.y;
    member.shoreReleased = false;
    this.physics.leave(animal.id);
    return null;
  }

  /** @param {string} id @param {boolean} value */
  block(id, value) {
    const member = this.members.get(id);
    if (member?.character) member.blocked = value;
  }

  /** @param {string} id @param {boolean} value */
  voice(id, value) {
    const member = this.members.get(id);
    if (member?.character) member.voice = value;
  }

  /** @param {string} from @param {string} to */
  canCommunicate(from, to) {
    const a = this.members.get(from); const b = this.members.get(to);
    return Boolean(a?.character && b?.character && from !== to && !a.blocked && !b.blocked
      && Math.hypot(a.x - b.x, a.z - b.z) <= VOICE_DISTANCE);
  }

  /** @param {string} id */
  snapshot(id) {
    const self = this.members.get(id);
    const players = Array.from(this.members, ([memberId, { character, x, y, z, swimming, voice }]) => ({ id: memberId, character, x, y, z, swimming, voice }));
    const available = CHARACTERS.filter((character) => players.every((player) => player.character !== character));
    return {
      type: /** @type {const} */ ('eden-state'), code: this.code, self: id, available, players,
      visit: { visited: CHARACTERS.filter((character) => this.visited.has(character)), nearby: nearVisit(self) },
      communication: players.some((player) => this.canCommunicate(id, player.id)), blocked: self?.blocked ?? false,
      garden: {
        sprouts: this.sprouts.map((sprout) => ({ ...sprout })),
        animals: this.animals.map((animal) => ({ ...animal })),
        fruit: { x: this.fruit.x, z: this.fruit.z, available: this.fruit.readyAt <= this.now() },
      },
    };
  }
}
