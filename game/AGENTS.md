# Reglas PlayCanvas para el juego (`game/`)

Adaptado de `playcanvas/engine` AGENTS.md (MIT) y del enfoque delgado de `playcanvas/developer-site`. Originales completos en `docs/references/` (no se cargan solos).
Aquí el Engine es una **dependencia**, no el código que mantenemos: se omiten las reglas internas del motor (build, tree shaking, deprecaciones, PR).

## Proyecto (completar en Sprint 1)
- Stack: PlayCanvas Engine + Vite, lenguaje y versión de Node según `Plan.md`.
- Comandos reales: `dev`, `build`, `lint`, `test`, `typecheck` → anótalos aquí al crearlos.
- GitHub Pages: `vite.config` lee `base: process.env.VITE_BASE ?? '/'`, la salida es `dist/` y `package-lock.json` va commiteado. El CI y el despliegue (`.github/workflows/`) esperan los scripts `lint`, `typecheck`, `test` y `build`.

## Código
- ES Modules. Sin `var`: usa `const` o `let`. Evita `any`; tipa con precisión.
- Nombres: clases PascalCase, funciones camelCase, constantes UPPER_SNAKE_CASE, archivos kebab-case (el archivo se llama como su clase principal).
- Ejecuta lint antes de entregar. Arregla solo lo que tocas.
- Comentarios: explica el porqué, no el qué. Sin comentarios obvios. Todo TODO lleva contexto.
- Imports de tipos solo-tipo con `import type` (TS) o `@import` (JSDoc).
- Estado de juego: instancias, no globales. Excepción: variables de módulo reutilizables (p. ej. un `Vec3` temporal) que nunca se exportan.

## Rendimiento (juego en tiempo real, multijugador)
- Sin asignaciones en el bucle de actualización ni de render: reutiliza objetos, usa pools (efectos, proyectiles, partículas).
- Cachea propiedades usadas con frecuencia en variables locales. Usa typed arrays para datos numéricos.
- Sin `try/catch`, creación de funciones ni concatenación de strings dentro de bucles calientes.
- Low poly: instancing/batching, pocas luces dinámicas, texturas pequeñas. Mide antes de optimizar.
- Trabajo pesado fuera del hilo principal (Web Workers) cuando aplique.

## Gráficos
- Usa las abstracciones del Engine; no llames a WebGL/WebGPU directamente.
- Comprueba qué backend usa el proyecto y prueba en él antes de dar algo por hecho.

## Scripts y atributos
- Los atributos tipo enum usan valores string legibles (`'linear'`), nunca constantes numéricas del Engine.
- Configuración expuesta como atributos; lógica reutilizable en scripts pequeños.

## Recursos
- Todo objeto que guarde recursos tiene `destroy()` y lo libera (`this.res?.destroy(); this.res = null`).
- Libera listeners, timers y conexiones de red al destruir entidades o salir de un mapa.

## Método
- Lee el código vecino y sigue su estilo antes de escribir.
- Causa raíz: no enmascares errores ni silencies avisos; arregla en el origen.
- Verifica en el navegador (captura + consola) antes de declarar algo hecho.
- Si hay varios enfoques válidos o falta información, **pregunta** al orquestador.

## Fuentes (no recuerdes APIs de memoria)
- API: https://api.playcanvas.com/engine/ · Manual: https://developer.playcanvas.com/user-manual/engine/
- Ejemplos: https://playcanvas.github.io · Foro: https://forum.playcanvas.com
- Skills de PlayCanvas en `.agents/skills/` y tipos `.d.ts` instalados.
