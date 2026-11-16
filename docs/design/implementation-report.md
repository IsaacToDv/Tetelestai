# Sprint 1 — Informe de implementación

Implementación local del corte aprobado de `genesis-vertical-slice.md`. El cierre del sprint corresponde al autor; este informe no lo declara cerrado.

## Comportamiento implementado

- Servidor Node/ws autoritativo, salas privadas por invitación de 12 caracteres aleatorios (48 bits), máximo dos participantes. Cada snapshot lleva únicamente el rol propio, posiciones autorizadas y progreso visible. La solución del reto reside en el servidor y se envía solo al terminar por tiempo.
- Entradas de dirección normalizadas, velocidad de 3 unidades/s, límites de mapa y parada de entradas caducadas. No se aceptan coordenadas de teletransporte. Simulación de 20 Hz y snapshots de 10 Hz.
- Fragmento compartido: ambos participantes deben estar dentro del punto de reunión y confirmar. La progresión es idempotente, puede releerse y se conserva mientras quede alguien en la sala.
- Reto de 45 s, respuesta validada exclusivamente en servidor, reintento tras error, ventana inclusiva de empate de 250 ms, IDs de envío idempotentes y resultado rival oculto hasta resolver. La desconexión antes del resultado cancela sin ganador. Agua simbólica para ganador o ambos en empate; ambos pueden concluir o repetir.
- Campamento PlayCanvas con primitivas arena/ocre, viajeros diferenciados, HUD español, teclado y botones con captura táctil. Los textos son resúmenes originales con Génesis 12:1–3 y Gálatas 3:8,16; no se copiaron versículos. El reto remite a Génesis 12:4–5; 12:6; 12:8.
- Chat de proximidad (12 unidades), texto mediante `textContent`, longitud de 300 caracteres y controles de silencio/bloqueo. Señalización WebRTC restringida a dos micrófonos optativos activos, misma sala, proximidad y ausencia de bloqueo. Sin servicios STUN/TURN externos.
- Voz apagada al entrar, permiso solicitado únicamente al pulsar el control, ICE temprano en búfer, volumen atenuado por distancia y limpieza de peers/tracks al apagar, bloquear, salir o desconectar. Un reemplazo de compañero conserva el opt-in del superviviente y crea un peer nuevo. Denegación y ausencia de rutas ICE se comunican en español con chat alternativo.
- Reconexión del transporte con espera creciente; intento de volver a la sala mientras exista. El rol puede reasignarse. Al vaciarse una sala se elimina; no hay persistencia tras reiniciar el servidor. Recursos gráficos, listeners, timers y conexiones se liberan, incluidos HMR y ciclo de página.

## Archivos y herramientas

`game/server/room.js` contiene el estado puro; `server/server.js`, el transporte y sus límites. `src/net/connection.js`, `src/voice/voice.js`, `src/core/input.js` y `src/core/create-app.js` separan conexión, medios, entradas y escena. `src/main.js` integra la interfaz. Las asignaciones de roles y la solución no se importan en runtime por el cliente.

Stack conservado: JavaScript ES Modules, PlayCanvas y Vite. Se añadieron ws, ESLint y TypeScript solo como verificador JSDoc/checkJs estricto (`noEmit`), junto a tipos de herramientas Node/ws. El lockfile permite `npm ci --ignore-scripts`.

Comandos desde `game/`:

```sh
npm ci --ignore-scripts
npm run server
# En otra terminal:
npm run dev
# Comprobaciones:
npm run lint
npm run typecheck
npm test
npm run build
```

Servidor por defecto `127.0.0.1:3001`; variables opcionales `PORT` y `HOST`. Cliente: `VITE_SERVER_URL`; por defecto `ws://<hostname>:3001` o `wss` si la página usa HTTPS. `VITE_BASE` controla el subdirectorio de Vite; se verificó build `/Tetelestai/`. Las variables Vite se fijan al construir. Pages solo sirve el cliente estático.

## Verificación

- `npm run lint`: limpio, incluidos scripts de diagnóstico.
- `npm run typecheck`: limpio, checkJs estricto sobre cliente, servidor y configuración Vite.
- `npm test`: 17 pruebas nativas Node: roles privados, límite de dos, movimiento/proximidad, fragmento, validación, reintentos/idempotencia, secreto de resultados, empate y frontera 250 ms, deadline, desconexión, reemplazo y progreso, bloqueo, JSON malformado, payload/rate, ICE temprano, atenuación y permisos.
- `VITE_BASE=/Tetelestai/ npm run build`: correcto. Aviso real de tamaño del motor: bundle ~2,10 MB, gzip ~540 kB; no se ocultó.
- Humo Chromium/Playwright en dos contextos, escritorio 1365×900 y viewport móvil 390×844, desde el build con subdirectorio: **correcto, exit 0 y cero errores de consola/página**. Crear/unir, roles distintos, movimiento real de teclado y toque sostenido CDP, doble consentimiento, chat, micrófono fake sin petición automática, SDP oferta/respuesta en ambos clientes, silencio/bloqueo y limpieza, error/reintento de respuesta, resultado, nueva ronda, cancelación por desconexión, regreso con fragmento conservado, timeout real de 45 s y solución, conclusión de ambos y salir/crear otra sala. El ganador del humo fue el primer cliente; empate y frontera exacta de 250 ms están cubiertos por pruebas nativas deterministas.
- Denegación real del permiso en un contexto de navegador sin permisos: el HUD muestra «No se pudo activar el micrófono. Comprueba el permiso y usa el chat de texto». Resize a 844×390 capturado; no demuestra un móvil físico.

El script reutilizable es `game/scripts/browser-smoke.cjs`; usa Playwright/Chromium ya presentes en el entorno y no añade esa dependencia al producto. Se ejecutó con `ALLOW_NO_ICE=1 SMOKE_URL=http://127.0.0.1:4173/Tetelestai/ node scripts/browser-smoke.cjs`. En un navegador sin restricciones debe comprobar RTP entrante con energía de audio; el parámetro `ALLOW_NO_ICE=1` permite completar los demás pasos solo cuando no hay candidatos locales y deja explícita la limitación en su JSON. No simula éxito de RTP. También se repitió instalación congelada antes de los cuatro checks CLI finales.

## Límite observado de voz y pendientes

El Chromium administrado del entorno contiene en `/etc/chromium/policies/managed/misc.json` `WebRtcIPHandling: "disable_non_proxied_udp"` y `AudioCaptureAllowed: false`. Los permisos de prueba y un dispositivo fake permitieron capturar tracks e intercambiar SDP; no se generaron candidatos host ni RTP. Una prueba aislada de dos `RTCPeerConnection` nativos, sin código del juego ni servidor de señalización, reproduce cero candidatos. Desactivar mDNS como diagnóstico no lo cambia. No se alteró la política administrada. Por tanto, intercambio de audio audible/RTP queda **sin verificar** aquí.

La proximidad de voz es un comportamiento del cliente y del enlace; no es una garantía de confidencialidad frente a un cliente modificado. No hay conectividad universal sin TURN, cuentas, moderación pública, persistencia, despliegue público ni pruebas de hardware móvil físico. Objetivos 30/60 FPS pendientes de dispositivos de referencia. Hosting público/TURN, edición digital de la Biblia y sprints posteriores siguen fuera de esta entrega.

Capturas y logs temporales: `/tmp/tetelestai-sprint1-desktop.png`, `/tmp/tetelestai-sprint1-mobile.png`, `/tmp/tetelestai-sprint1-result.png`, `/tmp/tetelestai-sprint1-landscape.png`, `/tmp/tetelestai-sprint1-smoke.json`, `/tmp/tetelestai-smoke.log`, `/tmp/tetelestai-rtc-diagnostic.log`.
