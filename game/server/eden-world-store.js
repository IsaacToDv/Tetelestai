import { createHash, randomBytes } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/** @typedef {{key:string,names:Record<string,string>}} EdenWorld */

/** @param {unknown} key @returns {key is string} */
function isWorldKey(key) {
  // A 32-byte base64url value has two padding bits in its final character.
  return typeof key === 'string' && key.length === 43 && /^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/.test(key);
}

/** @param {unknown} names @returns {names is Record<string,string>} */
function isNames(names) {
  return names !== null && typeof names === 'object' && !Array.isArray(names) && Object.entries(names).every(
    ([id, value]) => (id === 'donkey-1' || id === 'donkey-2') && typeof value === 'string',
  );
}

/** @param {unknown} error @param {string} code */
function hasCode(error, code) {
  return error instanceof Error && 'code' in error && error.code === code;
}

export class EdenWorldStore {
  /** @param {string} saveDirectory */
  constructor(saveDirectory) {
    this.directory = resolve(saveDirectory);
  }

  /** @param {string} key */
  #path(key) {
    const digest = createHash('sha256').update(key).digest('hex');
    return join(this.directory, `${digest}.json`);
  }

  /** @returns {EdenWorld} */
  create() {
    mkdirSync(this.directory, { recursive: true, mode: 0o700 });
    while (true) {
      const key = randomBytes(32).toString('base64url');
      try {
        writeFileSync(this.#path(key), '{}\n', { flag: 'wx', mode: 0o600, flush: true });
        return { key, names: {} };
      } catch (error) {
        if (!hasCode(error, 'EEXIST')) throw error;
      }
    }
  }

  /** @param {unknown} key @returns {EdenWorld|null} */
  load(key) {
    if (!isWorldKey(key)) return null;
    let text;
    try {
      text = readFileSync(this.#path(key), 'utf8');
    } catch (error) {
      if (hasCode(error, 'ENOENT')) return null;
      throw error;
    }
    /** @type {unknown} */
    const names = JSON.parse(text);
    if (!isNames(names)) throw new Error('Invalid garden names');
    return { key, names };
  }

  /** @param {string} key @param {Record<string,string>} names */
  saveNames(key, names) {
    if (!isNames(names)) throw new Error('Invalid garden names');
    if (!this.load(key)) throw new Error('Garden not found');

    // Stage beside the destination so rename replaces the previous file atomically.
    const temporaryDirectory = mkdtempSync(join(this.directory, '.save-'));
    try {
      const stagedPath = join(temporaryDirectory, 'names.json');
      writeFileSync(stagedPath, `${JSON.stringify(names)}\n`, { flag: 'wx', mode: 0o600, flush: true });
      renameSync(stagedPath, this.#path(key));
    } finally {
      rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  }
}
