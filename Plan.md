# Tetelestai — Plan

Estado: el autor autorizó el cierre de Sprint 1 de Edén y su integración en main. Sprint 2 amplía la exploración de «Dios crea» y está esperando validación del autor. Sprint 0 de revisión sigue abierto y se conserva el corte técnico Abram/Lot.

## Visión confirmada
Aventura bíblica multijugador low-poly, respetuosa y entretenida. Cada mapa representa un libro de la Biblia. Las referencias a friendslop son visuales y mecánicas; no se busca comedia, caos como finalidad ni caricaturizar el relato. Exploración, misterio, encuentros, retos y descubrimientos sostienen la diversión. La dirección vigente está en `docs/GDD.md`.

## Revisión de Sprint 0 — decisiones del autor (2026-11-16)
- Iniciar la campaña con «Dios crea» (Gn 1:1–2:25), explorando el Edén una vez creados los personajes. Conservar Abram/Lot para posible reutilización futura; no es la apertura ni una aprobación de roles para este tramo.
- El autor aprobó Edén para la primera mitad de Sprint 1. Dos amigos entran a una sala privada por código y cada uno elige un personaje disponible, Adán o Eva. El tramo ofrece caminata libre con teclado o controles táctiles y salida al menú en cualquier momento. La cámara va detrás del personaje y gira manualmente con ratón o arrastre táctil. El jardín provisional usa suelo, hierba y árboles low-poly. Los personajes son figuras humanas vestidas y estilizadas, sin representar una escena bíblica (Gn 2:7–25).
- Trabajar mediante entregas jugables pequeñas que combinan disciplinas; el autor valida cada entrega antes de avanzar. La secuencia concreta de nuevos sprints sigue por definir y aprobar; no se cierra Sprint 1.
- Cámara inicial en tercera persona. Primera persona no forma parte del alcance inicial confirmado.
- Experiencia deseada: menú de entrada y selección de personajes; sorteo entre amigos, elección manual y emparejamiento con desconocidos. Esta intención confirma las modalidades, no sus reglas de asignación, disponibilidad de roles, privacidad, acceso o moderación; V4/V6 para servicio público siguen pendientes.
- Sensación buscada: libertad de mundo abierto y descubrimiento inicial, seguida de guía progresiva mediante tareas, oficios y exploración que acerquen a los amigos a encuentros y retos. Supervivencia y reconducción al canon forman parte de la visión expresada, pero cada regla, peligro, consecuencia y transición requiere decisión específica del autor.
- El autor es responsable de TODOS los parámetros de guion, narrativa y juego; siempre se le consulta antes de fijarlos o cambiarlos. El game_designer formaliza técnicamente lo aprobado, evalúa viabilidad y accesibilidad y prepara preguntas; no decide contenido ni reglas por el autor.

### Ideas ilustrativas del autor — PENDIENTE_VALIDACION
- Adán en peligro de ahogarse y rescatado por un pez u otro animal: ejemplo imaginado, no hecho bíblico ni mecánica aprobada. Contexto del personaje: Gn 2:7–25; el rescate inventado no tiene referencia canónica aportada.
- Eva rechaza el fruto, la serpiente se retira y aparece un fragmento «Puerta de salida» relacionado por el autor con 1 Co 10:13: ejemplo imaginado, no evento ni conexión teológica aprobados. Contexto del fruto/serpiente: Gn 3:1–7, posterior al tramo «Dios crea». No incorporar ese episodio al primer tramo por inferencia.
- Evitar que un personaje muera fuera de su cronología canónica y conducirlo al «propósito de Dios»: orientación ilustrativa del autor; faltan reglas concretas de peligro, protección y consecuencias. No inferir invulnerabilidad, rescate automático ni una interpretación teológica universal.

### Decisiones necesarias antes de implementar la campaña
Personajes controlables y cantidad de participantes del primer tramo; inicio y cierre de la partida; primera tarea/oficio y guía; peligros y consecuencias; encuentro y reto; fragmentos y validación de referencias; reglas de las tres modalidades de selección/emparejamiento; seguridad y servicio para desconocidos; arte y dispositivos de rendimiento. El autor decide; las alternativas permanecen PENDIENTE_VALIDACION. El stack y otras decisiones anteriores se conservan como antecedentes vigentes salvo corrección expresa, sin atribuirles una revalidación global en esta ronda.

### Segunda mitad de Sprint 1

- **Aprobado.** Adán y Eva registran su visita a un punto de observación del jardín al acercarse y pulsar E o «Confirmar». La indicación inicial y una señal en el lugar orientan la actividad. Con dos aportes se muestra «Tarea completada» a ambos; los jugadores pueden seguir explorando o volver al menú. Los aportes se conservan mientras la sala siga ocupada. La visita es una adaptación jugable en el contexto de Gn 2:7–25.
- **Aprobado.** Voz y chat por proximidad en salas privadas según el prototipo local: radio de 12 unidades, micrófono apagado al entrar y optativo, silencio y bloqueo. El autor pidió mejorar su uso. Se priorizan controles y estados claros, limpieza en las transiciones de sala y verificación bidireccional de audio. Siguen pendientes los proveedores públicos y TURN.
- **Aprobado.** Una sola tarea de riego de dos brotes (Gn 2:15). Cualquiera puede regar uno o ambos. El jardín permanece abierto al completar las actividades.
- **Aprobado.** Dos asnos jóvenes provisionales. Cualquiera puede alimentar cada asno tres veces para que crezca. Un jugador puede montar un asno adulto libre y desmontar con el mismo botón. La monta usa los controles, la velocidad y los límites de caminar. Asnos, alimentación y monta son adaptaciones jugables.
- **Aprobado.** Cualquiera de los dos personajes puede comer un fruto genérico al acercarse al árbol. La fruta reaparece tras 30 segundos y se muestra una confirmación breve. Contexto: Gn 2:9, 16–17.
- **Aprobado.** Solo Adán puede dar y editar nombres (Gn 2:19–20). Los nombres se guardan por jardín en el servidor y el creador puede reabrirlo con su clave privada incluso tras reiniciar el servidor. La clave privada y el código de invitación tienen propósitos distintos.

Comprobación de lo aprobado: dos sesiones entran por código, completan una visita por personaje con teclado y toque y observan el mismo estado. Con una sesión todavía en sala, volver conserva el aporte. Tras completar, se puede caminar y regresar al menú. Probar entrega de chat y audio WebRTC simulado en ambos sentidos, salida del alcance, silencio, bloqueo y salida de sala. Usar consola y capturas de escritorio y móvil emulado.

### Sprint 2 — Alcance de campaña aprobado

El autor eligió ampliar el Edén dentro de «Dios crea». Quiere pasear junto al río y sus cuatro ramales según Gn 2:10–14, ver y oír el agua y los peces, nadar, beber y bañarse mediante interacción libre y física Jolt integrada con PlayCanvas. Eligió dos ovejas, un león y una jirafa como adaptaciones jugables (contexto de animales en Gn 2:19–20). Aprobó el arte provisional low-poly con primitivas, paleta actual, agua azul verdosa y rocas, y pidió agua de apariencia realista. Aprobó el agua continua por ramal y los sonidos de interacción con agua y animales en 3D mediante Howler.js, con opción de silenciar efectos.

Reglas aprobadas por el autor:

- El río que riega el jardín se divide en Pisón, Gihón, Hiddekel y Éufrates (Gn 2:10–14). Los senderos siguen los cauces. La forma y ubicación locales son adaptaciones jugables.
- Adán y Eva pueden entrar y salir por las orillas. Nadan libremente en superficie con los controles actuales. El asno montado se frena y baja la cabeza al llegar a la orilla. Tras soltar y volver a pulsar avance, entra y nada con su jinete.
- Beber es una acción de orilla con E o botón. Entrar al agua y nadar permite bañarse libremente. Las acciones tienen respuesta visual y sonora y carecen de medidores o efectos duraderos.
- Dos ovejas pastan y se dejan acariciar. El león permanece en reposo y al llamarlo levanta la cabeza. La jirafa ramonea y al darle hojas baja el hocico. Ambos personajes pueden repetir estas acciones con E o botón y recibir una respuesta breve visual y sonora. No consumen inventario.
- Tres peces visibles por ramal nadan en el cauce. Ambos personajes pueden darles alimento desde la orilla. Los tres nadan hacia el punto por unos segundos y producen salpicaduras. Se puede repetir sin inventario.
- Agua continua por ramal y sonidos espaciales de interacción con el agua y los animales. Un control permite silenciar los efectos. La sala privada para dos jugadores y las actividades de Sprint 1 son la base de la ampliación.

Implementación técnica:

- Agua: material GLSL compartido de PlayCanvas 2.24.1 (`ShaderMaterial`) sobre malla indexada. UV longitudinal para la corriente y transversal para orillas y profundidad aparente. Usar reflexión aproximada de cielo, Fresnel, brillo solar y la niebla del jardín en una sola pasada WebGL2. El módulo gráfico recibirá el trazado autorizado posteriormente y se limitará al render. Verificar compilación, movimiento y lectura de agua junto a la orilla en dos tamaños de pantalla.
- Audio: Howler.js 2.2.4 (MIT), versión fijada en npm. Usar el build con `spatial`, Web Audio y el marco de cámara de la escena para la orientación. Los efectos de juego se gestionarán aparte de las pistas WebRTC de voz. Verificar activación por gesto, atenuación, orientación y liberación al volver al menú.
- Física: JoltPhysics.js 1.1.1 monohilo en el servidor Node, con cuerpos dinámicos y flotación en superficie. PlayCanvas renderiza posiciones de la sala. Una geometría compartida de cauces define terreno, superficie y consultas en servidor y cliente. Verificar orillas, flotación, pausa de asno, desmonte, caducidad de entrada y liberación al salir.

## Decisiones del autor
- Web móvil y escritorio; objetivo de producto: 4–8 jugadores, público 13+.
- PlayCanvas Engine + Vite con JavaScript; no proyecto del Editor ni TypeScript como lenguaje del proyecto.
- Versión bíblica RVR1909. Verificar fuente digital y condiciones de uso antes de copiar texto.
- Cliente estático previsto en GitHub Pages. Node/ws y WebRTC local autorizados e implementados; hosting público, TURN y gastos pendientes.
- Tono respetuoso y entretenido. Dios se representa conforme al pasaje; si la Escritura no precisa su apariencia, mediante luz resplandeciente potente (criterio confirmado). La representación de Jesús y los dispositivos de medición siguen pendientes. Objetivos provisionales aprobados: 30 FPS móvil y 60 escritorio; aún sin mediciones.

## Arquitectura técnica vigente
Cliente PlayCanvas con módulos ES y Vite, entrada adaptada a teclado y pantalla táctil. JavaScript se comprueba mediante JSDoc y checkJs; ESLint, TypeScript como verificador y ws fueron aprobados. Pages entrega únicamente archivos estáticos.

La lógica de roles ocultos y estado de partida requiere autoridad del servidor: el cliente solo recibirá la información que le corresponda. El transporte local usa ws y la voz WebRTC del navegador; proveedor público, TURN y persistencia siguen pendientes. No exponer asignaciones secretas de otros jugadores. El servidor de juego y la infraestructura de voz no pueden alojarse como procesos en Pages.

Alternativas revisadas con el autor: Engine + Vite frente al Editor, y JavaScript frente a TypeScript. El autor seleccionó Engine + Vite y JavaScript. Respetar esta elección sin instalar dependencias durante Sprint 0.

## Ruta histórica del prototipo — sustituida como inicio narrativo
Sprint 1: corte vertical de Génesis siguiendo la ruta sugerida del GDD: movimiento, encuentros entre Abraham y Lot, un fragmento y un reto 1 vs 1, con voz/chat de proximidad. Es una propuesta de validación técnica y narrativa; dos roles no satisfacen todavía el objetivo final de 4–8 jugadores. No duplicar roles ni añadir otros sin definir cómo encajan. El alcance multijugador/voz queda condicionado a elegir servidor y servicio; no sustituirlo por una demo local y declararlo cumplido.

Sprints posteriores se definirán con los resultados del corte vertical: ampliar a 4–8 participantes, capítulos, progresión y cinemática. No hay fechas ni alcance cerrado para ellos.

## Riesgos y decisiones pendientes
- V1: hechos canónicos, diálogos, fragmento AT→NT y reto; todo candidato queda PENDIENTE_VALIDACION con referencias exactas.
- V2: representación de Jesús y revisión de condiciones de la fuente RVR1909; Dios según el criterio confirmado. El tono ya está confirmado.
- V3: dos roles fueron aprobados solo para el corte técnico; la campaña sigue los segmentos de Génesis y requiere consulta de cada adaptación.
- V4: proveedor de servidor/voz, costos y dependencias concretas.
- V5: personajes, paleta y assets. Low-poly es orientación, no aprobación de arte concreto.
- V6: sesiones privadas, silencio y bloqueo aprobados para pruebas 13+. El autor desea también emparejamiento con desconocidos; reglas de acceso, moderación y habilitación pública pendientes.
- Rendimiento: 30 FPS móvil/60 escritorio son metas provisionales aprobadas; dispositivos, mediciones y presupuesto gráfico pendientes.

## Validación
Sprint 0 produce documentación y fuentes, no una aplicación ejecutable. Sprint 1 deberá definir comandos reales y criterios medibles antes de implementar: compilación, lint, comprobación de tipos compatible con JavaScript, pruebas pertinentes y humo en navegador móvil/escritorio con consola limpia y captura. No afirmar pruebas realizadas mientras no exista código.

## Revisión de Sprint 0
Aprendido: el repositorio inicial interpretaba la inspiración como intención cómica; el autor aclaró y autorizó corregirla. Se conservan las mecánicas del GDD, sujetas a las validaciones anteriores. Sprint 0 cerrado tras el OK explícito del autor; las validaciones de contenido y servicios pasan como requisitos previos a sus tareas de Sprint 1.


## Sprint 1 — decisiones de infraestructura autorizadas (registro)
- Herramientas: ESLint para lint; TypeScript únicamente como verificador `checkJs`/`noEmit` de JavaScript con JSDoc; Playwright para humo de navegador. Sin migración del lenguaje a TypeScript. Motor y Vite ya autorizados por la elección del stack.
- Red propuesta: servicio Node con `ws`, autoridad sobre roles, posición validada y estado del reto. Salas privadas por código para las primeras pruebas; no emparejamiento público. Cada conexión recibe solo su rol y datos visibles, nunca el mapa completo de asignaciones.
- Voz propuesta: WebRTC del navegador, señalización por el servidor; proximidad calculada con posiciones autorizadas. Micrófono optativo y silenciado inicialmente, controles de silencio/bloqueo y texto alternativo. Usar un proveedor TURN requiere decisión de costos/credenciales; no prometer que STUN solo permita todos los tipos de red. Atenuar volumen en el cliente no ofrece privacidad frente a un cliente modificado; no vender la proximidad como confidencialidad.
- Hosting: Pages permanece como cliente; para las primeras pruebas, servidor dentro del entorno de desarrollo. El proveedor público de Node y TURN sigue pendiente. No abrir servicio público ni crear cuentas/consumo sin autorización.
- Alternativa: voz gestionada (p. ej. LiveKit) reduce implementación de medios, introduce SDK y servicio adicionales. Recomendada solo si se aprueban proveedor y presupuesto.
- La demo local puede validar contratos de red, pero no valida latencia real, TURN, 4–8 usuarios ni comportamiento en móviles físicos. El cierre del sprint exige pruebas del recorrido completo y las decisiones pendientes.

## Aprobaciones de ejecución — Sprint 1
Autor aprobó íntegramente docs/design/genesis-vertical-slice.md: dos jugadores, fragmento y reto, sin copiar versículos; producto final 4–8. V4: ESLint, TypeScript como verificador de JS/JSDoc y ws para servidor Node local. V4/V6: salas privadas por código, voz WebRTC de prueba inicialmente apagada y optativa, silencio/bloqueo y texto alternativo. V5: primitivas arena/ocre y objetivos provisionales 30 FPS móvil/60 escritorio pendientes de medición física. Estas decisiones reemplazan las correspondientes propuestas pendientes anteriores. Hosting público/TURN y edición digital de la Biblia no aprobados/verificados.

## Resultado de implementación Sprint 1
Corte local de dos participantes implementado; ver Sprints.md y docs/evidence/sprint-1/. Prueba local reportada por el autor como satisfactoria, incluido audio; falta pulir lógica y no hay métricas físicas de FPS. La nube conserva su limitación de comprobación RTP. La entrega se conserva en rama sprint-1/genesis-vertical-slice y copia descargable; pausar después de subirla por petición del autor. No se inicia Sprint 2.


## Dirección vigente — corrección del autor tras prueba local
- El autor informa que audio y ejecución local funcionan bien; señala que falta pulir la lógica. Es validación cualitativa reportada, no medición de FPS ni cierre automático del sprint.
- La campaña NO empieza con Abraham: seguirá los segmentos de Génesis en orden según indubiblia.org, verificados por el bibliotecario en `docs/library/Segmentos/Genesis.md`: 18 segmentos; primero «Dios crea» (Gn 1:1–2:25). El corte Abram/Lot se conserva como prueba técnica, no como apertura de la historia.
- Consultar SIEMPRE al autor antes de definir o cambiar narrativa, historia o mecánicas, incluido cómo se convierte un segmento en experiencia jugable. La secuencia de la fuente no aprueba roles, objetivos, escenas, retos ni recompensas. Ningún detalle nuevo queda autorizado por el prototipo anterior.
- El índice y las referencias preceden la validación del alcance. Las dos mitades de «Dios crea» se rigen por las decisiones del autor registradas en este Plan.

## Coordinación técnica del orquestador
El orquestador define el problema aprobado y solicita al bibliotecario investigación web específica para cada rol (graphic, physics, designer, artist, technical). Los dossiers de `docs/library/technical/` comparan técnicas compatibles con las versiones instaladas, con fuentes primarias, costos, límites y pruebas propuestas. El especialista revisa la aplicabilidad, el orquestador coordina interfaces y validación; ninguna recomendación técnica autoriza cambios narrativos o mecánicos. Perfiles reutilizables en `.codex/agents/*.toml`; los modelos y MCP disponibles se verifican en cada sesión.
