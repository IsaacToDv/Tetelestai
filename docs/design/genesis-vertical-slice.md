# Genesis vertical slice — Sprint 1 technical prototype

> Registro del prototipo implementado. El autor corrigió después la dirección: la campaña comienza por los segmentos de Génesis en orden de indubiblia, no por Abram/Lot. Este diseño conserva valor como prueba técnica; no autoriza trasladar su narrativa o mecánicas al inicio de la campaña. Consultar al autor antes de cualquier nueva adaptación.

Estado: **APROBADO por el autor para Sprint 1 (V1/V2/V3/V5)**. Se autoriza implementar la propuesta sin copiar versículos. No contiene citas textuales RVR1909. Base: `docs/GDD.md`, `Plan.md` y `docs/library/Libros/Genesis.md`.

## Objetivo y límites

Dos participantes recorren una zona compacta de Génesis, descubren sus roles mediante proximidad, encuentran un fragmento y completan un reto 1 vs 1. La diversión procede de explorar, comunicarse y resolver un desafío justo. Sin comedia, castigos caricaturescos ni competencia presentada como medida de fe.

**Alcance aprobado V3:** validar el corte con exactamente dos participantes, uno por rol, conservando 4–8 como objetivo del producto. No duplicar Abraham/Lot ni añadir personajes por defecto. Alternativa: ampliar primero a cuatro roles bíblicamente contextualizados, lo que exige nuevo contenido y aumenta el corte. Se recomienda la primera opción para verificar el recorrido aprobado con menor contenido pendiente. El autor eligió el corte de dos participantes; 4–8 permanece como objetivo de producto.

## Recorrido propuesto — APROBADO V1

| momento | comportamiento de juego propuesto | fundamento y límite |
|---|---|---|
| Entrada | El servidor asigna Abram o Lot y revela a cada jugador solo su propio rol. Interfaz puede aclarar «Abram (Abraham)». | Génesis 17:5 sitúa el cambio de nombre después del episodio; evitar presentarlo como ya ocurrido. |
| Exploración | Aparición en dos puntos cercanos de un campamento simplificado; ambos buscan un punto de reunión. Sin diálogo bíblico inventado. | Abstracción jugable, no geografía histórica reconstruida ni separación narrada por la Escritura. |
| Encuentro | La voz/chat por proximidad permite reconocer al compañero; el fragmento se activa cuando ambos están presentes y confirman continuar. | Génesis 12:4–5: Lot ya acompaña a Abram. No es su primer encuentro ni son desconocidos históricos. El secreto pertenece a los jugadores, no a la memoria de los personajes. |
| Fragmento | Una ficha muestra las referencias de la promesa y su lectura en el NT; ambos la revisan antes de iniciar el reto. | Génesis 12:1–3; Gálatas 3:8,16. Interpretación aprobada para este corte. |
| Reto | Ambos responden al desafío de orden de viaje detallado abajo. | Mecánica didáctica; no afirmar que Abram y Lot compitieron así. |
| Salida | El servidor registra fragmento completado una sola vez y resultado del reto; ambos pueden concluir el recorrido. | El corte no representa todo Génesis ni desbloquea la cinemática final del libro. |

No representar todavía una decisión de reparto de tierras: Génesis 13:5–12 requiere contexto adicional y aprobación. La victoria en el reto no decide el canon ni impide avanzar al otro jugador.

## Fragmento `promise-and-blessing` — APROBADO V1/V2

- Referencias exactas: Génesis 12:1–3; Gálatas 3:8 y 3:16.
- Resumen propuesto para revisión: relacionar la promesa de bendición a las familias de la tierra con la lectura que Pablo hace de la promesa y de Cristo en Gálatas. Presentarlo como explicación al jugador, sin atribuir conocimiento de Gálatas a un personaje del Génesis.
- Alcance: una sola ficha, con referencias y resumen original aprobado. No importar versículos mientras no se verifique la edición digital RVR1909.
- Fuente secundaria ya consultada: https://www.indubiblia.org/antiguo-testamento-1/genesis-1/estudio-gn ; véase biblioteca. La incorporación de Gálatas 3:8 y los límites narrativos son propuestas de diseño que deben revisarse contra los pasajes antes de implementar.
- Criterio de aceptación: se necesita presencia y confirmación de ambos; repetir la interacción no duplica el progreso; el recurso permanece accesible si alguien necesita releerlo.

## Reto `journey-order` — APROBADO V1

Ordenar tres tarjetas: Harán → Siquem → zona entre Betel y Hai. Referencias de revisión: Génesis 12:4–5, 12:6 y 12:8. Las tarjetas expresan lugares, sin copiar versículos. Se recomienda usar un mapa esquemático y permitir consultar las referencias antes de que ambos inicien.

Propuesta de reglas: una ronda de 45 segundos; enviar una secuencia; gana la primera secuencia correcta recibida por el servidor. Un error permite reordenar sin penalización humillante. Respuestas correctas recibidas dentro del mismo intervalo de 250 ms se consideran empate; si nadie acierta, mostrar la secuencia y permitir repetir. El servidor determina tiempo, respuesta y resultado; el cliente no declara ganadores. El efecto de latencia debe revisarse en pruebas antes de aceptar este criterio competitivo.

Recompensa propuesta: un recurso de viaje representado por una ficha de agua para el ganador, uno para cada jugador en empate. Es una recompensa ficticia de juego, no un evento bíblico; no altera hechos canónicos ni bloquea al perdedor. Su uso futuro queda fuera del corte y no debe prometer una economía implementada.

Criterios: aceptar solo los tres identificadores válidos sin duplicados; rechazar envíos fuera de ronda; idempotencia al repetir un envío; cancelar sin ganador ante desconexión antes del resultado; progresión compartida conservada por el servidor. No revelar el resultado rival antes de cerrar la ronda.

## Arte y rendimiento — base provisional aprobada V5

Usar suelo, senderos, tiendas y figuras geométricas temporales, sin assets generados ni personajes definitivos. Paleta arena/ocre con elementos interactivos de alto contraste, sujeta a revisión visual del autor. La geometría no pretende reconstrucción arqueológica.

Objetivos provisionales aprobados, por medir en dispositivos de referencia: 30 FPS sostenidos en móvil de referencia por definir y 60 FPS en escritorio de referencia por definir. Verificar visibilidad, tamaño de controles táctiles, orientación y equivalencia funcional con teclado antes de afirmar compatibilidad móvil. Evitar destellos rápidos; cualquier luz intensa debe conservar legibilidad y permitir reducir brillo.

Criterio confirmado por el autor: Dios según la descripción del pasaje; cuando esta no precise apariencia, luz resplandeciente potente. Este corte no necesita representar una aparición divina; cualquier escena posterior se revisará con su pasaje. Jesús sigue sin representación aprobada y no se muestra en el corte.

## Validaciones y límites vigentes

- V1/V2: recorrido, fragmento y reto aprobados. Verificar edición RVR1909 antes de incorporar texto; el corte usa referencias y resúmenes originales.
- V3: aprobada prueba de dos roles; objetivo de producto 4–8.
- V4/V6: aprobados servidor Node/ws local y WebRTC de prueba, salas privadas y controles de comunicación. Hosting público y TURN pendientes.
- V5: primitivas, paleta y objetivos provisionales aprobados; dispositivos físicos por definir. Las escenas temporales no son aprobación de arte final.

## Nota para integración

El GDD todavía contiene en sus notas la frase que puede sugerir que Lot no acompañaba a Abram al principio y presenta todas las sugerencias como pendientes V3. El orquestador debe reconciliar esas anotaciones con Génesis 12:4–5 y con la aprobación general recibida, sin confundirla con aprobación de los detalles nuevos de esta especificación.

## Registro de aprobación
El autor aprobó la propuesta completa del recorrido, el corte de dos jugadores, las primitivas arena/ocre y los objetivos provisionales. También aprobó ESLint, verificación checkJs con TypeScript, ws/Node local, salas privadas, micrófono optativo apagado, silencio/bloqueo y texto alternativo, y WebRTC de prueba. Las menciones previas a propuestas pendientes quedan resueltas solo para este alcance. Licencia de edición digital, hosting público, TURN y dispositivos físicos siguen pendientes; no se copia texto bíblico.
