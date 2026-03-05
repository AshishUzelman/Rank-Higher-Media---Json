# ARES — SEO Auditor

## Status: 🟡 Planned (Firebase ready ✅)
## Firebase Project: `ashish-ares` ✅ Created 2026-03-04

---

## What It Is
An SEO auditing tool that **replicates Ashish's research methodology at scale using AI agents**. Not just a report generator — a system where agents think like an expert SEM analyst, pull real data, and produce actionable, prioritized reports.

Previously referred to as "Opal" — official project name is **ARES**.

---

## Core Architecture

### Data Sources (Agent Inputs)
- Google Search Console API
- Google Analytics (GA4) API
- Google Ads API
- Ahrefs / SEMrush API (or DataForSEO)
- Google PageSpeed / Core Web Vitals API
- Crawl data (Screaming Frog or custom crawler)
- SERP ranking data (DataForSEO or ValueSERP)
- Firestore (store audit history + client profiles)

### Agent Team
| Agent | Job |
|---|---|
| Crawler Agent | Technical SEO audit — broken links, redirects, meta, H1s, duplicates |
| Data Fetcher Agent | Pulls GSC, GA4, Ads data via APIs |
| Keyword Agent | Opportunity identification, gaps, quick wins (pos 6–20) |
| Content Analyst Agent | Thin content, missing keyword targeting, content gaps |
| Backlink Agent | Link profile, lost links, toxic patterns, opportunities |
| Report Compiler Agent | Assembles all agent outputs → final report |
| Training Agent | Learns from Ashish's corrections → improves future outputs |

**Orchestrator:** Claude supervises the pipeline — runs agents in order, reviews outputs, flags anomalies.

### Research Methodology (How Ashish Does It — Agents Must Match)
1. **Current position** — GSC top queries/pages, high impression / low CTR quick wins, declining pages
2. **Technical audit** — crawl for issues, Core Web Vitals, index coverage
3. **Content gap** — compare site keywords vs competitors, find missing targets
4. **Backlink profile** — DR, lost links, toxic patterns, competitor link opportunities
5. **Prioritized action list** — every audit ends with High/Medium/Low ranked fixes, each with: what, why, impact, how

### Report Outputs
- **Executive Summary** — 1 page, plain language, top 3 priorities
- **Full Audit Report** — all sections, data, visuals, recommendations
- **Quick Wins Sheet** — high impact / low effort only
- **Monthly Progress Report** — vs last audit, ranking movements, tasks done
- Format: PDF export + Firestore (so Project Visualizer can read it)

### Agent Training Philosophy
- Agents trained on examples of outputs Ashish has approved
- Ashish's edits become training signal: "this is what good looks like"
- Key qualities: actionable, prioritized, plain language, no hedging
- Rule: every problem must come with the fix

---

## UI Direction
- Drive → Opal folder → 2 mockup images (need to review)
- Drive → Opal folder → "SEO Auditor" spec file (58KB — need to read)

---

## Next Steps
- [ ] Open Drive → Opal folder → read spec file + view mockup images
- [ ] Populate this BRIEF with spec details
- [ ] Design data pipeline architecture
- [ ] Scaffold repo (separate GitHub repo: `ashish-ares`)
- [ ] Build Data Fetcher Agent first (need data before anything else)
- [ ] Set up Firestore schema for audit storage

---

## Reference
> Full agent methodology documented in SOUL.md → "ARES — SEO Auditor Vision & Agent Architecture"
