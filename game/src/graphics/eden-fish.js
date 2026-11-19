import { Entity } from 'playcanvas';
import { EDEN_RIVERS, EDEN_WATER_Y } from '../../data/eden-rivers.js';

/** @import { MakeMaterial, MakeShape } from './eden-wildlife.js' */
/** @typedef {{x:number,z:number,dx:number,dz:number,length:number,start:number}} Segment */
/** @typedef {{entity:Entity,tail:Entity,index:number,phase:number,distance:number,lateral:number,x:number,z:number,yaw:number}} Fish */
/** @typedef {{id:string,width:number,length:number,segments:Segment[],fish:Fish[],feedTime:number,feedDistance:number,feedLateral:number}} School */

const RAD_TO_DEG = 180 / Math.PI;
const FEED_SPEED = 5;

/** @param {Entity} parent @param {MakeMaterial} material @param {MakeShape} shape */
export function createEdenFish(parent, material, shape) {
  const root = new Entity('River fish');
  parent.addChild(root);
  const scales = material(0.82, 0.61, 0.30);
  const fins = material(0.62, 0.34, 0.17);
  const silver = material(0.79, 0.85, 0.73);
  const eyes = material(0.12, 0.19, 0.17);
  /** @type {School[]} */
  const schools = [];
  let time = 0;
  let destroyed = false;

  for (const river of EDEN_RIVERS) {
    /** @type {Segment[]} */
    const segments = [];
    let length = 0;
    for (let index = 1; index < river.points.length; index++) {
      const [x, z] = river.points[index - 1];
      const [endX, endZ] = river.points[index];
      const segmentLength = Math.hypot(endX - x, endZ - z);
      segments.push({ x, z, dx: (endX - x) / segmentLength, dz: (endZ - z) / segmentLength, length: segmentLength, start: length });
      length += segmentLength;
    }

    /** @type {Fish[]} */
    const fish = [];
    for (let index = 0; index < 3; index++) {
      const entity = new Entity(`${river.id} fish ${index + 1}`);
      root.addChild(entity);
      shape(entity, 'Fish body', 'sphere', index === 1 ? silver : scales, 0, 0, 0, 0.16, 0.13, 0.49);
      const tail = shape(entity, 'Fish tail', 'cone', fins, 0, 0, 0.27, 0.21, 0.20, 0.07);
      tail.setLocalEulerAngles(-90, 0, 0);
      shape(entity, 'Dorsal fin', 'cone', fins, 0, 0.085, 0.025, 0.035, 0.14, 0.17)
        .setLocalEulerAngles(-16, 0, 0);
      for (const side of [-1, 1]) {
        shape(entity, 'Pectoral fin', 'sphere', fins, side * 0.105, -0.015, -0.04, 0.13, 0.025, 0.10)
          .setLocalEulerAngles(0, side * 20, side * 15);
        shape(entity, 'Fish eye', 'sphere', eyes, side * 0.06, 0.028, -0.15, 0.025, 0.026, 0.032);
      }
      fish.push({ entity, tail, index, phase: index * 2.05, distance: 0, lateral: 0, x: 0, z: 0, yaw: 0 });
    }
    schools.push({ id: river.id, width: river.width, length, segments, fish, feedTime: 0, feedDistance: 0, feedLateral: 0 });
  }

  /** @param {School} school @param {Fish} fish */
  function place(school, fish) {
    let segment = school.segments[school.segments.length - 1];
    let segmentIndex = school.segments.length - 1;
    for (let index = 0; index < school.segments.length; index++) {
      const candidate = school.segments[index];
      if (fish.distance <= candidate.start + candidate.length) {
        segment = candidate;
        segmentIndex = index;
        break;
      }
    }
    const along = fish.distance - segment.start;
    const lateral = fish.lateral * school.width;
    let tangentX = segment.dx;
    let tangentZ = segment.dz;
    const cornerDistance = 1.2;
    if (along < cornerDistance && segmentIndex > 0) {
      const previous = school.segments[segmentIndex - 1];
      const blend = 0.5 * (1 - along / cornerDistance);
      tangentX += (previous.dx - tangentX) * blend;
      tangentZ += (previous.dz - tangentZ) * blend;
    }
    if (segment.length - along < cornerDistance && segmentIndex < school.segments.length - 1) {
      const next = school.segments[segmentIndex + 1];
      const blend = 0.5 * (1 - (segment.length - along) / cornerDistance);
      tangentX += (next.dx - tangentX) * blend;
      tangentZ += (next.dz - tangentZ) * blend;
    }
    const tangentLength = Math.hypot(tangentX, tangentZ);
    fish.x = segment.x + segment.dx * along - tangentZ / tangentLength * lateral;
    fish.z = segment.z + segment.dz * along + tangentX / tangentLength * lateral;
    fish.entity.setLocalPosition(fish.x, EDEN_WATER_Y - 0.24 - fish.index * 0.035 + Math.sin(time * 1.7 + fish.phase) * 0.025, fish.z);
  }

  function reset() {
    if (destroyed) return;
    time = 0;
    for (const school of schools) {
      school.feedTime = 0;
      for (const fish of school.fish) {
        fish.distance = school.length * (0.39 + Math.sin(fish.phase) * 0.10);
        fish.lateral = Math.sin(fish.phase) * 0.20;
        place(school, fish);
        const segment = school.segments[0];
        fish.yaw = Math.atan2(-segment.dx, -segment.dz) * RAD_TO_DEG;
        fish.entity.setLocalEulerAngles(0, fish.yaw, 0);
        fish.tail.setLocalEulerAngles(-90, 0, 0);
      }
    }
  }

  /** @param {string} riverId @param {number} x @param {number} z */
  function feed(riverId, x, z) {
    if (destroyed || !Number.isFinite(x) || !Number.isFinite(z)) return;
    for (const school of schools) {
      if (school.id !== riverId) continue;
      let nearest = Infinity;
      for (const segment of school.segments) {
        const dx = x - segment.x;
        const dz = z - segment.z;
        const along = Math.max(0, Math.min(segment.length, dx * segment.dx + dz * segment.dz));
        const offsetX = dx - along * segment.dx;
        const offsetZ = dz - along * segment.dz;
        const distanceSquared = offsetX * offsetX + offsetZ * offsetZ;
        if (distanceSquared >= nearest) continue;
        nearest = distanceSquared;
        school.feedDistance = Math.max(1.2, Math.min(school.length - 1.2, segment.start + along));
        school.feedLateral = Math.max(-0.58, Math.min(0.58, (segment.dx * offsetZ - segment.dz * offsetX) / school.width));
      }
      let travelDistance = 0;
      for (const fish of school.fish) travelDistance = Math.max(travelDistance, Math.abs(fish.distance - school.feedDistance));
      school.feedTime = travelDistance / FEED_SPEED + 4;
      break;
    }
  }

  /** @param {number} delta */
  function update(delta) {
    if (destroyed || !Number.isFinite(delta) || delta <= 0) return;
    const dt = Math.min(delta, 0.1);
    time += dt;
    const blend = 1 - Math.exp(-dt * 2.4);
    const turnBlend = 1 - Math.exp(-dt * 6);
    for (const school of schools) {
      school.feedTime = Math.max(0, school.feedTime - dt);
      const feeding = school.feedTime > 0;
      for (const fish of school.fish) {
        const phase = time * 0.18 + fish.phase;
        const targetDistance = feeding
          ? school.feedDistance + Math.sin(time * 0.8 + fish.phase) * 0.28
          : school.length * (0.39 + Math.sin(phase) * 0.10);
        const targetLateral = feeding
          ? school.feedLateral + Math.sin(time * 0.9 + fish.phase) * 0.06
          : Math.sin(time * 0.4 + fish.phase) * 0.23;
        const previousX = fish.x;
        const previousZ = fish.z;
        const step = (targetDistance - fish.distance) * blend;
        fish.distance += Math.max(-FEED_SPEED * dt, Math.min(FEED_SPEED * dt, step));
        fish.lateral += (targetLateral - fish.lateral) * blend;
        place(school, fish);
        const dx = fish.x - previousX;
        const dz = fish.z - previousZ;
        if (dx * dx + dz * dz > 0.0000001) {
          const targetYaw = Math.atan2(-dx, -dz) * RAD_TO_DEG;
          const turn = ((targetYaw - fish.yaw + 540) % 360) - 180;
          fish.yaw = (fish.yaw + turn * turnBlend) % 360;
        }
        fish.entity.setLocalEulerAngles(Math.sin(time * 1.7 + fish.phase) * 2, fish.yaw, 0);
        fish.tail.setLocalEulerAngles(-90, Math.sin(time * (feeding ? 12 : 8) + fish.phase) * 22, 0);
      }
    }
  }

  reset();
  return {
    feed,
    update,
    reset,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      root.destroy();
      schools.length = 0;
    },
  };
}
