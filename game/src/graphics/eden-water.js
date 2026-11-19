import {
  BLEND_NORMAL, CULLFACE_NONE, Entity, Mesh, MeshInstance, PRIMITIVE_TRIANGLES,
  SEMANTIC_POSITION, SEMANTIC_TEXCOORD0, ShaderMaterial,
} from 'playcanvas';
import { WATER_FRAGMENT_GLSL, WATER_VERTEX_GLSL } from '../shaders/eden-water.js';

const FULL_TURN = 2 * Math.PI;

/**
 * Mounts a static river mesh with water tint, reflections and flow computed in the shader.
 * @param {import('playcanvas').Application} app
 * @param {Entity} parent
 * @param {{positions:ArrayLike<number>,uvs:ArrayLike<number>,indices:number[]|Uint8Array|Uint16Array|Uint32Array}} geometry
 * XYZ positions, upward-facing triangle indices and UVs with U across and V increasing downstream.
 */
export function createEdenWater(app, parent, geometry) {
  const surface = new Entity('Eden water surface');
  const mesh = new Mesh(app.graphicsDevice);
  const material = new ShaderMaterial({
    uniqueName: 'EdenWater',
    attributes: { vertex_position: SEMANTIC_POSITION, vertex_texCoord0: SEMANTIC_TEXCOORD0 },
    vertexGLSL: WATER_VERTEX_GLSL,
    fragmentGLSL: WATER_FRAGMENT_GLSL,
  });
  material.blendType = BLEND_NORMAL;
  material.cull = CULLFACE_NONE;
  // Opaque objects above the surface occlude it. Submerged objects receive its tint over their color.
  material.depthWrite = false;
  material.setParameter('uWaterPhase', 0);

  /** @type {MeshInstance|undefined} */ let instance;
  try {
    mesh.setPositions(geometry.positions);
    mesh.setUvs(0, geometry.uvs);
    mesh.setIndices(geometry.indices);
    mesh.update(PRIMITIVE_TRIANGLES);
    instance = new MeshInstance(mesh, material);
    surface.addComponent('render', { meshInstances: [instance], castShadows: false, receiveShadows: false });
    parent.addChild(surface);
  } catch (error) {
    if (!surface.render) {
      if (instance) instance.destroy();
      else mesh.destroy();
    }
    surface.destroy();
    material.destroy();
    throw error;
  }

  let phase = 0;
  let destroyed = false;
  return {
    /** @param {number} delta Seconds since the previous update. */
    update(delta) {
      if (destroyed) return;
      phase = (phase + delta * 1.15) % FULL_TURN;
      material.setParameter('uWaterPhase', phase);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      // The render component releases the MeshInstance and its mesh reference.
      surface.destroy();
      material.destroy();
    },
  };
}
