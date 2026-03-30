#!/bin/bash
# Tests for package.sh

PACKAGE="$(cd "$(dirname "$0")" && pwd)/../../skills/skill-builder/scripts/package.sh"
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

# Create a mock valid skill
mkdir -p "$TMPDIR/my-skill"
printf -- "---\nname: my-skill\ndescription: Test skill. Use when testing.\n---\n\n# My Skill\n" \
  > "$TMPDIR/my-skill/SKILL.md"

# Run package.sh
HOME="$TMPDIR" bash "$PACKAGE" "$TMPDIR/my-skill"

# Test: installs to ~/.claude/skills/
[[ -d "$TMPDIR/.claude/skills/my-skill" ]] \
  && run_test "installs skill to ~/.claude/skills/" "pass" \
  || run_test "installs skill to ~/.claude/skills/" "not found at $TMPDIR/.claude/skills/my-skill"

# Test: SKILL.md present after install
[[ -f "$TMPDIR/.claude/skills/my-skill/SKILL.md" ]] \
  && run_test "SKILL.md present after install" "pass" \
  || run_test "SKILL.md present after install" "SKILL.md missing after install"

# Test: creates zip file
[[ -f "$TMPDIR/my-skill.zip" ]] \
  && run_test "creates zip file" "pass" \
  || run_test "creates zip file" "my-skill.zip not found in $TMPDIR"

# Test: zip contains SKILL.md
unzip -l "$TMPDIR/my-skill.zip" 2>/dev/null | grep -q "SKILL.md" \
  && run_test "zip contains SKILL.md" "pass" \
  || run_test "zip contains SKILL.md" "SKILL.md not in zip"

echo ""
echo "$PASS passed, $FAIL failed"
[[ $FAIL -eq 0 ]]
