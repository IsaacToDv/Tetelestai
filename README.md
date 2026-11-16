# Tetelestai

Aventura bíblica multijugador low-poly, respetuosa y entretenida, donde cada mapa es un libro de la Biblia. El nombre viene del griego *tetelestai*, «consumado es» (Juan 19:30).

- Diseño: `docs/GDD.md`
- Cómo trabaja el enjambre de Codex: `AGENTS.md`
- Puesta en marcha (local o solo con GitHub): `SETUP.md`
- Estado y decisiones: `Plan.md` y `Sprints.md`; Sprint 0 de revisión en curso para la campaña «Dios crea».

Las referencias a otros juegos orientan sus mecánicas y apariencia. La diversión proviene de explorar, descubrir y superar retos juntos; no se busca un juego de risa. Objetivo: web móvil y escritorio, 4–8 jugadores, público de 13 años en adelante.

## Desarrollo del corte técnico histórico de Génesis

El código actual corresponde a Abram/Lot y se conserva para posible reutilización. La campaña comenzará en el Edén, en tercera persona; sus parámetros de guion, narrativa y juego los decide siempre el autor. El diseñador realiza la especificación técnica de lo aprobado. La nueva campaña aún no está implementada.

Requiere Node.js 22.18 o posterior. Desde `game/`, instala con `npm ci`. Ejecuta `npm run server` en una terminal y `npm run dev` en otra. Usa dos sesiones de navegador para crear una sala privada y compartir su código. El prototipo tiene exactamente dos participantes; el objetivo del producto sigue siendo 4–8.

La voz es optativa, comienza apagada y necesita permiso del micrófono. Las pruebas locales de WebRTC no garantizan conectividad entre redes distintas; hosting público y TURN siguen pendientes. Para acceder al micrófono fuera de localhost se necesita HTTPS.

Validación del desarrollo: `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` dentro de `game/`. `typecheck` revisa JavaScript con JSDoc; el proyecto no cambia de lenguaje.

Para generar los archivos del cliente para Pages: `VITE_BASE=/Tetelestai/ npm run build`. `VITE_SERVER_URL` configura la dirección WebSocket del servidor; una web HTTPS necesitará `wss://`. Pages sirve el cliente, no ejecuta el servidor Node. Generar el build no publica el juego.

El recorrido y sus referencias aprobadas están en `docs/design/genesis-vertical-slice.md`. El prototipo utiliza resúmenes originales y referencias; no incluye texto de versículos RVR1909 mientras se verifica la edición digital.
