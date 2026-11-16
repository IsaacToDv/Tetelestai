import js from '@eslint/js';

const browser = Object.fromEntries(['window', 'document', 'location', 'navigator', 'sessionStorage', 'console', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'WebSocket', 'HTMLElement', 'HTMLCanvasElement', 'HTMLButtonElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLDetailsElement', 'HTMLFormElement', 'AbortController', 'Audio', 'RTCPeerConnection', 'MediaStream', 'crypto', 'Float32Array'].map((name) => [name, 'readonly']));
export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  { files: ['src/**/*.js'], languageOptions: { globals: browser } },
  { files: ['scripts/**/*.cjs'], languageOptions: { globals: { ...browser, require: 'readonly', process: 'readonly' } } },
  { files: ['server/**/*.js', 'tests/**/*.js', 'vite.config.js'], languageOptions: { globals: { process: 'readonly', console: 'readonly', setInterval: 'readonly', clearInterval: 'readonly', setTimeout: 'readonly' } } },
];
