# Probar Tetelestai en tu escritorio

1. Descomprime la carpeta del sprint en tu escritorio.
2. Instala Node.js 22.18 o posterior (incluye npm): https://nodejs.org/
3. Abre una terminal dentro de `game/` y ejecuta `npm ci`.
4. En esa terminal ejecuta `npm run server`.
5. Abre otra terminal en `game/` y ejecuta `npm run dev`. Abre la dirección que muestra Vite.
6. Abre una segunda ventana o sesión privada del navegador. Crea una sala en la primera y utiliza su código en la segunda.
7. Elijan un personaje distinto cada uno, Adán o Eva. Camina con WASD o las flechas y arrastra con el ratón para girar la cámara. En pantallas táctiles, usa las flechas en pantalla y arrastra sobre el jardín. «Volver al menú» libera tu personaje.

La guía del jardín muestra la visita y el riego. Acércate a cada señal para que aparezca la acción. Pulsa E en el teclado o el botón que muestra el juego. El panel «Animales» muestra su crecimiento y permite editar los nombres si juegas como Adán.

Sigue el río hasta Pisón, Gihón, Hiddekel y Éufrates. Camina hacia el agua para nadar y vuelve a la orilla con los mismos controles. Si vas montado, el asno se detiene y baja la cabeza al llegar al agua. Suelta el control de movimiento y vuelve a avanzar para entrar con él. En la orilla aparecen «Beber» y, junto a los ramales, «Dar alimento a los peces». Acércate a las ovejas, al león y a la jirafa para ver sus acciones. En «Ríos de Edén» puedes silenciar los efectos espaciales.

Quien cree el jardín puede copiar su **clave privada del jardín** del panel de sala. Para recuperarlo, usa «Reabrir mi jardín» y pega esa clave. Los nombres se conservan tras reiniciar el servidor mientras se conserve `game/.eden-data/`. El progreso de las actividades permanece mientras la sala está ocupada. Comparte el código de sala con tu amigo.

Mantén ambas terminales abiertas. Detén los procesos con Ctrl+C al terminar. Puedes editar los archivos con tu editor habitual; Vite recarga el cliente durante el desarrollo.

Para probar Edén desde un teléfono en la misma red Wi‑Fi, inicia el servidor con `HOST=192.168.1.23 npm run server`, sustituyendo la IP de ejemplo por la de tu equipo. Abre la dirección de red que imprime Vite tanto en el equipo como en el teléfono y usa el mismo código de sala.

El panel «Voz y chat de proximidad» incluye chat, micrófono optativo, silencio y bloqueo. Para probar el micrófono en el mismo equipo usa `localhost`. Desde un teléfono en la red local, el navegador normalmente requiere HTTPS para conceder acceso al micrófono. El chat de texto está disponible por HTTP. [Contextos seguros de W3C](https://www.w3.org/TR/secure-contexts/#is-origin-trustworthy)

## Prototipo Abram/Lot

Abre `prototype.html` en el mismo servidor de Vite para probar la entrega histórica, con su propio código de sala, fragmento, reto y voz.

La voz comienza apagada. Actívala solo si quieres conceder permiso al micrófono. Para dos sesiones en la misma habitación conviene usar auriculares y evitar realimentación. El chat de texto sirve como alternativa.

El micrófono funciona en localhost o HTTPS. Acceder desde un teléfono por la IP de tu ordenador mediante HTTP no permite asumir que el micrófono estará disponible. La emulación móvil del navegador comprueba el diseño, pero no mide rendimiento en tu teléfono.

Este paquete permite una prueba local de dos jugadores. No incluye hosting, credenciales ni servicio TURN. No garantiza conectividad WebRTC entre redes distintas. Para publicar, el cliente necesita la URL de un servidor accesible (`VITE_SERVER_URL`); GitHub Pages no ejecuta el servidor.

## Comprobaciones

Desde `game/`:

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

`typecheck` comprueba JavaScript con JSDoc. El paquete contiene el código y el lockfile; las dependencias se descargan mediante `npm ci`, no se incluye `node_modules`.

Los documentos `Plan.md` y `Sprints.md` registran el alcance y las limitaciones. No contiene citas textuales de RVR1909 ni representaciones nuevas de Dios/Jesús.

## Trabajo con GitHub

El workflow `Game checks` ejecuta instalación, lint, verificación de JavaScript, pruebas y build en GitHub Actions. No despliega el juego. La rama del sprint se entrega por separado de `main` para revisión; descargar el ZIP no cambia tu repositorio.

Si prefieres trabajar con historial Git y subir tus cambios después, puedes clonar la rama en lugar de descomprimir el ZIP:

```sh
git clone --branch sprint-2/eden-rivers https://github.com/IsaacToDv/Tetelestai.git
cd Tetelestai/game
npm ci
```

El acceso a GitHub utiliza tu cuenta y sus permisos; este paquete no incluye tokens.

## Limitación de la comprobación de voz en la nube

El Chromium administrado de este entorno aplica restricciones a la captura de audio y a UDP directo de WebRTC. Se observó el mismo fallo sin el juego, con dos conexiones WebRTC mínimas. Por ello, una prueba de señalización en la nube no demuestra audio recibido. Prueba el micrófono y el audio entre dos sesiones de tu navegador local; el chat sigue disponible como alternativa.
