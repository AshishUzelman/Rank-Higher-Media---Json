# Skill Builder — Design Spec
**Date:** 2026-03-29
**Status:** Approved
**Sub-system:** 1 of 3 (Skill Builder → Scraper → Plugin Packager)

---

## Problem

Ashish needs to build many skills at scale for his agents and teams. Existing tools (Anthropic's `skill-creator`) are interactive and manual — they don't handle batch creation, multi-input types, or produce install-ready output automatically. The gap: a builder that accepts any starting point and produces a fully installed, validated skill in one pass.

---

## Solution

A Claude Code skill (`skill-builder`) that acts as a skill factory. It detects input type, extracts workflow knowledge, generates a complete valid SKILL.md, scaffolds the folder, validates frontmatter, and installs the skill — all in one invocation.

---

## Architecture

### Install Location
```
~/.claude/skills/skill-builder/     ← personal Claude Code skills dir
├── SKILL.md
├── scripts/
│   ├── scaffold.sh
│   ├── validate.py
│   └── package.sh
└── references/
    ├── skill-spec.md
    └── examples/
        ├── workflow-skill.md
        └── reference-skill.md
```

### Source / Version Control
```
~/rank-higher-media/.claude/worktrees/dazzling-bartik/
└── skills/
    └── skill-builder/              ← source lives here, synced to ~/.claude/skills/
```

---

## Components

### SKILL.md (the brain)
All intelligence lives here. Handles:
- Input detection (URL / pasted doc / plain language)
- Interview workflow (≤3 questions for plain language input)
- Use case extraction
- SKILL.md generation (frontmatter + body)
- Script orchestration (scaffold → validate → package)
- Summary output

**Trigger phrases:**
- "build me a skill for X"
- "create a skill that does X"
- "turn this doc into a skill"
- "make a skill from this URL"
- "I need a skill that handles X"

### scaffold.sh (~20 lines, Bash)
- Creates `~/.claude/skills/<name>/` directory structure
- Writes blank SKILL.md skeleton with frontmatter delimiters
- Creates `scripts/` and `references/` stubs if needed
- Idempotent — safe to re-run

### validate.py (~40 lines, Python)
Checks against the Anthropic Agent Skills spec:
- YAML frontmatter parses cleanly
- `name`: kebab-case, no spaces/caps, 1–64 chars, no "claude"/"anthropic" prefix
- `description`: 1–1024 chars, no XML angle brackets
- `SKILL.md` file exists at root (exact case)
- Folder name matches `name` field
Returns: pass/fail with specific error messages

### package.sh (~10 lines, Bash)
- Zips the skill folder
- Copies unzipped version to `~/.claude/skills/<name>/` for immediate use
- Outputs: install confirmation + trigger phrases to test

### references/skill-spec.md
Quick-reference loaded on demand:
- All frontmatter fields (required + optional)
- Naming rules
- Forbidden patterns
- Description formula: `[What it does] + [When to use it] + [Trigger phrases]`
- Progressive disclosure pattern (3 levels)

### references/examples/
Two examples Claude uses as templates during generation:
- `workflow-skill.md` — Category 2: multi-step workflow with validation gates
- `reference-skill.md` — Category 1: doc/asset creation with quality checklist

---

## Workflow (end-to-end)

```
User invokes skill-builder
        ↓
Detect input type
  ├── URL → WebFetch → extract content
  ├── Pasted doc → parse workflow steps directly
  └── Plain language → interview (≤3 questions)
        ↓
Extract 2–3 concrete use cases
        ↓
Draft frontmatter (name, description, trigger phrases)
        ↓
Write SKILL.md body (steps, examples, error handling)
        ↓
Run scaffold.sh → create folder structure
        ↓
Write generated SKILL.md to folder
        ↓
Run validate.py → check spec compliance
  ├── Pass → continue
  └── Fail → fix inline → re-validate
        ↓
Run package.sh → install to ~/.claude/skills/<name>/
        ↓
Summary: name, location, trigger phrases to test
```

---

## Input Types

| Input | How Claude handles it |
|-------|----------------------|
| Plain language ("build a skill for PPC campaign setup") | ≤3 question interview: what does it do, when should it trigger, any MCPs/tools needed |
| Pasted doc / SOP / workflow | Direct extraction — Claude reads steps and converts to skill structure |
| URL | WebFetch → read page → extract workflow/API info → generate reference or workflow skill |
| Structured data (JSON/YAML workflow) | Parse directly into skill steps |

---

## Output

- Installed skill at `~/.claude/skills/<name>/`
- Zipped copy for Claude.ai upload (if needed)
- Summary message with: skill name, install path, 3 trigger phrases to test

---

## Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Script language | Bash for scaffold/package, Python for validate | Bash has no deps; Python's `yaml` module gives reliable YAML parsing |
| Intelligence location | SKILL.md only | Avoids subprocess complexity; Claude reasons better than scripts for judgment calls |
| Install target | `~/.claude/skills/` | Personal skills dir for Claude Code — immediate availability, no restart needed |
| Validation scope | Frontmatter only (mechanical rules) | Triggering quality and instruction quality are judgment calls — Claude handles those inline |
| Examples in references/ | 2 examples (workflow + reference) | Covers the two most common skill categories Ashish will build |

---

## Success Criteria

- Skill triggers correctly on all trigger phrases above
- Given any of the 4 input types, produces a valid installable skill in one pass
- `validate.py` catches all spec violations before install
- Generated skills trigger correctly when tested (90%+ of relevant queries)
- Zero manual folder creation or copy-pasting required

---

## Out of Scope (covered by Sub-systems 2 & 3)

- Bulk/batch URL scraping (Sub-system 2: Scraper)
- Bundling multiple skills into a distributable plugin (Sub-system 3: Packager)
- Skill versioning and update management (Sub-system 3)
