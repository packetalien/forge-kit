# Security

## Policy

- Context isolation is enabled; no `nodeIntegration` in renderer.
- Preload exposes only `electronAPI.ping` via `contextBridge`.
- Local API listens on 127.0.0.1 (port 38462); not exposed to network by default.
- Credentials: if API keys are added later, use `~/.secrets` (see project credential-management rule).

## Audit

- **Initial:** Electron v33+, context isolation, CSP in index.html. No known critical CVEs for stack in use.
- **Phase 2:** WebGPU used in renderer with context isolation; GPU buffers are renderer-scoped only. No new vulns from grid/DnD (placement validated server-side via GridEngine).
- Append new findings and mitigations below.

## Best Practices

- Keep Electron and dependencies updated.
- Do not disable webSecurity or contextIsolation.
- Run `npm audit` before releases.
