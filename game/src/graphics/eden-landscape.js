import { Entity, Mesh, MeshInstance, PRIMITIVE_TRIANGLES, StandardMaterial, calculateNormals } from 'playcanvas';
import { EDEN_BOUNDS, EDEN_WATER_Y, createRiverSample, edenTerrainHeight, sampleEdenRiver } from '../../data/eden-rivers.js';
import { createEdenWater } from './eden-water.js';

const GRID_SPACING = 0.6;
const OUTER_MARGIN = 12;
const GRASS = [0.42, 0.55, 0.28];
const RIVERBED = [0.32, 0.30, 0.19];
const BANK = [0.57, 0.52, 0.35];
const PATH = [0.63, 0.56, 0.38];
const APPROACH = [[0, 3], [0, -10], [-4, -21]];

/** @typedef {{x:number,z:number,height:number,u:number,v:number}} WaterVertex */

/** @param {number} x @param {number} z */
function approachDistance(x, z) {
  let distance = Infinity;
  for (let index = 1; index < APPROACH.length; index++) {
    const start = APPROACH[index - 1];
    const end = APPROACH[index];
    const dx = end[0] - start[0];
    const dz = end[1] - start[1];
    const t = Math.max(0, Math.min(1, ((x - start[0]) * dx + (z - start[1]) * dz) / (dx * dx + dz * dz)));
    distance = Math.min(distance, Math.hypot(x - start[0] - t * dx, z - start[1] - t * dz));
  }
  return distance;
}

/**
 * Builds terrain and a single water surface from the shared channel distance field.
 * @param {import('playcanvas').Application} app
 * @param {Entity} parent
 */
export function createEdenLandscape(app, parent) {
  const root = new Entity('Eden landscape');
  const sample = createRiverSample();
  const minX = EDEN_BOUNDS.minX - OUTER_MARGIN;
  const minZ = EDEN_BOUNDS.minZ - OUTER_MARGIN;
  const columns = Math.ceil((EDEN_BOUNDS.maxX + OUTER_MARGIN - minX) / GRID_SPACING);
  const rows = Math.ceil((EDEN_BOUNDS.maxZ + OUTER_MARGIN - minZ) / GRID_SPACING);
  const stride = columns + 1;
  /** @type {number[]} */ const positions = [];
  /** @type {number[]} */ const colors = [];
  /** @type {number[]} */ const indices = [];
  /** @type {WaterVertex[]} */ const vertices = [];
  /** @type {number[]} */ const waterPositions = [];
  /** @type {number[]} */ const waterUvs = [];
  /** @type {number[]} */ const waterIndices = [];

  for (let row = 0; row <= rows; row++) {
    const z = minZ + row * GRID_SPACING;
    for (let column = 0; column <= columns; column++) {
      const x = minX + column * GRID_SPACING;
      sampleEdenRiver(x, z, sample);
      const distance = sample.distance;
      const height = edenTerrainHeight(distance);
      positions.push(x, height, z);
      vertices.push({ x, z, height, u: sample.u, v: sample.v });

      const shore = Math.max(0, 1 - Math.abs(distance - 1.03) / 0.38);
      const pathDistance = Math.min(Math.abs(distance - 1.65) * sample.river.width, approachDistance(x, z));
      const path = distance > 1.26 ? Math.max(0, Math.min(1, (0.93 - pathDistance) / 0.32)) : 0;
      const base = distance < 0.9 ? RIVERBED : GRASS;
      const variation = 0.985 + 0.015 * Math.sin(x * 0.23) * Math.cos(z * 0.19);
      for (let channel = 0; channel < 3; channel++) {
        const bankColor = base[channel] + (BANK[channel] - base[channel]) * shore;
        colors.push((bankColor + (PATH[channel] - bankColor) * path) * variation);
      }
      colors.push(1);
    }
  }

  /** @param {WaterVertex} first @param {WaterVertex} second */
  function shoreIntersection(first, second) {
    const t = (EDEN_WATER_Y - first.height) / (second.height - first.height);
    const x = first.x + (second.x - first.x) * t;
    const z = first.z + (second.z - first.z) * t;
    sampleEdenRiver(x, z, sample);
    return { x, z, height: EDEN_WATER_Y, u: sample.u, v: sample.v };
  }

  /** @param {number} a @param {number} b @param {number} c */
  function addTriangle(a, b, c) {
    indices.push(a, b, c);
    const triangle = [vertices[a], vertices[b], vertices[c]];
    /** @type {WaterVertex[]} */ const polygon = [];
    let previous = triangle[2];
    for (const vertex of triangle) {
      if ((previous.height <= EDEN_WATER_Y) !== (vertex.height <= EDEN_WATER_Y)) polygon.push(shoreIntersection(previous, vertex));
      if (vertex.height <= EDEN_WATER_Y) polygon.push(vertex);
      previous = vertex;
    }
    const firstIndex = waterPositions.length / 3;
    for (const vertex of polygon) {
      waterPositions.push(vertex.x, EDEN_WATER_Y, vertex.z);
      waterUvs.push(Math.max(0, Math.min(1, vertex.u)), vertex.v);
    }
    for (let index = 1; index < polygon.length - 1; index++) waterIndices.push(firstIndex, firstIndex + index, firstIndex + index + 1);
  }

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const index = row * stride + column;
      addTriangle(index, index + stride, index + 1);
      addTriangle(index + 1, index + stride, index + stride + 1);
    }
  }

  const ground = new Mesh(app.graphicsDevice);
  const material = new StandardMaterial();
  material.diffuse.set(1, 1, 1);
  material.diffuseVertexColor = true;
  material.flatShading = true;
  material.update();
  /** @type {MeshInstance|undefined} */ let instance;
  /** @type {ReturnType<typeof createEdenWater>|undefined} */ let water;
  try {
    ground.setPositions(positions);
    ground.setNormals(calculateNormals(positions, indices));
    ground.setColors(colors);
    ground.setIndices(indices);
    ground.update(PRIMITIVE_TRIANGLES);
    instance = new MeshInstance(ground, material);
    root.addComponent('render', { meshInstances: [instance], castShadows: false });
    water = createEdenWater(app, root, { positions: waterPositions, uvs: waterUvs, indices: waterIndices });
    parent.addChild(root);
  } catch (error) {
    if (!root.render) {
      if (instance) instance.destroy();
      else ground.destroy();
    }
    water?.destroy();
    root.destroy();
    material.destroy();
    throw error;
  }

  let destroyed = false;
  return {
    /** @param {number} delta */
    update(delta) { water?.update(delta); },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      water?.destroy();
      root.destroy();
      material.destroy();
    },
  };
}
