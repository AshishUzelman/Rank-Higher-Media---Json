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

### Step 7: Self-Critique Before Installing

Before running package.sh, review the generated skill:
- Does the description clearly explain what triggers this skill? Would a user naturally say one of those phrases?
- Are the instructions specific enough that another Claude instance could follow them without ambiguity?
- Does the skill scope match what was requested — not too narrow, not over-engineered?

Fix any issues, re-validate if frontmatter changed.

### Step 8: Install and Package

```bash
bash ~/.claude/skills/skill-builder/scripts/package.sh ~/.claude/skills/<skill-name>
```

This copies to `~/.claude/skills/<skill-name>/` and creates `<skill-name>.zip` for Claude.ai upload.

### Step 9: Output Summary

Always end with:
```
✓ Skill built: <skill-name>
  Installed: ~/.claude/skills/<skill-name>/
  Zip:       <skill-name>.zip  ← upload to Claude.ai: Settings → Capabilities → Skills

Test it with:
  - "<trigger phrase 1>"
  - "<trigger phrase 2>"
  - "<trigger phrase 3>"

Tip: If this skill represents a reusable workflow, consider adding it to ~/ashish-skills/ so agents and teams can install it.
```

## Notes
- New skills are available immediately in your next Claude Code session
- To share or upload to Claude.ai: use the .zip file created by package.sh
- If pyyaml is not installed, validate.py falls back to simple line parsing — install with: `pip3 install pyyaml`
