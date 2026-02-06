#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:8080}"
EXAMPLES_DIR="${EXAMPLES_DIR:-../examples}"

echo "==> Quickstart check against ${API_BASE}"

echo "1/4 healthz"
curl -fsS "${API_BASE}/healthz" >/dev/null

echo "2/4 hash"
curl -fsS -X POST "${API_BASE}/v1/hash/sha256" \
  -H "content-type: application/json" \
  --data @"${EXAMPLES_DIR}/hash-request.json" >/dev/null

echo "3/4 verify manifest"
curl -fsS -X POST "${API_BASE}/v1/verify/manifest" \
  -H "content-type: application/json" \
  --data @"${EXAMPLES_DIR}/verify-manifest-request.json" >/dev/null

echo "4/4 verify receipt"
curl -fsS -X POST "${API_BASE}/v1/verify/receipt" \
  -H "content-type: application/json" \
  --data @"${EXAMPLES_DIR}/verify-receipt-request.json" >/dev/null

echo "Quickstart check passed."
