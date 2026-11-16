# Probar Tetelestai en tu escritorio

1. Descomprime la carpeta del sprint en tu escritorio.
2. Instala Node.js 22.18 o posterior (incluye npm): https://nodejs.org/
3. Abre una terminal dentro de `game/` y ejecuta `npm ci`.
4. En esa terminal ejecuta `npm run server`.
5. Abre otra terminal en `game/` y ejecuta `npm run dev`. Abre la dirección que muestra Vite.
6. Abre una segunda ventana o sesión privada del navegador. Crea una sala en la primera y utiliza su código en la segunda.
7. Sigue las indicaciones del juego para reunir a ambos jugadores, activar el fragmento y completar el reto.

Mantén ambas terminales abiertas. Detén los procesos con Ctrl+C al terminar. Puedes editar los archivos con tu editor habitual; Vite recarga el cliente durante el desarrollo.

## Voz y navegador

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
git clone --branch sprint-1/genesis-vertical-slice https://github.com/IsaacToDv/Tetelestai.git
cd Tetelestai/game
npm ci
```

El acceso a GitHub utiliza tu cuenta y sus permisos; este paquete no incluye tokens.

## Limitación de la comprobación de voz en la nube

El Chromium administrado de este entorno aplica restricciones a la captura de audio y a UDP directo de WebRTC. Se observó el mismo fallo sin el juego, con dos conexiones WebRTC mínimas. Por ello, una prueba de señalización en la nube no demuestra audio recibido. Prueba el micrófono y el audio entre dos sesiones de tu navegador local; el chat sigue disponible como alternativa.
