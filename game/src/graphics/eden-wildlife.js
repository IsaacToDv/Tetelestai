import { Entity } from 'playcanvas';

/** @import { StandardMaterial } from 'playcanvas' */
/** @typedef {'sheep'|'lion'|'giraffe'} Species */
/** @typedef {(r:number, g:number, b:number) => StandardMaterial} MakeMaterial */
/** @typedef {(parent:Entity, name:string, type:'box'|'cone'|'cylinder'|'sphere', surface:StandardMaterial,
 * x:number, y:number, z:number, width:number, height:number, depth:number) => Entity} MakeShape */

/** @param {MakeMaterial} material @param {MakeShape} shape */
export function createEdenWildlifeBuilder(material, shape) {
  const wool = material(0.89, 0.83, 0.67);
  const cream = material(0.97, 0.89, 0.73);
  const slate = material(0.32, 0.27, 0.25);
  const dark = material(0.21, 0.16, 0.12);
  const sand = material(0.75, 0.49, 0.24);
  const mane = material(0.49, 0.28, 0.15);
  const honey = material(0.85, 0.62, 0.34);
  const chestnut = material(0.54, 0.32, 0.18);

  function buildSheep() {
    const entity = new Entity('Sheep');
    const head = new Entity('Sheep head');
    const restPitch = -64;
    entity.addChild(head);
    head.setLocalPosition(0, 0.69, -0.37);
    head.setLocalEulerAngles(restPitch, 0, 0);

    shape(entity, 'Fleece', 'sphere', wool, 0, 0.74, 0.04, 0.76, 0.69, 1.19);
    shape(entity, 'Shoulder fleece', 'sphere', cream, 0, 0.83, -0.28, 0.70, 0.65, 0.57);
    shape(entity, 'Rump fleece', 'sphere', cream, 0, 0.77, 0.34, 0.68, 0.68, 0.60);
    shape(entity, 'Tail', 'sphere', wool, 0, 0.71, 0.60, 0.20, 0.30, 0.22);
    shape(head, 'Neck fleece', 'sphere', wool, 0, 0.01, -0.14, 0.32, 0.30, 0.50);
    shape(head, 'Face', 'sphere', slate, 0, 0.02, -0.34, 0.35, 0.36, 0.33);
    shape(head, 'Muzzle', 'sphere', slate, 0, -0.08, -0.46, 0.28, 0.19, 0.26);
    shape(head, 'Crown fleece', 'sphere', cream, 0, 0.16, -0.31, 0.36, 0.25, 0.33);
    for (const side of [-1, 1]) {
      shape(head, 'Ear', 'sphere', slate, side * 0.20, 0.075, -0.255, 0.29, 0.10, 0.16)
        .setLocalEulerAngles(0, side * 12, -side * 18);
      shape(head, 'Eye', 'sphere', dark, side * 0.148, 0.045, -0.413, 0.055, 0.060, 0.042);
      for (const z of [-0.34, 0.37]) {
        shape(entity, 'Leg', 'box', slate, side * 0.218, 0.27, z, 0.12, 0.54, 0.13);
      }
    }
    return { entity, head, restPitch };
  }

  function buildLion() {
    const entity = new Entity('Lion');
    const head = new Entity('Lion head');
    const restPitch = -23;
    entity.addChild(head);
    head.setLocalPosition(0, 0.58, -0.64);
    head.setLocalEulerAngles(restPitch, 0, 0);

    shape(entity, 'Body', 'sphere', sand, 0, 0.36, 0.08, 0.72, 0.65, 1.75);
    shape(entity, 'Shoulders', 'sphere', mane, 0, 0.45, -0.49, 0.76, 0.72, 0.67);
    shape(head, 'Mane', 'sphere', mane, 0, 0, -0.08, 0.85, 0.91, 0.63);
    shape(head, 'Face', 'sphere', sand, 0, 0.045, -0.315, 0.57, 0.55, 0.48);
    shape(head, 'Chin', 'sphere', cream, 0, -0.14, -0.46, 0.44, 0.22, 0.32);
    shape(head, 'Nose', 'sphere', dark, 0, -0.045, -0.595, 0.185, 0.115, 0.075);
    for (const side of [-1, 1]) {
      shape(head, 'Cheek', 'sphere', honey, side * 0.13, -0.05, -0.47, 0.25, 0.23, 0.27);
      shape(head, 'Ear', 'sphere', sand, side * 0.30, 0.31, -0.28, 0.19, 0.22, 0.13);
      shape(head, 'Eye', 'sphere', dark, side * 0.15, 0.122, -0.506, 0.065, 0.046, 0.043);
      shape(entity, 'Foreleg', 'sphere', sand, side * 0.30, 0.14, -0.85, 0.21, 0.22, 0.91);
      shape(entity, 'Front paw', 'sphere', honey, side * 0.31, 0.09, -1.24, 0.22, 0.17, 0.34);
      shape(entity, 'Haunch', 'sphere', sand, side * 0.25, 0.26, 0.58, 0.34, 0.54, 0.61);
      shape(entity, 'Hind paw', 'sphere', honey, side * 0.35, 0.08, 0.40, 0.21, 0.16, 0.31);
    }
    shape(entity, 'Tail', 'box', sand, 0.05, 0.13, 1.02, 0.07, 0.58, 0.08)
      .setLocalEulerAngles(101, 12, 0);
    shape(entity, 'Tail tuft', 'sphere', mane, 0.11, 0.079, 1.31, 0.12, 0.14, 0.24);
    return { entity, head, restPitch };
  }

  function buildGiraffe() {
    const entity = new Entity('Giraffe');
    const neck = new Entity('Giraffe neck');
    const head = new Entity('Giraffe head');
    const restPitch = -13;
    entity.addChild(neck);
    neck.setLocalPosition(0, 1.63, -0.49);
    neck.setLocalEulerAngles(restPitch, 0, 0);
    neck.addChild(head);
    head.setLocalPosition(0, 1.40, -0.07);

    shape(entity, 'Torso', 'box', honey, 0, 1.57, 0.08, 0.58, 0.59, 1.36);
    shape(entity, 'Shoulders', 'sphere', honey, 0, 1.64, -0.42, 0.66, 0.69, 0.67);
    shape(entity, 'Rump', 'sphere', honey, 0, 1.58, 0.61, 0.58, 0.58, 0.44);
    shape(neck, 'Neck', 'box', honey, 0, 0.69, 0, 0.29, 1.50, 0.33);
    shape(neck, 'Mane', 'box', chestnut, 0, 0.71, 0.167, 0.095, 1.24, 0.055);
    shape(head, 'Skull', 'sphere', honey, 0, 0.04, -0.14, 0.37, 0.36, 0.55);
    shape(head, 'Muzzle', 'sphere', cream, 0, -0.018, -0.37, 0.32, 0.23, 0.38);
    for (const side of [-1, 1]) {
      shape(head, 'Ear', 'sphere', honey, side * 0.20, 0.13, -0.065, 0.26, 0.10, 0.14)
        .setLocalEulerAngles(0, 0, side * 25);
      shape(head, 'Ossicone', 'cylinder', chestnut, side * 0.095, 0.24, -0.104, 0.073, 0.20, 0.073)
        .setLocalEulerAngles(0, 0, -side * 9);
      shape(head, 'Eye', 'sphere', dark, side * 0.149, 0.091, -0.271, 0.058, 0.055, 0.05);
      for (const z of [-0.46, 0.60]) {
        shape(entity, 'Leg', 'box', honey, side * 0.21, 0.71, z, 0.125, 1.41, 0.15);
        shape(entity, 'Hoof', 'box', chestnut, side * 0.21, 0.066, z - 0.018, 0.139, 0.132, 0.18);
      }
      for (const [y, z, size, angle] of [[1.64, -0.09, 0.24, 30], [1.44, 0.20, 0.18, -19], [1.69, 0.44, 0.22, -12]]) {
        shape(entity, 'Coat patch', 'box', chestnut, side * 0.289, y, z, 0.014, size, size * 1.20)
          .setLocalEulerAngles(angle, 0, 0);
      }
      for (const [y, z, angle] of [[0.24, -0.037, 25], [0.54, 0.025, -16], [0.86, -0.033, 28], [1.16, 0.023, -23]]) {
        shape(neck, 'Neck patch', 'box', chestnut, side * 0.144, y, z, 0.013, 0.18, 0.135)
          .setLocalEulerAngles(angle, 0, 0);
      }
    }
    shape(entity, 'Tail', 'box', chestnut, 0, 1.29, 0.87, 0.055, 0.50, 0.055)
      .setLocalEulerAngles(-28, 0, 0);
    return { entity, head: neck, restPitch };
  }

  const builders = { sheep: buildSheep, lion: buildLion, giraffe: buildGiraffe };
  /** @param {Species} species */
  return (species) => builders[species]();
}
