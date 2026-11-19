import initJolt from 'jolt-physics/wasm-compat';

const jolt = await initJolt();
const STEP = 1 / 60;
const MAX_ELAPSED = 0.1;
const STEERING_BLEND = 1 - Math.exp(-9 * STEP);
const BUOYANCY = 1.7;
const WATER_DRAG = 80;
const SWIM_LAYER = 0;
const BODY_CAPACITY = 16;

/** @typedef {{ body: InstanceType<typeof jolt.Body>, bodyId: InstanceType<typeof jolt.BodyID>, surfaceY: number, vx: number, vz: number }} Swimmer */

function createWorld() {
  const settings = new jolt.JoltSettings();
  settings.mMaxBodies = BODY_CAPACITY;
  settings.mMaxBodyPairs = BODY_CAPACITY;
  settings.mMaxContactConstraints = BODY_CAPACITY;

  // Shore transitions belong to the room. Swimmers share a layer without contacts.
  const layerPairs = new jolt.ObjectLayerPairFilterTable(1);
  const broadPhase = new jolt.BroadPhaseLayerInterfaceTable(1, 1);
  const layer = new jolt.BroadPhaseLayer(0);
  broadPhase.MapObjectToBroadPhaseLayer(SWIM_LAYER, layer);
  jolt.destroy(layer);
  const broadPhaseFilter = new jolt.ObjectVsBroadPhaseLayerFilterTable(broadPhase, 1, layerPairs, 1);
  settings.mObjectLayerPairFilter = layerPairs;
  settings.mBroadPhaseLayerInterface = broadPhase;
  settings.mObjectVsBroadPhaseLayerFilter = broadPhaseFilter;

  let simulation;
  try {
    simulation = new jolt.JoltInterface(settings);
  } catch (error) {
    jolt.destroy(broadPhaseFilter);
    jolt.destroy(broadPhase);
    jolt.destroy(layerPairs);
    throw error;
  } finally {
    jolt.destroy(settings);
  }

  const physics = simulation.GetPhysicsSystem();
  const capsule = new jolt.CapsuleShape(0.36, 0.28);
  capsule.AddRef();

  return {
    simulation,
    capsule,
    bodies: physics.GetBodyInterface(),
    gravity: physics.GetGravity(),
    origin: new jolt.RVec3(),
    rotation: new jolt.Quat(0, 0, 0, 1),
    surface: new jolt.RVec3(),
    up: new jolt.Vec3(0, 1, 0),
    stillWater: new jolt.Vec3(0, 0, 0),
    velocity: new jolt.Vec3(),
  };
}

/** A per-room Jolt world, created on the first water entry. */
export function createEdenSwimPhysics() {
  /** @type {Map<string, Swimmer>} */
  const swimmers = new Map();
  /** @type {ReturnType<typeof createWorld> | null} */
  let world = null;
  let accumulator = 0;
  let destroyed = false;

  function releaseWorld() {
    if (!world) return;
    jolt.destroy(world.origin);
    jolt.destroy(world.rotation);
    jolt.destroy(world.surface);
    jolt.destroy(world.up);
    jolt.destroy(world.stillWater);
    jolt.destroy(world.velocity);
    world.capsule.Release();
    jolt.destroy(world.simulation);
    world = null;
    accumulator = 0;
  }

  /** @param {string} id @param {number} x @param {number} z @param {number} surfaceY */
  function enter(id, x, z, surfaceY) {
    if (destroyed || swimmers.has(id)) return;
    if (!Number.isFinite(x) || !Number.isFinite(z) || !Number.isFinite(surfaceY)) {
      throw new RangeError('Invalid swim entry coordinates');
    }
    world ??= createWorld();
    world.origin.Set(x, surfaceY, z);

    const settings = new jolt.BodyCreationSettings(
      world.capsule, world.origin, world.rotation, jolt.EMotionType_Dynamic, SWIM_LAYER,
    );
    settings.mAllowedDOFs = jolt.EAllowedDOFs_TranslationX | jolt.EAllowedDOFs_TranslationY | jolt.EAllowedDOFs_TranslationZ;
    settings.mAllowSleeping = false;
    settings.mLinearDamping = 0;
    let body;
    try {
      body = world.bodies.CreateBody(settings);
    } finally {
      jolt.destroy(settings);
    }
    if (!jolt.getPointer(body)) throw new Error('Unable to allocate a Jolt swim body');
    const bodyId = body.GetID();
    world.bodies.AddBody(bodyId, jolt.EActivation_Activate);
    swimmers.set(id, { body, bodyId, surfaceY, vx: 0, vz: 0 });
  }

  /** @param {string} id @param {number} vx @param {number} vz */
  function setInput(id, vx, vz) {
    const swimmer = swimmers.get(id);
    if (!swimmer || !Number.isFinite(vx) || !Number.isFinite(vz)) return;
    swimmer.vx = vx;
    swimmer.vz = vz;
  }

  /** @param {number} deltaSeconds */
  function step(deltaSeconds) {
    const active = world;
    if (!active || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;
    accumulator += Math.min(deltaSeconds, MAX_ELAPSED);
    const { surface, up, stillWater, gravity, velocity, simulation } = active;
    while (accumulator >= STEP) {
      for (const swimmer of swimmers.values()) {
        const { body, vx, vz } = swimmer;
        const current = body.GetLinearVelocity();
        const nextX = current.GetX() + (vx - current.GetX()) * STEERING_BLEND;
        const nextZ = current.GetZ() + (vz - current.GetZ()) * STEERING_BLEND;
        surface.Set(0, swimmer.surfaceY, 0);
        body.ApplyBuoyancyImpulse(surface, up, BUOYANCY, WATER_DRAG, 0, stillWater, gravity, STEP);
        // Preserve Jolt's buoyancy and vertical drag while steering horizontally.
        velocity.Set(nextX, body.GetLinearVelocity().GetY(), nextZ);
        body.SetLinearVelocity(velocity);
      }
      simulation.Step(STEP, 1);
      accumulator -= STEP;
    }
  }

  /** @param {string} id @param {{x: number, y: number, z: number}} out */
  function read(id, out) {
    const swimmer = swimmers.get(id);
    if (!swimmer) return false;
    const position = swimmer.body.GetPosition();
    out.x = position.GetX();
    out.y = position.GetY();
    out.z = position.GetZ();
    return true;
  }

  /** @param {string} id @param {number} x @param {number} z */
  function constrain(id, x, z) {
    const swimmer = swimmers.get(id);
    const active = world;
    if (!swimmer || !active || !Number.isFinite(x) || !Number.isFinite(z)) return;
    active.origin.Set(x, swimmer.body.GetPosition().GetY(), z);
    active.bodies.SetPosition(swimmer.bodyId, active.origin, jolt.EActivation_Activate);
  }

  /** @param {string} id */
  function leave(id) {
    const swimmer = swimmers.get(id);
    const active = world;
    if (!swimmer || !active) return;
    active.bodies.RemoveBody(swimmer.bodyId);
    active.bodies.DestroyBody(swimmer.bodyId);
    swimmers.delete(id);
    if (!swimmers.size) releaseWorld();
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    for (const id of swimmers.keys()) leave(id);
    releaseWorld();
  }

  return { enter, setInput, step, read, constrain, leave, destroy };
}
