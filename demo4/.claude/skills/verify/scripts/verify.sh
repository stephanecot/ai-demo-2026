#!/usr/bin/env bash
# Definition of done for demo4: runs the real commands and prints a PASS/FAIL board.
# Usage: verify.sh [--change <name>] [--skip-backend] [--skip-frontend]
set -u

JAVA_HOME_25=/opt/homebrew/Cellar/openjdk/25.0.2/libexec/openjdk.jdk/Contents/Home
ROOT=$(cd "$(dirname "$0")/../../../.." && pwd)
CHANGE=""; RUN_BACKEND=1; RUN_FRONTEND=1
while [ $# -gt 0 ]; do
  case "$1" in
    --change) CHANGE="$2"; shift 2 ;;
    --skip-backend) RUN_BACKEND=0; shift ;;
    --skip-frontend) RUN_FRONTEND=0; shift ;;
    *) echo "unknown option: $1" >&2; exit 64 ;;
  esac
done

LOG=$(mktemp -d)
declare -a NAMES STATUSES
fail=0

run() { # run <label> <dir> <cmd...>
  local label="$1" dir="$2"; shift 2
  local log="$LOG/${label//[^a-zA-Z0-9]/_}.log"
  echo "▶ $label"
  if (cd "$dir" && "$@" >"$log" 2>&1); then
    NAMES+=("$label"); STATUSES+=("PASS")
  else
    NAMES+=("$label"); STATUSES+=("FAIL"); fail=1
    echo "  ✗ FAIL — last lines of output:"
    tail -25 "$log" | sed 's/^/    /'
  fi
}

if [ "$RUN_BACKEND" = 1 ]; then
  if [ -d "$JAVA_HOME_25" ]; then export JAVA_HOME="$JAVA_HOME_25"; fi
  run "backend: ./mvnw test" "$ROOT/backend" ./mvnw -q test
fi

if [ "$RUN_FRONTEND" = 1 ]; then
  run "frontend: npm run typecheck" "$ROOT/frontend" npm run -s typecheck
  run "frontend: npm run lint"      "$ROOT/frontend" npm run -s lint
  run "frontend: npm test"          "$ROOT/frontend" npm run -s test
fi

if command -v openspec >/dev/null 2>&1; then
  if [ -n "$CHANGE" ]; then
    run "openspec validate $CHANGE" "$ROOT" openspec validate "$CHANGE"
    if [ -f "$ROOT/openspec/changes/$CHANGE/tasks.md" ]; then
      open_tasks=$(grep -c '^\s*- \[ \]' "$ROOT/openspec/changes/$CHANGE/tasks.md" || true)
      NAMES+=("openspec tasks left in $CHANGE"); STATUSES+=("$open_tasks open")
    fi
  else
    run "openspec validate --all" "$ROOT" openspec validate --all
  fi
fi

echo
echo "=== VERIFY SUMMARY ==="
for i in "${!NAMES[@]}"; do
  printf '%-6s %s\n' "${STATUSES[$i]}" "${NAMES[$i]}"
done
echo "logs: $LOG"
exit $fail
