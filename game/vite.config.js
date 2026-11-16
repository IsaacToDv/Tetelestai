import { defineConfig } from 'vite';
import { URL, fileURLToPath } from 'node:url';

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  server: {
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.eden-data/**'] },
  },
  build: {
    rolldownOptions: {
      input: {
        eden: fileURLToPath(new URL('./index.html', import.meta.url)),
        prototype: fileURLToPath(new URL('./prototype.html', import.meta.url)),
      },
    },
  },
});
