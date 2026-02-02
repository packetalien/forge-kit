# Forge-Kit

Tooling and app kit for high-fidelity TTRPG logistics and equipment management (macOS Tahoe, Electron, WebGPU, SQLite).

## Contents

- **[ttrpg-logistics-suite](./ttrpg-logistics-suite/)** — Electron-based TTRPG gear manager (grid inventory, Nested Set DB, local API, GM sync roadmap). See [ttrpg-logistics-suite/README.md](./ttrpg-logistics-suite/README.md) and [ROADMAP](./ttrpg-logistics-suite/ROADMAP.md).

## Quick start

```bash
cd ttrpg-logistics-suite && npm install && npm start
```

## Repo rules

- Root docs: README.md only here; project-specific docs live under each subproject (e.g. `ttrpg-logistics-suite/docs/`, ROADMAP.md).
- Credentials: use `~/.secrets`; never commit secrets.
- Scripts: zsh/bash, POSIX-friendly.
