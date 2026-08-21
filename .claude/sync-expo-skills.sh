#!/usr/bin/env bash
# Re-sincroniza los skills reales de .agents/skills/ hacia .claude/skills/.
# Necesario en Windows: git checkout materializa los symlinks como archivos
# de texto (core.symlinks=false), y el loader de Claude Code necesita
# directorios con SKILL.md. Copiamos en lugar de enlazar.
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
src="$root/.agents/skills"
dst="$root/.claude/skills"
[ -d "$src" ] || exit 0
mkdir -p "$dst"
for d in "$src"/*/; do
  name="$(basename "$d")"
  target="$dst/$name"
  # Reemplaza solo si es stub (archivo) o difiere; conserva otros skills.
  if [ ! -d "$target/" ] || [ -f "$target" ]; then
    rm -rf "$target"
    cp -r "$d" "$target"
  fi
done
