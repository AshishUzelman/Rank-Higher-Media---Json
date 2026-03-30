# Skill Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Claude Code skill that turns plain language, pasted docs, or URLs into fully installed, validated skill folders in one pass.

**Architecture:** A SKILL.md holds all intelligence (input detection, interview, generation, script orchestration). Three lean scripts handle mechanics: scaffold.sh creates the folder, validate.py checks spec compliance, package.sh installs and zips. All scripts are optional — Claude writes the skill content, scripts handle the filesystem.

**Tech Stack:** Bash (scaffold, package), Python 3 stdlib + optional pyyaml (validate), Markdown (SKILL.md, references)

---

### Task 1: Create source directory structure

**Files:**
- Create: `skills/skill-builder/scripts/.gitkeep`
- Create: `skills/skill-builder/references/examples/.gitkeep`
- Create: `tests/skill-builder/.gitkeep`

- [ ] **Step 1: Create directories**

```bash
mkdir -p skills/skill-builder/scripts
mkdir -p skills/skill-builder/references/examples
mkdir -p tests/skill-builder
touch skills/skill-builder/scripts/.gitkeep
touch skills/skill-builder/references/examples/.gitkeep
touch tests/skill-builder/.gitkeep
```

- [ ] **Step 2: Verify structure**

```bash
find skills/skill-builder tests/skill-builder -type d
```

Expected output:
```
skills/skill-builder
skills/skill-builder/scripts
skills/skill-builder/references
skills/skill-builder/references/examples
tests/skill-builder
```

- [ ] **Step 3: Commit**

```bash
git add skills/ tests/
git commit -m "feat: scaffold skill-builder directory structure"
```

---

### Task 2: validate.py — write test first, then implement

**Files:**
- Create: `tests/skill-builder/test_validate.py`
- Create: `skills/skill-builder/scripts/validate.py`

- [ ] **Step 1: Write the failing tests**

Create `tests/skill-builder/test_validate.py`:

```python
#!/usr/bin/env python3
"""Tests for validate.py — run before implementing validate.py to confirm RED state."""

import sys
import os
import tempfile
import subprocess

VALIDATE_SCRIPT = os.path.join(
    os.path.dirname(__file__),
    '../../skills/skill-builder/scripts/validate.py'
)


def run_validate(skill_dir):
    result = subprocess.run(
        ['python3', VALIDATE_SCRIPT, skill_dir],
        capture_output=True, text=True
    )
    return result.returncode, result.stdout + result.stderr


def make_skill(parent_dir, folder_name, frontmatter_body):
    """Create a minimal skill directory with SKILL.md."""
    skill_dir = os.path.join(parent_dir, folder_name)
    os.makedirs(skill_dir)
    content = f"---\n{frontmatter_body}\n---\n\n# Skill\n"
    with open(os.path.join(skill_dir, 'SKILL.md'), 'w') as f:
        f.write(content)
    return skill_dir


def test_valid_skill_passes():
    with tempfile.TemporaryDirectory() as d:
        skill_dir = make_skill(
            d, 'my-skill',
            'name: my-skill\ndescription: Does X. Use when user asks to do X.'
        )
        code, output = run_validate(skill_dir)
        assert code == 0, f"Expected pass, got returncode={code}: {output}"


def test_missing_skill_md_fails():
    with tempfile.TemporaryDirectory() as d:
        skill_dir = os.path.join(d, 'my-skill')
        os.makedirs(skill_dir)
        code, output = run_validate(skill_dir)
        assert code == 1, "Expected fail for missing SKILL.md"
        assert 'SKILL.md' in output


def test_name_with_uppercase_fails():
    with tempfile.TemporaryDirectory() as d:
        skill_dir = make_skill(
            d, 'my-skill',
            'name: MySkill\ndescription: Does X. Use when user asks.'
        )
        code, output = run_validate(skill_dir)
        assert code == 1, "Expected fail for uppercase name"
        assert 'kebab-case' in output


def test_name_too_long_fails():
    with tempfile.TemporaryDirectory() as d:
        long_name = 'a' * 65
        skill_dir = make_skill(
            d, long_name,
            f'name: {long_name}\ndescription: Does X. Use when user asks.'
        )
        code, output = run_validate(skill_dir)
        assert code == 1, "Expected fail for name > 64 chars"
        assert '64' in output


def test_claude_prefix_fails():
    with tempfile.TemporaryDirectory() as d:
        skill_dir = make_skill(
            d, 'claude-helper',
            'name: claude-helper\ndescription: Does X. Use when user asks.'
        )
        code, output = run_validate(skill_dir)
        assert code == 1, "Expected fail for reserved prefix"
        assert 'reserved' in output


def test_anthropic_prefix_fails():
    with tempfile.TemporaryDirectory() as d:
        skill_dir = make_skill(
            d, 'anthropic-tool',
            'name: anthropic-tool\ndescription: Does X. Use when user asks.'
        )
        code, output = run_validate(skill_dir)
        assert code == 1, "Expected fail for reserved prefix"
        assert 'reserved' in output


def test_description_too_long_fails():
    with tempfile.TemporaryDirectory() as d:
        long_desc = 'X' * 1025
        skill_dir = make_skill(
            d, 'my-skill',
            f'name: my-skill\ndescription: {long_desc}'
        )
        code, output = run_validate(skill_dir)
        assert code == 1, "Expected fail for description > 1024 chars"
        assert '1024' in output


def test_description_with_xml_fails():
    with tempfile.TemporaryDirectory() as d:
        skill_dir = make_skill(
            d, 'my-skill',
            'name: my-skill\ndescription: Does <thing>. Use when user asks.'
        )
        code, output = run_validate(skill_dir)
        assert code == 1, "Expected fail for XML angle brackets"
        assert 'angle bracket' in output


def test_name_mismatch_with_folder_fails():
    with tempfile.TemporaryDirectory() as d:
        skill_dir = make_skill(
            d, 'my-skill',
            'name: other-skill\ndescription: Does X. Use when user asks.'
        )
        code, output = run_validate(skill_dir)
        assert code == 1, "Expected fail for name/folder mismatch"
        assert 'match folder' in output


def test_missing_description_fails():
    with tempfile.TemporaryDirectory() as d:
        skill_dir = make_skill(d, 'my-skill', 'name: my-skill')
        code, output = run_validate(skill_dir)
        assert code == 1, "Expected fail for missing description"
        assert 'description' in output


if __name__ == '__main__':
    tests = [(name, obj) for name, obj in globals().items() if name.startswith('test_')]
    passed, failed = 0, 0
    for name, test in tests:
        try:
            test()
            print(f"  ✓ {name}")
            passed += 1
        except AssertionError as e:
            print(f"  ✗ {name}: {e}")
            failed += 1
    print(f"\n{passed} passed, {failed} failed")
    sys.exit(0 if failed == 0 else 1)
```

- [ ] **Step 2: Run tests — verify RED state**

```bash
python3 tests/skill-builder/test_validate.py
```

Expected: All tests fail with `FileNotFoundError` or similar — validate.py doesn't exist yet.

- [ ] **Step 3: Implement validate.py**

Create `skills/skill-builder/scripts/validate.py`:

```python
#!/usr/bin/env python3
"""Validates a Claude Code skill folder against the Agent Skills spec.

Usage: python3 validate.py <skill_dir>
Exit 0: valid. Exit 1: invalid (errors printed to stdout).
"""

import sys
import os
import re


def parse_frontmatter(content):
    """Extract and parse YAML frontmatter. Returns dict or None on error."""
    if not content.startswith('---'):
        return None, "SKILL.md must start with '---' (YAML frontmatter)"
    parts = content.split('---', 2)
    if len(parts) < 3:
        return None, "SKILL.md frontmatter not closed (missing closing '---')"
    fm_text = parts[1]
    try:
        import yaml
        fm = yaml.safe_load(fm_text)
    except ImportError:
        # Fallback: simple line-by-line key:value parsing
        fm = {}
        for line in fm_text.strip().splitlines():
            if ':' in line:
                k, _, v = line.partition(':')
                fm[k.strip()] = v.strip()
    except Exception as e:
        return None, f"Invalid YAML frontmatter: {e}"
    return fm, None


def validate_skill(skill_dir):
    errors = []
    skill_name = os.path.basename(skill_dir.rstrip('/'))

    # 1. SKILL.md must exist (exact case)
    skill_md_path = os.path.join(skill_dir, 'SKILL.md')
    if not os.path.exists(skill_md_path):
        errors.append("SKILL.md not found (must be exactly 'SKILL.md', case-sensitive)")
        return errors

    with open(skill_md_path, 'r') as f:
        content = f.read()

    fm, parse_error = parse_frontmatter(content)
    if parse_error:
        errors.append(parse_error)
        return errors
    if not fm:
        errors.append("Frontmatter is empty")
        return errors

    # 2. Validate name
    name = str(fm.get('name', '')).strip()
    if not name:
        errors.append("'name' field is required")
    else:
        valid_name = re.match(r'^[a-z0-9]([a-z0-9-]*[a-z0-9])?$', name)
        if not valid_name:
            errors.append(
                f"'name' must be kebab-case (lowercase letters, numbers, hyphens only, "
                f"no leading/trailing hyphens): got '{name}'"
            )
        if len(name) > 64:
            errors.append(f"'name' must be 64 characters or fewer: got {len(name)}")
        if name.startswith('claude') or name.startswith('anthropic'):
            errors.append(f"'name' cannot start with 'claude' or 'anthropic' (reserved): got '{name}'")
        if name != skill_name:
            errors.append(
                f"'name' field ('{name}') must match folder name ('{skill_name}')"
            )

    # 3. Validate description
    description = str(fm.get('description', '')).strip()
    if not description:
        errors.append("'description' field is required")
    else:
        if len(description) > 1024:
            errors.append(f"'description' must be 1024 characters or fewer: got {len(description)}")
        if '<' in description or '>' in description:
            errors.append("'description' must not contain XML angle brackets (< or >)")

    return errors


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: validate.py <skill_dir>")
        sys.exit(1)

    skill_dir = sys.argv[1]
    if not os.path.isdir(skill_dir):
        print(f"Error: '{skill_dir}' is not a directory")
        sys.exit(1)

    errors = validate_skill(skill_dir)
    if errors:
        print("VALIDATION FAILED:")
        for e in errors:
            print(f"  ✗ {e}")
        sys.exit(1)
    else:
        print("✓ Validation passed")
        sys.exit(0)
```

- [ ] **Step 4: Run tests — verify GREEN**

```bash
python3 tests/skill-builder/test_validate.py
```

Expected:
```
  ✓ test_valid_skill_passes
  ✓ test_missing_skill_md_fails
  ✓ test_name_with_uppercase_fails
  ✓ test_name_too_long_fails
  ✓ test_claude_prefix_fails
  ✓ test_anthropic_prefix_fails
  ✓ test_description_too_long_fails
  ✓ test_description_with_xml_fails
  ✓ test_name_mismatch_with_folder_fails
  ✓ test_missing_description_fails

10 passed, 0 failed
```

- [ ] **Step 5: Commit**

```bash
git add tests/skill-builder/test_validate.py skills/skill-builder/scripts/validate.py
git commit -m "feat: add validate.py with full spec compliance checks"
```

---

### Task 3: scaffold.sh — write test first, then implement

**Files:**
- Create: `tests/skill-builder/test_scaffold.sh`
- Create: `skills/skill-builder/scripts/scaffold.sh`

- [ ] **Step 1: Write the failing tests**

Create `tests/skill-builder/test_scaffold.sh`:

```bash
#!/bin/bash
# Tests for scaffold.sh

SCAFFOLD="$(cd "$(dirname "$0")" && pwd)/../../skills/skill-builder/scripts/scaffold.sh"
PASS=0
FAIL=0

run_test() {
  local name="$1" result="$2"
  if [[ "$result" == "pass" ]]; then
    echo "  ✓ $name"; ((PASS++))
  else
    echo "  ✗ $name: $result"; ((FAIL++))
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
```

- [ ] **Step 2: Run tests — verify RED state**

```bash
bash tests/skill-builder/test_scaffold.sh
```

Expected: All tests fail — scaffold.sh doesn't exist yet.

- [ ] **Step 3: Implement scaffold.sh**

Create `skills/skill-builder/scripts/scaffold.sh`:

```bash
#!/bin/bash
# Creates a Claude Code skill folder structure.
# Usage: scaffold.sh <skill_name> [--with-scripts] [--with-references]

set -e

SKILL_NAME="$1"
if [[ -z "$SKILL_NAME" ]]; then
  echo "Usage: scaffold.sh <skill_name> [--with-scripts] [--with-references]"
  exit 1
fi

INSTALL_DIR="$HOME/.claude/skills/$SKILL_NAME"

mkdir -p "$INSTALL_DIR"

[[ "$*" == *"--with-scripts"* ]]     && mkdir -p "$INSTALL_DIR/scripts"
[[ "$*" == *"--with-references"* ]]  && mkdir -p "$INSTALL_DIR/references/examples"

# Only write SKILL.md skeleton if one doesn't already exist
if [[ ! -f "$INSTALL_DIR/SKILL.md" ]]; then
  cat > "$INSTALL_DIR/SKILL.md" << SKILLEOF
---
name: $SKILL_NAME
description:
---

# Skill Name

## Overview

## Instructions

### Step 1:

## Examples

## Common Issues
SKILLEOF
fi

echo "Scaffolded: $INSTALL_DIR"
```

- [ ] **Step 4: Run tests — verify GREEN**

```bash
bash tests/skill-builder/test_scaffold.sh
```

Expected:
```
  ✓ creates skill directory
  ✓ creates SKILL.md
  ✓ SKILL.md has frontmatter delimiters
  ✓ creates scripts/ with --with-scripts flag
  ✓ creates references/examples/ with --with-references flag
  ✓ idempotent (preserves existing SKILL.md)

6 passed, 0 failed
```

- [ ] **Step 5: Commit**

```bash
git add tests/skill-builder/test_scaffold.sh skills/skill-builder/scripts/scaffold.sh
git commit -m "feat: add scaffold.sh for skill folder creation"
```

---

### Task 4: package.sh — write test first, then implement

**Files:**
- Create: `tests/skill-builder/test_package.sh`
- Create: `skills/skill-builder/scripts/package.sh`

- [ ] **Step 1: Write the failing tests**

Create `tests/skill-builder/test_package.sh`:

```bash
#!/bin/bash
# Tests for package.sh

PACKAGE="$(cd "$(dirname "$0")" && pwd)/../../skills/skill-builder/scripts/package.sh"
PASS=0
FAIL=0

run_test() {
  local name="$1" result="$2"
  if [[ "$result" == "pass" ]]; then
    echo "  ✓ $name"; ((PASS++))
  else
    echo "  ✗ $name: $result"; ((FAIL++))
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
```

- [ ] **Step 2: Run tests — verify RED state**

```bash
bash tests/skill-builder/test_package.sh
```

Expected: All tests fail — package.sh doesn't exist yet.

- [ ] **Step 3: Implement package.sh**

Create `skills/skill-builder/scripts/package.sh`:

```bash
#!/bin/bash
# Installs a skill to ~/.claude/skills/ and zips it for Claude.ai upload.
# Usage: package.sh <skill_dir>

set -e

SKILL_DIR="$1"
if [[ -z "$SKILL_DIR" ]]; then
  echo "Usage: package.sh <skill_dir>"
  exit 1
fi

if [[ ! -d "$SKILL_DIR" ]]; then
  echo "Error: '$SKILL_DIR' is not a directory"
  exit 1
fi

SKILL_NAME=$(basename "$SKILL_DIR")
ZIP_FILE="$(dirname "$SKILL_DIR")/${SKILL_NAME}.zip"

# Install to ~/.claude/skills/
mkdir -p "$HOME/.claude/skills"
cp -r "$SKILL_DIR" "$HOME/.claude/skills/"

# Zip for Claude.ai upload
(cd "$(dirname "$SKILL_DIR")" && zip -r "$ZIP_FILE" "$SKILL_NAME" --quiet)

echo "✓ Installed: $HOME/.claude/skills/$SKILL_NAME"
echo "✓ Zipped:    $ZIP_FILE"
```

- [ ] **Step 4: Run tests — verify GREEN**

```bash
bash tests/skill-builder/test_package.sh
```

Expected:
```
  ✓ installs skill to ~/.claude/skills/
  ✓ SKILL.md present after install
  ✓ creates zip file
  ✓ zip contains SKILL.md

4 passed, 0 failed
```

- [ ] **Step 5: Commit**

```bash
git add tests/skill-builder/test_package.sh skills/skill-builder/scripts/package.sh
git commit -m "feat: add package.sh for skill installation and zipping"
```

---

### Task 5: Write references/skill-spec.md

**Files:**
- Create: `skills/skill-builder/references/skill-spec.md`

- [ ] **Step 1: Write the file**

Create `skills/skill-builder/references/skill-spec.md`:

```markdown
# Claude Code Skill Spec — Quick Reference

## Required Files
- `SKILL.md` — exact name, case-sensitive. No README.md inside skill folder.

## Folder Naming
- kebab-case only: `my-skill` ✓
- No spaces: `My Skill` ✗
- No underscores: `my_skill` ✗
- No capitals: `MySkill` ✗

## YAML Frontmatter

### Required Fields
```yaml
---
name: skill-name           # kebab-case, 1-64 chars, matches folder name
description: What it does. Use when [trigger phrases].   # 1-1024 chars
---
```

### name Rules
- Lowercase letters, numbers, hyphens only
- Cannot start/end with a hyphen
- Cannot start with `claude` or `anthropic` (reserved)
- Must match folder name exactly

### description Rules
- Must include WHAT it does AND WHEN to trigger
- No XML angle brackets `< >`
- Include specific phrases users would actually say
- Formula: `[What it does]. Use when [trigger conditions]. [Key capabilities].`

### Optional Fields
```yaml
license: MIT
compatibility: Requires Python 3.8+, internet access
metadata:
  author: Your Name
  version: 1.0.0
  mcp-server: server-name
```

## Folder Structure
```
skill-name/
├── SKILL.md              # Required
├── scripts/              # Optional: executable code
├── references/           # Optional: docs loaded on demand
│   └── examples/
└── assets/               # Optional: templates, fonts
```

## Progressive Disclosure (3 levels)
1. **YAML frontmatter** — always loaded. Triggers the skill.
2. **SKILL.md body** — loaded when skill is relevant. Core instructions.
3. **references/ files** — loaded on demand. Heavy reference material.

## Description Formula
```
[What it does]. Use when [specific trigger phrases]. [Key capabilities].
```

Good:
```
Manages PPC campaign setup for Google Ads. Use when user says "create a campaign",
"set up ads", or "new Google Ads campaign". Handles keywords, ad copy, and bid strategy.
```

Bad:
```
Helps with projects.        ← too vague, no triggers
Creates documents.          ← missing when to use it
```

## Security
- No `<` or `>` anywhere in frontmatter
- Skills named `claude-*` or `anthropic-*` are rejected at upload
- Keep SKILL.md under 5,000 words; move heavy docs to references/
```

- [ ] **Step 2: Verify file exists**

```bash
cat skills/skill-builder/references/skill-spec.md | head -5
```

Expected first line: `# Claude Code Skill Spec — Quick Reference`

- [ ] **Step 3: Commit**

```bash
git add skills/skill-builder/references/skill-spec.md
git commit -m "feat: add skill-spec.md quick reference"
```

---

### Task 6: Write example skills in references/examples/

**Files:**
- Create: `skills/skill-builder/references/examples/workflow-skill.md`
- Create: `skills/skill-builder/references/examples/reference-skill.md`

- [ ] **Step 1: Write workflow-skill.md (Category 2 template)**

Create `skills/skill-builder/references/examples/workflow-skill.md`:

```markdown
# Example: Category 2 — Workflow Automation Skill

Use this as a template when the skill automates a multi-step process.
Key markers: numbered steps, validation gates, examples with actions+results.

---

```yaml
---
name: ppc-campaign-setup
description: Sets up Google Ads campaigns end-to-end. Use when user says "create a campaign", "set up Google Ads", "new PPC campaign", or "launch ads for [product]". Handles keywords, ad copy, bid strategy, and conversion tracking setup.
---
```

# PPC Campaign Setup

## Overview
End-to-end Google Ads campaign creation following proven SEM methodology. No steps skipped.

## Instructions

### Step 1: Gather Campaign Requirements
Collect before proceeding:
- Business/product being advertised
- Target geography
- Monthly budget
- Campaign goal: leads / sales / traffic / brand awareness
- Existing keywords or negatives if any

### Step 2: Keyword Strategy
1. Identify 10-20 core terms matching user intent
2. Expand with match types: Exact [keyword], Phrase "keyword", Broad +keyword
3. Build negative keyword list: irrelevant, competitor, informational terms
4. Group into ad groups by theme (1 theme per ad group, max 10-15 keywords each)

### Step 3: Ad Copy
For each ad group write:
- 3 headlines (30 chars max)
- 2 descriptions (90 chars max)
- Display URL paths (15 chars each)

Checklist before finalizing:
- [ ] Headline 1 contains primary keyword
- [ ] At least one headline has a CTA
- [ ] Description includes unique value prop
- [ ] No trademark violations

### Step 4: Conversion Tracking
Confirm before campaign goes live:
- [ ] Google Tag Manager installed on site
- [ ] Conversion action created in Google Ads
- [ ] Tag fires on confirmation/thank-you page

## Examples

### Example: Lead gen campaign
User says: "Set up a campaign for my law firm targeting personal injury in Toronto"
Actions:
1. Keywords: "personal injury lawyer toronto", "car accident lawyer toronto" + 15 more
2. Negatives: "free", "law school", "study", "paralegal"
3. Ad groups: Car Accidents, Slip & Fall, Medical Negligence
Result: Campaign structure ready for client review, all ad copy written

## Common Issues

### Low Quality Score
Cause: Primary keyword missing from headline or landing page
Solution: Add keyword to Headline 1 and verify it appears on the landing page

### Budget exhausting by noon
Cause: Broad match keywords with insufficient negatives
Solution: Switch to phrase/exact match, expand negative keyword list
```

- [ ] **Step 2: Write reference-skill.md (Category 1 template)**

Create `skills/skill-builder/references/examples/reference-skill.md`:

```markdown
# Example: Category 1 — Document/Asset Creation Skill

Use this as a template when the skill produces a document, report, or structured output.
Key markers: output format defined up front, quality checklist, consistent structure.

---

```yaml
---
name: seo-audit-report
description: Generates SEO audit reports following Ashish's methodology. Use when user says "audit this site", "run an SEO audit", "create an SEO report", or "analyze [site] for SEO issues". Produces executive summary, full audit, and prioritized action list.
---
```

# SEO Audit Report

## Overview
Creates structured SEO audit reports: understand current position → technical audit →
content gaps → backlinks → prioritized recommendations. Every finding gets a fix.

## Instructions

### Step 1: Gather Inputs
Collect or accept:
- Target site URL
- GSC data if available (top queries, CTR, impressions by page)
- Any existing crawl data or previous audit

### Step 2: Structure the Report
Always use this section order:
1. Executive Summary (plain language, 1 page)
2. Current Position Analysis
3. Technical Audit
4. Content Gap Analysis
5. Backlink Profile
6. Priority Action List (High / Medium / Low)

### Step 3: Priority Action List Rules
Every item must include:
- **What:** specific, actionable fix (not vague)
- **Why:** business impact
- **Priority:** High / Medium / Low
- **How:** step-by-step instructions

Priority thresholds:
- High: blocking rankings or causing measurable traffic loss
- Medium: meaningful improvement, not urgent
- Low: minor improvement, do when bandwidth allows

### Step 4: Quality Checklist
Before finalizing:
- [ ] Every problem has a fix — no bare findings
- [ ] Executive summary uses plain language (no jargon)
- [ ] All priorities rated High/Medium/Low
- [ ] Tone is direct: "do this" not "consider doing this"
- [ ] Each section has data supporting it

## Output Format
Markdown with clear H2/H3 sections. Ready to export as PDF.
Include a "Quick Wins" summary at the top of the Priority Action List.

## Common Issues

### Report too long, client won't read it
Cause: All findings listed at equal weight
Solution: Lead with Quick Wins (High priority, easy fixes). Executive summary max 1 page.

### Vague recommendations
Cause: Writing "improve page speed" without specifics
Solution: Always include the specific element and the fix: "Compress hero image on /services (currently 2.4MB, target under 200KB using TinyPNG)"
```

- [ ] **Step 3: Verify both files**

```bash
ls skills/skill-builder/references/examples/
```

Expected:
```
reference-skill.md
workflow-skill.md
```

- [ ] **Step 4: Commit**

```bash
git add skills/skill-builder/references/examples/
git commit -m "feat: add Category 1 and 2 example skills to references"
```

---

### Task 7: Write SKILL.md — the brain

**Files:**
- Create: `skills/skill-builder/SKILL.md`

- [ ] **Step 1: Write SKILL.md**

Create `skills/skill-builder/SKILL.md`:

```markdown
---
name: skill-builder
description: Builds complete, validated Claude Code skills from any input. Use when user says "build me a skill for X", "create a skill that does X", "turn this doc into a skill", "make a skill from this URL", "I need a skill that handles X", or wants to package a workflow as a reusable Claude Code skill.
---

# Skill Builder

## Overview
Factory for creating Claude Code skills. Takes plain language, pasted documents, or URLs
and produces a complete, installed, validated skill folder in one pass.

Before starting, consult `references/skill-spec.md` for naming rules and frontmatter requirements.
For structure templates, see `references/examples/`.

## Instructions

### Step 1: Detect and Process Input

**URL** (user provides a link):
- Use WebFetch to retrieve the page content
- Extract: workflow steps, API operations, tool names, domain concepts, trigger conditions

**Pasted document or SOP** (user pastes text):
- Extract workflow steps directly from the content
- Identify trigger conditions from the document's stated purpose
- Note any tools, MCPs, or dependencies mentioned

**Plain language** (user describes what they want):
- Ask AT MOST 3 questions, one at a time, stopping early if intent is clear:
  1. "What specific workflow or task should this skill handle?"
  2. "What would a user say to activate it? Give me 3-5 example phrases."
  3. "Does this need any MCPs or external tools, or is it standalone?"

**Structured data** (JSON/YAML workflow):
- Parse steps and keys directly into the skill structure

### Step 2: Choose Skill Category

**Category 1 — Document/Asset Creation**: Makes files, reports, designs, code
- Template: `references/examples/reference-skill.md`
- Key elements: output format defined, quality checklist, consistent section order

**Category 2 — Workflow Automation**: Multi-step process with consistent methodology
- Template: `references/examples/workflow-skill.md`
- Key elements: numbered steps, validation gates, examples with actions+results

**Category 3 — MCP Enhancement**: Workflow guidance on top of an MCP server
- Same structure as Category 2 but steps reference specific MCP tool calls

### Step 3: Design the Folder Structure

Decide what supporting files are needed:
- `scripts/` — only if deterministic validation or file operations are required
- `references/` — if reference material exceeds ~100 lines or examples are reusable
- Keep SKILL.md focused: move heavy docs to references/, keep instructions in SKILL.md body

### Step 4: Write SKILL.md Content

**Frontmatter** (consult `references/skill-spec.md` for all rules):
```yaml
---
name: skill-name-in-kebab-case
description: [What it does]. Use when [specific trigger phrases]. [Key capabilities].
---
```

Description checklist:
- Includes BOTH what it does AND when to trigger
- Under 1024 characters
- No XML angle brackets (< or >)
- 3-5 specific phrases a user would actually say
- Mentions file types or MCPs if relevant

**Body structure** (scale each section to its complexity):
```markdown
# Skill Name

## Overview
[Core purpose in 1-2 sentences]

## Instructions

### Step 1: [First step]
[Clear, actionable instruction with specifics]

### Step 2: [Second step]

## Examples

### Example: [Common scenario]
User says: "[trigger phrase]"
Actions: [numbered steps]
Result: [what user gets]

## Common Issues

### [Error or failure type]
Cause: [why it happens]
Solution: [specific fix]
```

### Step 5: Scaffold the Folder

Run scaffold.sh to create the folder structure:
```bash
bash ~/.claude/skills/skill-builder/scripts/scaffold.sh <skill-name>
# Add --with-scripts if scripts/ is needed
# Add --with-references if references/ is needed
```

Write the generated SKILL.md content to the scaffolded file:
```
~/.claude/skills/<skill-name>/SKILL.md
```

### Step 6: Validate

Run validate.py to check spec compliance:
```bash
python3 ~/.claude/skills/skill-builder/scripts/validate.py ~/.claude/skills/<skill-name>
```

If validation fails:
- Read the specific error message
- Fix the issue in SKILL.md (most common: name format, description length, XML chars)
- Re-run validation
- Do NOT proceed to package until validation passes

### Step 7: Install and Package

```bash
bash ~/.claude/skills/skill-builder/scripts/package.sh ~/.claude/skills/<skill-name>
```

This copies to `~/.claude/skills/<skill-name>/` and creates `<skill-name>.zip` for Claude.ai upload.

### Step 8: Output Summary

Always end with:
```
✓ Skill built: <skill-name>
  Installed: ~/.claude/skills/<skill-name>/
  Zip:       <skill-name>.zip  ← upload to Claude.ai: Settings → Capabilities → Skills

Test it with:
  - "<trigger phrase 1>"
  - "<trigger phrase 2>"
  - "<trigger phrase 3>"
```

## Notes
- New skills are available immediately in your next Claude Code session
- To share or upload to Claude.ai: use the .zip file created by package.sh
- If pyyaml is not installed, validate.py falls back to simple line parsing — install with: `pip3 install pyyaml`
```

- [ ] **Step 2: Verify SKILL.md is valid**

```bash
# Quick sanity check — name and description present, no XML brackets
head -6 skills/skill-builder/SKILL.md
```

Expected:
```
---
name: skill-builder
description: Builds complete, validated Claude Code skills from any input. Use when user says "build me a skill for X"...
---
```

- [ ] **Step 3: Commit**

```bash
git add skills/skill-builder/SKILL.md
git commit -m "feat: add SKILL.md — core skill-builder workflow"
```

---

### Task 8: Install skill-builder and smoke test

**Files:**
- No new files — deploys source to `~/.claude/skills/skill-builder/`

- [ ] **Step 1: Validate the source skill first**

```bash
python3 skills/skill-builder/scripts/validate.py skills/skill-builder
```

Expected: `✓ Validation passed`

- [ ] **Step 2: Install skill-builder to Claude Code skills directory**

```bash
mkdir -p ~/.claude/skills
cp -r skills/skill-builder ~/.claude/skills/
```

- [ ] **Step 3: Verify install**

```bash
ls ~/.claude/skills/skill-builder/
```

Expected:
```
SKILL.md    references/    scripts/
```

- [ ] **Step 4: Smoke test — run validate on the installed copy**

```bash
python3 ~/.claude/skills/skill-builder/scripts/validate.py ~/.claude/skills/skill-builder
```

Expected: `✓ Validation passed`

- [ ] **Step 5: Smoke test — scaffold a test skill**

```bash
bash ~/.claude/skills/skill-builder/scripts/scaffold.sh smoke-test-skill
```

Expected: `Scaffolded: /Users/ashishuzelman/.claude/skills/smoke-test-skill`

- [ ] **Step 6: Clean up test skill**

```bash
rm -rf ~/.claude/skills/smoke-test-skill
```

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: skill-builder complete — install, validate, smoke test passing"
```

---

## Self-Review

**Spec coverage:**
- ✓ All 4 input types handled (Step 1 in SKILL.md)
- ✓ scaffold.sh creates folder + SKILL.md skeleton
- ✓ validate.py checks all mechanical spec rules
- ✓ package.sh installs + zips
- ✓ references/skill-spec.md quick reference
- ✓ 2 example skills (workflow + reference categories)
- ✓ Install target: `~/.claude/skills/`
- ✓ pyyaml fallback handled

**Placeholder scan:** None found. All steps have exact code, exact commands, exact expected output.

**Type consistency:** `validate_skill(skill_dir)` defined in Task 2, used in same file only. `scaffold.sh` takes `<skill_name>` as arg in both Tasks 3 and 8. `package.sh` takes `<skill_dir>` in both Tasks 4 and 8. Consistent throughout.
