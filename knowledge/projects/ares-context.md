# ares Expert Profile
_Seeded manually: 2026-04-09 — auto-updated after each brainstorm debate_

## Tech Stack
- Framework: Next.js 16, Tailwind 4, Firebase Web SDK v12
- Language: JavaScript only (no TypeScript)
- Local LLMs: Ollama on M1 Mac — qwen3:30b-a3b (Worker, 128K ctx), gemma3:12b (Supervisor/Critic)
- Path alias: @/ maps to src/

## Key Conventions
- Firebase 12: guard initializeApp with hasConfig check (throws if apiKey is empty string)
- React hooks: never call Date.now()/Math.random() in render phase — use async callbacks
- App Router only — no pages/ directory
- 'use client' on all components using hooks or browser APIs
- Always output full file content — no partial stubs or "// continues" comments

## Agent Architecture
- agent_inbox/ → agent_connector.js → Ollama Worker → Supervisor → agent_outbox/
- Actor-Critic: qwen3 drafts → gemma3 critiques → qwen3 revises (2 turns)
- Supervisor pattern: gemma3 reviews, APPROVED/REJECTED loop, max 3 retries → escalated
- TaskTypes: code | review | research | summary | debate | agentic | general
- Worker: **Worker**: claude tag in task file → routes to Claude API

## Current Priorities (as of 2026-04-09)
1. Brainstorm system (this build)
2. Multi-phase worker loop (research → draft → critic → refine → supervisor)
3. Ash Code delegator + Active Dreaming
4. Meta-Harness patterns: environment bootstrapping + structured tool schema

## Key Scripts
- npm run ares-start/stop/status — daemon control
- npm run brainstorm -- "topic" --project ares — debate engine (after this build)
- npm run connector — manual connector run

## Key Gotchas
- knowledge_retrieval.js KNOWLEDGE_ROOT fixed to ../../knowledge (was broken before 2026-04-09)
- Firestore backup active; Drive OAuth pending credentials.json
- All agent outputs should include structured JSON header + markdown body
