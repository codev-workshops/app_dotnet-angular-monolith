#!/usr/bin/env bash
# Stop all services started by run-all.sh.
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE"
for name in customers products inventory orders gateway; do
  if [ -f ".run/$name.pid" ]; then
    pid="$(cat ".run/$name.pid")"
    if kill "$pid" 2>/dev/null; then echo "stopped $name (pid $pid)"; fi
    rm -f ".run/$name.pid"
  fi
done
