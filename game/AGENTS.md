# Reglas PlayCanvas para el juego (`game/`)

Adaptado de `playcanvas/engine` AGENTS.md (MIT) y del enfoque delgado de `playcanvas/developer-site`. Originales completos en `docs/references/` (no se cargan solos).
Aquí el Engine es una **dependencia**, no el código que mantenemos: se omiten las reglas internas del motor (build, tree shaking, deprecaciones, PR).

## Proyecto (corte vertical de Sprint 1)
- Stack: PlayCanvas Engine 2.24.1 + Vite 8.3.8, JavaScript ES Modules; Node >=22.18.0 (verificado con 24.22.1).
- Desde `game/`: `npm ci --ignore-scripts`, `npm run server` (terminal 1), `npm run dev` (terminal 2), `npm run build`, `npm run preview`. Node/ws escucha por defecto en `127.0.0.1:3001`; `HOST`/`PORT` son opcionales. Si la caché del usuario no es escribible, usar `npm --cache /tmp/tetelestai-npm-cache ci --ignore-scripts`.
- Build para Pages: `VITE_BASE=/Tetelestai/ npm run build`; preview con la misma variable y ruta `/Tetelestai/`.
- Scripts reales: `npm run lint` (ESLint), `npm run typecheck` (checkJs estricto/JSDoc sin emitir TS), `npm test` (Node nativo: motor de sala, integración ws y voz). Las herramientas y ws fueron autorizados V4; el lenguaje sigue siendo JavaScript.
- La raíz abre Edén (`src/eden.js`, `src/graphics/eden-scene.js`, `server/eden-room.js`). Su primera entrega usa salas de dos, selección manual y exploración libre. `node scripts/eden-smoke.cjs` comprueba el recorrido con Playwright; `SMOKE_URL` apunta a la raíz del cliente. El corte histórico se sirve en `prototype.html` y usa sus propios códigos.
- Campamento multijugador privado de dos: servidor autoritativo en `server/room.js` y `server/server.js`; cliente en `src/net`, `src/voice` y `src/core`. `createApp` devuelve `setState()` y `destroy()` idempotente. La solución del reto vive solo en servidor; cada snapshot contiene únicamente el rol propio.
- Cliente configura servidor con `VITE_SERVER_URL` (por defecto hostname local, ws/wss, puerto3001). Sin STUN/TURN externo; micrófono opt-in apagado. Permisos/red/políticas pueden impedir voz; mantener chat alternativo. Proximidad no equivale a confidencialidad contra un cliente modificado.
- Humo reutilizable opcional: `node scripts/browser-smoke.cjs`, con Playwright global y `/usr/bin/chromium` existentes (no dependencia npm). `SMOKE_URL`/`CHROMIUM_PATH` son opcionales. Escritorio1365×900, viewport móvil390×844 y entrada táctil CDP. `ALLOW_NO_ICE=1` registra explícitamente el límite del Chromium administrado (cero candidatos por política `disable_non_proxied_udp`); no afirma verificar RTP/audio audible. Véase `docs/design/implementation-report.md`. No demuestra FPS ni hardware móvil físico.
- Build avisa de chunk del motor >500 kB (~2.09 MB, gzip ~535 kB); revisar presupuesto al fijar rendimiento, sin ocultar la advertencia.
- GitHub Pages: `vite.config` lee `base: process.env.VITE_BASE ?? '/'`, la salida es `dist/` y `package-lock.json` va commiteado. El CI y el despliegue (`.github/workflows/`) esperan los scripts `lint`, `typecheck`, `test` y `build`.

## Aprobación de contenido y reglas
Antes de definir o modificar narrativa, historia o mecánicas, consulta al autor mediante el orquestador y espera su respuesta explícita. Incluye cambios de lógica que alteren reglas, progresión, retos o recompensas. El prototipo Abram/Lot no fija el comienzo de la campaña. Las reparaciones técnicas que mantienen comportamiento aprobado pueden avanzar; duda de diseño va al orquestador, investigación técnica al bibliotecario.

## Código
- ES Modules. Sin `var`: usa `const` o `let`. Evita `any`; tipa con precisión.
- Nombres: clases PascalCase, funciones camelCase, constantes UPPER_SNAKE_CASE, archivos kebab-case (el archivo se llama como su clase principal).
- Ejecuta lint antes de entregar. Arregla solo lo que tocas.
- Comentarios: explica el porqué, no el qué. Sin comentarios obvios. Todo TODO lleva contexto.
- Imports de tipos solo-tipo con `import type` (TS) o `@import` (JSDoc).
- Estado de juego: instancias, no globales. Excepción: variables de módulo reutilizables (p. ej. un `Vec3` temporal) que nunca se exportan.

## Rendimiento (juego en tiempo real, multijugador)
- Sin asignaciones en el bucle de actualización ni de render: reutiliza objetos, usa pools (efectos, proyectiles, partículas).
- Cachea propiedades usadas con frecuencia en variables locales. Usa typed arrays para datos numéricos.
- Sin `try/catch`, creación de funciones ni concatenación de strings dentro de bucles calientes.
- Low poly: instancing/batching, pocas luces dinámicas, texturas pequeñas. Mide antes de optimizar.
- Trabajo pesado fuera del hilo principal (Web Workers) cuando aplique.

## Gráficos
- Usa las abstracciones del Engine; no llames a WebGL/WebGPU directamente.
- Comprueba qué backend usa el proyecto y prueba en él antes de dar algo por hecho.

## Scripts y atributos
- Los atributos tipo enum usan valores string legibles (`'linear'`), nunca constantes numéricas del Engine.
- Configuración expuesta como atributos; lógica reutilizable en scripts pequeños.

## Recursos
- Todo objeto que guarde recursos tiene `destroy()` y lo libera (`this.res?.destroy(); this.res = null`).
- Libera listeners, timers y conexiones de red al destruir entidades o salir de un mapa.

## Método
- Lee el código vecino y sigue su estilo antes de escribir.
- Causa raíz: no enmascares errores ni silencies avisos; arregla en el origen.
- Verifica en el navegador (captura + consola) antes de declarar algo hecho.
- Si hay varios enfoques válidos o falta información, **pregunta** al orquestador.

## Fuentes (no recuerdes APIs de memoria)
- API: https://api.playcanvas.com/engine/ · Manual: https://developer.playcanvas.com/user-manual/engine/
- Ejemplos: https://playcanvas.github.io · Foro: https://forum.playcanvas.com
- Skills de PlayCanvas en `.agents/skills/` y tipos `.d.ts` instalados.
