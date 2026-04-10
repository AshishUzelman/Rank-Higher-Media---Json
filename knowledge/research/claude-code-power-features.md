# Claude Code Power Features — Research Reference
> Compiled: 2026-04-09 | Applies to: Claude Code CLI + Ash Code fork
> Sources: Official docs, leaked source analysis, community repos, power-user guides

---

## Top 10 — Apply Immediately

1. **`claude --worktree <branch-name>`** — creates an isolated git worktree and starts a session in it. Run 3-5 of these in parallel, cycling between them. Boris Cherny (Claude Code creator) runs 10-15 simultaneous sessions.
2. **`Shift+Tab+Tab` = Plan Mode** — Claude plans without making any file changes. Confirm scope before unleashing execution mode. Also bindable in keybindings.json.
3. **`claude -p "prompt" --output-format json`** — full non-interactive/headless mode. Pipe stdin, get structured JSON back. The backbone of all CI/CD and automation.
4. **Hooks: PreToolUse as a security gate** — the only hook event that can *block* an action before it executes. Use it to protect files, enforce mandatory review, or sandbox risky bash commands.
5. **`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`** — enables the experimental multi-agent team mode where Claude instances communicate via `SendMessage` tool. Requires Opus 4.6+.
6. **`claude mcp serve`** — exposes Claude Code's own tools (Read, Edit, Write, Bash, Grep) as an MCP server so other AI clients (Claude Desktop, Cursor) can delegate work to it.
7. **Auto Memory** — Claude writes its own memory files under `~/.claude/projects/<repo>/memory/` across sessions. It learns your build commands, style preferences, debugging insights without you writing anything.
8. **`CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`** — control when auto-compaction fires (default: ~83.5% of context window). Tune it earlier to avoid mid-task interruption.
9. **`/compact` with instructions** — pass a custom prompt to control what gets preserved during compaction: `/compact focus on the auth module implementation, discard setup discussion`
10. **MCP Tool Search (lazy loading)** — Claude Code only loads MCP tool definitions on demand, not all at once. This cuts context usage by ~95% compared to clients that dump all tool definitions upfront.

---

## 1. Context Management

### Context Window Basics
- Context window: 1M tokens for Sonnet 4.6 and Opus 4.6 on paid plans
- Auto-compaction triggers at ~83.5% usage (for 200K window, that's ~167K tokens)
- Token bar shown at bottom of terminal — watch it actively
- `/context` command shows exact breakdown: system prompt, tools, memory files, skills, conversation history

### Compaction Controls
- **`/compact`** — manual compaction, accepts custom instructions: `/compact keep only the database schema decisions and API design`
- **`CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`** env var — set lower (e.g., 70) to trigger earlier and keep buffer
- **`PreCompact` hook** — fires before auto-compaction, lets you run maintenance scripts or log state

### Subagents for Context Isolation
- Subagents run in separate context windows and report back summaries
- Delegate research tasks to subagents — reading many files burns main context fast
- Use `/batch` for codebase-wide migrations with parallel agents (different from `claude -p`)

### Git Worktrees for Parallel Sessions
- `claude --worktree <branch-name>` — creates isolated worktree + starts session
- All worktrees share the same auto-memory directory: `~/.claude/projects/<repo>/memory/`
- Parallel 3-5 worktrees is the recommended pattern; add browser sessions for up to 10-15
- While Claude works in one worktree, review what finished in another — no idle waiting

### .claudeignore
- Works like .gitignore — tells Claude which files/dirs to skip when reading context
- Prevent irrelevant code (vendor/, dist/, logs/) from consuming tokens
- Define allowed/forbidden file paths in CLAUDE.md as an additional layer

### Session Commands
- `/clear` — fresh context, keeps memory files
- `/compact` — compress with optional instructions
- `/resume` — pick up a previous named session
- `/rename` — give session a readable name for later resumption
- `/branch` — create parallel conversation to explore an alternative
- `/rewind` — roll back to an earlier conversation point (also `Esc+Esc` key)

---

## 2. Hooks — All Lifecycle Events

Hooks are configured in `~/.claude/settings.json` under the `hooks` key. Four handler types: `command`, `http`, `prompt`, `agent`.

### Session & Conversation Hooks
| Event | Trigger | Can Block? |
|---|---|---|
| `Setup` | Initialization / maintenance | No |
| `SessionStart` | Startup, resume, or /clear | No |
| `SessionEnd` | Exit, Ctrl+C, error | No |
| `UserPromptSubmit` | When you submit a prompt | No |
| `PreCompact` | Before auto-compaction fires | No |

### Tool Execution Hooks
| Event | Trigger | Can Block? |
|---|---|---|
| `PreToolUse` | Before any tool executes | **YES — the only blocking hook** |
| `PermissionRequest` | When Claude shows a permission dialog | No |
| `PostToolUse` | After successful tool execution | No |
| `PostToolUseFailure` | When a tool execution fails | No |

### Subagent Hooks
| Event | Trigger | Can Block? |
|---|---|---|
| `SubagentStart` | Subagent startup / resume | No |
| `SubagentStop` | Subagent completes | No |

### Notification & Completion Hooks
| Event | Trigger | Can Block? |
|---|---|---|
| `Notification` | When Claude sends a notification | No |
| `Stop` | When Claude finishes responding | No |

### Key Hook Patterns
```json
// settings.json — protect production config from edits
{
  "hooks": {
    "PreToolUse": [{
      "matcher": {"tool": "Edit", "file_pattern": "*.env.production"},
      "handler": {"type": "command", "command": "echo 'BLOCKED: production env is read-only' && exit 1"}
    }]
  }
}
```
- PreToolUse: security gates, file protection, mandatory review enforcement
- PostToolUse: run tests after edits, log tool calls, trigger notifications
- Stop: run linters/formatters after Claude finishes, send Slack/desktop notification
- SessionStart: load context packets, hydrate memory, set environment
- SubagentStop: collect results, merge outputs, trigger next stage

### Known Bug (as of early 2026)
- GitHub issue #9567: hook environment variables and `$CLAUDE_TOOL_INPUT` may be empty/unknown in some versions. Verify with your version before relying on them.

---

## 3. CLI Flags & Non-Interactive Mode

### Core CLI Flags
```bash
claude -p "prompt"                           # non-interactive / headless mode
claude -p "prompt" --output-format json      # structured JSON output
claude -p "prompt" --output-format stream-json  # streaming JSON (real-time)
claude -p --input-format stream-json         # accept streaming JSON input
claude -p --include-partial-messages         # include in-progress messages in stream
claude -p --verbose                          # verbose output
claude --worktree <branch>                   # create isolated worktree + start session
claude --permission-mode plan                # plan mode (no file changes)
claude --dangerously-skip-permissions        # skip all permission prompts (use in containers)
claude mcp serve                             # expose Claude Code as MCP server
claude --model <model-id>                    # specify model
```

### Non-Interactive Piping Patterns
```bash
# Pipe file content to Claude
cat error.log | claude -p "explain this error"

# Analyze git diff
git diff HEAD~1 | claude -p "review these changes for bugs" --output-format json

# Chain multiple operations
claude -p "list all API endpoints" --output-format json | jq '.[] | .path'

# Multi-step stream-JSON chaining
claude -p --input-format stream-json --output-format stream-json --include-partial-messages
```

### GitHub Actions Integration
- Official: `anthropics/claude-code-action` — mention @claude in any PR/issue to trigger
- `/install-github-app` slash command — sets up automatic PR review
- Headless mode (`claude -p`) is how Claude runs in CI/CD pipelines
- Environment variable `ANTHROPIC_API_KEY` must be set as a GitHub Actions secret

### Batch Mode vs Headless Mode
- `/batch` — codebase-wide parallel migrations, multiple agents working simultaneously
- `claude -p` — single non-interactive execution for CI/CD and scripting (not the same thing)

### Container Execution Pattern (ykdojo)
- Run `--dangerously-skip-permissions` inside Docker so Claude doesn't prompt for each action
- Container includes Gemini CLI as fallback for blocked sites
- Claude Code becomes the orchestrator that spawns and coordinates other AI CLIs in separate containers

---

## 4. CLAUDE.md & Memory System

### Memory File Hierarchy (loads in order, project wins over global)
1. `~/.claude/CLAUDE.md` — global instructions, apply to every project
2. `~/.claude/CLAUDE.local.md` — machine-local global (not committed)
3. `.claude/CLAUDE.md` in project root — project-wide instructions
4. `.claude/CLAUDE.local.md` — project-local, not committed (gitignored)
5. Subdirectory CLAUDE.md files — increasingly specific, loaded recursively up the tree

### CLAUDE.md Best Practices
- Keep under 200 lines — compliance degrades beyond that
- Break complex rules into `.claude/rules/` subdirectory files
- Be specific and concise — vague rules get ignored
- Treat it as a living document: every mistake Claude makes → add a rule so it never happens again
- Define forbidden directories explicitly to prevent context bleed
- Use `@filename` imports to include other files inline

### Auto Memory System
- Claude writes its own memory files: `~/.claude/projects/<git-repo>/memory/`
- Stores: build commands, debugging insights, architecture notes, code style preferences, workflow habits
- Enabled by default in recent versions
- Machine-local (not synced to cloud) — practical operational memory
- All worktrees in the same repo share the same auto-memory directory

### CLAUDE.md Structure Patterns
```markdown
# Project: [Name]
## Tech Stack
## Build Commands
## Key Conventions (do / don't)
## Forbidden Paths (never read or edit)
## Architecture Notes
## Current Sprint / Open Items
```

### Memory Import Trick
Use `@path/to/file.md` in CLAUDE.md to dynamically include other files. Useful for splitting large instructions into logical chunks without hitting the 200-line compliance cliff.

---

## 5. Skills / Slash Commands

### Built-in Commands (key ones)
| Command | What it does |
|---|---|
| `/compact [instructions]` | Compress context with optional retention focus |
| `/clear` | Fresh context (keeps memory) |
| `/resume` | Resume a previous named session |
| `/rename` | Name the current session |
| `/branch` | Parallel conversation fork |
| `/rewind` | Roll back to earlier conversation state |
| `/model` | Switch model (Sonnet, Opus, Haiku) |
| `/effort [low\|medium\|high\|max\|auto]` | Set reasoning depth |
| `/doctor` | Installation health check |
| `/cost` | Show session cost, tokens, duration, code changes |
| `/status` | Version, model, account info |
| `/context` | Token usage breakdown by category |
| `/config` | Open settings menu |
| `/review` | Code review |
| `/batch` | Parallel codebase-wide migration with multiple agents |
| `/install-github-app` | Set up automated PR review via GitHub App |
| `/powerup` | Interactive tutorial system with animated demos |

### Custom Skills / Commands
- File at `.claude/commands/foo.md` → creates `/foo` command (prompt-based)
- File at `.claude/skills/foo/SKILL.md` → creates `/foo` skill (same mechanism)
- Both work identically — skills are just prompt playbooks
- View all available commands by typing `/` in the terminal

### Bundled Skills (ship with Claude Code)
- Available in every session without any configuration
- Unlike built-in commands (fixed logic), bundled skills are prompt-based playbooks

### 73 Slash Commands Found in Leaked Source
The leaked source map revealed 73 total slash commands — many not surfaced in the UI. Use `/` to discover all available ones in your version.

---

## 6. MCP Servers

### Three Scope Levels
```bash
claude mcp add <name> <command> --scope user     # global, all projects
claude mcp add <name> <command> --scope local    # per-project, per-user (default)
claude mcp add <name> <command> --scope project  # committed to .mcp.json, shared with team
```

### Direct Config Edit (skip the CLI wizard)
Edit `~/Library/Application Support/Claude/claude_desktop_config.json` directly for complex setups. Faster than stepping through prompts.

### Tool Search / Lazy Loading
- Claude Code loads MCP tool definitions on demand, not all at once
- Cuts context usage by ~95% vs clients that dump all tool schemas upfront
- Critical for projects with many MCP servers connected

### Claude Code as MCP Server
```bash
claude mcp serve
```
- Exposes Claude Code's tools (Read, Edit, Write, Bash, Grep, LS) via MCP protocol
- Other AI clients (Claude Desktop, Cursor, Windsurf) can delegate file editing to it
- Architecture: JSON-RPC 2.0 over stdio — no network exposure, process-isolated
- Connected clients can only reach Claude Code's own tools, not its connected MCP servers
- Memory usage: ~50-100MB overhead on top of normal 200-500MB

### Common MCP Pitfalls
- Conflicting tool names across multiple MCP servers cause silent failures
- "Disabled in connector settings" usually means a name conflict between servers
- Authentication: prefer short-lived tokens / env vars over long-lived credentials

### Remote MCP Servers
- Supported via SSE transport (server-sent events) for cloud-hosted MCP servers
- Use `--transport sse` flag when adding remote servers

---

## 7. Experimental Features

### Agent Teams (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`)
```json
// ~/.claude/settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```
- Enables `SendMessage` tool for inter-agent communication
- One session acts as team lead; teammates work independently in separate contexts
- Requires Opus 4.6 or later
- Introduced in v2.1.32 (2026-02-05), still experimental
- Known limitations: session resumption, task coordination, shutdown behavior

### Hidden Features (from leaked source map — not yet enabled externally)
- **KAIROS** — always-on assistant (compiles to false in external builds, cannot be enabled via config)
- **ULTRAPLAN** — enhanced planning mode
- **Undercover Mode** — unknown purpose
- **BUDDY** — AI pet companion
- Source map exposed 512,000 lines of TypeScript across ~1,900 files: 27 API beta flags, 80 feature flags, 73 slash commands, 118 settings, 280 env vars

### Notable Environment Variables (from leaked source + docs)
| Variable | Effect |
|---|---|
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | Enable multi-agent team coordination |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | Set custom compaction threshold % |
| `DISABLE_PROMPT_CACHING` | Disable prompt caching (useful for debugging) |
| `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS` | Disable all experimental beta headers |
| `ANTHROPIC_BASE_URL` | Custom API endpoint (for proxies, Bedrock, Vertex) |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | Override the default Sonnet model ID |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | Override the default Opus model ID |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | Override the default Haiku model ID |
| `CLAUDE_CODE_SESSION_ID` | Access current session ID in hooks/scripts |

### /powerup — Interactive Tutorial
- Built-in interactive tutorial system with animated demos
- Just type `/powerup` — Claude walks through what it can actually do
- Good onboarding tool for new team members

---

## 8. Local LLM Integration (Ollama)

### Native Ollama Integration (since Jan 2026)
Ollama added Anthropic Messages API compatibility in January 2026 — Claude Code can connect directly without a proxy for supported models.

```bash
# Direct connection (if Ollama supports Anthropic Messages API for your model)
ANTHROPIC_BASE_URL=http://localhost:11434 ANTHROPIC_API_KEY=ollama claude
```

### LiteLLM Proxy (universal approach)
Claude Code speaks Anthropic Messages API format. Local models (Ollama, llama.cpp, LM Studio) speak OpenAI format. LiteLLM bridges the gap:

```bash
# Install LiteLLM
pip install litellm

# Start proxy (translates Anthropic → OpenAI format for Ollama)
litellm --model ollama/qwen3:30b-a3b --port 4000

# Point Claude Code at the proxy
ANTHROPIC_BASE_URL=http://localhost:4000 ANTHROPIC_API_KEY=fake claude
```

### Supported Local Models (as of 2026)
- qwen3.5, qwen3:30b-a3b, Kimi-k2, GLM-5 via Ollama Anthropic API
- Any model via LiteLLM proxy (OpenAI-compatible models)

### Ash Code Routing Opportunity
The `ANTHROPIC_BASE_URL` env var is the hook point for local LLM routing. In Ash Code's MoE router:
- Set `ANTHROPIC_BASE_URL` to the router's endpoint
- Router inspects task complexity and routes to: local model (cheap/fast) vs Claude API (complex)
- This is the Phase 3 architecture — agent_connector.js becomes the MoE router

### Container Pattern for Local LLMs
Run Claude Code inside Docker, pointed at Ollama on the host:
```bash
ANTHROPIC_BASE_URL=http://host.docker.internal:11434 claude --dangerously-skip-permissions
```

---

## Bonus: Keyboard Shortcuts Reference

| Shortcut | Action |
|---|---|
| `Esc` | Interrupt Claude mid-response |
| `Esc+Esc` | Open rewind menu (undo changes) |
| `Shift+Tab` | Toggle auto-accept mode ("yolo mode" — accepts all tool calls) |
| `Shift+Tab+Tab` | Toggle Plan Mode (no file changes) |
| `Ctrl+G` | Open in external editor |
| `Option+T` / `Alt+T` | Toggle Extended Thinking |
| `Option+P` / `Alt+P` | Open model picker |

### Custom Keybindings
- Edit `~/.claude/keybindings.json` — changes apply without restart
- Map slash commands to key combos for faster workflows
- Supports chord bindings

---

## Resources
- [Official Claude Code Docs](https://code.claude.com/docs/en/)
- [Hooks Reference](https://code.claude.com/docs/en/hooks)
- [CLI Reference](https://code.claude.com/docs/en/cli-reference)
- [Settings Reference](https://code.claude.com/docs/en/settings)
- [Agent Teams Docs](https://code.claude.com/docs/en/agent-teams)
- [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) — curated skills, hooks, slash-commands, orchestrators
- [ykdojo/claude-code-tips](https://github.com/ykdojo/claude-code-tips) — 45 tips including container setup, Gemini CLI minion
- [FlorianBruniaux/claude-code-ultimate-guide](https://github.com/FlorianBruniaux/claude-code-ultimate-guide) — beginner to power user guide
- [Claude Code Hidden Features (leaked source)](https://wavespeed.ai/blog/posts/claude-code-hidden-features-leaked-source-2026/)
- [Environment Variables Gist](https://gist.github.com/jedisct1/9627644cda1c3929affe9b1ce8eaf714)
- [Ollama Integration](https://docs.ollama.com/integrations/claude-code)
- [LiteLLM + Ollama guide](https://medium.com/@kamilmatejuk/run-claude-code-with-local-agents-using-litellm-and-ollama-ab88869cbd00)
- [Cuttlesoft Advanced User Guide](https://cuttlesoft.com/blog/2026/02/03/claude-code-for-advanced-users/)
