# rolling_summary.md — Session Context Buffer
> Keeps last 3 sessions. Archive older sessions to Drive before overwriting.
> Drive folder: 15s6YJyUVIb6bg0ky3WLWSklJAvndCNs1
> Update this file at the END of every session before closing.

---

## Session 3 — [Most Recent]
**Date:** 2026-03
**Primary Work:**
- Rebuilt full memory file set (soul.md, soul_ares.md, permanent.json, client_override.json, rolling_summary.md) for use in Claude Code
- Confirmed project root placement alongside CLAUDE.md
- Confirmed file save to Drive is critical end-of-session rule

**Decisions Made:**
- Both base soul (agency) + ARES extension maintained as separate files
- soul.md = agency identity/principles; soul_ares.md = platform architecture + project status

**Open Items:**
- ARES React dashboard still in active dev (agent status, token usage UI)
- Rank Higher Media website blocked by DNS config — high priority unlock
- Drive save automation script not yet built

**Next Session Should Start With:**
- Review ARES dashboard progress
- Confirm DNS issue status for Rank Higher Media
- Check if Drive save script is needed

---

## Session 2 — [Previous]
**Date:** 2026-02-28
**Primary Work:**
- Clarified ARES architecture: Firebase + React + hybrid LLM routing
- Scoped ARES as broader platform (not just SEO pipeline)
- Discussed Council of Agents concept and swarm architecture

**Decisions Made:**
- Ollama/Gemma 3 for bulk tasks; Claude API for quality-critical work
- Three-tier agent hierarchy: Director → Manager → Worker

**Open Items:**
- Visual Firebase/React dashboard still spec phase

---

## Session 1 — [Older]
**Date:** 2026-02-27
**Primary Work:**
- Built original soul.md + companion files (v1)
- Clarified soul = constitution/personality, NOT client data
- Built: soul.md, permanent.json, client_override.json, rolling_summary.md, README.md

**Decisions Made:**
- soul_base.md + client_override.json pattern (not monolithic soul)
- Scrutinizer: 3-flaw minimum, 3-loop max before escalate
- LLM routing: local for research, Claude for Supervisor + Scrutinizer

---

## Archive Protocol
When Session 1 would be overwritten:
1. Copy current rolling_summary.md to Drive (folder: 15s6YJyUVIb6bg0ky3WLWSklJAvndCNs1)
2. Name it: `rolling_summary_archive_YYYY-MM.md`
3. Then overwrite Session 1 slot with new session
