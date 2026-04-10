# Claude Code Latest Changelog Research
> Research date: 2026-04-10
> Target version queried: "1.1617.0" — this version number does not exist.
> Actual latest version: **v2.1.98** (released April 9, 2026)
> Claude Code uses a v2.x.y versioning scheme, not v1.x. The closest match to the spirit of the query is the current release.

---

## Version & Date

**v2.1.98** — April 9, 2026 (latest as of research date)
**v2.1.97** — April 8, 2026
**v2.1.94** — April 7, 2026
**v2.1.92** — April 4, 2026
**v2.1.91** — April 2, 2026
**v2.1.90** — April 1, 2026
**v2.1.89** — April 1, 2026

---

## Note on "Self-Correcting Loop"

Ashish mentioned "the local model is done, and working great — I like the self-correcting loop it's suggesting." This is likely referring to:

1. **The Stop hook** — fires when Claude finishes a response. It can return `{continue: true}` to force Claude to keep working. This is the hook-level self-correction mechanism.
2. **The PermissionDenied hook with `{retry: true}`** — when Auto mode blocks a tool call, this hook fires and can retry, creating a correction loop.
3. **The agentic loop architecture** — Claude Code's design (take action → observe result → decide next step) is the built-in self-correcting pattern used in all background agent tasks.
4. **Ollama + Claude Code** — Ollama v0.14 shipped native Anthropic Messages API compatibility in early 2026. Claude Code can now be routed to Ollama directly via env vars, no proxy needed. This is the most likely "local model is done" reference.

---

## Top 5 Most Important Changes (Ranked for Ashish's Use Case)

---

### 1. Ollama Native Anthropic API Compatibility (Ollama v0.14, early 2026)

**What changed:** Ollama v0.14 implemented the full Anthropic Messages API, including streaming tool calls. Claude Code can now point directly at a local Ollama instance with two env vars (`ANTHROPIC_BASE_URL` + `ANTHROPIC_API_KEY=ollama`). No LiteLLM proxy or adapter required. Running `ollama launch claude` auto-configures the variables.

**What the "self-correcting loop" is:** When running a local model through Ollama as the Claude Code backend, the agentic loop (action → observe → iterate) is the self-correction. Models like Qwen2.5 Coder 32B and GLM 4.7 Flash (128K context) are the recommended local choices. The loop works because the Stop hook can force Claude to continue rather than halt — even on local models.

**ARES / Ash Code impact:** This validates the ARES Phase 1 architecture. The `agent_connector.js` routing layer should be updated to support an `OLLAMA_MODE` env var that swaps `ANTHROPIC_BASE_URL` to `http://localhost:11434/v1`. The self-correcting behavior Ashish is seeing is the Stop hook + iterative tool execution — this is built-in, not a separate feature.

**Implement immediately:** Yes. Add `ANTHROPIC_BASE_URL=http://localhost:11434/v1` + `ANTHROPIC_API_KEY=ollama` to the ARES `.env.local` as a toggleable `ARES_LLM_BACKEND` setting.

---

### 2. Advanced Hook System: `defer`, `PermissionDenied`, and `Stop` Hooks (v2.1.89+)

**What changed:** Three major hook additions landed:
- **`defer` decision** in `PreToolUse` hooks — pauses Claude at a tool call and yields control to the calling process (e.g., your agent_connector). Requires v2.1.89+.
- **`PermissionDenied` hook** — fires when Auto mode blocks a tool call, can return `{retry: true}` to force a retry (the self-correction loop at the permission layer).
- **`Stop` hook** — fires when Claude finishes generating. Can return `{continue: true}` to prevent stopping and force another iteration.

**ARES / Ash Code impact:** This is the hook architecture that powers autonomous self-correction in ARES. The `agent_connector.js` should register a `Stop` hook that checks task completion status in Firestore, and return `{continue: true}` if the task's success criteria aren't met yet. The `defer` decision is the missing piece for building the "Gemini writes task → Claude Code executes, pauses at ambiguity → Gemini resolves → Claude resumes" loop.

**Implement immediately:** Yes — the Stop hook + PermissionDenied retry is the self-correcting loop ARES needs. Add to the hook configuration in `.claude/settings.json` in the ARES repo.

---

### 3. MCP Tool Result Persistence Override — Up to 500K chars (v2.1.91)

**What changed:** MCP servers can now set `_meta["anthropic/maxResultSizeChars"]` on tool results to pass through up to 500,000 characters without truncation. Previously, large tool results (database schemas, full file trees, audit reports) were silently cut off.

**ARES / Ash Code impact:** The SEO Auditor agent and any ARES tool that returns large structured data (full Firestore dumps, full site crawl results, full keyword lists) can now be passed to Claude without hitting the truncation wall. The ARES MCP server config should set this field on all tools that return bulk data.

**Implement immediately:** Yes — update the ARES MCP server definitions to include `_meta["anthropic/maxResultSizeChars"]: 500000` on any tool returning large payloads.

---

### 4. Default Effort Level Changed to "High" for API Key Users (v2.1.94)

**What changed:** The default effort level was upgraded from medium to high for all API-key users, Bedrock/Vertex/Foundry users, and Team/Enterprise users. This means Claude Code now uses extended thinking and deeper reasoning by default on all tasks — without needing `/effort high` explicitly.

**ARES / Ash Code impact:** Any ARES Worker task running via Claude Code API (headless `-p` mode) now gets high-effort reasoning by default. This is significant for the ARES SEO Auditor and any multi-step agent task. Budget impact: high effort uses more tokens. For routine/cheap worker tasks, explicitly set `/effort low` or `--effort low` to preserve budget. For strategic tasks (Director, Manager tier), keep high.

**Implement immediately:** Review ARES agent task definitions and add explicit `--effort low` to high-frequency, low-complexity worker tasks. Leave strategic tasks at default high.

---

### 5. Subprocess Sandboxing + `CLAUDE_CODE_PERFORCE_MODE` + Monitor Tool (v2.1.98)

**What changed:** Three security/ops features shipped together:
- **Subprocess sandboxing** via PID namespace isolation on Linux (`CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1`). Each bash subprocess runs in an isolated namespace.
- **`CLAUDE_CODE_PERFORCE_MODE`** — for read-only file systems (Perforce), prevents silent overwrites and tells Claude to run `p4 edit` first.
- **Monitor tool** — streams events from background scripts in real-time. Useful for watching long-running agent tasks.

**ARES / Ash Code impact:** The Monitor tool is directly relevant to ARES background agent execution. Rather than polling Firestore for task status, the Monitor tool can stream live events from `agent_connector.js` tasks to the ARES dashboard. Subprocess sandboxing is important when ARES runs worker scripts autonomously — enabling it prevents cross-contamination between parallel subagents.

**Implement immediately:** Enable `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1` in the ARES production env. Evaluate the Monitor tool as a replacement for the Firestore polling approach in the ARES dashboard's TaskQueue widget.

---

## Additional Notable Changes

### Slash Commands
- `/release-notes` — interactive version picker (v2.1.92)
- `/powerup` — interactive feature lessons (v2.1.90)
- `/agents` — now shows running count: `● N running` (v2.1.97)
- `/cost` — per-model and cache-hit breakdown (v2.1.92)
- `/reload-plugins` — pick up new plugin skills without restart (v2.1.98)
- `/tag` and `/vim` — **removed** in v2.1.92

### CLI Flags
- `--exclude-dynamic-system-prompt-sections` — prompt caching optimization for print mode (v2.1.98)
- `MCP_CONNECTION_NONBLOCKING=true` — prevents MCP server delays from blocking headless `-p` mode startup (v2.1.89)
- `CLAUDE_CODE_SCRIPT_CAPS` — limit total script invocations per session (v2.1.98)

### CLAUDE.md Fixes
- **Nested CLAUDE.md re-injection bug fixed** (v2.1.89) — nested CLAUDE.md files were being re-injected dozens of times per session; now fixed. This was causing silent context bloat and unpredictable behavior in ARES sessions.

### Hooks Reference
| Hook | Trigger | New Capability |
|------|---------|---------------|
| `PreToolUse` | Before any tool runs | `defer` decision pauses for external input |
| `PostToolUse` | After tool completes | File path context (`file_path`) added |
| `PermissionDenied` | Auto mode blocks tool | `{retry: true}` for self-correction |
| `Stop` | Claude finishes response | `{continue: true}` to force another iteration |
| `UserPromptSubmit` | User submits prompt | `hookSpecificOutput.sessionTitle` |
| `TaskCreated` | Subagent task created | Available since v2.1.84 |
| `WorktreeCreate` | Worktree created | HTTP hook support |
| `CronCreate` | Scheduled task created | Available since v2.1.85 |

### MCP Changes
- RFC 9728 Protected Resource Metadata OAuth discovery (v2.1.85)
- Step-up auth via `403 insufficient_scope` for elevated scopes (v2.1.85)
- HTTP/SSE memory leak fixed (~50 MB/hr) (v2.1.97)
- MCP server auto-restarts on crash instead of failing until restart (v2.1.89)

### Agentic / Subagent Features
- Subagent worktree isolation (v2.1.89) — each subagent gets its own worktree
- `cwd:` override for subagents (v2.1.89)
- Named subagents in `@` typeahead (v2.1.89)
- Background subagents with partial progress reporting (v2.1.98)
- Stale worktree cleanup (v2.1.98)

---

## What to Implement in ARES Immediately

| Priority | Item | Why |
|----------|------|-----|
| P0 | Add `ANTHROPIC_BASE_URL` toggle to agent_connector.js for Ollama routing | Local model working — make it a proper config switch |
| P0 | Register `Stop` hook in ARES that checks Firestore task completion | This is the self-correcting loop |
| P1 | Register `PermissionDenied` hook with `{retry: true}` for auto-mode tasks | Prevents silent failures in unattended agent runs |
| P1 | Set `_meta["anthropic/maxResultSizeChars"]: 500000` on bulk-data MCP tools | SEO auditor needs this |
| P1 | Add `--effort low` to high-frequency ARES worker task invocations | Cost control now that default is high |
| P2 | Enable `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1` in ARES production | Subagent sandboxing |
| P2 | Evaluate Monitor tool for ARES dashboard live streaming | Replace Firestore polling for task status |

---

## Sources Consulted
- [Claude Code GitHub CHANGELOG.md](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- [Claude Code GitHub Releases](https://github.com/anthropics/claude-code/releases)
- [Claude Code Docs Changelog](https://code.claude.com/docs/en/changelog)
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks)
- [Ollama + Claude Code Integration](https://docs.ollama.com/integrations/claude-code)
- [Claude Code v2.1.98 Release Notes](https://www.claudeupdates.dev/version/2.1.98)
- [Piebald-AI Claude Code System Prompts](https://github.com/Piebald-AI/claude-code-system-prompts)
- [Claude Code March 2026 Updates — Builder.io](https://www.builder.io/blog/claude-code-updates)
- [Claude Code April 2026 Updates — Releasebot](https://releasebot.io/updates/anthropic/claude-code)
- [Agentic AI Loops with Claude — DEV Community](https://dev.to/whoffagents/agentic-ai-loops-with-claude-build-self-correcting-agents-that-actually-finish-tasks-1i1p)
- [Claude Code Ollama DataCamp Tutorial](https://www.datacamp.com/tutorial/using-claude-code-with-ollama-local-models)
- [Run Claude Code with local agents using LiteLLM and Ollama — Medium](https://medium.com/@kamilmatejuk/run-claude-code-with-local-agents-using-litellm-and-ollama-ab88869cbd00)
