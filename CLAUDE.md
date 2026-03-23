# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Nexus is an all-in-one desktop security toolkit (Electron + Python FastAPI) for CTF competitions, authorized pentesting, security research, and bug bounty. It has a React frontend and Python backend communicating via SSE streaming.

## Architecture

**Three-layer stack:**
- **Electron shell** (`electron/`) — BrowserWindow, IPC handlers, Python subprocess management
- **React UI** (`renderer/src/`) — Vite + React + Tailwind CSS v4 + Zustand state management
- **Python backend** (`backend/`) — FastAPI with async generator modules streamed as SSE

**Key data flow:** User clicks Run → React calls `useStream` hook → GET (EventSource) or POST (fetch ReadableStream) to FastAPI → Python async generator yields `{type, message}` dicts → `utils/streamer.py` wraps as SSE `data:` lines → React appends to `lines[]` state → `StreamOutput` component renders live.

**Port negotiation:** `pythonBridge.js` finds a free port, sets `NEXUS_PORT` env var, spawns Python. Python prints `READY:{port}` to stdout during FastAPI lifespan startup. Electron detects this and sends port to renderer via IPC. Fallback: browser dev mode hardcodes port 7331.

**Module pattern:** Each tool is an async generator in `backend/modules/{category}/`. Routers in `backend/routers/` mount endpoints that call `stream()` from `utils/streamer.py` which wraps the generator as SSE. Frontend pages have a tool selector sidebar + config panel + StreamOutput.

## Development Commands

```bash
npm run install:all    # Install root + renderer dependencies
npm run dev            # Start Vite dev server + Electron concurrently
npm run build          # Build renderer + package with electron-builder

# Backend only (for testing):
cd backend && python main.py   # Starts on port 7331 (default)

# Renderer only (for UI work):
cd renderer && npx vite --port 5173
```

## Tailwind CSS v4

This project uses **Tailwind v4** with CSS-based config. Do NOT use `tailwind.config.js` for theme values. Instead, use `@theme` blocks in `renderer/src/index.css`. The PostCSS plugin is `@tailwindcss/postcss` (not `tailwindcss`).

## Important Patterns

- **State stores** are in `renderer/src/store/` using Zustand. `settingsStore` holds port/status/maintenance mode. `activityStore` tracks scan history. `logStore` tracks audit events.
- **All scan results stream live** — never use REST JSON responses for tool output. Always use the SSE streaming pattern.
- **Admin panel** is hidden, toggled with `Ctrl+Shift+A`. It has audit logging, session stats, system info, and maintenance mode.
- **Maintenance mode** locks down the entire app — set via admin panel, blocks all tool pages with a lockdown screen.
- **Python auto-restart** — `pythonBridge.js` retries up to 3 times with exponential backoff if the Python process crashes.
- **Windows-first** — Use `python` not `python3`, `cmd /c` for shell execution in launch configs. Preview configs use `"runtimeExecutable": "cmd"`.

## Adding a New Tool

1. Create async generator in `backend/modules/{category}/newtool.py`
2. Add endpoint in `backend/routers/{category}.py` calling `stream(newtool(args))`
3. Add tool entry to the `TOOLS` array in the corresponding page component
4. Add config inputs and wire up the `run()` function with the endpoint path

## Streaming: GET vs POST

- Use `useStream.start(path, params)` for GET tools (EventSource) — query params only, no body
- Use `useStream.startPost(path, body)` for POST tools (fetch ReadableStream) — required when sending arrays or large payloads (e.g., wordlists, credential lists)
- Both parse `data: {json}\n\n` lines identically; choose based on whether the tool needs a request body

## Input Validation

All backend inputs must go through `backend/utils/validator.py` before use:
- `validate_domain()` — strips protocol, validates format
- `validate_url()` — adds `https://` if missing
- `validate_ip_or_cidr()` — for network tools
- `validate_port_range()` — accepts comma/dash syntax (e.g., `80,443,8000-9000`)
- `validate_hash()` — allows hex + special chars for bcrypt/argon2/etc.

## All 22 tools wired

All modules are exposed via routes. New in v1.1.0:
- `GET /api/recon/reversedns?ip=` — calls `reverse_dns(ip)`
- `GET /api/recon/geoip?ip=` — calls `ip_geolocation(ip)`
- `GET /api/web/cors?url=` — calls `cors_checker(url)`
- `GET /api/password/encode?text=` — calls `encoder(text)`
- `GET /api/password/strength?password=` — calls `password_strength(password)`

## StreamOutput Line Types

The `StreamOutput` component colors lines by `type` field:
`found` (green), `vuln` (red), `warn` (yellow), `error` (red/dim), `done` (blue), `progress` (blue/dim), `info` (white/dim), `data`/`result` (white)

## Exporter Utility

`backend/utils/exporter.py` provides `to_json()`, `to_csv()`, `to_txt()` — not currently called server-side. Export is handled client-side via `ExportButton` in `renderer/src/components/Forms/index.jsx` using `window.nexus.saveFile()` (Electron) or blob download (browser).
