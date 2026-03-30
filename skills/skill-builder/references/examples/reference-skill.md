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
