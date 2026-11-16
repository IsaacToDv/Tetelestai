# SETUP — Tetelestai (Codex + PlayCanvas)

## 0. Sin máquina local (GitHub + Codex en la nube)
1. Crea un repositorio `tetelestai` en GitHub y sube el contenido del zip (Add file → Upload files). Pages gratis exige repo público; en privado depende de tu plan de GitHub.
2. En el repo: Settings → Pages → Source: **GitHub Actions**. Desde ahí, cada merge a `main` despliega el juego solo.
3. En chatgpt.com/codex: conecta GitHub, instala la app de Codex en el repo y crea un **environment** (necesitas plan Plus, Pro, Business o Enterprise; con API key no hay nube). Pon Node 22 y este setup script: `if [ -f game/package.json ]; then cd game && npm ci; fi`.
4. Internet: por defecto está apagado mientras el agente trabaja. Para que el bibliotecario consulte la web, actívalo con dominios permitidos (por ejemplo `indubiblia.org`, `developer.playcanvas.com`, `api.playcanvas.com`).
5. Settings → Code review: activa las revisiones automáticas. También puedes comentar `@codex review` en un PR.
6. Lanzar trabajo: crea un issue con la plantilla "Tarea de sprint" y coméntalo con `@codex`. Codex abre el PR, el CI corre y, al hacer merge, se despliega.

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

## 3. Qué viene configurado
- `.codex/config.toml`: subagentes activos (6 hilos, profundidad 1), Context7 y Serena compartidos, PlayCanvas Editor MCP **desactivado**.
- `.codex/agents/*.toml`: los 5 subagentes. El orquestador es la sesión principal (AGENTS.md).
- Firecrawl vive solo en el bibliotecario; Tripo y Chrome DevTools, solo en los agentes que los necesitan, para no gastar tokens de esquema en el orquestador.
- PlayCanvas Editor MCP: actívalo (`enabled = true`) solo si trabajas con un proyecto del Editor; ábrelo y conéctalo al puerto 52000. Un solo servidor por Editor.

## 3b. Modelos
Configurados: sesión principal `gpt-6.1-sol`; `technical_programmer` Sol high; `physics_programmer`, `graphic_programmer`, `game_designer` Sol medium; `bibliotecario` `gpt-6-luna`. Para el Sprint 0 cambia con `/model gpt-6-astra` (según tu plan). Terra (`gpt-6.1-terra`) requiere Codex CLI 0.159.0+. Comprueba los nombres en `/model`; si alguno no existe en tu cuenta, edita la línea `model` del TOML.

## 4. Verificar
`codex mcp list` y `/mcp` en la sesión. Si un subagente no ve Context7 o Serena, copia sus bloques `[mcp_servers.*]` a su TOML.

## 5. Primer prompt
> Lee AGENTS.md, Plan.md y Sprints.md. Están vacíos: ejecuta el Sprint 0. Usa el bibliotecario para indexar Génesis en indubiblia.org y comprobar la documentación de PlayCanvas, luego hazme todas las preguntas de validación en una sola ronda.

## Costos y avisos
- Firecrawl y Tripo consumen créditos. Todo gasto pasa por V4.
- indubiblia.org tiene derechos reservados: la biblioteca guarda resúmenes y URLs, no copias.
- Las funciones de subagentes, plugins y skills de Codex cambian con frecuencia; si algo no carga, revisa la documentación oficial de Codex.
