// Gn 2:10–14 identifies a river and four branches. Local geometry is a game layout.
export const EDEN_BOUNDS = { minX: -43, maxX: 43, minZ: -48, maxZ: 19 };
export const EDEN_WATER_Y = -0.16;

/** @typedef {{id:string,label:string,width:number,points:[number,number][]}} River */
/** @type {River} */
const edenRiver = {
  id: 'eden', label: 'Río de Edén', width: 2.9,
  points: [[22, 22], [20, 9], [17, -1], [16, -10], [12, -18], [6, -24], [0, -26]],
};

/** @type {River[]} */
export const EDEN_RIVERS = [
  { id: 'pison', label: 'Pisón', width: 2.65, points: [[0, -26], [-9, -24], [-18, -22], [-29, -23], [-37, -29], [-47, -30]] },
  { id: 'gihon', label: 'Gihón', width: 2.75, points: [[0, -26], [-8, -31], [-13, -37], [-14, -43], [-19, -52]] },
  { id: 'hiddekel', label: 'Hiddekel', width: 2.55, points: [[0, -26], [4, -33], [9, -37], [13, -42], [12, -52]] },
  { id: 'euphrates', label: 'Éufrates', width: 3.05, points: [[0, -26], [8, -28], [19, -29], [27, -24], [35, -23], [46, -26]] },
];

/** @typedef {{id:string,type:'sheep'|'lion'|'giraffe',action:'pet-sheep'|'call-lion'|'feed-giraffe',x:number,z:number,yaw:number}} Wildlife */
/** @type {Wildlife[]} */
export const EDEN_WILDLIFE = [
  { id: 'sheep-1', type: 'sheep', action: 'pet-sheep', x: -14, z: -10, yaw: 20 },
  { id: 'sheep-2', type: 'sheep', action: 'pet-sheep', x: -18, z: -12, yaw: -65 },
  { id: 'lion', type: 'lion', action: 'call-lion', x: 24, z: -14, yaw: -110 },
  { id: 'giraffe', type: 'giraffe', action: 'feed-giraffe', x: -25, z: -34, yaw: 35 },
];

/** @typedef {{river:River,x:number,z:number,dx:number,dz:number,length:number,invLengthSquared:number,distance:number}} Segment */
/** @type {Segment[]} */
const segments = [];
for (const river of [edenRiver, ...EDEN_RIVERS]) {
  let distance = 0;
  for (let i = 1; i < river.points.length; i++) {
    const [x, z] = river.points[i - 1];
    const [endX, endZ] = river.points[i];
    const dx = endX - x;
    const dz = endZ - z;
    const length = Math.hypot(dx, dz);
    segments.push({ river, x, z, dx, dz, length, invLengthSquared: 1 / (length * length), distance });
    distance += length;
  }
}

/** @typedef {{river:River,distance:number,u:number,v:number,x:number,z:number}} RiverSample */
/** @returns {RiverSample} */
export function createRiverSample() { return { river: edenRiver, distance: 0, u: 0, v: 0, x: 0, z: 0 }; }

const sample = createRiverSample();

/** @param {number} x @param {number} z @param {RiverSample} out */
export function sampleEdenRiver(x, z, out) {
  let nearest = Infinity;
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const dx = x - segment.x;
    const dz = z - segment.z;
    const t = Math.max(0, Math.min(1, (dx * segment.dx + dz * segment.dz) * segment.invLengthSquared));
    const ox = dx - t * segment.dx;
    const oz = dz - t * segment.dz;
    const normalized = (ox * ox + oz * oz) / (segment.river.width * segment.river.width);
    if (normalized >= nearest) continue;
    nearest = normalized;
    out.river = segment.river;
    out.x = segment.x + t * segment.dx;
    out.z = segment.z + t * segment.dz;
    out.u = 0.5 + Math.sign(segment.dx * oz - segment.dz * ox) * 0.5 * Math.sqrt(normalized);
    out.v = segment.distance + t * segment.length;
  }
  out.distance = Math.sqrt(nearest);
  return out;
}

/** @param {number} distance Normalized channel distance from the centerline. */
export function edenTerrainHeight(distance) {
  if (distance < 1) return EDEN_WATER_Y - (1 - distance * distance) * 1.42;
  return EDEN_WATER_Y * Math.max(0, 1 - (distance - 1) * 4);
}

/** @param {number} x @param {number} z */
export function isEdenWater(x, z) { return sampleEdenRiver(x, z, sample).distance < 0.90; }

/** @param {number} x @param {number} z */
export function edenRiverShore(x, z) {
  sampleEdenRiver(x, z, sample);
  if (sample.distance < 1 || sample.distance > 1.56) return null;
  const blend = 0.52 / sample.distance;
  return { riverId: sample.river.id, x: sample.x + (x - sample.x) * blend, z: sample.z + (z - sample.z) * blend };
}
