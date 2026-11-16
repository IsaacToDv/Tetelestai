# SETUP — Tetelestai (Codex + PlayCanvas)

## 0. Sin máquina local (GitHub + Codex en la nube)
1. Crea un repositorio `tetelestai` en GitHub y sube el contenido del zip (Add file → Upload files). Pages gratis exige repo público; en privado depende de tu plan de GitHub.
2. El workflow actual `.github/workflows/ci.yml` ejecuta comprobaciones del juego; no despliega a Pages. Publicar requiere autorización y un flujo de despliegue aparte.
3. En chatgpt.com/codex: conecta GitHub, instala la app de Codex en el repo y crea un **environment** (necesitas plan Plus, Pro, Business o Enterprise; con API key no hay nube). Pon Node 22 y este setup script: `if [ -f game/package.json ]; then cd game && npm ci; fi`.
4. Internet: por defecto está apagado mientras el agente trabaja. Para que el bibliotecario consulte la web, actívalo con dominios permitidos (por ejemplo `indubiblia.org`, `developer.playcanvas.com`, `api.playcanvas.com`).
5. Settings → Code review: activa las revisiones automáticas. También puedes comentar `@codex review` en un PR.
6. Lanzar trabajo: crea un issue con la plantilla "Tarea de sprint" y coméntalo con `@codex`. Codex prepara el PR y el CI corre. El merge y el despliegue requieren autorización; el CI actual no publica el juego.

Límites de la nube: los MCP locales (Serena, Firecrawl, Chrome DevTools, Tripo) pueden no estar disponibles; los secretos no llegan a la fase en la que trabaja el agente; y no he comprobado si los subagentes de `.codex/agents/` se cargan en tareas en la nube. `AGENTS.md` prevé trabajar por turnos de rol si faltan. Todo lo demás de este archivo (secciones 1 en adelante) es para uso local y es opcional.


Requisitos: Codex CLI o app, Node.js 22.18+, `uv` (para Serena), Git, Chrome estable.

## 1. Abrir el proyecto
1. Descomprime, `git init`, abre la carpeta en Codex y márcala como **trusted** (sin eso no se leen `.codex/config.toml` ni `.codex/agents/`).
2. Variable de entorno (la clave no va en el repo): `FIRECRAWL_API_KEY` (cuenta en firecrawl.dev).

## 2. Instalar lo que no cabe en un zip
| herramienta | comando |
|---|---|
| Playwright CLI | `npm install -g @playwright/cli@latest` y luego `playwright-cli install --skills=agents` y `playwright-cli install-browser`. Alternativa: `$skill-installer` → skill `playwright` de OpenAI. |
| Superpowers | En Codex: `/plugins`, busca `superpowers`, Install. |
| Skills de PlayCanvas | Crea el juego: `npm create playcanvas@latest game`. Después, desde la **raíz**: `npx skills add playcanvas/skills`. Usa una sola vía de instalación para no duplicar skills. |
| Tripo 3D (opcional) | Alfa: requiere Blender y el addon de Tripo AI. Solo se usa tras validar V4/V5. |

Si `create-playcanvas` genera su propio `AGENTS.md` dentro de `game/`, fusiónalo con el de este zip (conserva sus comandos reales).

## 3. Perfiles del repositorio
- `.codex/config.toml` registra seis roles con profundidad máxima 1 y seis hilos: bibliotecario, game_designer, graphic_programmer, physics_programmer, artist y technical_programmer. El orquestador es la sesión principal.
- `.codex/agents/*.toml` contiene instrucciones reutilizables. No fija modelos ni instala/configura servidores MCP, credenciales o herramientas. Cada sesión debe comprobar qué capacidades tiene realmente.
- Bibliotecario investiga segmentos bíblicos y técnicas web para los roles; el orquestador valida con el autor narrativa, historia y mecánicas antes de implementar. Los dossiers quedan en `docs/library/technical/`.
- Si la sesión no carga perfiles o no tiene subagentes, el orquestador adopta cada rol por turnos leyendo sus `developer_instructions` y lo comunica. No afirmes herramientas disponibles por estar mencionadas en documentación.

## 4. Verificar perfiles
`python -c "import pathlib,tomllib; [tomllib.loads(p.read_text()) for p in pathlib.Path('.codex').rglob('*.toml')]"` comprueba sintaxis TOML si Python >=3.11 está instalado. Esto no demuestra que el cliente cargue los roles. Revisa las capacidades de tu versión de Codex; `codex mcp list` y `/mcp` aplican solo si esa sesión ofrece esos comandos. No hace falta activar MCP para leer los dossiers guardados.

## 5. Primer prompt
> Lee AGENTS.md, Plan.md y Sprints.md. Si están vacíos, ejecuta Sprint 0; si ya tienen decisiones, respétalas. Delega al bibliotecario verificar los segmentos de Génesis en orden según indubiblia y el dossier técnico necesario. Consulta en una sola ronda las decisiones nuevas de narrativa, historia y mecánicas; espera mi aprobación antes de implementarlas.

## Costos y avisos
- Firecrawl y Tripo consumen créditos. Todo gasto pasa por V4.
- indubiblia.org tiene derechos reservados: la biblioteca guarda resúmenes y URLs, no copias.
- Las funciones de subagentes, plugins y skills de Codex cambian con frecuencia; si algo no carga, revisa la documentación oficial de Codex.
