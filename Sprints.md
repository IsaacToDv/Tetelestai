# Tetelestai — Sprints

## Sprint 0 — Revisión para la campaña «Dios crea» (2026-11-16)
Estado: en curso

Objetivo: aclarar con el autor la base del prototipo de campaña y su flujo de entregas, conservando el Sprint 0 histórico y el corte Abram/Lot para posible reutilización.

| id | dueño | criterio de aceptación | estado |
|---|---|---|---|
| S0R-01 | orquestador + autor | Inicio en Edén tras la creación de los personajes, tercera persona y entregas jugables pequeñas confirmados | hecho |
| S0R-02 | orquestador | Autoridad exclusiva del autor sobre guion, narrativa y parámetros de juego explícita en AGENTS y rol técnico del diseñador | hecho |
| S0R-03 | autor + diseñador | Concretar personajes, participantes, guía, supervivencia, encuentro/reto y cierre; diseñador formaliza lo aprobado | pendiente de decisiones del autor |
| S0R-04 | autor + técnico | Especificar sorteo entre amigos, elección manual y emparejamiento con desconocidos, con V4/V6 antes de habilitar servicio público | modalidades confirmadas; reglas y seguridad pendientes |
| S0R-05 | bibliotecario + especialistas | Reutilizar índice de segmentos y preparar dossiers técnicos según el alcance concreto aprobado | índice disponible; dossiers específicos pendientes |
| S0R-06 | orquestador | Sincronizar contexto documental con el repositorio original y revisar Markdown redundantes sin borrar material único | revisión hecha; entrega por PR, integración pendiente |
| S0R-07 | autor | Validar especificación y ruta concreta V1–V6 según alcance; dar OK al cierre de esta revisión | pendiente |

Validaciones pendientes: adaptación jugable del primer segmento, parámetros concretos y nueva ruta; proveedores/moderación pública, arte y condiciones de la fuente bíblica. Las ideas de rescate y «Puerta de salida» son PENDIENTE_VALIDACION, registradas en Plan.md. No se inicia implementación de campaña en esta actualización documental.

Resultado y lecciones: el autor eligió entregas jugables pequeñas con disciplinas combinadas y validación antes de avanzar; sus ejemplos no autorizan reglas. Aprobó la primera mitad de Sprint 1 en Edén y decidirá si se continúa después de probarla. El Sprint 0 anterior permanece cerrado y el corte histórico de Abram/Lot conserva su estado de aceptación pendiente.

Revisión documental: no se eliminaron Markdown porque conservan instrucciones, fuentes, decisiones o evidencia distintas. Se corrigió la afirmación obsoleta de despliegue automático en SETUP.md. Se sincronizan también los perfiles y fuentes locales de la corrección anterior para que la revisión remota conserve su contexto; no se modifica código del juego ni se fusiona o despliega.

---

## Sprint 0 — Dirección y base documental
Estado: cerrado

Objetivo: consolidar decisiones del autor, corregir el tono, investigar las fuentes iniciales y presentar una ruta revisable antes de implementar.

| id | dueño | criterio de aceptación | estado |
|---|---|---|---|
| S0-01 | orquestador | Leer AGENTS, Plan, Sprints y GDD desde la actualización de main | hecho |
| S0-02 | orquestador | Registrar respuestas de la ronda única y corregir enfoque cómico en README, AGENTS y GDD | hecho |
| S0-03 | bibliotecario | Índice mínimo de Génesis y documentación/versión PlayCanvas verificadas; registrar estado de fuente RVR1909 | hecho; licencia RVR1909 pendiente |
| S0-04 | orquestador | Plan y ruta de sprints preparados con propuestas y decisiones diferenciadas | hecho |
| S0-05 | autor | Revisar Plan/Sprints y dar OK explícito V3 | hecho |

V3 aprobado por el autor. Validaciones pendientes para Sprint 1: V1/V2 para contenido concreto y representación; V4 para servicios/dependencias; V5 para arte; V6 para interacción con desconocidos. Se registran pendientes sin repetir la ronda inicial de preguntas.

Resultado y lecciones: el autor confirmó RVR1909, web móvil/escritorio, 4–8 jugadores, 13+, Engine + Vite con JavaScript y Pages para el cliente. El juego busca diversión con respeto, sin enfoque de comedia. Consultar el remoto antes de concluir que faltan archivos recién subidos.

## Sprint 1 — «Dios crea», primera mitad
Estado: cerrado

Objetivo: probar una primera exploración de Edén tras la creación de los personajes (Gn 2:7–25, dentro de Gn 1:1–2:25), en una sala privada para dos amigos.

| id | dueño | criterio de aceptación | estado |
|---|---|---|---|
| S1E-01 | técnico | Crear y unirse por código; dos plazas; elección excluyente de Adán/Eva validada por servidor; salir al menú libera el personaje | implementado y verificado |
| S1E-02 | gráfico + orquestador | Jardín low-poly con figuras provisionales vestidas; caminata libre con teclado/táctil; cámara tercera persona detrás del personaje con giro manual por ratón/arrastre táctil | implementado y verificado en escritorio y móvil emulado |
| S1E-03 | orquestador | Lint, comprobación de tipos, pruebas, build y humo de dos sesiones sin errores de consola con captura | verificado |

Validaciones pendientes: aceptación de la entrega por el autor. El autor ya pidió avanzar con la segunda mitad. Rendimiento físico pendiente de dispositivos de referencia.

Resultado y lecciones: Edén abre en la raíz del cliente y el prototipo Abram/Lot queda en `prototype.html`. Pasaron lint, checkJs, 21 pruebas y el build bajo `/Tetelestai/`. El humo de producción en Chrome verificó entrada, selección, marcha sincronizada, giro con ratón y toque, salida y reelección con cero errores de consola. El build conserva el aviso de tamaño del motor. [Informe](docs/evidence/eden/tetelestai-eden-smoke.json) · [Escritorio](docs/evidence/eden/tetelestai-eden-desktop.png) · [Móvil emulado](docs/evidence/eden/tetelestai-eden-mobile.png)

## Sprint 1 — «Dios crea», segunda mitad
Estado: cerrado

Objetivo: ampliar la exploración de Edén con las actividades solicitadas y comunicación privada durante el recorrido.

| id | dueño | criterio de aceptación | estado |
|---|---|---|---|
| S1E-04 | técnico + gráfico + orquestador | Visita cooperativa guiada, estado compartido y aportes conservados mientras exista la sala | implementado y verificado |
| S1E-05 | técnico + orquestador | Chat y voz por proximidad, micrófono optativo, silencio, bloqueo y limpieza | verificado en localhost con audio simulado en ambas direcciones |
| S1E-06 | técnico + gráfico + orquestador | Dos brotes regables por cualquiera; tres alimentaciones por asno; monta/desmonta a velocidad de marcha; fruto que reaparece tras 30 s; nombres editables por Adán con recuperación tras reinicio | implementado y verificado |
| S1E-07 | orquestador | Integrar las reglas aprobadas y verificar build, lint, pruebas, dos sesiones de navegador y capturas | verificado |

Validaciones pendientes: rendimiento en dispositivos físicos y proveedores públicos. El autor autorizó el cierre y la integración en main.

Resultado y lecciones: lint, checkJs, build para `/Tetelestai/` y 30 pruebas pasaron. El recorrido de ambas mitades pasó en dos sesiones de Chrome con Playwright, sin errores de consola. La prueba de servidor verificó el nombre editado desde una instancia nueva y el reloj controlado comprobó la reposición del fruto exactamente a los 30 s. Los nombres persisten en el directorio del servidor y las actividades viven en la sala activa. El build conserva el aviso de tamaño del motor. [Informe](docs/evidence/eden-garden/tetelestai-eden-garden-smoke.json) · [Escritorio](docs/evidence/eden-garden/tetelestai-eden-garden-desktop.png) · [Móvil emulado](docs/evidence/eden-garden/tetelestai-eden-garden-mobile.png)

## Sprint 1 — Corte vertical de Génesis (propuesta)
Estado: esperando validación

Objetivo: demostrar el recorrido de encuentro, fragmento y reto en un escenario de Génesis según la ruta sugerida del GDD. Inicio condicionado a V3 y a resolver los bloqueos de infraestructura y contenido.

| id | dueño | criterio de aceptación | estado |
|---|---|---|---|
| S1-01 | diseñador + autor | Especificar recorrido Abraham/Lot, canon, fragmento y reto con referencias y OK V1/V2; definir relación entre dos roles del corte y 4–8 jugadores finales | aprobado e implementado |
| S1-02 | técnico + autor | Elegir servidor y voz, aprobar dependencias/costos V4 y definir controles de acceso/comunicación V6 | base local aprobada; público/TURN pendientes |
| S1-03 | técnico | Preparar Engine + Vite JS y comandos de build/lint/check/test; configurar base de Pages | implementado y verificado |
| S1-04 | físico + gráfico | Movimiento teclado/táctil y escenario low-poly revisable; objetivo de rendimiento y arte aprobados | implementado; FPS físico pendiente |
| S1-05 | técnico | Sincronización autoritativa, roles ocultos y voz/chat por proximidad según servicios aprobados | implementado; RTP bidireccional verificado localmente con audio simulado |
| S1-06 | diseñador + programadores | Integrar un fragmento y un reto 1 vs 1 aprobados en el recorrido | implementado y humo correcto |
| S1-07 | orquestador | Build, lint, comprobaciones y pruebas pertinentes pasan; humo móvil/escritorio, consola limpia y evidencia visual; autor valida cierre | comprobaciones locales correctas; esperando aceptación |

Validaciones pendientes: V1–V6 según tareas; meta de rendimiento/dispositivos. No instalar dependencias ni implementar hasta aprobar el alcance. No desplegar ni publicar sin autorización.

Resultado y lecciones: iniciado por autorización del autor. Los sprints posteriores se definirán después de evaluar este corte.


### Ejecución inicial — S1-03
Objetivo: base web JavaScript reproducible con Engine + Vite, sin presentar el corte multijugador como completado.
- [x] Crear `game/package.json` y lockfile con PlayCanvas/Vite, `game/index.html`, `game/src/main.js`, `game/src/core/create-app.js` y `game/vite.config.js` (base desde VITE_BASE).
- [x] `createApp(canvas)` inicializa el motor y devuelve una instancia con `destroy()`; la entrada libera listeners y recursos, soporta resize y comunica un fallo WebGL sin dejar una pantalla vacía.
- [x] Añadir `game/.gitignore` para dependencias y salida; documentar comandos reales en `game/AGENTS.md`.
- [x] Verificar instalación congelada, build con base de Pages y respuesta del servidor. Humo en navegador si disponible; registrar resultados y limitaciones reales.
- [x] Proponer herramientas concretas de lint/check y dependencias de red/voz para V4 antes de instalarlas. El código seguirá siendo JavaScript.
Revisión: canvas ausente, falta de WebGL, resize móvil, desmontaje, rutas de assets bajo subdirectorio. Los criterios de red, voz y contenido siguen en S1-01/02/05/06; esta base no los sustituye.


Avance verificable S1-03: instalación congelada, build raíz y base `/Tetelestai/` correctos; humo Chromium con Playwright ya disponible, escritorio 1280×720 y viewport móvil 390×844, resize y mensaje de pérdida de contexto. Capturas en `/tmp/tetelestai-foundation-desktop.png` y `/tmp/tetelestai-foundation-mobile.png` (artefactos temporales). Sin errores de consola en el humo normal. No demuestra dispositivo móvil físico ni FPS. Aviso de tamaño: motor ~2.09 MB / gzip ~535 KB. No hay todavía lint, comprobación de tipos ni suite de juego; no se declara completado S1-03 ni Sprint 1. Ronda única V1–V6 enviada con propuestas; respuestas pendientes. Rama de trabajo: `sprint-1/foundation`; sin publicación.


### Ejecución del corte aprobado — contrato de trabajo
- [ ] Servidor Node/ws local: salas privadas de dos, roles individuales secretos, movimiento validado con límites, proximidad y fragmento compartido, reto autoritativo de 45 s con empate 250 ms, cancelación ante desconexión y envíos idempotentes. Tests nativos de protocolo y estado (sin exponer respuestas/roles rivales).
- [ ] Cliente PlayCanvas arena/ocre: teclado y controles táctiles, cámara legible, HUD de conexión/rol/fragmento/reto, escenas y listeners con destrucción; textos españoles y referencias sin copiar versículos.
- [ ] Chat por proximidad y silencio/bloqueo. WebRTC optativo inicialmente apagado, señalización validada, limpieza de tracks/conexiones, gestión de permisos; sin promesa de conectividad fuera de la prueba local sin TURN.
- [ ] ESLint y checkJs sin cambiar lenguaje; tests reales, build Pages con base configurable y URL de servidor configurable sin claves.
- [ ] Integración con dos sesiones de navegador: crear/unir, roles privados, desplazarse, fragmento, reto, resultado, chat, bloqueo, desconexión y voz con dispositivo de audio simulado. Revisar consola y capturas, no inferir rendimiento móvil físico.
- [ ] Revisión independiente, corregir hallazgos y documentar comandos y límites. Cierre de sprint requiere OK del autor tras evidencia.
Ronda V1–V6 respondida afirmativamente por el autor para esta base de prueba. No repetir solicitudes ya aprobadas. No push, despliegue ni publicación en esta tarea.


### Entrega local de Sprint 1
Implementado el recorrido de dos participantes: salas por código, roles privados, movimiento teclado/táctil, fragmento compartido, reto autoritativo, recompensa simbólica, chat por proximidad, silencio/bloqueo y voz WebRTC optativa. Dos hallazgos de ciclo de sesión corregidos con regresiones: opt-in de voz tras salida del compañero y conclusión/reentrada tras salida.

Evidencia: `docs/evidence/sprint-1/` contiene capturas escritorio/móvil/resultado y el informe de humo de producción. Lint y checkJs limpios, 17 pruebas automáticas, build para Pages y humo de dos sesiones correcto (crear/unir, fragmento, orden erróneo, resultado, repetir, desconexión, reentrada, timeout 45 s, concluir y salir). La señalización de voz se comprobó; **audio recibido/RTP no verificado** por política administrada Chromium sin UDP directo y cero candidatos, reproducido sin el producto. Las pruebas de voz simuladas verifican colas ICE, atenuación, bloqueo, permisos y limpieza, sin sustituir audio real.

Pendientes de aceptación: prueba de audio en navegador local sin política restrictiva, rendimiento en móviles/escritorios físicos de referencia y OK del autor para cierre. Hosting público/TURN quedan fuera del alcance autorizado. Se entrega para prueba local; no declarar cerrado ni rendimiento alcanzado. El autor pidió subir la entrega a rama remota y pausar después, sin comenzar Sprint 2.


### Revisión del autor después de prueba local
El autor reporta que funciona bien en local, incluido el audio, y pide pulir la lógica. No aporta FPS/dispositivos concretos; conservar esa distinción respecto de las limitaciones de nube. Sprint 1 continúa esperando aceptación del conjunto, no se declara cerrado.

Verificación local del 2026-11-16 con Chrome 157, escritorio y viewport táctil emulado: recorrido completo en dos sesiones, cero errores de consola y RTP con energía de audio simulada en ambos sentidos. El humo comprueba el resultado en ambos clientes con un solo acierto. La ventana de empate de 250 ms se verifica con reloj controlado en las pruebas de sala. [Informe local](docs/evidence/sprint-1/tetelestai-sprint1-local-smoke.json).

Corrección vigente: Abram/Lot queda como prototipo técnico histórico, no comienzo de campaña. Seguir segmentos de Génesis en orden según indubiblia verificados por bibliotecario. Narrativa, historia y mecánicas requieren consulta al autor ANTES de diseño definitivo/implementación; no convertir la corrección de ruta en aprobación de nuevas escenas o reglas.

Encargo anterior: refactorizar instrucciones de orquestador y perfiles de agentes, añadir artist y establecer investigación técnica del bibliotecario para cada rol. No se modificó el juego ni comenzó Sprint 2. El encargo vigente está en la revisión de Sprint 0 al inicio de este archivo.

Refactorización de coordinación realizada: seis perfiles en `.codex/agents/`, incluyendo artist; orquestador con apartado técnico y bibliotecario con biblioteca técnica por tarea. Índice verificado de 18 segmentos guardado en `docs/library/Segmentos/Genesis.md` (primero Dios crea, Gn 1:1–2:25). No se implementó narrativa ni mecánica nueva. Próximo diseño del primer segmento requiere consulta previa al autor.
