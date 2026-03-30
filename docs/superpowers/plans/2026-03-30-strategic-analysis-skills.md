# Strategic Analysis Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 3 Claude Code skills in `~/ashish-skills/strategic/` — strategic-intake (Director), competitive-intel (Worker 1), strategic-analysis (Worker 2) — that together cover client onboarding, competitive data collection, and 8 strategic frameworks, producing organized client deliverables with PPT outlines.

**Architecture:** Three skills in a pipeline: strategic-intake diagnoses what's needed and outputs a work-order.md → competitive-intel collects data from DataForSEO + free APIs and outputs an intel-brief.md → strategic-analysis runs selected frameworks and outputs reports + summary + slides-outline.md. Each skill can also run independently.

**Tech Stack:** Markdown skill files following ashish-skills pattern (frontmatter + SKILL.md + references/). Validation via `~/.claude/skills/skill-builder/scripts/validate.py`. Install via `~/.claude/skills/skill-builder/scripts/package.sh`.

---

## File Map

**New files — 17 total:**

```
~/ashish-skills/strategic/
  strategic-intake/
    SKILL.md
    references/
      intake-questions.md
      framework-selector.md
  competitive-intel/
    SKILL.md
    references/
      datasources.md
      intel-brief-template.md
  strategic-analysis/
    SKILL.md
    references/
      frameworks/
        competitor-analysis.md
        swot.md
        pestel.md
        tows.md
        soar.md
        vrio.md
        gap-analysis.md
        five-forces.md
      report-format.md
      slides-outline.md
```

**Output folders (client data — gitignored):**
```
~/rank-higher-media/clients/
  [client-slug]/
    intake.md
    _index.md
    [YYYY-MM-DD]/
      work-order.md
      intel-brief.md
      [framework].md
      summary.md
      slides-outline.md
```

---

## Task 1: Scaffold Directory Structure

**Files:**
- Create: `~/ashish-skills/strategic/` (all subdirectories)
- Create: `~/rank-higher-media/clients/.gitkeep`

- [ ] **Step 1: Create all skill directories**

```bash
mkdir -p ~/ashish-skills/strategic/strategic-intake/references
mkdir -p ~/ashish-skills/strategic/competitive-intel/references
mkdir -p ~/ashish-skills/strategic/strategic-analysis/references/frameworks
```

- [ ] **Step 2: Create the clients output folder and gitignore it**

```bash
mkdir -p ~/rank-higher-media/clients
touch ~/rank-higher-media/clients/.gitkeep
```

Add to `~/rank-higher-media/.gitignore` (open file and append):
```
# Client output data — never commit
clients/*/
!clients/.gitkeep
```

- [ ] **Step 3: Verify structure**

```bash
find ~/ashish-skills/strategic -type d
```

Expected output:
```
/Users/ashishuzelman/ashish-skills/strategic
/Users/ashishuzelman/ashish-skills/strategic/strategic-intake
/Users/ashishuzelman/ashish-skills/strategic/strategic-intake/references
/Users/ashishuzelman/ashish-skills/strategic/competitive-intel
/Users/ashishuzelman/ashish-skills/strategic/competitive-intel/references
/Users/ashishuzelman/ashish-skills/strategic/strategic-analysis
/Users/ashishuzelman/ashish-skills/strategic/strategic-analysis/references
/Users/ashishuzelman/ashish-skills/strategic/strategic-analysis/references/frameworks
```

- [ ] **Step 4: Commit scaffold**

```bash
cd ~/ashish-skills
git add strategic/
git commit -m "feat: scaffold strategic analysis skills directory structure"
```

---

## Task 2: Write strategic-intake/SKILL.md

**Files:**
- Create: `~/ashish-skills/strategic/strategic-intake/SKILL.md`

- [ ] **Step 1: Write the file**

```markdown
---
name: strategic-intake
description: Expert onboarding agent for new client engagements. Diagnoses which strategic analysis frameworks are needed and sequences the work. Use when "new client [company]", "onboard [company]", "what analysis do I need for [client/goal]", "strategic intake for [company]", "what should I run for [client]", "start a new engagement".
---

# Strategic Intake

## Overview
Director-level skill. Conducts a structured intake for any new client or engagement, scores the answers
against a framework selector matrix, identifies competitor targets, and outputs a `work-order.md` —
the sequenced plan for running competitive-intel and strategic-analysis.

Intake question bank + scoring rules: `references/intake-questions.md`
Framework selector matrix: `references/framework-selector.md`

## Instructions

### Step 1: Collect Basic Client Info
Ask these three questions first, one at a time:
1. What is the client's name and primary URL?
2. What industry and primary service/product are they in?
3. What is the primary decision this analysis needs to support?
   Options: new market entry / competitive positioning / growth planning /
   resource-capability audit / annual strategy review / quick competitive snapshot / product launch

### Step 2: Check for Existing Intake
Before asking any more questions, check:
- Does `~/rank-higher-media/clients/[client-slug]/intake.md` exist?
- If YES: load it, show the client summary, then ask only: "What's changed since last time?" and
  "What decision is this engagement supporting?" Skip Steps 3–4 if answers are unchanged.
- If NO: proceed with full intake questionnaire below.

### Step 3: Run the Intake Questionnaire
Load `references/intake-questions.md`. Ask each question one at a time. Score each answer as you go.
Six questions total — running score determines framework recommendations.

### Step 4: Identify Competitors
Ask these in order, one at a time:
1. "Who are your top 3 direct competitors?" (if unknown: "What companies do your customers
   consider instead of you?")
2. "Are there emerging players or alternative solutions to watch?"
3. "Are there indirect competitors — different approach, same customer problem?"

If client cannot name competitors, note this. DataForSEO Domain Analytics can surface
keyword-overlap competitors after the intel phase runs.

### Step 5: Apply Framework Selector
Using the decision type from Step 1 + intake scores from Step 3, apply the matrix in
`references/framework-selector.md`. Output: ordered list of recommended frameworks with
one-line rationale for each. Maximum 4 frameworks per engagement — more is scope creep.

### Step 6: Build and Save Work Order
Produce the following as `~/rank-higher-media/clients/[client-slug]/[YYYY-MM-DD]/work-order.md`:

```
# Work Order — [Client Name]
Date: [YYYY-MM-DD]
Engagement: [decision being supported]

## Client
- Name: [name]
- URL: [url]
- Industry: [industry]
- Primary service: [service]

## Competitor Targets
- [competitor 1 name]: [URL]
- [competitor 2 name]: [URL]
- [competitor 3 name]: [URL]

## Recommended Analysis Sequence

1. competitive-intel
   - Target URLs: [client URL + all competitor URLs]
   - Priority data: [what's most critical for this specific decision]

2. strategic-analysis
   Frameworks to run (in this order):
   - [framework 1] — [one-line rationale]
   - [framework 2] — [one-line rationale]
   - [framework 3 if needed] — [one-line rationale]

## Final Deliverable
[Description: e.g., "Full strategic report + PPT outline for board presentation" or
"Quick competitive snapshot for pricing decision"]

## Compliance / Sensitivity Notes
[Any flags: health claims, legal language, confidentiality, regulated industry]
```

### Step 7: Save Intake Record
- Save/update: `~/rank-higher-media/clients/[client-slug]/intake.md`
  (append new entry with date if file exists; create if new client)
- Update: `~/rank-higher-media/clients/[client-slug]/_index.md`
  (add new run entry: date | decision | frameworks run | status)

## Common Issues

### Client doesn't know their competitors
Use this prompt: "Think about a customer who chose not to hire you — who did they go with instead?"
Note the gap in work-order.md. DataForSEO will surface competitors by keyword overlap after intel runs.

### Too many frameworks requested
Rule: max 4 per engagement. More than 4 = scope creep = reports no one reads.
Prioritize by: decision timeline (short = quick wins, annual = full stack) and
data available (no intel yet = SWOT only; full intel = PESTEL + Five Forces + TOWS).

### Recurring client (intake.md exists)
Load existing intake first. Ask only about changes + new decision. Update intake.md, don't replace it.
Historical record of past engagements lives in the same file.
```

- [ ] **Step 2: Validate**

```bash
python3 ~/.claude/skills/skill-builder/scripts/validate.py ~/ashish-skills/strategic/strategic-intake
```

Expected: `✓ Validation passed`

- [ ] **Step 3: Commit**

```bash
cd ~/ashish-skills
git add strategic/strategic-intake/SKILL.md
git commit -m "feat: add strategic-intake SKILL.md"
```

---

## Task 3: Write strategic-intake Reference Files

**Files:**
- Create: `~/ashish-skills/strategic/strategic-intake/references/intake-questions.md`
- Create: `~/ashish-skills/strategic/strategic-intake/references/framework-selector.md`

- [ ] **Step 1: Write intake-questions.md**

```markdown
# Intake Questions — Full Bank

Ask these 6 questions in order, one at a time. Score each answer and keep a running total.
Final score + decision type feeds into framework-selector.md.

---

## Q1: Business Stage
**Ask:** "Where is the business right now — are they growing, defending their position,
entering a new market, or in some kind of transition?"

| Answer | Score |
|--------|-------|
| Actively growing / expanding | +2 competitive, +2 growth |
| Defending against competitors | +3 competitive, +1 risk |
| Entering a new market or launching a product | +3 external, +2 competitive |
| Restructuring / cost-cutting / pivoting | +2 internal, +2 gap |
| Stable / maintaining | +1 competitive, +1 growth |

---

## Q2: Competitive Maturity
**Ask:** "How well do they know their competitive landscape — do they track competitors
actively, or is this mostly unknown territory?"

| Answer | Score |
|--------|-------|
| Track competitors closely (share of voice, pricing, ads) | +1 competitive |
| Know competitors by name but limited intel | +2 competitive |
| Minimal awareness — don't really know who they're competing with | +3 competitive, +3 external |
| Market is fragmented — many small competitors | +2 external, +2 five-forces |

---

## Q3: Decision Horizon
**Ask:** "Is the decision this analysis supports something they need to act on in the next
30–90 days, or is this longer-term strategic planning (6–12+ months out)?"

| Answer | Score |
|--------|-------|
| Short-term (30–90 days) — tactical decision | +2 quick-wins |
| Medium-term (3–6 months) | +1 competitive, +1 growth |
| Long-term (6–12+ months) — annual or strategic planning | +2 external, +2 growth, +2 internal |

---

## Q4: Industry Regulatory Environment
**Ask:** "Does their industry have significant regulation, compliance requirements, or
environmental/political factors that affect how they operate or market?"

| Answer | Score |
|--------|-------|
| Heavily regulated (legal, health, finance, government) | +3 external (PESTEL critical) |
| Some regulation but manageable | +1 external |
| Minimal regulation | 0 |
| Undergoing regulatory change right now | +3 external, +2 risk |

---

## Q5: Internal Resource Clarity
**Ask:** "Do they have a clear picture of what makes them better than competitors —
their unique capabilities, advantages, or resources?"

| Answer | Score |
|--------|-------|
| Very clear — can articulate specific advantages | 0 |
| Somewhat clear but not formally analyzed | +2 internal (VRIO useful) |
| Not clear — they're not sure what their real advantages are | +3 internal (VRIO critical) |
| Recently changed (new team, acquisition, pivot) | +3 internal, +2 gap |

---

## Q6: Growth vs Defense Orientation
**Ask:** "Is the primary goal here to identify growth opportunities, or to protect and
defend what they already have?"

| Answer | Score |
|--------|-------|
| Pure growth — find new opportunities, expand | +3 growth (SOAR), +2 gap |
| Pure defense — protect market share, respond to threats | +3 competitive, +2 risk |
| Both — grow while managing threats | +1 competitive, +1 growth, +1 risk |
| Recovery — rebuild after setback | +2 internal, +2 gap, +1 growth |

---

## Scoring Summary

After all 6 questions, tally scores by category:

| Category | What It Drives |
|----------|---------------|
| `competitive` score ≥ 4 | → Competitor Analysis + SWOT required |
| `external` score ≥ 4 | → PESTEL required |
| `growth` score ≥ 4 | → SOAR + Gap Analysis |
| `internal` score ≥ 4 | → VRIO + Gap Analysis |
| `five-forces` score ≥ 2 | → Five Forces |
| `quick-wins` score ≥ 2 | → Limit to Competitor Analysis + SWOT (skip long frameworks) |
| SWOT already done | → TOWS upgrades SWOT to action plan automatically |

Pass the category scores and decision type to `framework-selector.md`.
```

- [ ] **Step 2: Write framework-selector.md**

```markdown
# Framework Selector Matrix

Input: decision type + category scores from intake-questions.md
Output: ordered list of frameworks to run, max 4 per engagement

---

## By Decision Type (primary selector)

| Decision Type | Required | Recommended | Skip |
|---------------|----------|-------------|------|
| New market entry | PESTEL, Five Forces | SWOT, VRIO | SOAR, Gap Analysis |
| Competitive positioning | Competitor Analysis, SWOT | TOWS, Five Forces | SOAR |
| Growth planning | SOAR, Gap Analysis | TOWS, SWOT | PESTEL (unless regulated) |
| Resource/capability audit | VRIO, Gap Analysis | SWOT | PESTEL, SOAR |
| Annual strategy review | SWOT, PESTEL | TOWS, Five Forces | SOAR (unless growth-focused) |
| Quick competitive snapshot | Competitor Analysis | SWOT | All others |
| Product launch | Competitor Analysis, PESTEL | SWOT, VRIO | SOAR, Gap Analysis |

---

## Score Overrides (secondary selector)

These override or add to the decision type selections:

| Condition | Action |
|-----------|--------|
| `competitive` ≥ 4 AND SWOT is in plan | Add TOWS — turns SWOT into action strategies |
| `external` ≥ 5 | Elevate PESTEL to Required regardless of decision type |
| `internal` ≥ 4 | Add VRIO — they need to understand their own advantages |
| `quick-wins` ≥ 2 | Limit total frameworks to 2 max — speed over depth |
| `growth` ≥ 4 AND `competitive` ≥ 4 | Run SWOT → TOWS → SOAR in that order |

---

## Framework Sequence Rules

Always run frameworks in this order when multiple apply:
1. Competitor Analysis (establishes the competitive baseline — everything else builds on it)
2. SWOT (internal + external snapshot — needed before TOWS)
3. PESTEL (macro context — informs SWOT threats/opportunities)
4. Five Forces (industry structure — if market entry or competitive intensity is the question)
5. TOWS (only after SWOT exists — converts analysis to strategies)
6. VRIO (internal capability deep-dive)
7. SOAR (after competitive picture is established)
8. Gap Analysis (last — defines the delta from current to desired state)

---

## Common Combinations

**New client, unknown market:**
Competitor Analysis → PESTEL → SWOT → TOWS

**Established client, competitive threat:**
Competitor Analysis → SWOT → TOWS → Five Forces

**Growth planning, strong internal clarity:**
SOAR → Gap Analysis → TOWS

**Annual strategy review:**
Competitor Analysis → PESTEL → SWOT → TOWS

**Quick pitch / proposal support:**
Competitor Analysis → SWOT only

---

## What Each Framework Answers

| Framework | Primary Question |
|-----------|-----------------|
| Competitor Analysis | Who are we competing with and how do we compare right now? |
| SWOT | What are our strengths, weaknesses, opportunities, and threats? |
| PESTEL | What external forces could help or hurt us over the next 12–24 months? |
| TOWS | Given our SWOT, what specific strategies should we pursue? |
| SOAR | Where are our greatest growth opportunities and what do we aspire to? |
| VRIO | Which of our resources give us a real, sustainable competitive advantage? |
| Gap Analysis | What's the gap between where we are and where we need to be? |
| Five Forces | How intense is competition in this industry and where is the power? |
```

- [ ] **Step 3: Commit**

```bash
cd ~/ashish-skills
git add strategic/strategic-intake/references/
git commit -m "feat: add strategic-intake reference files (intake-questions, framework-selector)"
```

---

## Task 4: Write competitive-intel/SKILL.md

**Files:**
- Create: `~/ashish-skills/strategic/competitive-intel/SKILL.md`

- [ ] **Step 1: Write the file**

```markdown
---
name: competitive-intel
description: Competitive intelligence data collection agent. Pulls traffic, ad strategy, SEO, tech stack, audience, and search demand data for a client and their competitors. Use when "pull intel on [URL/company]", "competitive brief for [client]", "research [company]'s competitors", "run competitive intel", "gather data for [client]". Outputs a structured intel-brief.md.
---

# Competitive Intel

## Overview
Worker 1 in the strategic analysis pipeline. Collects competitive intelligence across
5 categories using DataForSEO as the primary engine, supplemented by free APIs and
guided manual pulls. Takes a list of URLs (client + competitors) as input.
Outputs a structured `intel-brief.md` ready for strategic-analysis to consume.

Data sources + API patterns: `references/datasources.md`
Intel brief output template: `references/intel-brief-template.md`

## Instructions

### Step 1: Confirm Inputs
Before collecting data, confirm:
- Client name and URL
- Competitor URLs (1–5 targets)
- Primary intelligence goal (what decision does this intel need to support?)
- Load `work-order.md` if available at `~/rank-higher-media/clients/[slug]/[date]/work-order.md`

If no work-order.md, ask: "What's the most important question this intel needs to answer?"
This determines which data categories to prioritize.

### Step 2: Traffic & Market Position
For each URL (client + competitors), collect using DataForSEO Labs API:
- Estimated monthly organic traffic
- Estimated traffic value (CPC equivalent)
- Top 10 organic keywords by traffic share
- Domain authority / domain rating

Note relative positioning: who leads on traffic, who's catching up, who's declining.

See `references/datasources.md` → Section 1 for DataForSEO Labs endpoints.

### Step 3: Ad Strategy & PPC Intelligence
For each URL, collect using DataForSEO Ads Transparency API:
- Active Google ads (headlines, descriptions, landing pages)
- Estimated ad spend (if available)
- Top paid keywords
- Ad copy patterns (what messaging are they using?)

Also check: Meta Ad Library (manual — browser only) for Facebook/Instagram ads.
Note: what offers, hooks, and objection-handling are competitors using in ads?

See `references/datasources.md` → Section 2.

### Step 4: SEO & Keyword Intelligence
For each URL, collect using DataForSEO (SERP API + Backlinks API):
- Top 20 organic keywords ranked
- People Also Ask questions for core service terms
- Backlink count + referring domains
- On-page: title tags, H1s, meta descriptions for top 5 pages
- Content gaps: keywords competitors rank for that client doesn't

This section feeds directly into the FAQ demand analysis (Ashish's methodology):
For each PAA question: Is it answered on the client's site? Yes / Partially / No.

See `references/datasources.md` → Section 3.

### Step 5: Tech Stack
For each URL, collect using DataForSEO Domain Technologies API:
- CRM
- Analytics platform
- CMS / website platform
- Live chat / support tools
- Marketing automation
- Payment processor (if applicable)

Cross-reference with BuiltWith free API for verification on key findings.

See `references/datasources.md` → Section 4.

### Step 6: Audience & Search Demand
Collect the following:
- Google Trends: trend direction for core service terms (use trendspyg or manual)
  — Is demand growing, stable, or declining?
- Reddit API: search subreddits relevant to the industry for:
  — What questions customers are asking
  — What complaints appear repeatedly
  — What language customers use to describe their problem
- AnswerThePublic (3 free searches/day) or DataForSEO PAA for expanded question bank

Ashish's FAQ methodology: the questions customers ask on Reddit and in PAA are the
real entry points. A fleet manager searching "how to save on fuel for truck fleet" cares
about cost and insight — not tech specs. Content must meet them at that question first.

See `references/datasources.md` → Section 5.

### Step 7: E-E-A-T Assessment (per competitor)
For each competitor, assess visible trust signals:
- Experience: Does content show real expertise or is it generic? Case studies? Original data?
- Expertise: Credentials, certifications, author bios visible?
- Authoritativeness: Press mentions, industry associations, backlinks from authority sites?
- Trustworthiness: Reviews visible above fold? Privacy policy? Contact info clear?

Score each: Strong / Partial / Weak per E-E-A-T pillar.
This reveals where the client can differentiate on trust, not just product.

### Step 8: Assemble Intel Brief
Use the template in `references/intel-brief-template.md`.
Flag any data that couldn't be collected as [DATA UNAVAILABLE — reason].
Never leave blanks — always explain why data is missing.

Save to: `~/rank-higher-media/clients/[client-slug]/[YYYY-MM-DD]/intel-brief.md`

## Common Issues

### DataForSEO returns sparse data for small/new domains
For domains with low traffic, DFS Labs may return minimal results.
Fallback: use Google Search Console data (if you have access to client's GSC),
expand to broader keyword categories, note the data gap in the brief.

### Competitor runs no ads
This is a finding, not a gap. Note it as: "[Competitor] runs no paid search —
organic-only strategy. Their top organic keywords are [X, Y, Z]."

### Can't identify key PAA questions
Use DataForSEO SERP API with People Also Ask element for service + location combos.
If still sparse, use Reddit API to surface customer language directly.
```

- [ ] **Step 2: Validate**

```bash
python3 ~/.claude/skills/skill-builder/scripts/validate.py ~/ashish-skills/strategic/competitive-intel
```

Expected: `✓ Validation passed`

- [ ] **Step 3: Commit**

```bash
cd ~/ashish-skills
git add strategic/competitive-intel/SKILL.md
git commit -m "feat: add competitive-intel SKILL.md"
```

---

## Task 5: Write competitive-intel Reference Files

**Files:**
- Create: `~/ashish-skills/strategic/competitive-intel/references/datasources.md`
- Create: `~/ashish-skills/strategic/competitive-intel/references/intel-brief-template.md`

- [ ] **Step 1: Write datasources.md**

```markdown
# Competitive Intel — Data Sources Guide

## Data Source Tiers

**Tier 1 — DataForSEO (primary engine, pay-per-call)**
API base: `https://api.dataforseo.com/v3/`
Auth: Basic auth (login:password base64 encoded)
Existing patterns: see seo-audit-workflow skill for DataForSEO call examples.

**Tier 2 — Free APIs (programmatic)**
- Google Search Console API (free, OAuth2 — client sites you manage)
- BuiltWith API (free tier, 1 req/sec — tech stack)
- Reddit API (free non-commercial, OAuth2 — audience research)
- trendspyg (open-source Python — Google Trends data)

**Tier 3 — Manual browser pulls**
- Meta Ad Library (competitor Facebook/Instagram ads)
- SparkToro (50 searches/month — audience hangouts)
- AnswerThePublic (3 searches/day — FAQ visualization)
- Google Trends browser (quick trend checks)

---

## Section 1: Traffic & Market Position

**DataForSEO Labs API — Domain Overview**
Endpoint: `POST /v3/dataforseo_labs/google/domain_overview/live`

Request body:
```json
{
  "target": "competitor.com",
  "location_name": "Canada",
  "language_name": "English",
  "include_subdomains": true
}
```

Returns: organic_traffic_estimate, organic_etv, organic_keywords_count, domain_rank

**DataForSEO Labs — Ranked Keywords**
Endpoint: `POST /v3/dataforseo_labs/google/ranked_keywords/live`

Request body:
```json
{
  "target": "competitor.com",
  "location_name": "Canada",
  "language_name": "English",
  "limit": 20,
  "order_by": ["traffic_percent,desc"]
}
```

Returns: top keywords driving organic traffic with volume, position, traffic share.

---

## Section 2: Ad Strategy & PPC

**DataForSEO Ads Transparency API**
Endpoint: `POST /v3/serp/google/ads/live/regular`

Request body:
```json
{
  "keyword": "[competitor brand name]",
  "location_name": "Canada",
  "language_name": "English",
  "device": "desktop"
}
```

Also use: `POST /v3/serp/google/ads_transparency/search/live`
```json
{
  "advertiser_domain": "competitor.com",
  "location_name": "Canada"
}
```

Returns: ad headlines, descriptions, display URLs, landing pages.

**Meta Ad Library (manual)**
URL: https://www.facebook.com/ads/library/
Search by: advertiser name or URL
Filter: Country = Canada (or relevant), Status = Active
Export: manual — screenshot or copy ad copy text

---

## Section 3: SEO & Keywords

**DataForSEO SERP API — People Also Ask**
Endpoint: `POST /v3/serp/google/organic/live/regular`

Request body:
```json
{
  "keyword": "[service] [city]",
  "location_name": "Canada",
  "language_name": "English",
  "device": "desktop",
  "depth": 10
}
```

In the response, extract items where `type == "people_also_ask_element"`.
For click depth on PAA: add `"click_depth": 2` to get expanded question sets.

**DataForSEO Backlinks API — Summary**
Endpoint: `POST /v3/backlinks/summary/live`

Request body:
```json
{
  "target": "competitor.com",
  "include_subdomains": true
}
```

Returns: total_backlinks, referring_domains, domain_rank, referring_ips.

**DataForSEO Labs — Keyword Gap**
Endpoint: `POST /v3/dataforseo_labs/google/bulk_keyword_difficulty/live`
Use to compare client domain vs competitor domain keyword overlap.

---

## Section 4: Tech Stack

**DataForSEO Domain Technologies API**
Endpoint: `POST /v3/domain_analytics/technologies/domain_technologies/live`

Request body:
```json
{
  "target": "competitor.com"
}
```

Returns: technologies grouped by category (analytics, crm, cms, chat, marketing automation, etc.)

**BuiltWith Free API (verification)**
Endpoint: `GET https://api.builtwith.com/free1/api.json?KEY=[your_key]&LOOKUP=[domain]`
Rate limit: 1 request/second
Returns: technology groups and categories (not full tech names on free tier)
Get key at: builtwith.com/free-api

---

## Section 5: Audience & Search Demand

**Reddit API (audience research)**
Endpoint: `GET https://oauth.reddit.com/r/[subreddit]/search`
Auth: OAuth2 — register app at reddit.com/prefs/apps
Rate limit: 100 queries/min authenticated

Search strategy:
1. Find relevant subreddits for the industry (e.g., r/fleet, r/trucking, r/smallbusiness)
2. Search for: "[service problem]", "[competitor name]", "[pain point keywords]"
3. Look for: top comments on pain points, recurring questions, language patterns
4. Extract: exact phrases customers use to describe their problem

**trendspyg (Google Trends data)**
Install: `pip install trendspyg`
Usage:
```python
from trendspyg import TrendReq
pytrends = TrendReq()
pytrends.build_payload(["keyword 1", "keyword 2"], timeframe="today 12-m", geo="CA")
interest_over_time = pytrends.interest_over_time()
```

Returns: trend data comparable to Google Trends browser — is demand growing or shrinking?

**Google Search Console API (client's own data)**
Console: console.cloud.google.com
Library: google-api-python-client
Scope: https://www.googleapis.com/auth/webmasters.readonly

Use to: pull actual queries driving clicks, impressions, CTR, position for the client site.
This is the ground truth for "what do our customers actually search for."

---

## Fallback Priority

If DataForSEO is unavailable or returns sparse data:
1. Google Search Console API for client site data (always works if GSC access exists)
2. BuiltWith for tech stack
3. Reddit search (manual) for customer language
4. Google Trends browser + screenshot for trend direction
5. Note all gaps in intel-brief.md with [DATA UNAVAILABLE — reason]
```

- [ ] **Step 2: Write intel-brief-template.md**

```markdown
# Intel Brief Template

Use this structure for every intel-brief.md output.
Replace [placeholders] with actual data.
Mark unavailable data as: [DATA UNAVAILABLE — reason]

---

# Intel Brief — [Client Name] vs [Competitor 1], [Competitor 2], [Competitor 3]
**Date:** [YYYY-MM-DD]
**Prepared for:** [Engagement / Decision being supported]
**Data sources used:** [list: DataForSEO Labs, DataForSEO SERP API, BuiltWith, Reddit, etc.]

---

## 1. Traffic & Market Position

| Metric | [Client] | [Competitor 1] | [Competitor 2] | [Competitor 3] |
|--------|----------|----------------|----------------|----------------|
| Est. monthly organic traffic | | | | |
| Est. traffic value ($/mo) | | | | |
| Total ranked keywords | | | | |
| Domain authority | | | | |

**Key finding:** [1–2 sentences — who leads, who's catching up, biggest gap]

---

## 2. Ad Strategy

### [Client]
- Running ads: Yes / No
- Top paid keywords: [list]
- Ad messaging themes: [what benefits/hooks are they emphasizing]

### [Competitor 1]
- Running ads: Yes / No
- Estimated monthly spend: [if available]
- Top paid keywords: [list]
- Ad messaging themes: [what benefits/hooks are they emphasizing]
- Notable ad copy: "[headline example]" — [what makes it effective/ineffective]

### [Competitor 2]
[same structure]

**Key finding:** [who's most aggressive on paid, what messaging is winning, gaps to exploit]

---

## 3. SEO & Keyword Intelligence

### Top Keywords by Traffic Share

| Keyword | Volume | [Client] Pos. | [Comp 1] Pos. | [Comp 2] Pos. |
|---------|--------|---------------|---------------|---------------|
| [keyword] | [vol] | | | |

### People Also Ask — FAQ Demand Analysis

| Question | Monthly Volume (est.) | Client Answers It? | Priority |
|----------|-----------------------|--------------------|----------|
| [question] | [vol] | Yes / Partially / No | High / Med / Low |

**Key finding:** [how many PAA questions go unanswered on client site, biggest opportunity]

### Backlink Comparison

| Metric | [Client] | [Comp 1] | [Comp 2] |
|--------|----------|----------|----------|
| Referring domains | | | |
| Total backlinks | | | |

---

## 4. Tech Stack

| Category | [Client] | [Comp 1] | [Comp 2] |
|----------|----------|----------|----------|
| CMS | | | |
| Analytics | | | |
| CRM | | | |
| Marketing automation | | | |
| Live chat | | | |
| Other notable | | | |

**Key finding:** [any tech advantages, gaps, or notable differences]

---

## 5. Audience & Search Demand

### Trend Direction (trendspyg / Google Trends)
- [Core service term 1]: [Growing / Stable / Declining] — [context]
- [Core service term 2]: [Growing / Stable / Declining] — [context]

### Customer Language (Reddit research)
Top pain points expressed by customers in [relevant subreddits]:
- "[exact quote or paraphrase from customer post]" — [frequency / upvotes signal]
- "[exact quote]"
- "[exact quote]"

Entry-point questions (what customers search BEFORE they search for the solution):
- "[FAQ-style question]" — connects to: [client service/product]
- "[FAQ-style question]" — connects to: [client service/product]

**Key finding:** [the real customer problem in plain language, and how competitors are/aren't addressing it]

---

## 6. E-E-A-T Assessment

| E-E-A-T Pillar | [Client] | [Comp 1] | [Comp 2] |
|----------------|----------|----------|----------|
| Experience (case studies, original data) | Strong/Partial/Weak | | |
| Expertise (credentials, author bios) | Strong/Partial/Weak | | |
| Authority (press, backlinks, associations) | Strong/Partial/Weak | | |
| Trust (reviews, contact, privacy policy) | Strong/Partial/Weak | | |

**Key finding:** [where client can differentiate on trust]

---

## 7. Summary — Top 5 Strategic Insights

1. [Most important competitive finding]
2. [Biggest opportunity identified]
3. [Most significant threat or risk]
4. [Key differentiator the client has or needs]
5. [Recommended entry point for content / messaging strategy]

---

## Data Gaps & Limitations
[List any data that was unavailable, why, and what would resolve it]
```

- [ ] **Step 3: Commit**

```bash
cd ~/ashish-skills
git add strategic/competitive-intel/references/
git commit -m "feat: add competitive-intel reference files (datasources, intel-brief-template)"
```

---

## Task 6: Write strategic-analysis/SKILL.md

**Files:**
- Create: `~/ashish-skills/strategic/strategic-analysis/SKILL.md`

- [ ] **Step 1: Write the file**

```markdown
---
name: strategic-analysis
description: Runs strategic analysis frameworks (SWOT, PESTEL, TOWS, SOAR, VRIO, Gap Analysis, Five Forces, Competitor Analysis) on competitive intelligence data. Use when "run PESTEL for [client]", "full strategic analysis", "SWOT on [company]", "run the frameworks from the work order", "analyze [client] using [framework]", "strategic report for [client]".
---

# Strategic Analysis

## Overview
Worker 2 in the strategic analysis pipeline. Takes an `intel-brief.md` as input (or manually
provided data). Runs one or more strategic frameworks. Produces individual framework reports,
a synthesized summary, and a PowerPoint deck outline.

Framework guides: `references/frameworks/[framework-name].md`
Report format: `references/report-format.md`
Slides structure: `references/slides-outline.md`

## Instructions

### Step 1: Confirm Inputs
Before running any framework:
- Load `intel-brief.md` from `~/rank-higher-media/clients/[slug]/[date]/intel-brief.md`
  (or ask user to paste the data if no brief is available)
- Load `work-order.md` if available — it specifies which frameworks to run and in what order
- If no work-order: ask "Which framework(s) should I run, or should I recommend based on the data?"

### Step 2: Run Frameworks in Sequence
Run one framework at a time, in the order specified by work-order.md or framework-selector.md.
For each framework:
1. State: "Running [Framework Name] for [Client]..."
2. Load `references/frameworks/[framework].md` for the methodology
3. Apply the framework using intel-brief data
4. Output the completed framework report
5. Save to: `~/rank-higher-media/clients/[slug]/[date]/[framework-name].md`

Never batch multiple frameworks without pausing to review each one.
Each framework must be fully completed before starting the next.

### Step 3: Framework Report Structure
Each framework report must contain all five sections:
1. **Data inputs used** — which intel-brief sections informed this analysis
2. **Framework grid/matrix** — the completed visual structure for this framework
3. **Key findings** — 3–5 bullets, specific to this client's situation
4. **Strategic implications** — what this means for the client in plain language
5. **Recommended actions** — prioritized High / Medium / Low with effort estimates

See `references/report-format.md` for exact section templates per framework.

### Step 4: Build Summary Report
After all frameworks are complete, produce `summary.md`:

Structure:
1. Executive Overview (3–5 sentences, plain language, written for a business owner)
2. Top 3 Strategic Priorities (across all frameworks — ranked)
3. Risks to Watch (top 3, specific and actionable)
4. Quick Wins — what can be acted on this month
5. Full Action List (all recommendations from all frameworks, deduplicated, sorted by priority)

Save to: `~/rank-higher-media/clients/[slug]/[date]/summary.md`

### Step 5: Build Slides Outline
Using the framework outputs and summary, produce `slides-outline.md`.
See `references/slides-outline.md` for the standard deck structure.
Adapt the deck to the specific engagement — not every slide is needed for every client.

Save to: `~/rank-higher-media/clients/[slug]/[date]/slides-outline.md`

### Step 6: Update Client Index
Add a run entry to `~/rank-higher-media/clients/[slug]/_index.md`:
```
| [YYYY-MM-DD] | [frameworks run] | [decision supported] | Complete |
```

## Common Issues

### Intel brief is incomplete or missing sections
Use available data. Flag gaps explicitly in each framework: "[INSUFFICIENT DATA — competitor
traffic not available. Assumption used: [X]. Validate when DataForSEO access confirmed.]"
Never fabricate data to fill a framework cell.

### Frameworks contradict each other
This is valuable, not a problem. Note the contradiction explicitly in the summary:
"SWOT identified X as a strength; VRIO analysis suggests this advantage may not be
sustainable because [Y]. Recommend reviewing before committing to this as a core differentiator."

### Client has no meaningful differentiation
VRIO and Gap Analysis will surface this. Don't sugarcoat it. Name the gap:
"No identified resource provides a sustainable competitive advantage at this time.
Priority recommendation: identify and invest in building one of [X, Y, Z]."
```

- [ ] **Step 2: Validate**

```bash
python3 ~/.claude/skills/skill-builder/scripts/validate.py ~/ashish-skills/strategic/strategic-analysis
```

Expected: `✓ Validation passed`

- [ ] **Step 3: Commit**

```bash
cd ~/ashish-skills
git add strategic/strategic-analysis/SKILL.md
git commit -m "feat: add strategic-analysis SKILL.md"
```

---

## Task 7: Write Framework Reference Files (Part 1: Competitor Analysis, SWOT, PESTEL, TOWS)

**Files:**
- Create: `~/ashish-skills/strategic/strategic-analysis/references/frameworks/competitor-analysis.md`
- Create: `~/ashish-skills/strategic/strategic-analysis/references/frameworks/swot.md`
- Create: `~/ashish-skills/strategic/strategic-analysis/references/frameworks/pestel.md`
- Create: `~/ashish-skills/strategic/strategic-analysis/references/frameworks/tows.md`

- [ ] **Step 1: Write competitor-analysis.md**

```markdown
# Competitor Analysis Framework

**Purpose:** Side-by-side comparison of the client vs key competitors across dimensions
that matter for the specific decision at hand.

**Primary question:** Who are we competing with, how do we compare right now,
and where are the exploitable gaps?

**Always run first** — establishes the competitive baseline that all other frameworks reference.

---

## Data Inputs (from intel-brief.md)
- Section 1: Traffic & Market Position
- Section 2: Ad Strategy
- Section 3: SEO & Keywords (especially PAA / FAQ demand)
- Section 4: Tech Stack
- Section 6: E-E-A-T Assessment

---

## Framework Structure

### Comparison Matrix

| Dimension | [Client] | [Comp 1] | [Comp 2] | [Comp 3] |
|-----------|----------|----------|----------|----------|
| Organic traffic (est.) | | | | |
| Paid search presence | | | | |
| Keyword coverage | | | | |
| Top 3 keywords | | | | |
| Content depth | Thin/Med/Deep | | | |
| E-E-A-T score | Strong/Partial/Weak | | | |
| Tech stack sophistication | Basic/Mid/Advanced | | | |
| Brand awareness signals | Low/Med/High | | | |
| Pricing position (if known) | | | | |
| Primary value proposition | | | | |

### Content & Messaging Analysis

For each competitor, identify:
- **Primary hook** (what's their lead message? what problem do they claim to solve first?)
- **Proof points** (how do they establish credibility? numbers? case studies? testimonials?)
- **CTA strategy** (what action do they push? free trial? contact? demo? pricing page?)
- **FAQ/content strategy** (do they answer the PAA questions customers are asking?)

### Traffic Source Mix (if available)
| Source | [Client] | [Comp 1] | [Comp 2] |
|--------|----------|----------|----------|
| Organic search | % | % | % |
| Paid search | % | % | % |
| Direct | % | % | % |
| Social | % | % | % |
| Referral | % | % | % |

---

## Output Format

### Key Findings (3–5 bullets)
- [Who leads overall and why]
- [Biggest gap the client has vs the field]
- [Best opportunity the client has that competitors haven't captured]
- [Most dangerous competitive threat]
- [Messaging/positioning gap to exploit]

### Strategic Implications
[2–3 sentences: what this competitive picture means for the client's strategy]

### Recommended Actions
| Action | Priority | Effort | Expected Impact |
|--------|----------|--------|----------------|
| [specific action] | High/Med/Low | Low/Med/High | [plain language impact] |
```

- [ ] **Step 2: Write swot.md**

```markdown
# SWOT Analysis Framework

**Purpose:** Internal and external snapshot — what the client does well, where they're
weak, what opportunities exist, and what threatens them.

**Primary question:** What is our current strategic position?

**Run second** — after Competitor Analysis establishes the external context.
**Required before TOWS** — TOWS is built entirely from the SWOT output.

---

## Data Inputs (from intel-brief.md + Competitor Analysis)
- Competitor Analysis output (defines competitive context for S/W)
- Section 1: Traffic data (relative position = strength or weakness)
- Section 3: Keyword gaps (opportunities)
- Section 5: Trend data + customer language (opportunities and threats)
- Section 6: E-E-A-T assessment (strengths and weaknesses)

---

## Framework Structure

### The SWOT Grid

**STRENGTHS** (internal, positive — what the client does well or has that competitors don't)
Examples to probe: proprietary tech, strong local reputation, specialized expertise,
better E-E-A-T signals, loyal customer base, cost structure advantage, certifications.

**WEAKNESSES** (internal, negative — where the client falls short vs competitors)
Examples to probe: thin content, poor technical SEO, weak backlink profile, no paid
presence, lower brand awareness, pricing disadvantage, limited service area.

**OPPORTUNITIES** (external, positive — market conditions the client could exploit)
Examples to probe: underserved PAA questions, competitor weakness to exploit,
growing search demand, regulatory change favoring client, competitors not running ads.

**THREATS** (external, negative — market conditions that could hurt the client)
Examples to probe: well-funded competitor entering the market, declining search demand,
regulatory risk, economic conditions, emerging substitutes, Google algorithm changes.

### Completed Grid Format

| | Helpful | Harmful |
|---|---------|---------|
| **Internal** | **Strengths:** [list 3–5 specific items] | **Weaknesses:** [list 3–5 specific items] |
| **External** | **Opportunities:** [list 3–5 specific items] | **Threats:** [list 3–5 specific items] |

---

## Rules for Good SWOT Entries
- Every entry must be SPECIFIC to this client — no generic SWOT filler
- Strength: "Ranks #1 for 'pilates classes Dorval' — capturing 65% of local search intent"
  NOT: "Good reputation"
- Weakness: "No content addressing the top 12 PAA questions customers ask"
  NOT: "Website needs improvement"
- Opportunity: "Competitor A stopped running Google Ads in March — their paid traffic dropped 40%"
  NOT: "Growing market"
- Threat: "Google AI Overview now appearing for 3 of client's top 5 keywords, reducing CTR"
  NOT: "Competition is increasing"

---

## Output Format

### Key Findings (3–5 bullets)
[Most important insights from each quadrant]

### Strategic Implications
[2–3 sentences: what this SWOT snapshot tells you about the client's strategic position]

### Recommended Actions
| Action | Priority | Effort | Expected Impact |
|--------|----------|--------|----------------|
| [specific action] | High/Med/Low | Low/Med/High | [plain language impact] |

**Note:** If TOWS is next in the sequence, the SWOT output feeds directly into it.
```

- [ ] **Step 3: Write pestel.md**

```markdown
# PESTEL Analysis Framework

**Purpose:** Evaluates the macro-environmental forces that could help or hurt the client
over the next 12–24 months across Political, Economic, Social, Technological, Environmental,
and Legal dimensions.

**Primary question:** What external forces beyond competitors will shape our strategy?

**Use for:** new market entry, regulated industries, annual planning, international expansion.
**Skip for:** quick competitive snapshots, short-term tactical decisions.

---

## Data Inputs
- intel-brief.md Section 5: Trend data (Social + Technological signals)
- External research: government sources, industry associations, news (researcher provides)
- Client intake: regulatory environment score from intake-questions.md

---

## Framework Structure

For each of the 6 dimensions, assess:
- **What's happening** (current state — fact-based)
- **Direction** (is this getting better, worse, or neutral for the client?)
- **Impact** (High / Medium / Low — on this specific client)
- **Strategic implication** (what should the client do about it)

### P — Political
Factors: government policy, political stability, trade regulations, tax policy,
government spending in the industry, political attitude toward the industry.

Example for connected vehicles: "Government fleet electrification mandates for 2030
represent a High-impact opportunity — client's platform can position as compliance-enablement."

### E — Economic
Factors: economic growth/recession, interest rates, inflation, fuel prices, consumer
spending, unemployment, exchange rates (for businesses operating across borders).

### S — Social
Factors: demographic shifts, changing attitudes/values, consumer behavior changes,
health consciousness, cultural trends, workforce changes (remote work, gig economy).

### T — Technological
Factors: automation, AI/ML adoption in the industry, new platforms, connectivity (5G/IoT),
cybersecurity risks, emerging competitor tech, technology adoption rate of target customers.

### E — Environmental
Factors: climate change regulations, sustainability expectations from customers,
carbon footprint requirements, ESG reporting demands, weather/climate operational risks.

### L — Legal
Factors: employment law, health and safety, advertising regulations, data privacy (PIPEDA/GDPR),
industry-specific compliance requirements, IP/patent landscape.

---

## Completed Grid Format

| Dimension | Key Factor | Direction | Impact | Strategic Implication |
|-----------|-----------|-----------|--------|----------------------|
| Political | [factor] | ↑ / → / ↓ | H/M/L | [action or watch item] |
| Economic | [factor] | ↑ / → / ↓ | H/M/L | [action or watch item] |
| Social | [factor] | ↑ / → / ↓ | H/M/L | [action or watch item] |
| Technological | [factor] | ↑ / → / ↓ | H/M/L | [action or watch item] |
| Environmental | [factor] | ↑ / → / ↓ | H/M/L | [action or watch item] |
| Legal | [factor] | ↑ / → / ↓ | H/M/L | [action or watch item] |

Aim for 2–3 factors per dimension. More than 4 = analysis paralysis.

---

## Output Format

### Key Findings (3–5 bullets)
[Highest-impact factors — what the client MUST respond to]

### Strategic Implications
[2–3 sentences: what the macro environment means for this client's 12-month strategy]

### Recommended Actions
| Action | Priority | Effort | Expected Impact |
|--------|----------|--------|----------------|
| [specific action] | High/Med/Low | Low/Med/High | [plain language impact] |
```

- [ ] **Step 4: Write tows.md**

```markdown
# TOWS Matrix Framework

**Purpose:** Converts SWOT analysis into specific, actionable strategies by matching
internal capabilities to external conditions.

**Primary question:** Given our SWOT, what specific strategies should we pursue?

**REQUIRES:** A completed SWOT analysis as input. Never run TOWS without SWOT.
TOWS is not a replacement for SWOT — it's the action layer built on top of it.

---

## Data Inputs
- SWOT output (required — all 4 quadrants)
- Competitor Analysis output (for SO and WT strategies)
- intel-brief.md (for market context)

---

## Framework Structure

TOWS creates 4 strategy types by crossing SWOT quadrants:

| | **Opportunities (O)** | **Threats (T)** |
|---|---|---|
| **Strengths (S)** | **SO Strategies** — use strengths to maximize opportunities | **ST Strategies** — use strengths to minimize threats |
| **Weaknesses (W)** | **WO Strategies** — overcome weaknesses by exploiting opportunities | **WT Strategies** — minimize weaknesses and avoid threats |

### SO Strategies (Maxi-Maxi)
"We have [Strength X] — we should use it to capture [Opportunity Y]."
These are the aggressive growth plays. Prioritize these when the client has strong assets.

### ST Strategies (Maxi-Mini)
"We have [Strength X] — we should use it to defend against [Threat Y]."
Competitive defense using existing advantages.

### WO Strategies (Mini-Maxi)
"[Opportunity Y] exists — we need to fix [Weakness X] to capture it."
Improvement investments justified by market opportunity.

### WT Strategies (Mini-Mini)
"[Weakness X] makes [Threat Y] more dangerous — we need to protect ourselves."
Defensive damage control. Lowest priority unless threat is imminent.

---

## How to Build the Matrix

For each strategy cell, generate 2–4 specific strategy statements:
1. State the strength/weakness and opportunity/threat being combined
2. Describe the specific action that follows from combining them
3. Assign: Priority (High/Med/Low), Timeline (This month / Q2 / H2), Owner (TBD or suggest)

Example SO Strategy:
"[S: Ranks #1 organically for 'fleet management software Canada'] +
[O: Competitor A stopped running Google Ads — paid landscape is open]
→ Strategy: Launch Google Ads campaign targeting competitor A's top 10 keywords.
Priority: High | Timeline: This month | Estimated cost: $[X]/mo"

---

## Output Format

### TOWS Matrix (completed)
[Full 2×2 grid with 2–4 strategies per cell]

### Priority Strategy List
Rank all strategies across all 4 cells:
| Rank | Strategy | Type | Priority | Timeline |
|------|----------|------|----------|----------|
| 1 | [strategy] | SO/ST/WO/WT | High | This month |

### Key Findings (3–5 bullets)
[The most important strategic moves that emerged from TOWS]

### Recommended Actions
| Action | Priority | Effort | Expected Impact |
|--------|----------|--------|----------------|
| [specific action] | High/Med/Low | Low/Med/High | [plain language impact] |
```

- [ ] **Step 5: Commit**

```bash
cd ~/ashish-skills
git add strategic/strategic-analysis/references/frameworks/competitor-analysis.md
git add strategic/strategic-analysis/references/frameworks/swot.md
git add strategic/strategic-analysis/references/frameworks/pestel.md
git add strategic/strategic-analysis/references/frameworks/tows.md
git commit -m "feat: add framework reference files Part 1 (competitor-analysis, swot, pestel, tows)"
```

---

## Task 8: Write Framework Reference Files (Part 2: SOAR, VRIO, Gap Analysis, Five Forces)

**Files:**
- Create: `~/ashish-skills/strategic/strategic-analysis/references/frameworks/soar.md`
- Create: `~/ashish-skills/strategic/strategic-analysis/references/frameworks/vrio.md`
- Create: `~/ashish-skills/strategic/strategic-analysis/references/frameworks/gap-analysis.md`
- Create: `~/ashish-skills/strategic/strategic-analysis/references/frameworks/five-forces.md`

- [ ] **Step 1: Write soar.md**

```markdown
# SOAR Analysis Framework

**Purpose:** Focuses on Strengths, Opportunities, Aspirations, and Results — a positive,
forward-looking alternative to SWOT that drives growth planning and cultural alignment.

**Primary question:** Where are our greatest strengths and opportunities, and what do we
aspire to achieve?

**Use for:** growth planning, positive culture initiatives, strategic visioning sessions,
organizations focused on building vs defending.
**Skip for:** crisis response, heavily threat-driven situations (use SWOT+TOWS instead).

---

## Data Inputs (from intel-brief.md + intake)
- Competitor Analysis output (identifies strengths in context)
- Section 5: Trend data (growth opportunities)
- Client intake: growth orientation score
- Any existing client goals or mission statements

---

## Framework Structure

### S — Strengths
What do we do exceptionally well? What resources, capabilities, or assets give us an edge?
Focus on the best of what IS, not what's average.
Pull from: Competitor Analysis (where client leads), E-E-A-T (trust advantages), client intel.

### O — Opportunities
What opportunities align with our strengths? Where is the market moving in our favor?
These must connect to actual Strengths — SOAR opportunities are ones the client is
positioned to capture, not generic market trends.
Pull from: trend data, PAA gaps, competitor weaknesses, market growth signals.

### A — Aspirations
What do we want to become? What's the bold ambition that motivates the team?
These are forward-looking statements: "We aspire to become the recognized leader in [X] by [year]."
Prompt the client (or draft from intake data): "What does success look like in 3 years?"

### R — Results
What measurable outcomes will tell us we've succeeded?
For each Aspiration, define 1–2 specific, measurable results:
- "Rank #1 for [core keyword] by Q4" (SEO)
- "Capture 30% of [city] market share within 18 months" (market position)
- "Reduce customer acquisition cost from $[X] to $[Y]" (efficiency)

---

## Completed Grid Format

**Strengths:**
- [Strength 1: specific, evidence-backed]
- [Strength 2]
- [Strength 3]

**Opportunities:**
- [Opportunity 1 that connects to a specific strength]
- [Opportunity 2]
- [Opportunity 3]

**Aspirations:**
- "We aspire to [bold statement]"
- "We aspire to [bold statement]"

**Results (per aspiration):**
| Aspiration | Metric | Target | Timeline |
|------------|--------|--------|----------|
| [aspiration 1] | [KPI] | [target] | [date] |

---

## Output Format

### Key Findings (3–5 bullets)
[Most actionable insights from the SOAR analysis]

### Strategic Implications
[2–3 sentences: what this tells you about where to direct growth energy]

### Recommended Actions
| Action | Priority | Effort | Expected Impact |
|--------|----------|--------|----------------|
| [specific action] | High/Med/Low | Low/Med/High | [plain language impact] |
```

- [ ] **Step 2: Write vrio.md**

```markdown
# VRIO Framework

**Purpose:** Assesses which of the client's resources and capabilities provide a sustained
competitive advantage by evaluating Value, Rarity, Imitability, and Organization.

**Primary question:** Which of our resources give us a real, lasting competitive advantage —
and which advantages are temporary or vulnerable?

**Use for:** Positioning strategy, capability-based pricing, investment prioritization,
identifying what to protect vs what to build.

---

## Data Inputs (from intel-brief.md + intake)
- Section 4: Tech stack (technology resources)
- Section 6: E-E-A-T assessment (expertise and authority as resources)
- Competitor Analysis output (rarity assessment)
- Client intake: internal resource clarity score

---

## Framework Structure

For each resource or capability, assess across 4 questions:

**V — Is it Valuable?**
Does this resource help the client exploit opportunities or neutralize threats?
If NO → it's a competitive disadvantage or irrelevant. Don't include it.

**R — Is it Rare?**
Do few or no competitors have this resource?
If NO (common) → it's competitive parity. Not an advantage, but needed to compete.

**I — Is it costly to Imitate?**
Would it be difficult or expensive for competitors to copy or replicate?
Factors that increase inimitability: unique history, causal ambiguity (hard to understand why it works),
social complexity (relationships, culture, trust), patents/IP.
If NO (easy to copy) → advantage is temporary. Expect competitors to close the gap.

**O — Is the Organization set up to exploit it?**
Does the client have the processes, structure, and management to actually use this resource?
If NO → the resource exists but isn't being leveraged. This is a gap to fix.

---

## VRIO Assessment Table

| Resource / Capability | Valuable? | Rare? | Costly to Imitate? | Organized to Exploit? | Competitive Implication |
|-----------------------|-----------|-------|--------------------|-----------------------|-------------------------|
| [Resource 1] | Y/N | Y/N | Y/N | Y/N | Disadvantage / Parity / Temporary Advantage / Sustained Advantage |
| [Resource 2] | Y/N | Y/N | Y/N | Y/N | |
| [Resource 3] | Y/N | Y/N | Y/N | Y/N | |

### Competitive Implication Key
| V | R | I | O | Result |
|---|---|---|---|--------|
| N | — | — | — | Competitive Disadvantage |
| Y | N | — | — | Competitive Parity (table stakes) |
| Y | Y | N | — | Temporary Competitive Advantage (protect now) |
| Y | Y | Y | N | Unused Advantage (organizational gap — fix this) |
| Y | Y | Y | Y | Sustained Competitive Advantage (build on this) |

---

## Resources to Always Evaluate
- Brand reputation / trust signals
- Proprietary data or technology
- Customer relationships / retention
- Specialized expertise or certifications
- Geographic coverage or exclusivity
- Partnerships or distribution channels
- Cost structure advantages
- Talent / team capabilities

---

## Output Format

### Key Findings (3–5 bullets)
[Which resources are genuine sustained advantages; which are at risk; which aren't being exploited]

### Strategic Implications
[2–3 sentences: what this means for positioning, investment, and competitive strategy]

### Recommended Actions
| Action | Priority | Effort | Expected Impact |
|--------|----------|--------|----------------|
| [specific action] | High/Med/Low | Low/Med/High | [plain language impact] |
```

- [ ] **Step 3: Write gap-analysis.md**

```markdown
# Gap Analysis Framework

**Purpose:** Measures the gap between the client's current state and their desired future
state, then maps the steps required to close it.

**Primary question:** What's the gap between where we are and where we need to be —
and what will it take to close it?

**Use for:** Performance improvement planning, product roadmaps, capability development,
post-SOAR execution planning (SOAR defines aspirations; Gap Analysis defines the path).

---

## Data Inputs (from intel-brief.md + client intake + SOAR if available)
- Competitor Analysis (competitors' current state = client's gap in some areas)
- SOAR Results metrics (if SOAR was run — use those as the desired state targets)
- Section 1: Traffic data (current state for organic performance)
- Section 3: PAA gaps (content gap = specific measurable gap)
- Client intake: stated goals and current performance awareness

---

## Framework Structure

A Gap Analysis has three components:

### 1. Current State Assessment
Document where the client is TODAY across key dimensions.
Be specific — use data from intel-brief wherever possible.

| Dimension | Current State | Data Source |
|-----------|---------------|-------------|
| Organic traffic | [X visits/mo] | DataForSEO Labs |
| Keyword rankings | [X keywords in top 10] | DataForSEO SERP |
| PAA questions answered | [X of Y questions answered] | intel-brief Section 3 |
| Brand awareness | [Low/Med/High relative to market] | Competitor Analysis |
| [Other relevant dimension] | | |

### 2. Desired State (Future State)
Where does the client need or want to be? Be specific and time-bound.

| Dimension | Desired State | Timeline | Source of Target |
|-----------|---------------|----------|-----------------|
| Organic traffic | [X visits/mo] | [12 months] | SOAR result / client goal |
| Keyword rankings | [X keywords in top 10] | [6 months] | |
| PAA questions answered | [All Y questions answered] | [3 months] | |
| Brand awareness | [Med/High relative to market] | [18 months] | |

### 3. Gap & Closure Plan
For each dimension, define: what's the gap, what closes it, and what does it cost?

| Dimension | Current | Desired | Gap | Closing Actions | Priority | Effort |
|-----------|---------|---------|-----|-----------------|----------|--------|
| [dimension] | [now] | [target] | [delta] | [specific actions] | H/M/L | L/M/H |

---

## Types of Gaps to Always Check

**Performance Gaps:** Current results vs targets (traffic, rankings, conversions)
**Capability Gaps:** Skills or tools the client lacks vs what's needed to compete
**Content Gaps:** Topics/questions competitors answer that the client doesn't
**Resource Gaps:** Budget, team, or technology gaps vs what's required
**Positioning Gaps:** How the client is perceived vs how they want to be perceived

---

## Output Format

### Key Findings (3–5 bullets)
[Biggest gaps identified — be specific about magnitude]

### Gap Priority Matrix
| Gap | Magnitude (Large/Med/Small) | Urgency (High/Med/Low) | Effort to Close (High/Med/Low) |
|-----|-----------------------------|------------------------|-------------------------------|

### Strategic Implications
[2–3 sentences: what the gap analysis tells you about priorities and investment]

### Recommended Actions
| Action | Priority | Effort | Expected Impact |
|--------|----------|--------|----------------|
| [specific action] | High/Med/Low | Low/Med/High | [plain language impact] |
```

- [ ] **Step 4: Write five-forces.md**

```markdown
# Five Forces Analysis Framework

**Purpose:** Analyzes the competitive intensity and attractiveness of the industry by
assessing five structural forces that determine where power lies and how profits are captured.

**Primary question:** How intense is competition in this industry and where is the power?

**Use for:** Market entry decisions, competitive intensity assessment, pricing strategy,
understanding structural barriers and opportunities.
**Developed by:** Michael Porter, Harvard Business School.

---

## Data Inputs (from intel-brief.md + PESTEL if available)
- Section 1: Traffic data (market size, competitor count)
- Section 2: Ad data (competitive intensity signal)
- Section 3: Keyword data (search demand = market size indicator)
- PESTEL output (if available — Legal and Economic factors inform several forces)
- Client intake: industry and competitive maturity data

---

## Framework Structure

Assess each force as: High / Medium / Low intensity, then explain why.

### Force 1: Competitive Rivalry (among existing competitors)
How intense is the competition between established players?

Signals of HIGH rivalry:
- Many competitors of similar size
- Low industry growth (competitors fighting for fixed market share)
- High fixed costs (pressure to fill capacity at any price)
- Low switching costs for customers
- Undifferentiated products/services
- High exit barriers (competitors stay even when losing money)

Signals of LOW rivalry:
- Few competitors, clear market leader
- Fast market growth (room for everyone)
- Highly differentiated offerings
- High switching costs

**Assessment for this client:**
- Number of direct competitors identified: [X]
- Market growth direction: [growing/stable/declining — from trendspyg data]
- Differentiation level: [High/Med/Low based on Competitor Analysis]
- Rivalry intensity: High / Medium / Low

### Force 2: Threat of New Entrants
How easy is it for new competitors to enter the market?

Signals of HIGH threat (easy entry):
- Low startup costs
- No regulatory barriers
- Established players don't have strong brand loyalty
- Easy access to distribution channels
- No significant economies of scale required

Signals of LOW threat (hard to enter):
- High capital requirements
- Strong regulatory barriers (licences, certifications)
- Established players have economies of scale
- Strong brand loyalty / switching costs in place
- Proprietary technology or IP

**Assessment for this client:**
- Entry barriers identified: [list]
- Capital requirement to compete: [Low/Med/High]
- Regulatory barriers: [none/some/significant]
- New entrant threat: High / Medium / Low

### Force 3: Threat of Substitutes
How easily can customers switch to a different solution entirely?

This is NOT about competitors — it's about alternatives that solve the same problem differently.
Example: fleet GPS tracking → substitute = manual fuel log + driver reporting + spreadsheets.

Signals of HIGH substitution threat:
- Many ways to solve the same customer problem
- Substitutes are cheaper or more convenient
- Customers have low brand loyalty

Signals of LOW substitution threat:
- No easy alternatives exist
- Switching to a substitute requires significant effort/cost/retraining
- Client's solution delivers clearly superior results

**Assessment for this client:**
- Main substitutes identified: [list with how they compare]
- Substitute cost vs client: [cheaper/similar/more expensive]
- Substitution threat: High / Medium / Low

### Force 4: Bargaining Power of Suppliers
How much power do the client's suppliers have to raise prices or reduce quality?

For digital/SaaS/marketing businesses, suppliers = platform providers (Google, Meta),
software vendors, data providers (DataForSEO), talent/agencies.

Signals of HIGH supplier power:
- Few suppliers dominate (e.g., Google = monopoly on search ads)
- No easy substitute for the supplier's product
- Supplier's product is critical to the business
- High switching costs between suppliers

Signals of LOW supplier power:
- Many supplier options
- Easy to switch
- Client buys in large volume (leverage)

**Assessment for this client:**
- Critical suppliers: [list]
- Supplier concentration: [High/Med/Low]
- Supplier power: High / Medium / Low

### Force 5: Bargaining Power of Buyers (Customers)
How much power do customers have to push prices down or demand better terms?

Signals of HIGH buyer power:
- Buyers are large or purchase in high volume
- Many alternatives available (low switching costs)
- Buyers are price-sensitive
- Products are undifferentiated

Signals of LOW buyer power:
- Many small buyers, no single one dominates revenue
- High switching costs
- Client's product is essential and hard to replace
- Strong brand loyalty

**Assessment for this client:**
- Customer concentration: [are there a few large clients or many small ones?]
- Switching costs for clients: [Low/Med/High]
- Buyer power: High / Medium / Low

---

## Five Forces Summary Grid

| Force | Intensity | Key Driver | Strategic Implication |
|-------|-----------|------------|----------------------|
| Competitive Rivalry | H/M/L | [reason] | [what to do] |
| Threat of New Entrants | H/M/L | [reason] | [what to do] |
| Threat of Substitutes | H/M/L | [reason] | [what to do] |
| Supplier Power | H/M/L | [reason] | [what to do] |
| Buyer Power | H/M/L | [reason] | [what to do] |

**Overall Industry Attractiveness:** High / Medium / Low
[1 sentence: is this a good industry to be in and why]

---

## Output Format

### Key Findings (3–5 bullets)
[Most important structural forces affecting competitive strategy]

### Strategic Implications
[2–3 sentences: what this industry structure means for the client's positioning and priorities]

### Recommended Actions
| Action | Priority | Effort | Expected Impact |
|--------|----------|--------|----------------|
| [specific action] | High/Med/Low | Low/Med/High | [plain language impact] |
```

- [ ] **Step 5: Commit**

```bash
cd ~/ashish-skills
git add strategic/strategic-analysis/references/frameworks/soar.md
git add strategic/strategic-analysis/references/frameworks/vrio.md
git add strategic/strategic-analysis/references/frameworks/gap-analysis.md
git add strategic/strategic-analysis/references/frameworks/five-forces.md
git commit -m "feat: add framework reference files Part 2 (soar, vrio, gap-analysis, five-forces)"
```

---

## Task 9: Write Report Format and Slides Outline

**Files:**
- Create: `~/ashish-skills/strategic/strategic-analysis/references/report-format.md`
- Create: `~/ashish-skills/strategic/strategic-analysis/references/slides-outline.md`

- [ ] **Step 1: Write report-format.md**

```markdown
# Strategic Analysis — Report Format

## Universal Report Structure
Every framework report follows this 5-section structure.
Scale each section to complexity — don't pad, don't truncate.

### Section 1: Data Inputs Used
List which intel-brief sections informed this analysis.
Flag any data gaps: [DATA UNAVAILABLE — reason. Assumption used: X]

### Section 2: Framework Grid / Matrix
The completed visual grid for this framework.
Tables must be complete — no empty cells without a reason noted.

### Section 3: Key Findings (3–5 bullets)
Specific to this client. No generic strategy filler.
Each bullet = one actionable insight with evidence.
Format: "[Finding]: [Evidence]. [Implication]."
Example: "Client's organic traffic is 40% of Competitor A's — their keyword coverage
is 3x larger. Priority: close the top 20 keyword gaps identified in intel-brief Section 3."

### Section 4: Strategic Implications
2–3 sentences. Plain language. Written for a business owner.
Answers: "So what does all this mean for us?"
No jargon. No hedging. Direct.

### Section 5: Recommended Actions
| Action | What exactly to do | Priority | Effort | Expected Impact |
|--------|-------------------|----------|--------|----------------|
| [name] | [specific enough to execute] | H/M/L | L/M/H | [plain English outcome] |

Priority rules:
- HIGH: Blocking rankings, causing measurable revenue loss, or competitor is exploiting actively
- MEDIUM: Meaningful opportunity, no current competitor advantage
- LOW: Nice to have, minimal competitive pressure

---

## Summary Report Structure (summary.md)

### Executive Overview
3–5 sentences. Business owner language. No jargon.
Structure: [What we found] → [Most important implication] → [What to do first]

### Top 3 Strategic Priorities
Numbered, ranked by impact × urgency.
Each priority:
- One clear statement of what needs to happen
- Why it's the top priority (evidence-backed)
- What success looks like (measurable)

### Risks to Watch
Top 3 risks. Specific — not "competitive pressure."
Format: "Risk: [what]. Trigger: [when to act]. Response: [what to do if it materializes]."

### Quick Wins (Act This Month)
Max 5 items. High impact, low effort.
For each: what to do + estimated search/business opportunity.

### Full Action List
All recommendations from all frameworks, deduplicated, sorted by priority.
| Action | Source Framework | Priority | Effort | Owner (if known) |
|--------|-----------------|----------|--------|-----------------|

---

## Tone Rules (applies to all report sections)
- "Do this" not "consider doing this"
- Specific: "add city name to the H1 on the services page" not "improve local signals"
- Every problem has a fix listed
- Numbers where possible: "answers 4 of 18 PAA questions" not "limited FAQ coverage"
- Written for a business owner, reviewed by a strategist
```

- [ ] **Step 2: Write slides-outline.md**

```markdown
# Strategic Analysis — Slides Outline

## Standard Deck Structure

Adapt this for each engagement — not every slide is needed every time.
Remove slides that don't apply. Add client-specific slides as needed.

---

### Slide 1: Title
- Client name + logo
- Engagement title (e.g., "Competitive Strategy Review — Q2 2026")
- Prepared by: [Agency name] | Date: [YYYY-MM-DD]
- Visual: Clean, on-brand. No data on this slide.

### Slide 2: Executive Summary
- What we analyzed (3 bullets)
- Top 3 findings (3 bullets — lead with most important)
- One key data point that makes the stakes concrete
- Visual: Simple text layout. No charts.

### Slide 3: Market Context (PESTEL)
- 6 dimensions as icons or table
- Highlight: 2–3 highest-impact factors only
- Direction arrows: ↑ favorable, ↓ risk, → neutral
- Speaker note: "This slide shows the external environment — what's outside their control but must inform strategy."

### Slide 4: Competitive Landscape (Competitor Analysis + Five Forces)
- Traffic comparison bar chart (client vs competitors)
- Key metrics table: traffic, DA, keywords, ads running (Y/N)
- Overall industry attractiveness rating (from Five Forces)
- Visual: Data-heavy — bar chart + table. Client highlighted.
- Speaker note: "Client ranks [X] in organic traffic. Key gap is [Y]."

### Slide 5: Client Position (SWOT)
- Classic 2×2 SWOT grid
- Max 3 items per quadrant — don't crowd
- Color: green = S/O, red/orange = W/T
- Visual: SWOT grid graphic. One slide only.

### Slide 6: Strategic Options (TOWS)
- 2×2 TOWS grid with top strategy per cell
- Highlight: top 2 priority strategies with callout boxes
- Visual: TOWS grid + callout arrows to priority strategies.
- Speaker note: "These are the specific actions that come from crossing our SWOT analysis."

### Slide 7: Resource Advantage (VRIO)
- VRIO table: resources + Y/N columns + implication
- Highlight: resources with Sustained Advantage in green
- Highlight: Unused Advantages in amber (organizational gap)
- Visual: Styled table. Traffic-light color coding.

### Slide 8: Gap Analysis / Opportunity Map
- Two-column layout: Current State vs Desired State
- Gap size visualized (progress bars or delta arrows)
- Top 3 gaps highlighted
- Visual: Before/after layout. Quantified where possible.

### Slide 9: Priority Action Plan
- Top 10 actions across all frameworks
- Sorted by priority (High first)
- Effort column: Low/Med/High
- Timeline column: This month / Q2 / H2
- Visual: Styled table. Priority color-coded.

### Slide 10: Next Steps + Timeline
- 3-column layout: This Month | Next Quarter | 6-Month Horizon
- Max 3–4 items per column
- Named owners where known
- Visual: Simple timeline or column layout.

---

## Slide Customization by Engagement Type

**Quick competitive snapshot (2 frameworks):**
Keep: Title, Executive Summary, Competitive Landscape, Client Position, Priority Action Plan
Drop: PESTEL, TOWS, VRIO, Gap Analysis, Five Forces

**New market entry:**
Keep: Title, Executive Summary, Market Context (PESTEL), Competitive Landscape, Five Forces, Client Position, Priority Action Plan
Add: Market Entry Risk slide (custom)
Drop: VRIO (unless capability audit is needed)

**Annual strategy review (full deck):**
Use all 10 slides. Full analysis.

**Growth planning:**
Swap TOWS slide for SOAR slide.
SOAR slide: 4-quadrant layout (S/O/A/R) with aspiration statements highlighted.

---

## Slide Design Principles
- One main idea per slide
- Data visualization over text tables where possible
- Numbers always beat adjectives ("4x higher traffic" beats "significantly more traffic")
- Client always highlighted/differentiated from competitors in charts
- Speaker notes on every data slide — explains what the audience should take away
```

- [ ] **Step 3: Commit**

```bash
cd ~/ashish-skills
git add strategic/strategic-analysis/references/report-format.md
git add strategic/strategic-analysis/references/slides-outline.md
git commit -m "feat: add strategic-analysis report-format and slides-outline references"
```

---

## Task 10: Validate, Install, and Smoke Test All 3 Skills

**Files:** No new files — validation and installation only.

- [ ] **Step 1: Validate all 3 skills**

```bash
python3 ~/.claude/skills/skill-builder/scripts/validate.py ~/ashish-skills/strategic/strategic-intake
python3 ~/.claude/skills/skill-builder/scripts/validate.py ~/ashish-skills/strategic/competitive-intel
python3 ~/.claude/skills/skill-builder/scripts/validate.py ~/ashish-skills/strategic/strategic-analysis
```

Expected output (all three):
```
✓ Validation passed
✓ Validation passed
✓ Validation passed
```

If any fail: check error message — likely a frontmatter issue (name mismatch, description too long, or angle brackets in description).

- [ ] **Step 2: Install all 3 skills to ~/.claude/skills/**

```bash
bash ~/.claude/skills/skill-builder/scripts/package.sh ~/ashish-skills/strategic/strategic-intake
bash ~/.claude/skills/skill-builder/scripts/package.sh ~/ashish-skills/strategic/competitive-intel
bash ~/.claude/skills/skill-builder/scripts/package.sh ~/ashish-skills/strategic/strategic-analysis
```

Expected output (each):
```
✓ Installed: /Users/ashishuzelman/.claude/skills/strategic-intake
✓ Zipped:    /Users/ashishuzelman/ashish-skills/strategic/strategic-intake.zip
```

- [ ] **Step 3: Verify installation**

```bash
ls ~/.claude/skills/ | grep -E "strategic|competitive"
```

Expected:
```
competitive-intel
strategic-analysis
strategic-intake
```

- [ ] **Step 4: Smoke test — strategic-intake**

In a new Claude Code session (or describe the expected behavior):

Trigger: "new client Acme Fleet Management, acmefleet.ca"

Expected behavior:
1. Skill loads (name: strategic-intake matches trigger phrase)
2. Asks Q1: industry / primary service
3. Proceeds through intake questions one at a time
4. Recommends frameworks based on answers
5. Produces work-order.md

Pass criteria: skill follows Steps 1–7 in SKILL.md without skipping steps or asking multiple questions at once.

- [ ] **Step 5: Smoke test — competitive-intel**

Trigger: "pull intel on acmefleet.ca vs competitor.ca"

Expected behavior:
1. Skill loads
2. Confirms inputs (client URL, competitor URLs, decision goal)
3. Steps through 7 data collection sections in order
4. Flags any data not available with reason
5. Produces intel-brief.md using the template from references/

Pass criteria: intel-brief.md matches template structure from intel-brief-template.md.

- [ ] **Step 6: Smoke test — strategic-analysis**

Trigger: "run SWOT and TOWS for Acme Fleet"

Expected behavior:
1. Skill loads
2. Asks for intel-brief.md or data input
3. Runs Competitor Analysis first (baseline), then SWOT, then TOWS in order
4. Produces completed framework grids — no empty cells
5. Produces summary.md and slides-outline.md

Pass criteria: outputs match report-format.md structure; summary has all 5 sections; slides-outline includes slide titles and speaker notes.

---

## Task 11: Final Commit and Push

- [ ] **Step 1: Verify all files are committed**

```bash
cd ~/ashish-skills
git status
```

Expected: `nothing to commit, working tree clean`

- [ ] **Step 2: Push to remote**

```bash
cd ~/ashish-skills
git push origin main
```

Expected: `Branch 'main' set up to track remote branch 'main' from 'origin'.`

- [ ] **Step 3: Confirm on GitHub**

Visit: https://github.com/AshishUzelman/ashish-skills
Verify: `strategic/` folder visible with all 3 skill directories under it.

- [ ] **Step 4: Update PROJECT_STATUS.md**

In `~/rank-higher-media/PROJECT_STATUS.md`, add to TODAY section:
```
- [x] Strategic analysis skills: strategic-intake + competitive-intel + strategic-analysis built and installed
- [x] 11 new skills total in ~/.claude/skills/ (was 8, now 11)
- [x] ashish-skills: strategic/ folder committed and pushed
```

Add to ALL-TIME MILESTONES:
```
| 2026-03-30 | Strategic Analysis Skills: 3-skill pipeline (strategic-intake + competitive-intel + strategic-analysis) with 8 frameworks, DataForSEO-first data layer, client folder output system |
```

- [ ] **Step 5: Update rolling_summary.md Session 7 entry**

In `~/rank-higher-media/rolling_summary.md`, update Session 7 (or add it):
```
## Session 7 — [Most Recent]
Date: 2026-03-30
Primary Work:
- Designed + built 3 strategic analysis skills: strategic-intake, competitive-intel, strategic-analysis
- 8 frameworks covered: Competitor Analysis, SWOT, PESTEL, TOWS, SOAR, VRIO, Gap Analysis, Five Forces
- DataForSEO-first data layer (covers ~75% of intel needs); free API complements identified
- Client output folder structure: ~/rank-higher-media/clients/[slug]/[date]/
- 17 files total: 3 SKILL.md + 14 reference files
- Validated, installed, smoke tested — all 3 live at ~/.claude/skills/
- ashish-skills: 11 skills total, strategic/ folder pushed to main (private)
```

- [ ] **Step 6: Commit memory updates**

```bash
cd ~/rank-higher-media
git add PROJECT_STATUS.md rolling_summary.md
git commit -m "End-of-session memory update — Session 7 (2026-03-30): strategic analysis skills complete"
git push
```

---

## Self-Review

**Spec coverage check:**
- [x] strategic-intake: client onboarding, intake questions, framework selector, work-order.md output → Tasks 2–3
- [x] competitive-intel: 5 data categories, DataForSEO-first, E-E-A-T lens, FAQ demand, intel-brief.md output → Tasks 4–5
- [x] strategic-analysis: all 8 frameworks, report structure, summary, slides outline → Tasks 6–9
- [x] Client folder structure (dated runs + index) → Task 1
- [x] DataForSEO-first data stack with free APIs → datasources.md (Task 5)
- [x] Validation + installation → Task 10
- [x] Memory updates → Task 11

**Placeholder scan:** None found. All steps contain actual file content.

**Type consistency:** No code types used — all markdown. Folder paths and file names consistent throughout (client-slug, work-order.md, intel-brief.md, summary.md, slides-outline.md).
