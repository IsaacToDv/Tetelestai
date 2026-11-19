/** Keyboard and captured pointer input share the same directional state. */
export class Input {
  /** @param {(message:{type:'input',dx:number,dz:number})=>boolean} send @param {HTMLElement} controls @param {boolean} [sendRelease] */
  constructor(send, controls, sendRelease = false) {
    this.send = send; this.active = false;
    this.keys = new Set();
    this.moving = false;
    /** @type {Map<number,string>} */ this.pointers = new Map();
    this.events = new AbortController();
    const options = { signal: this.events.signal };
    window.addEventListener('keydown', (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) { event.preventDefault(); this.keys.add(event.code); }
    }, options);
    window.addEventListener('keyup', (event) => {
      if (this.keys.delete(event.code) && sendRelease) this.update(true);
    }, options);
    window.addEventListener('blur', () => this.clear(), options);
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.clear(); }, options);
    controls.addEventListener('pointerdown', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement) || !target.dataset.direction) return;
      event.preventDefault(); target.setPointerCapture(event.pointerId); this.pointers.set(event.pointerId, target.dataset.direction);
    }, options);
    const release = (/** @type {PointerEvent} */ event) => {
      if (this.pointers.delete(event.pointerId) && sendRelease) this.update(true);
    };
    controls.addEventListener('pointerup', release, options); controls.addEventListener('pointercancel', release, options); controls.addEventListener('lostpointercapture', release, options);
    this.timer = setInterval(() => this.update(), 100);
  }
  /** @param {boolean} [releaseOnly] */
  update(releaseOnly = false) {
    if (!this.active) return;
    let dx = 0; let dz = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) dx--;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) dx++;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) dz--;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) dz++;
    for (const direction of this.pointers.values()) {
      if (direction === 'left') dx--; if (direction === 'right') dx++;
      if (direction === 'up') dz--; if (direction === 'down') dz++;
    }
    const moving = dx !== 0 || dz !== 0;
    if (releaseOnly && (moving || !this.moving)) return;
    this.moving = moving;
    this.send({ type: 'input', dx: Math.max(-1, Math.min(1, dx)), dz: Math.max(-1, Math.min(1, dz)) });
  }
  clear() { this.keys.clear(); this.pointers.clear(); this.moving = false; if (this.active) this.send({ type: 'input', dx: 0, dz: 0 }); }
  destroy() { this.clear(); clearInterval(this.timer); this.events.abort(); }
}
