# Tetelestai — Plan

Estado: base aprobada por el autor (V3); Sprint 1 autorizado. Las decisiones explícitas del autor se distinguen de las propuestas.

## Visión confirmada
Aventura bíblica multijugador low-poly, respetuosa y entretenida. Cada mapa representa un libro de la Biblia. Las referencias a friendslop son visuales y mecánicas; no se busca comedia, caos como finalidad ni caricaturizar el relato. Exploración, misterio, encuentros, retos y descubrimientos sostienen la diversión. La dirección vigente está en `docs/GDD.md`.

## Decisiones del autor
- Web móvil y escritorio; objetivo de producto: 4–8 jugadores, público 13+.
- PlayCanvas Engine + Vite con JavaScript; no proyecto del Editor ni TypeScript como lenguaje del proyecto.
- Versión bíblica RVR1909. Verificar fuente digital y condiciones de uso antes de copiar texto.
- Cliente estático en GitHub Pages. Servidor multijugador y servicio de voz pendientes; no se ha autorizado gasto.
- Tono respetuoso y entretenido. Dios se representa conforme al pasaje; si la Escritura no precisa su apariencia, mediante luz resplandeciente potente (criterio confirmado). La representación de Jesús y la meta de rendimiento siguen pendientes.

## Arquitectura aprobada en V3 — servicios/dependencias pendientes V4
Cliente PlayCanvas con módulos ES y Vite, entrada adaptada a teclado y pantalla táctil. JavaScript puede comprobarse mediante JSDoc y checkJs, pendiente de definir herramientas en Sprint 1. Pages entrega únicamente archivos estáticos.

La lógica de roles ocultos y estado de partida requiere autoridad del servidor: el cliente solo recibirá la información que le corresponda. El transporte, proveedor, persistencia y voz no están elegidos. No exponer asignaciones secretas de otros jugadores. El servidor de juego y la infraestructura de voz no pueden alojarse como procesos en Pages.

Alternativas revisadas con el autor: Engine + Vite frente al Editor, y JavaScript frente a TypeScript. El autor seleccionó Engine + Vite y JavaScript. Respetar esta elección sin instalar dependencias durante Sprint 0.

## Ruta aprobada — V3
Sprint 1: corte vertical de Génesis siguiendo la ruta sugerida del GDD: movimiento, encuentros entre Abraham y Lot, un fragmento y un reto 1 vs 1, con voz/chat de proximidad. Es una propuesta de validación técnica y narrativa; dos roles no satisfacen todavía el objetivo final de 4–8 jugadores. No duplicar roles ni añadir otros sin definir cómo encajan. El alcance multijugador/voz queda condicionado a elegir servidor y servicio; no sustituirlo por una demo local y declararlo cumplido.

Sprints posteriores se definirán con los resultados del corte vertical: ampliar a 4–8 participantes, capítulos, progresión y cinemática. No hay fechas ni alcance cerrado para ellos.

## Riesgos y decisiones pendientes
- V1: hechos canónicos, diálogos, fragmento AT→NT y reto; todo candidato queda PENDIENTE_VALIDACION con referencias exactas.
- V2: representación de Jesús y revisión de condiciones de la fuente RVR1909; Dios según el criterio confirmado. El tono ya está confirmado.
- V3: Plan y Sprints aprobados. Concretar el corte de dos roles frente al objetivo de producto de 4–8 jugadores.
- V4: proveedor de servidor/voz, costos y dependencias concretas.
- V5: personajes, paleta y assets. Low-poly es orientación, no aprobación de arte concreto.
- V6: sesiones privadas o emparejamiento público, moderación y controles de voz/chat para 13+.
- Rendimiento: FPS, dispositivo móvil de referencia y presupuesto gráfico pendientes; 60 FPS no fue aprobado.

## Validación
Sprint 0 produce documentación y fuentes, no una aplicación ejecutable. Sprint 1 deberá definir comandos reales y criterios medibles antes de implementar: compilación, lint, comprobación de tipos compatible con JavaScript, pruebas pertinentes y humo en navegador móvil/escritorio con consola limpia y captura. No afirmar pruebas realizadas mientras no exista código.

## Revisión de Sprint 0
Aprendido: el repositorio inicial interpretaba la inspiración como intención cómica; el autor aclaró y autorizó corregirla. Se conservan las mecánicas del GDD, sujetas a las validaciones anteriores. Sprint 0 cerrado tras el OK explícito del autor; las validaciones de contenido y servicios pasan como requisitos previos a sus tareas de Sprint 1.


## Sprint 1 — propuesta concreta de infraestructura (V4/V6 pendiente)
- Herramientas: ESLint para lint; TypeScript únicamente como verificador `checkJs`/`noEmit` de JavaScript con JSDoc; Playwright para humo de navegador. Sin migración del lenguaje a TypeScript. Motor y Vite ya autorizados por la elección del stack.
- Red propuesta: servicio Node con `ws`, autoridad sobre roles, posición validada y estado del reto. Salas privadas por código para las primeras pruebas; no emparejamiento público. Cada conexión recibe solo su rol y datos visibles, nunca el mapa completo de asignaciones.
- Voz propuesta: WebRTC del navegador, señalización por el servidor; proximidad calculada con posiciones autorizadas. Micrófono optativo y silenciado inicialmente, controles de silencio/bloqueo y texto alternativo. Usar un proveedor TURN requiere decisión de costos/credenciales; no prometer que STUN solo permita todos los tipos de red. Atenuar volumen en el cliente no ofrece privacidad frente a un cliente modificado; no vender la proximidad como confidencialidad.
- Hosting: Pages permanece como cliente; para las primeras pruebas, servidor dentro del entorno de desarrollo. El proveedor público de Node y TURN sigue pendiente. No abrir servicio público ni crear cuentas/consumo sin autorización.
- Alternativa: voz gestionada (p. ej. LiveKit) reduce implementación de medios, introduce SDK y servicio adicionales. Recomendada solo si se aprueban proveedor y presupuesto.
- La demo local puede validar contratos de red, pero no valida latencia real, TURN, 4–8 usuarios ni comportamiento en móviles físicos. El cierre del sprint exige pruebas del recorrido completo y las decisiones pendientes.

## Aprobaciones de ejecución — Sprint 1
Autor aprobó íntegramente docs/design/genesis-vertical-slice.md: dos jugadores, fragmento y reto, sin copiar versículos; producto final 4–8. V4: ESLint, TypeScript como verificador de JS/JSDoc y ws para servidor Node local. V4/V6: salas privadas por código, voz WebRTC de prueba inicialmente apagada y optativa, silencio/bloqueo y texto alternativo. V5: primitivas arena/ocre y objetivos provisionales 30 FPS móvil/60 escritorio pendientes de medición física. Estas decisiones reemplazan las correspondientes propuestas pendientes anteriores. Hosting público/TURN y edición digital de la Biblia no aprobados/verificados.

## Resultado de implementación Sprint 1
Corte local de dos participantes implementado; ver Sprints.md y docs/evidence/sprint-1/. Estado esperando aceptación: voz RTP limitada por políticas del navegador de nube y rendimiento físico pendiente. La entrega se conserva en rama sprint-1/genesis-vertical-slice y copia descargable; pausar después de subirla por petición del autor. No se inicia Sprint 2.
