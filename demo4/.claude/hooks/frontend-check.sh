#!/usr/bin/env bash
# PostToolUse hook (Edit|Write): lint + typecheck the frontend after Claude edits a TS/TSX file.
# Reads the tool payload on stdin, only acts on frontend/src/**/*.ts(x).
# Exit 2 feeds the errors back to Claude so it fixes them before moving on.
set -u

file=$(jq -r '.tool_input.file_path // .tool_response.filePath // empty')
case "$file" in
  */frontend/src/*.ts|*/frontend/src/*.tsx) ;;
  *) exit 0 ;;
esac

frontend="${file%%/src/*}"
cd "$frontend" || exit 0

out=""
if ! lint=$(npx oxlint "$file" 2>&1); then
  out+="oxlint failed on ${file#"$frontend"/}:"$'\n'"$lint"$'\n'
fi
if ! types=$(npx tsc -b 2>&1); then
  out+="tsc -b failed:"$'\n'"$(printf '%s\n' "$types" | head -30)"$'\n'
fi

if [ -n "$out" ]; then
  printf '%s' "$out" >&2
  exit 2
fi
