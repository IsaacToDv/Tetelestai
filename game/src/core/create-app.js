import { Application, Color, Entity, StandardMaterial, FILLMODE_FILL_WINDOW, RESOLUTION_AUTO, PROJECTION_ORTHOGRAPHIC } from 'playcanvas';

/** @import {State} from '../net/connection.js' */
/** @param {HTMLCanvasElement} canvas */
export function createApp(canvas) {
  const app = new Application(canvas, { graphicsDeviceOptions: { antialias: true, alpha: false } });
  let destroyed = false;
  /** @type {StandardMaterial[]} */ const materials = [];
  const targets = new Float32Array([-4, 0, 4, 0]);
  let active = false; let partner = false;
  /** @param {number} r @param {number} g @param {number} b */
  const material = (r, g, b) => {
    const result = new StandardMaterial(); result.diffuse = new Color(r, g, b); result.update(); materials.push(result); return result;
  };
  /** @param {string} name @param {'box'|'capsule'|'cone'|'cylinder'|'sphere'} type @param {StandardMaterial} mat @param {number} x @param {number} y @param {number} z @param {number} sx @param {number} sy @param {number} sz */
  const shape = (name, type, mat, x, y, z, sx, sy, sz) => {
    const entity = new Entity(name); entity.addComponent('render', { type });
    if (entity.render) entity.render.material = mat;
    entity.setPosition(x, y, z); entity.setLocalScale(sx, sy, sz); app.root.addChild(entity); return entity;
  };
  const camera = new Entity('Camp camera');
  camera.addComponent('camera', { clearColor: new Color(0.84, 0.72, 0.51), projection: PROJECTION_ORTHOGRAPHIC, orthoHeight: 11, farClip: 100 });
  camera.setPosition(0, 19, 14); camera.lookAt(0, 0, 0); app.root.addChild(camera);
  const resize = () => { app.resizeCanvas(); if (camera.camera) camera.camera.orthoHeight = window.innerWidth < 650 ? 10 : 11; };
  const destroy = () => {
    if (destroyed) return;
    destroyed = true; window.removeEventListener('resize', resize); app.off('update', update);
    app.destroy(); materials.forEach((item) => item.destroy());
  };
  const own = new Entity('Your traveler'); const other = new Entity('Companion traveler');
  /** @param {number} delta */
  function update(delta) {
    const blend = Math.min(1, delta * 12);
    const ownPosition = own.getPosition(); const otherPosition = other.getPosition();
    own.setPosition(ownPosition.x + (targets[0] - ownPosition.x) * blend, 0, ownPosition.z + (targets[1] - ownPosition.z) * blend);
    other.setPosition(otherPosition.x + (targets[2] - otherPosition.x) * blend, 0, otherPosition.z + (targets[3] - otherPosition.z) * blend);
    own.enabled = active; other.enabled = partner;
  }
  try {
    app.graphicsDevice.maxPixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    app.setCanvasFillMode(FILLMODE_FILL_WINDOW); app.setCanvasResolution(RESOLUTION_AUTO);
    app.scene.ambientLight = new Color(0.6, 0.55, 0.46);
    const light = new Entity('Afternoon light'); light.addComponent('light', { type: 'directional', intensity: 1.4 }); light.setEulerAngles(48, 28, 0); app.root.addChild(light);
    const sand = material(0.77, 0.59, 0.35); const linen = material(0.84, 0.74, 0.52);
    const ochre = material(0.49, 0.28, 0.12); const stone = material(0.46, 0.42, 0.32);
    const teal = material(0.08, 0.59, 0.55); const blue = material(0.12, 0.26, 0.4); const gold = material(0.94, 0.54, 0.12);
    shape('Camp ground', 'box', sand, 0, -0.2, 0, 26, 0.3, 20);
    shape('Travel path', 'box', linen, 0, -0.035, 0, 22, 0.04, 2.2);
    shape('Meeting area', 'cylinder', teal, 0, 0.015, 0, 6, 0.06, 6);
    shape('Fragment stone', 'box', linen, 0, 0.6, 0, 0.7, 1.2, 0.5).setEulerAngles(0, 18, 0);
    shape('Fragment sign', 'cone', gold, 0, 1.65, 0, 0.35, 0.5, 0.35);
    for (let i = 0; i < 6; i++) {
      const x = (i % 3 - 1) * 7; const z = i < 3 ? -5.5 : 5.5;
      shape('Tent', 'box', ochre, x, 0.7, z, 2.7, 1.4, 2);
      shape('Tent roof left', 'box', linen, x - 0.65, 1.65, z, 1.85, 0.14, 2.5).setEulerAngles(0, 0, 35);
      shape('Tent roof right', 'box', linen, x + 0.65, 1.65, z, 1.85, 0.14, 2.5).setEulerAngles(0, 0, -35);
      shape('Camp jar', 'cylinder', gold, x + 1.9, 0.4, z, 0.5, 0.8, 0.5);
    }
    for (let i = 0; i < 14; i++) {
      const x = (i % 7 - 3) * 3.6; const z = i < 7 ? -8.8 : 8.8;
      shape('Boundary rock', 'box', stone, x, 0.16, z, 0.7, 0.4, 0.55).setEulerAngles(8, i * 37, 12);
    }
    app.root.addChild(own); app.root.addChild(other);
    const robe = shape('Your robe', 'capsule', blue, 0, 0.7, 0, 0.65, 0.6, 0.65); own.addChild(robe); robe.setLocalPosition(0, 0.7, 0);
    const head = shape('Your head', 'sphere', linen, 0, 1.5, 0, 0.43, 0.43, 0.43); own.addChild(head); head.setLocalPosition(0, 1.5, 0);
    const partnerRobe = shape('Companion robe', 'capsule', gold, 0, 0.7, 0, 0.65, 0.6, 0.65); other.addChild(partnerRobe); partnerRobe.setLocalPosition(0, 0.7, 0);
    const partnerHead = shape('Companion head', 'sphere', linen, 0, 1.5, 0, 0.43, 0.43, 0.43); other.addChild(partnerHead); partnerHead.setLocalPosition(0, 1.5, 0);
    own.setPosition(-4, 0, 0); other.setPosition(4, 0, 0); own.enabled = false; other.enabled = false;
    window.addEventListener('resize', resize); resize(); app.on('update', update); app.start();
    return {
      /** @param {State|null} state */
      setState(state) {
        active = Boolean(state); partner = Boolean(state && state.players.length === 2);
        if (!state) return;
        for (const player of state.players) {
          const offset = player.id === state.self ? 0 : 2;
          targets[offset] = player.x; targets[offset + 1] = player.z;
        }
      }, destroy,
    };
  } catch (error) { destroy(); throw error; }
}
