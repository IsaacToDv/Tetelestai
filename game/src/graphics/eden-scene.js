import { Application, Color, Entity, FILLMODE_FILL_WINDOW, FOG_LINEAR, RESOLUTION_AUTO, StandardMaterial } from 'playcanvas';

/** @typedef {'adam'|'eve'} Character */
/** @typedef {{id:string, character:Character|null, x:number, z:number}} Player */
/** @typedef {{id:string,x:number,z:number,watered:boolean}} Sprout */
/** @typedef {{id:string,x:number,z:number,feeds:number,name:string|null,rider:string|null}} Animal */
/** @typedef {{sprouts:Sprout[],animals:Animal[],fruit:{x:number,z:number,available:boolean}}} Garden */
/** @typedef {{self:string,players:Player[],visit?:{visited:Character[],nearby:boolean},garden?:Garden}} EdenState */
/** @typedef {{entity:Entity,x:number,z:number}} MovingFigure */
/** @typedef {MovingFigure & {id:string,rider:string|null}} Donkey */
/** @typedef {MovingFigure & {id:string|null,mount:Donkey|null,leftLeg:Entity,rightLeg:Entity,shadow:Entity}} Avatar */

const ORBIT_RADIUS = 4.5;
const INITIAL_PITCH = 0.36;
const LOOK_HEIGHT = 1.16;
const LOOK_SENSITIVITY = 0.007;
const RAD_TO_DEG = 180 / Math.PI;
const VISIT_Z = -3;
const SEAT_HEIGHT = 0.78;

/** @param {HTMLCanvasElement} canvas */
export function createEdenScene(canvas) {
  const app = new Application(canvas, { graphicsDeviceOptions: { antialias: true, alpha: false } });
  /** @type {StandardMaterial[]} */ const materials = [];
  const camera = new Entity('Eden camera');
  const visitMarker = new Entity('Garden visit marker');
  const completedMarker = new Entity('Completed garden visit marker');
  const gardenProps = new Entity('Interactive garden');
  /** @type {Donkey[]} */ const donkeys = [];
  /** @type {{id:string,root:Entity,dry:Entity,watered:Entity}[]} */ const sprouts = [];
  const fruitTree = new Entity('Fruit tree');
  const fruits = new Entity('Available fruit');
  /** @type {Record<Character, Avatar>} */ let avatars;
  /** @type {Avatar|null} */ let local = null;
  let yaw = 0;
  let pitch = INITIAL_PITCH;
  let destroyed = false;

  /** @param {number} r @param {number} g @param {number} b */
  function material(r, g, b) {
    const mat = new StandardMaterial();
    mat.diffuse.set(r, g, b);
    mat.update();
    materials.push(mat);
    return mat;
  }

  /** @param {Entity} parent @param {string} name @param {'box'|'cone'|'cylinder'|'sphere'} type
   * @param {StandardMaterial} mat @param {number} x @param {number} y @param {number} z
   * @param {number} width @param {number} height @param {number} depth */
  function shape(parent, name, type, mat, x, y, z, width, height, depth) {
    const entity = new Entity(name);
    entity.addComponent('render', { type, castShadows: false });
    if (entity.render) entity.render.material = mat;
    entity.setLocalPosition(x, y, z);
    entity.setLocalScale(width, height, depth);
    parent.addChild(entity);
    return entity;
  }

  function buildGarden() {
    const soil = material(0.29, 0.39, 0.22);
    const meadow = material(0.42, 0.55, 0.28);
    const grass = material(0.49, 0.59, 0.28);
    const bark = material(0.29, 0.22, 0.13);
    const canopy = material(0.26, 0.46, 0.24);
    const freshLeaves = material(0.43, 0.56, 0.25);
    shape(app.root, 'Ground', 'box', soil, 0, -0.15, 0, 90, 0.26, 90);
    shape(app.root, 'Garden floor', 'cylinder', meadow, 0, -0.045, 0, 36, 0.09, 29);

    // The playable meadow stays clear. Trees frame the area outside the camera's orbit radius.
    const trees = [
      [-17, -12, 1.1], [-16, -5, 1.25], [-17, 2, 0.95], [-19, 9, 1.05],
      [16, -13, 0.94], [17, -6, 1.18], [17, 1, 1.06], [16, 8, 1.27],
      [-11, -14, 1.18], [-6, -16, 1.08], [0, -14, 1.35], [6, -15, 0.92], [11, -14, 1.19],
      [-13, 13, 1.24], [-7, 15, 0.92], [0, 14, 1.14], [7, 14, 1.3], [12, 14, 1.02],
      [-20, -20, 1.3], [-9, -23, 1.46], [3, -24, 1.2], [15, -24, 1.45],
      [-19, 19, 1.4], [-8, 23, 1.27], [5, 22, 1.38], [18, 20, 1.21],
    ];
    for (const [x, z, scale] of trees) {
      shape(app.root, 'Trunk', 'cylinder', bark, x, scale, z, 0.4 * scale, 2 * scale, 0.4 * scale);
      shape(app.root, 'Crown', 'sphere', canopy, x, 2.9 * scale, z, 3.2 * scale, 2.7 * scale, 2.6 * scale);
      shape(app.root, 'Crown tip', 'sphere', freshLeaves, x - 0.65 * scale, 3.38 * scale, z + 0.24, 2.4 * scale, 2.1 * scale, 2.3 * scale);
    }

    for (let index = 0; index < 27; index++) {
      const angle = index * 2.39996323;
      const distance = 3 + index * 0.33;
      const x = Math.cos(angle) * distance * 1.18;
      const z = Math.sin(angle) * distance * 0.85;
      const height = 0.14 + (index % 3) * 0.06;
      shape(app.root, 'Grass', 'cone', grass, x, height * 0.45, z, 0.19, height, 0.13)
        .setLocalEulerAngles(0, index * 37, 12);
    }
  }

  function buildAvatars() {
    const skin = material(0.65, 0.42, 0.29);
    const hair = material(0.15, 0.12, 0.10);
    const belt = material(0.25, 0.18, 0.12);
    const shadow = material(0.30, 0.40, 0.22);
    const blue = material(0.20, 0.39, 0.51);
    const terracotta = material(0.61, 0.34, 0.25);

    /** @param {string} name @param {StandardMaterial} cloth @param {number} hairLength @returns {Avatar} */
    function buildAvatar(name, cloth, hairLength) {
      const root = new Entity(name);
      const groundShadow = shape(root, 'Shadow', 'cylinder', shadow, 0, 0.005, 0, 0.85, 0.01, 0.62);
      const leftLeg = shape(root, 'Left leg', 'box', belt, -0.135, 0.27, 0, 0.19, 0.49, 0.22);
      const rightLeg = shape(root, 'Right leg', 'box', belt, 0.135, 0.27, 0, 0.19, 0.49, 0.22);
      shape(root, 'Tunic', 'box', cloth, 0, 0.85, 0, 0.57, 0.76, 0.36);
      shape(root, 'Waistband', 'box', belt, 0, 0.77, 0, 0.59, 0.06, 0.38);
      shape(root, 'Left sleeve', 'box', cloth, -0.33, 0.94, 0, 0.17, 0.44, 0.24).setLocalEulerAngles(0, 0, -11);
      shape(root, 'Right sleeve', 'box', cloth, 0.33, 0.94, 0, 0.17, 0.44, 0.24).setLocalEulerAngles(0, 0, 11);
      shape(root, 'Head', 'sphere', skin, 0, 1.44, 0, 0.41, 0.47, 0.39);
      shape(root, 'Hair', 'sphere', hair, 0, 1.58 - hairLength * 0.2, 0.085, 0.43, hairLength, 0.34);
      root.enabled = false;
      app.root.addChild(root);
      return { entity: root, id: null, x: 0, z: 0, mount: null, shadow: groundShadow, leftLeg, rightLeg };
    }

    return { adam: buildAvatar('Adam', blue, 0.26), eve: buildAvatar('Eve', terracotta, 0.47) };
  }

  function buildInteractiveGarden() {
    const drySoil = material(0.53, 0.34, 0.17);
    const wetSoil = material(0.28, 0.19, 0.13);
    const paleLeaf = material(0.65, 0.64, 0.30);
    const freshLeaf = material(0.34, 0.65, 0.29);
    const bark = material(0.35, 0.24, 0.12);
    const canopy = material(0.22, 0.50, 0.25);
    const fruit = material(0.93, 0.65, 0.23);
    const coat = material(0.48, 0.43, 0.40);
    const lighterCoat = material(0.56, 0.51, 0.42);
    const muzzle = material(0.72, 0.67, 0.58);
    const dark = material(0.25, 0.22, 0.20);
    const shadow = material(0.31, 0.40, 0.23);

    /** @param {Entity} root @param {StandardMaterial} soil @param {StandardMaterial} leaf @param {number} scale */
    function buildSprout(root, soil, leaf, scale) {
      shape(root, 'Soil bed', 'cylinder', soil, 0, 0.025, 0, 1.18, 0.05, 1.18);
      shape(root, 'Stem', 'cylinder', leaf, 0, 0.05 + 0.25 * scale, 0, 0.07, 0.50 * scale, 0.07);
      shape(root, 'Left leaf', 'sphere', leaf, -0.13 * scale, 0.05 + 0.41 * scale, 0, 0.40 * scale, 0.12, 0.25 * scale)
        .setLocalEulerAngles(0, 0, -26);
      shape(root, 'Right leaf', 'sphere', leaf, 0.13 * scale, 0.05 + 0.49 * scale, 0, 0.40 * scale, 0.12, 0.25 * scale)
        .setLocalEulerAngles(0, 0, 28);
    }

    for (const id of ['sprout-1', 'sprout-2']) {
      const root = new Entity(id);
      const dry = new Entity('Dry sprout');
      const watered = new Entity('Watered sprout');
      buildSprout(dry, drySoil, paleLeaf, 0.78);
      buildSprout(watered, wetSoil, freshLeaf, 1.55);
      watered.enabled = false;
      root.addChild(dry);
      root.addChild(watered);
      gardenProps.addChild(root);
      sprouts.push({ id, root, dry, watered });
    }

    /** @param {string} id @param {StandardMaterial} fur */
    function buildDonkey(id, fur) {
      const root = new Entity(id);
      shape(root, 'Animal shadow', 'cylinder', shadow, 0, 0.004, 0, 0.97, 0.008, 1.76);
      shape(root, 'Body', 'box', fur, 0, 1.0, 0, 0.66, 0.57, 1.48);
      shape(root, 'Neck', 'box', fur, 0, 1.27, -0.57, 0.34, 0.60, 0.38).setLocalEulerAngles(23, 0, 0);
      shape(root, 'Mane', 'box', dark, 0, 1.39, -0.39, 0.10, 0.42, 0.10).setLocalEulerAngles(23, 0, 0);
      shape(root, 'Head', 'box', fur, 0, 1.57, -0.77, 0.40, 0.38, 0.55).setLocalEulerAngles(-16, 0, 0);
      shape(root, 'Muzzle', 'box', muzzle, 0, 1.46, -1.05, 0.36, 0.25, 0.28);
      for (const side of [-1, 1]) {
        shape(root, 'Ear', 'box', fur, side * 0.13, 1.95, -0.67, 0.095, 0.47, 0.11)
          .setLocalEulerAngles(-8, 0, -side * 14);
        shape(root, 'Eye', 'box', dark, side * 0.204, 1.62, -0.86, 0.014, 0.055, 0.055);
        for (const z of [-0.51, 0.51]) {
          shape(root, 'Leg', 'box', fur, side * 0.23, 0.44, z, 0.13, 0.73, 0.15);
          shape(root, 'Hoof', 'box', dark, side * 0.23, 0.077, z - 0.025, 0.15, 0.15, 0.20);
        }
      }
      shape(root, 'Tail', 'box', dark, 0, 0.73, 0.76, 0.075, 0.61, 0.075).setLocalEulerAngles(-14, 0, 0);
      gardenProps.addChild(root);
      donkeys.push({ id, entity: root, x: 0, z: 0, rider: null });
    }

    buildDonkey('donkey-1', coat);
    buildDonkey('donkey-2', lighterCoat);
    shape(fruitTree, 'Fruit tree trunk', 'cylinder', bark, 0, 1.50, 0, 0.47, 3.0, 0.47);
    shape(fruitTree, 'Fruit canopy', 'sphere', canopy, 0, 3.35, 0, 3.55, 2.02, 2.82);
    shape(fruitTree, 'Sunlit canopy', 'sphere', freshLeaf, 0.68, 3.70, -0.24, 2.62, 1.63, 2.21);
    for (const [x, y, z] of [[-0.99, 2.78, 0.75], [0.42, 2.60, 0.82], [1.13, 2.87, -0.31], [-0.58, 2.67, -0.73]]) {
      shape(fruits, 'Fruit', 'sphere', fruit, x, y, z, 0.34, 0.33, 0.34);
    }
    fruitTree.addChild(fruits);
    gardenProps.addChild(fruitTree);
    gardenProps.enabled = false;
    app.root.addChild(gardenProps);
  }

  function buildVisitMarker() {
    const rim = material(0.30, 0.23, 0.13);
    const gold = material(0.94, 0.72, 0.26);
    gold.emissive.set(0.16, 0.09, 0.02);
    gold.update();
    const teal = material(0.20, 0.65, 0.57);
    teal.emissive.set(0.02, 0.13, 0.10);
    teal.update();

    shape(app.root, 'Visit point edge', 'cylinder', rim, 0, 0.014, VISIT_Z, 1.62, 0.028, 1.62);
    shape(visitMarker, 'Visit point', 'cylinder', gold, 0, 0.02, 0, 1.37, 0.028, 1.37);
    shape(visitMarker, 'Visit beacon', 'box', gold, 0, 2.25, 0, 0.50, 0.50, 0.50)
      .setLocalEulerAngles(28, 25, 45);
    shape(completedMarker, 'Visited point', 'cylinder', teal, 0, 0.02, 0, 1.37, 0.028, 1.37);
    shape(completedMarker, 'Visited beacon left', 'box', teal, -0.26, 2.25, 0, 0.34, 0.34, 0.34)
      .setLocalEulerAngles(28, 25, 45);
    shape(completedMarker, 'Visited beacon right', 'box', teal, 0.26, 2.25, 0, 0.34, 0.34, 0.34)
      .setLocalEulerAngles(28, 25, 45);
    visitMarker.setLocalPosition(0, 0, VISIT_Z);
    completedMarker.setLocalPosition(0, 0, VISIT_Z);
    completedMarker.enabled = false;
    app.root.addChild(visitMarker);
    app.root.addChild(completedMarker);
  }

  /** @param {Garden|undefined} garden */
  function syncGarden(garden) {
    const entering = !gardenProps.enabled;
    gardenProps.enabled = garden !== undefined;
    for (const sprout of sprouts) {
      const state = garden?.sprouts.find((item) => item.id === sprout.id);
      sprout.root.enabled = state !== undefined;
      if (state) {
        sprout.root.setPosition(state.x, 0, state.z);
        sprout.dry.enabled = !state.watered;
        sprout.watered.enabled = state.watered;
      }
    }
    for (const donkey of donkeys) {
      const state = garden?.animals.find((item) => item.id === donkey.id);
      const appearing = entering || !donkey.entity.enabled;
      donkey.entity.enabled = state !== undefined;
      donkey.rider = state?.rider ?? null;
      if (state) {
        donkey.x = state.x;
        donkey.z = state.z;
        const scale = state.feeds >= 3 ? 1 : 0.64;
        if (donkey.entity.getLocalScale().x !== scale) donkey.entity.setLocalScale(scale, scale, scale);
        if (appearing) {
          donkey.entity.setPosition(state.x, 0, state.z);
          donkey.entity.setEulerAngles(0, 0, 0);
        }
      }
    }
    if (garden) {
      fruitTree.setPosition(garden.fruit.x, 0, garden.fruit.z);
      fruits.enabled = garden.fruit.available;
    }
  }

  /** @param {Avatar} avatar @param {Player|undefined} player */
  function syncAvatar(avatar, player) {
    avatar.entity.enabled = player !== undefined;
    if (!player) {
      avatar.id = null;
      return;
    }
    avatar.x = player.x;
    avatar.z = player.z;
    if (avatar.id !== player.id) {
      avatar.entity.setPosition(player.x, 0, player.z);
      avatar.entity.setEulerAngles(0, 0, 0);
      avatar.id = player.id;
    }
  }

  /** @param {Avatar} avatar */
  function syncMount(avatar) {
    const mount = avatar.id ? donkeys.find((donkey) => donkey.rider === avatar.id) ?? null : null;
    if (mount === avatar.mount) return;
    avatar.mount = mount;

    const legX = mount ? 0.35 : 0.135;
    const legZ = mount ? -0.16 : 0;
    const tilt = mount ? -25 : 0;
    avatar.leftLeg.setLocalPosition(-legX, 0.27, legZ);
    avatar.rightLeg.setLocalPosition(legX, 0.27, legZ);
    avatar.leftLeg.setLocalEulerAngles(tilt, 0, mount ? -14 : 0);
    avatar.rightLeg.setLocalEulerAngles(tilt, 0, mount ? 14 : 0);
    avatar.shadow.enabled = !mount;
  }

  /** @param {MovingFigure} figure @param {number} blend */
  function moveFigure(figure, blend) {
    if (!figure.entity.enabled) return;
    const position = figure.entity.getPosition();
    const dx = figure.x - position.x;
    const dz = figure.z - position.z;
    if (dx * dx + dz * dz > 0.0001) {
      figure.entity.setEulerAngles(0, Math.atan2(-dx, -dz) * RAD_TO_DEG, 0);
    }
    figure.entity.setPosition(position.x + dx * blend, 0, position.z + dz * blend);
  }

  /** @param {Avatar} avatar @param {number} blend */
  function moveAvatar(avatar, blend) {
    if (!avatar.mount) {
      moveFigure(avatar, blend);
      return;
    }
    const mount = avatar.mount.entity;
    const position = mount.getPosition();
    avatar.entity.setPosition(position.x, SEAT_HEIGHT, position.z);
    avatar.entity.setRotation(mount.getRotation());
  }

  function positionCamera() {
    if (!local) {
      camera.setPosition(5, 6.2, 10);
      camera.lookAt(0, 0.9, 0);
      return;
    }
    const position = local.entity.getPosition();
    const horizontalRadius = ORBIT_RADIUS * Math.cos(pitch);
    const focusHeight = LOOK_HEIGHT + position.y * 0.72;
    camera.setPosition(
      position.x + Math.sin(yaw) * horizontalRadius,
      focusHeight + Math.sin(pitch) * ORBIT_RADIUS,
      position.z + Math.cos(yaw) * horizontalRadius,
    );
    camera.lookAt(position.x, focusHeight, position.z);
  }

  /** @param {number} delta */
  function update(delta) {
    const blend = 1 - Math.exp(-14 * delta);
    if (gardenProps.enabled) {
      for (let index = 0; index < donkeys.length; index++) moveFigure(donkeys[index], blend);
    }
    moveAvatar(avatars.adam, blend);
    moveAvatar(avatars.eve, blend);
    if (local) positionCamera();
  }

  const resize = () => app.resizeCanvas();
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    window.removeEventListener('resize', resize);
    app.off('update', update);
    app.destroy();
    for (const mat of materials) mat.destroy();
  }

  try {
    const sky = new Color(0.72, 0.81, 0.72);
    app.graphicsDevice.maxPixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    app.setCanvasFillMode(FILLMODE_FILL_WINDOW);
    app.setCanvasResolution(RESOLUTION_AUTO);
    app.scene.ambientLight.set(0.53, 0.57, 0.49);
    app.scene.fog.type = FOG_LINEAR;
    app.scene.fog.color.copy(sky);
    app.scene.fog.start = 18;
    app.scene.fog.end = 42;
    camera.addComponent('camera', { clearColor: sky, fov: 57, nearClip: 0.15, farClip: 65 });
    app.root.addChild(camera);
    const sun = new Entity('Sunlight');
    sun.addComponent('light', { type: 'directional', color: new Color(1, 0.94, 0.79), intensity: 1.35 });
    sun.setEulerAngles(48, 24, 0);
    app.root.addChild(sun);
    buildGarden();
    avatars = buildAvatars();
    buildVisitMarker();
    buildInteractiveGarden();
    positionCamera();
    window.addEventListener('resize', resize);
    resize();
    app.on('update', update);
    app.start();
  } catch (error) {
    destroy();
    throw error;
  }

  return {
    /** @param {EdenState|null} state */
    setState(state) {
      const completed = state?.visit?.visited.length === 2;
      visitMarker.enabled = !completed;
      completedMarker.enabled = completed;
      syncGarden(state?.garden);
      syncAvatar(avatars.adam, state?.players.find((player) => player.character === 'adam'));
      syncAvatar(avatars.eve, state?.players.find((player) => player.character === 'eve'));
      syncMount(avatars.adam);
      syncMount(avatars.eve);
      const choice = state?.players.find((player) => player.id === state.self)?.character;
      const next = choice ? avatars[choice] : null;
      if (next !== local) {
        local = next;
        yaw = 0;
        pitch = INITIAL_PITCH;
        positionCamera();
      }
    },
    /** @param {number} dx @param {number} dy */
    orbit(dx, dy) {
      if (!local) return;
      yaw = (yaw - dx * LOOK_SENSITIVITY) % (2 * Math.PI);
      pitch = Math.max(0.22, Math.min(1.03, pitch + dy * LOOK_SENSITIVITY));
    },
    heading: () => yaw,
    destroy,
  };
}
