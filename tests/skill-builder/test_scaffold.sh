#!/bin/bash
# Tests for scaffold.sh

SCAFFOLD="$(cd "$(dirname "$0")" && pwd)/../../skills/skill-builder/scripts/scaffold.sh"
PASS=0
FAIL=0

run_test() {
  local name="$1" result="$2"
  if [[ "$result" == "pass" ]]; then
    echo "  ✓ $name"; ((PASS++)) || true
  else
    echo "  ✗ $name: $result"; ((FAIL++)) || true
  fi
}

TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

# Test: creates skill directory
HOME="$TMPDIR" bash "$SCAFFOLD" test-skill 2>/dev/null
[[ -d "$TMPDIR/.claude/skills/test-skill" ]] \
  && run_test "creates skill directory" "pass" \
  || run_test "creates skill directory" "directory not created at $TMPDIR/.claude/skills/test-skill"

# Test: creates SKILL.md
[[ -f "$TMPDIR/.claude/skills/test-skill/SKILL.md" ]] \
  && run_test "creates SKILL.md" "pass" \
  || run_test "creates SKILL.md" "SKILL.md not found"

# Test: SKILL.md contains frontmatter delimiters
grep -q "^---" "$TMPDIR/.claude/skills/test-skill/SKILL.md" 2>/dev/null \
  && run_test "SKILL.md has frontmatter delimiters" "pass" \
  || run_test "SKILL.md has frontmatter delimiters" "no --- found in SKILL.md"

# Test: --with-scripts creates scripts/ dir
HOME="$TMPDIR" bash "$SCAFFOLD" test-skill-scripts --with-scripts 2>/dev/null
[[ -d "$TMPDIR/.claude/skills/test-skill-scripts/scripts" ]] \
  && run_test "creates scripts/ with --with-scripts flag" "pass" \
  || run_test "creates scripts/ with --with-scripts flag" "scripts/ not created"

# Test: --with-references creates references/examples/ dir
HOME="$TMPDIR" bash "$SCAFFOLD" test-skill-refs --with-references 2>/dev/null
[[ -d "$TMPDIR/.claude/skills/test-skill-refs/references/examples" ]] \
  && run_test "creates references/examples/ with --with-references flag" "pass" \
  || run_test "creates references/examples/ with --with-references flag" "references/examples/ not created"

# Test: idempotent — does not overwrite existing SKILL.md
echo "existing content" > "$TMPDIR/.claude/skills/test-skill/SKILL.md"
HOME="$TMPDIR" bash "$SCAFFOLD" test-skill 2>/dev/null
grep -q "existing content" "$TMPDIR/.claude/skills/test-skill/SKILL.md" \
  && run_test "idempotent (preserves existing SKILL.md)" "pass" \
  || run_test "idempotent (preserves existing SKILL.md)" "overwrote existing content"

echo ""
echo "$PASS passed, $FAIL failed"
[[ $FAIL -eq 0 ]]
