#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:8080}"
API_KEY="${HUB_API_KEY:-}"

echo "== Health =="
curl -sS "$BASE_URL/health" | python3 -m json.tool

echo "\n== Models =="
if [[ -n "$API_KEY" ]]; then
  curl -sS -H "x-api-key: $API_KEY" "$BASE_URL/models" | python3 -m json.tool
else
  curl -sS "$BASE_URL/models" | python3 -m json.tool
fi

echo "\n== Chat (smart alias) =="
REQ='{"model":"smart","messages":[{"role":"user","content":"Say hi in one short sentence."}]}'
if [[ -n "$API_KEY" ]]; then
  curl -sS -H "x-api-key: $API_KEY" -H "content-type: application/json" -d "$REQ" "$BASE_URL/v1/chat/completions" | python3 -m json.tool
else
  curl -sS -H "content-type: application/json" -d "$REQ" "$BASE_URL/v1/chat/completions" | python3 -m json.tool
fi
