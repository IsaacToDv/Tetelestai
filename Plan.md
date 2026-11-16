# Tetelestai — Plan

Estado: base técnica conservada; dirección narrativa corregida por el autor. Las decisiones explícitas del autor se distinguen de las propuestas.

## Visión confirmada
Aventura bíblica multijugador low-poly, respetuosa y entretenida. Cada mapa representa un libro de la Biblia. Las referencias a friendslop son visuales y mecánicas; no se busca comedia, caos como finalidad ni caricaturizar el relato. Exploración, misterio, encuentros, retos y descubrimientos sostienen la diversión. La dirección vigente está en `docs/GDD.md`.

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
- V6: sesiones privadas, silencio y bloqueo aprobados para pruebas 13+. Emparejamiento público y su moderación siguen pendientes.
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
- El bibliotecario entrega el índice y las referencias; luego el diseñador prepara propuestas pendientes y el orquestador reúne las decisiones del autor antes de implementar. No se inicia aún la adaptación del primer segmento ni otro sprint.

## Coordinación técnica del orquestador
El orquestador define el problema aprobado y solicita al bibliotecario investigación web específica para cada rol (graphic, physics, designer, artist, technical). Los dossiers de `docs/library/technical/` comparan técnicas compatibles con las versiones instaladas, con fuentes primarias, costos, límites y pruebas propuestas. El especialista revisa la aplicabilidad, el orquestador coordina interfaces y validación; ninguna recomendación técnica autoriza cambios narrativos o mecánicos. Perfiles reutilizables en `.codex/agents/*.toml`; los modelos y MCP disponibles se verifican en cada sesión.
