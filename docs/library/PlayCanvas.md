# PlayCanvas — verificación de Sprint 0

Consulta: 2026-11-15. Sin instalación ni selección definitiva de versión.

- npm `latest` devuelve **2.24.1**, licencia MIT, requisito Node `>=18.3.0` y tipos en `build/playcanvas.d.ts`. Esto es una observación del registro, no una versión ya fijada por el proyecto. [Fuente: https://registry.npmjs.org/playcanvas/latest ; HTTP 200]
- El manual describe soporte web de escritorio/móvil mediante WebGPU o WebGL 2, y uso independiente del Editor. Incluye ejemplos JavaScript y acceso a `npm create playcanvas@latest`. [Fuente: https://developer.playcanvas.com/user-manual/engine.md ; HTTP 200]
- API oficial accesible. [Fuente: https://api.playcanvas.com/engine/ ; HTTP 200]
- La ruta Markdown válida comprobada es `/user-manual/engine.md`; `/user-manual/engine/index.md` devuelve 404. [Fuente: consultas directas a ambas URLs]

[Inferencia] Engine + Vite con JavaScript encaja con el enfoque elegido. El soporte del motor no prueba rendimiento en los móviles objetivo: fijar dispositivos, presupuesto visual y mediciones antes de prometer FPS. Consultar documentación de la versión fijada y sus tipos al implementar; `latest` cambia.
