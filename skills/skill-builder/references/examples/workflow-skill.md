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
