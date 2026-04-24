#!/bin/bash
# ARES Dashboard Test Agent
# Tests all routes, pipes findings to qwen2.5-coder:7b for intelligent review.
# Usage: ./scripts/test_dashboard.sh [base_url]
#   default base_url: http://localhost:3001

set -e

BASE_URL="${1:-http://localhost:3001}"
MODEL="qwen2.5-coder:7b"
OLLAMA="http://localhost:11434/api/generate"
TS=$(date +%Y-%m-%d_%H-%M-%S)
REPORT_DIR="$HOME/rank-higher-media/ares/logs/dashboard_tests"
REPORT="$REPORT_DIR/report_${TS}.md"
mkdir -p "$REPORT_DIR"

ROUTES=(
  "/"
  "/dashboard"
  "/agents"
  "/tasks"
  "/admin"
  "/system-map"
)

echo "=== ARES Dashboard Test Agent ==="
echo "Base: $BASE_URL | Model: $MODEL | Report: $REPORT"
echo ""

# Collect raw findings
FINDINGS=$(mktemp)
echo "# Dashboard Test Run — $TS" > "$FINDINGS"
echo "Base URL: $BASE_URL" >> "$FINDINGS"
echo "" >> "$FINDINGS"

for ROUTE in "${ROUTES[@]}"; do
  URL="${BASE_URL}${ROUTE}"
  echo "→ Testing $URL"

  HTTP_CODE=$(curl -s -o /tmp/ares_test_body.html -w "%{http_code}" --max-time 10 "$URL" || echo "000")
  BODY=$(cat /tmp/ares_test_body.html 2>/dev/null || echo "")
  BODY_SIZE=${#BODY}

  # Extract signals
  TITLE=$(echo "$BODY" | grep -o '<title>[^<]*</title>' | head -1 | sed 's/<[^>]*>//g')
  ERROR_COUNT=$(echo "$BODY" | grep -ciE "error|exception|uncaught|failed" || true)
  NEXT_ERROR=$(echo "$BODY" | grep -ciE 'nextjs.+error|__NEXT_ERROR|application error' || true)
  FIRESTORE_MENTIONS=$(echo "$BODY" | grep -ci "firestore" || true)

  {
    echo "## Route: $ROUTE"
    echo "- HTTP: $HTTP_CODE"
    echo "- Size: ${BODY_SIZE} bytes"
    echo "- Title: $TITLE"
    echo "- Error-like mentions: $ERROR_COUNT"
    echo "- Next.js error indicators: $NEXT_ERROR"
    echo "- Firestore mentions: $FIRESTORE_MENTIONS"
    echo ""
  } >> "$FINDINGS"

  # Save short head sample for LLM review
  echo "### Body head ($ROUTE):" >> "$FINDINGS"
  echo '```html' >> "$FINDINGS"
  echo "$BODY" | head -c 1500 >> "$FINDINGS"
  echo "" >> "$FINDINGS"
  echo '```' >> "$FINDINGS"
  echo "" >> "$FINDINGS"
done

# Send findings to qwen2.5-coder:7b for a verdict
PROMPT_FILE=$(mktemp)
{
  echo "You are an ARES dashboard QA agent. Analyze these route-test findings and produce a verdict."
  echo ""
  echo "For each route, decide: PASS / WARN / FAIL."
  echo "Rules:"
  echo "- HTTP 200 + nonzero body + no Next.js error indicators = PASS."
  echo "- HTTP 200 but error indicators present = WARN."
  echo "- Non-200 HTTP or zero body = FAIL."
  echo ""
  echo "Output format (strict markdown):"
  echo ""
  echo "## Verdict"
  echo "| Route | Status | Notes |"
  echo "|---|---|---|"
  echo "| /path | PASS/WARN/FAIL | short note |"
  echo ""
  echo "## Summary"
  echo "- Overall: PASS / WARN / FAIL"
  echo "- Issues found: ..."
  echo "- Next actions: ..."
  echo ""
  echo "=== FINDINGS ==="
  cat "$FINDINGS"
} > "$PROMPT_FILE"

PAYLOAD=$(jq -n \
  --arg model "$MODEL" \
  --rawfile prompt "$PROMPT_FILE" \
  '{model: $model, prompt: $prompt, stream: false, options: {temperature: 0.2}}')

VERDICT=$(curl -s --max-time 120 "$OLLAMA" \
  -H 'Content-Type: application/json' \
  -d "$PAYLOAD" \
  | jq -r '.response // "Model returned no response"')

# Write final report
{
  echo "# ARES Dashboard Test Report"
  echo "**Timestamp:** $TS"
  echo "**Base URL:** $BASE_URL"
  echo "**Model:** $MODEL"
  echo ""
  echo "$VERDICT"
  echo ""
  echo "---"
  echo ""
  echo "# Raw Findings"
  cat "$FINDINGS"
} > "$REPORT"

rm -f "$FINDINGS" "$PROMPT_FILE" /tmp/ares_test_body.html

echo ""
echo "=== VERDICT ==="
echo "$VERDICT"
echo ""
echo "Full report: $REPORT"
