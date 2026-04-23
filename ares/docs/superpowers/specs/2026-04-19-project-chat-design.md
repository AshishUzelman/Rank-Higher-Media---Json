# ARES Project Chat — Design Spec

**Date:** 2026-04-19
**Status:** PARTIAL — architecture + data model approved, components/intent/flow still to be written
**Origin:** Session 21 brainstorm — the missing wire between the dashboard and the agent pipeline

---

## Problem

ARES has a working agent pipeline (5-phase loop, Actor-Critic, Supervisor) but no natural
language interface. All task submission happens via terminal. `DirectorChat.js` exists in
the dashboard but is not wired. The vision: a dashboard that feels like Claude Projects /
Gems — persistent per-project chat with proactive agent responses, reference documents
that load into context, and live pipeline state visible inline.

## Approved Approach — Option C: Hybrid Fast Chat + Intent Detection

Two paths in one chat interface:

- **Conversation path** (`< 5s`) — direct Ollama call (gemma3:12b), loads live Firestore
  task state so it can actually answer "how's task 13 doing?" Not routed through the pipeline.
- **Action path** — intent classifier detects a command → qwen3 transforms natural language
  into a structured task file → writes to `agent_inbox/` → daemon runs the full 5-phase loop
  → chat shows live `PhaseTimeline` inline.

Intent detection starts as rule-based (`run|build|write|create|fix` → action; else conversation).
Gets smarter later via the MoE router (Phase 2).

---

## Architecture (approved)

```
User types in DirectorChat (dashboard)
        ↓
  /api/chat/[projectId]   (Next.js App Router, Admin SDK for writes)
        ↓
  Intent Classifier (rule-based)
        ↓
  ┌─────────────────┬──────────────────────────┐
  │  CONVERSATION   │  ACTION / COMMAND         │
  │  gemma3:12b     │  qwen3:30b-a3b            │
  │  < 5s           │  ~10s to queue + pipeline │
  │                 │                           │
  │  Load context:  │  Transform NL → task file │
  │  - project docs │  Write agent_inbox/*.md   │
  │  - live tasks   │  Daemon runs 5-phase loop │
  │    (Firestore)  │  PhaseTimeline inline     │
  │  Stream SSE     │                           │
  └─────────────────┴──────────────────────────┘
        ↓
  Firestore: projects/{projectId}/messages
```

**New components:**
- `/api/chat/[projectId]` — Next.js API route (new)
- `ConversationHandler` — direct Ollama call with Firestore state (new)
- `ActionHandler` — NL → task file → agent_inbox/ writer (new)
- `projects/{projectId}/messages` — Firestore collection (new)
- `projects/{projectId}/context` — reference docs registry (new)

**Existing components touched:**
- `DirectorChat.js` — wire to API route, add SSE consumer, embed PhaseTimeline inline
- `PhaseTimeline.jsx` — no change, just embedded in chat messages
- `firestore-client.js` — no change, used by API route for writes
- `agent_connector.js` — no change, just receives new task files

---

## Data Model (approved)

**`projects/{projectId}/messages`**
```js
{
  id: "msg_1714123456789",
  role: "user" | "assistant" | "system",
  content: "How's task 13 doing?",
  type: "conversation" | "action",
  taskId: "task_13",                   // set if type === "action"
  timestamp: Firestore.Timestamp,
  model: "gemma3:12b" | "qwen3:30b-a3b"
}
```

**`projects/{projectId}/context`**
```js
{
  hardcoded: [                         // always loaded
    "SOUL_ARES.md",
    "knowledge/projects/ares-context.md",
    "docs/verified-flow.md"
  ],
  userDocs: [                          // up to 4, editable in dashboard
    { label: "Strategy", path: "..." }
  ],
  updatedAt: Firestore.Timestamp
}
```

**Context loaded per conversation message:**
1. Last 20 messages (paginated — "Load more" button adds 20 more)
2. Hardcoded + user-added reference docs (up to 8 total)
3. Live `tasks` collection filtered by project

---

## Locked Decisions (from PM review)

| # | Question | Answer |
|---|---|---|
| 1 | Ollama reachability | Local dev now; GCP Ollama VM for production (later) |
| 2 | Firestore writes | API route uses Admin SDK via `firestore-client.js` |
| 3 | Model for chat | gemma3:12b for conversation, qwen3:30b-a3b for action |
| 4 | NL → task file | qwen3 call in action path, standard LLM-as-formatter |
| 5 | Streaming | SSE via Next.js `Response` with `ReadableStream` |
| 6 | Token-aware router | Phase 2 sub-project (MoE Router), not in this spec |
| 7 | Reference docs | Hybrid — 3 hardcoded + up to 4 user-added per project |
| 8 | History depth | 20 messages default, "Load more" button for older |

---

## Still To Be Written (next session picks up here)

- **Section 3: Components** — file-by-file breakdown, props, imports
- **Section 4: Intent Detection** — exact trigger rules, fallback behavior, edge cases
- **Section 5: Live State Integration** — how conversation handler queries Firestore to
  answer status questions accurately
- **Section 6: Error Handling** — Ollama down, task write failure, Firestore quota
- **Section 7: Testing Strategy** — how to verify end-to-end
- **Success Criteria** — measurable checklist

---

## Out of Scope (tracked for later)

- **MoE Router** (token-aware routing across local/Gemini/Claude) — Phase 2
- **Production Ollama** (GCP VM) — when site goes live
- **Nightly dreaming integration** — corrections from action path already feed it via the
  existing pipeline; no new wiring needed
- **Multi-user auth** — personal tool for now

---

## Handoff Notes

- **Continued from:** Session 21 brainstorm, 2026-04-19
- **Original insight:** DirectorChat component exists but is not wired to agent_inbox/.
  This spec closes that gap.
- **Pair with Gemini:** This doc is designed to be pickup-able by Gemini App as a second
  working context. All decisions locked; only design sections 3-7 remain.
- **Harness parity:** Any changes to Claude Code harness should mirror to the local LLM
  harness (Ash Code) so local models gain the same upgrades.
- **Future tooling:** Obsidian or Graphite planned as a mind-mapping tool for the knowledge
  base — may affect how reference docs are sourced/linked later.
