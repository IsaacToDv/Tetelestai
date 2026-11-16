# Biblioteca técnica — investigación por tarea

La mantiene el bibliotecario para el orquestador y los roles técnicos/creativos. Investigar según la tarea que se va a hacer; evitar recopilar técnicas generales sin un problema definido. «Mejor» significa adecuada al motor, versión, plataforma, restricciones y medición de esta tarea, no una superioridad universal.

## Flujo

1. El orquestador registra la tarea aprobada y pide una pregunta técnica concreta: rol consumidor, objetivo, motor/versiones, plataforma, presupuesto, alternativas y evidencia esperada.
2. El bibliotecario comprueba fuentes primarias vigentes; consulta tipos/API instalados cuando corresponda. Compara alternativas y registra limitaciones o evidencia contradictoria.
3. Entrega una ficha breve en esta carpeta y la anota en `../Fuentes.md`. El rol consumidor usa esa ficha; no repite la misma investigación web.
4. El orquestador revisa el alcance y las dependencias. El implementador verifica con un experimento medible y devuelve el resultado para actualizar la ficha. Una técnica recomendada no equivale a aprobación de una mecánica o contenido narrativo.
5. Si faltan acceso, documentación o versión coincidente, declarar «sin verificar» y continuar con la parte independiente; no inventar resultados ni cambiar políticas de seguridad.

## Plantilla de ficha (`<task>-<topic>.md`)

- Tarea / pregunta concreta:
- Rol consumidor y responsable:
- Estado: investigado / recomendado / probado / descartado / sin verificar.
- Fecha de consulta; versiones de motor, herramientas y plataforma:
- Restricciones y criterio de éxito medible:
- Fuentes primarias: URL, sección y qué afirma; separar hechos de inferencias.
- Alternativas: ventajas, costo de CPU/GPU/red/memoria, complejidad y compatibilidad; marcar valores no medidos.
- Recomendación y razón para esta tarea; condiciones en que deja de servir:
- Dependencias/costos/licencias o decisiones que requieren aprobación:
- Experimento reproducible: pasos/comando, escenario, dispositivo, métrica y umbral.
- Resultado real: medición, evidencia y límite; dejar pendiente si no se ejecutó.
- Preguntas al autor: narrativa, historia, mecánicas y cualquier cambio de alcance; no responderlas técnicamente por él.

## Índice inicial de fuentes oficiales

Consulta: 2026-11-16. Se comprobaron páginas y encabezados, no se ejecutaron experimentos. La versión instalada del motor se consulta en `game/package-lock.json`; el manual web puede adelantarse a ella.

| Consumidor | Fuente primaria verificada HTTP 200 | Uso de consulta |
|---|---|---|
| orquestador / technical_programmer | https://developer.playcanvas.com/user-manual/optimization/ | «Debugging and Optimization», selección de herramientas y optimización; definir primero qué medir |
| graphic_programmer | https://developer.playcanvas.com/user-manual/graphics/ | backends y capacidades de render; contrastar con API/tipos instalados |
| physics_programmer | https://developer.playcanvas.com/user-manual/physics/ | entrada oficial al sistema físico; elegir colisiones/control solo tras objetivo aprobado |
| game_designer | https://api.playcanvas.com/engine/ | verificar posibilidades del motor al evaluar una mecánica ya consultada; la API no determina diseño |
| artist | https://developer.playcanvas.com/user-manual/assets/ | diferencia asset/recurso, ciclo de vida y formatos; revisar presupuesto y licencias antes de importar |
| roles con controles táctiles | https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events | referencia propuesta de Pointer Events; acceso rechazado por proxy HTTPS 403 en esta consulta, contenido no verificado |
| roles con profiling web | https://developer.chrome.com/docs/devtools/performance | referencia propuesta de Performance; acceso rechazado por proxy HTTPS 403 en esta consulta, contenido no verificado |

La documentación oficial del motor/API ya comprobada en `../PlayCanvas.md` se reutiliza. Esta tabla es un punto de entrada; una investigación por tarea debe resolver su pregunta y comparar opciones antes de recomendar una técnica concreta.
