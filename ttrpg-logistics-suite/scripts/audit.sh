#!/bin/zsh
# Append npm audit and outdated to docs/SECURITY.md (run from repo root or ttrpg-logistics-suite)
set -e
SCRIPT_DIR="${0:A:h}"
ROOT="${SCRIPT_DIR:h}"
cd "$ROOT"
DATE=$(date +%Y-%m-%d)
echo "" >> docs/SECURITY.md
echo "---" >> docs/SECURITY.md
echo "## Audit $DATE" >> docs/SECURITY.md
echo "" >> docs/SECURITY.md
npm audit 2>&1 | head -80 >> docs/SECURITY.md || true
echo "" >> docs/SECURITY.md
echo "### Outdated" >> docs/SECURITY.md
npm outdated 2>&1 >> docs/SECURITY.md || true
echo "Audit complete. Review docs/SECURITY.md; fix vulns manually if needed."
