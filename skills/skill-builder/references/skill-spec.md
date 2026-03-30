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
