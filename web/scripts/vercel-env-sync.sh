#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.production}"
VERCEL_ENV="${2:-production}"
GIT_BRANCH="${3:-}"

if ! command -v vercel >/dev/null 2>&1; then
  echo "Error: vercel CLI is not installed. Install with: npm i -g vercel" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: env file not found: $ENV_FILE" >&2
  exit 1
fi

if [[ "$VERCEL_ENV" != "production" && "$VERCEL_ENV" != "preview" && "$VERCEL_ENV" != "development" ]]; then
  echo "Error: environment must be one of: production, preview, development" >&2
  exit 1
fi

VERCEL_ARGS=()
if [[ -n "${VERCEL_SCOPE:-}" ]]; then
  VERCEL_ARGS+=(--scope "$VERCEL_SCOPE")
fi
if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  VERCEL_ARGS+=(--token "$VERCEL_TOKEN")
fi

SYNCED=0
SKIPPED=0

while IFS= read -r raw || [[ -n "$raw" ]]; do
  line="${raw%$'\r'}"
  trimmed_start="$(printf '%s' "$line" | sed -E 's/^[[:space:]]+//')"

  if [[ -z "${line//[[:space:]]/}" || "${trimmed_start#\#}" != "$trimmed_start" ]]; then
    continue
  fi

  if [[ "$line" != *=* ]]; then
    echo "Skipping invalid line (no '='): $line"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  key="${line%%=*}"
  value="${line#*=}"
  key="$(printf '%s' "$key" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//')"

  if [[ -z "$key" ]]; then
    echo "Skipping invalid line (empty key): $line"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  if [[ "$value" == \"*\" && "$value" == *\" ]]; then
    value="${value:1:${#value}-2}"
  elif [[ "$value" == \'*\' && "$value" == *\' ]]; then
    value="${value:1:${#value}-2}"
  fi

  echo "Syncing $key -> $VERCEL_ENV"

  if [[ -n "$GIT_BRANCH" ]]; then
    printf 'y\n' | vercel env rm "$key" "$VERCEL_ENV" "$GIT_BRANCH" "${VERCEL_ARGS[@]}" >/dev/null 2>&1 || true
    printf '%s\n' "$value" | vercel env add "$key" "$VERCEL_ENV" "$GIT_BRANCH" "${VERCEL_ARGS[@]}" >/dev/null
  else
    printf 'y\n' | vercel env rm "$key" "$VERCEL_ENV" "${VERCEL_ARGS[@]}" >/dev/null 2>&1 || true
    printf '%s\n' "$value" | vercel env add "$key" "$VERCEL_ENV" "${VERCEL_ARGS[@]}" >/dev/null
  fi

  SYNCED=$((SYNCED + 1))
done < "$ENV_FILE"

echo "Done. Synced $SYNCED variable(s) from $ENV_FILE to Vercel $VERCEL_ENV environment. Skipped $SKIPPED line(s)."
