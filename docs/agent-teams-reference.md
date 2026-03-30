# Agent Teams — Master Reference Guide
Source: https://code.claude.ai/docs/en/agent-teams
Captured: 2026-03-30
Version: Claude Code v2.1.32+

## What They Are
Coordinate multiple Claude Code instances working together. One session = team lead. Teammates work independently, each in their own context window, and communicate directly with each other via a shared task list and mailbox.

Unlike sub-agents (which only report back to the main agent), teammates can message each other directly.

---

## Enabling

Add to `.claude/settings.local.json`:
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```
Disabled by default. Requires Claude Code v2.1.32+.

---

## When to Use Agent Teams

**Best use cases:**
- Research and review: multiple teammates investigate different aspects simultaneously
- New modules/features: each teammate owns a separate piece
- Debugging competing hypotheses: teammates test different theories in parallel
- Cross-layer coordination: frontend / backend / tests each owned by different teammate

**When NOT to use:**
- Sequential tasks (use sub-agents instead)
- Same-file edits
- Work with many dependencies
- Simple tasks (overkill)
- Tight token budget

---

## Sub-agents vs Agent Teams

| | Sub-agents | Agent teams |
|--|-----------|------------|
| Context | Own window; results return to caller | Own window; fully independent |
| Communication | Report to main agent only | Message each other directly |
| Coordination | Main agent manages all work | Shared task list, self-coordination |
| Best for | Focused tasks, result only matters | Complex work needing discussion |
| Token cost | Lower | Higher (each = separate Claude instance) |

---

## Display Modes

| Mode | Config | Notes |
|------|--------|-------|
| Auto | `"auto"` | Split panes in tmux, in-process otherwise |
| In-process | `"in-process"` | Any terminal, no setup |
| Split panes | `"tmux"` | Requires tmux or iTerm2 |

Set in `~/.claude.json`: `{ "teammateMode": "in-process" }`
Override per session: `claude --teammate-mode in-process`

In-process controls:
- `Shift+Down` — cycle through teammates
- `Enter` — view teammate session
- `Escape` — interrupt current turn
- `Ctrl+T` — toggle task list

---

## Prompting Pattern

```
Goal: [what we're building and why agents exist as a team]

Create a team of [N] teammates using [Haiku/Sonnet/Opus]:

Agent 1 — [Role]
Owns: [files/domain]
[Task description]. When done, message [agent name].

Agent 2 — [Role]
Wait for [agent]'s message. Then [task]. Send output to [agent].

Agent 3 — [QA/Review Role]
Review [agents]' work. Send failures back with specific issues.

Final deliverables:
- [specific output]
```

---

## Key Rules

1. **File ownership** — each agent owns specific files, no overlap
2. **Direct messaging** — agents talk to each other, not through the lead
3. **Parallel by default** — not a chain; agents work simultaneously
4. **Plan approval mode** — agents plan first, lead approves before execution
5. **3–5 teammates max** — coordination overhead and N× token cost
6. **Full context in spawn prompt** — no conversation history inherited
7. **Clean shutdown** — ask teammate to shut down, wait for confirmation before cleanup

---

## Architecture

| Component | Role |
|-----------|------|
| Team lead | Creates team, spawns teammates, coordinates |
| Teammates | Independent Claude Code instances |
| Task list | Shared work items (pending → in progress → completed) |
| Mailbox | Direct agent-to-agent messaging |

Storage:
- `~/.claude/teams/{team-name}/config.json` — team config + members array
- `~/.claude/tasks/{team-name}/` — task list

---

## Task System
- Dependencies: task can block on another task completing
- Self-claim: teammate picks up next unblocked task after finishing
- File locking prevents race conditions on simultaneous claims

---

## Messaging
- `message` — send to one teammate
- `broadcast` — send to all (use sparingly — costs scale with team size)
- Messages delivered automatically; lead doesn't need to poll
- Idle notifications sent automatically when teammate finishes

---

## Permissions
- Teammates inherit lead's permission settings
- All teammates get `--dangerously-skip-permissions` if lead has it
- Can change individual teammate modes after spawn
- Cannot set per-teammate modes at spawn time

---

## Hooks for Quality Gates

| Hook | Trigger | Use for |
|------|---------|---------|
| `TeammateIdle` | Teammate about to go idle | Enforce quality before finishing |
| `TaskCreated` | Task being added to list | Validate task format/criteria |
| `TaskCompleted` | Task being marked done | Check deliverables exist |

Exit code 2 = block the action + send feedback to the agent.

---

## Common Pitfalls & Fixes

| Problem | Fix |
|---------|-----|
| Too many permission prompts | Pre-approve common operations in project settings |
| Deliverables being overwritten | Assign file owners in prompt |
| Agent not doing much | Assign explicit work or dependency in prompt |
| Burning too many tokens | Use fewer agents or Haiku instead of Sonnet |
| Agents losing work | Tell them to save to temp files they can call later |
| Wrong approvals | Have yourself approve until you understand the flow |
| Lead starts working instead of delegating | "Wait for your teammates to finish before proceeding" |

---

## Limitations (Experimental)
- No session resumption with in-process teammates
- Task status can lag
- Slow shutdown (finishes current request first)
- One team per session
- No nested teams
- Lead is fixed
- Split panes not supported: VS Code integrated terminal, Windows Terminal, Ghostty

---

## Token Cost
- Each teammate = separate context window = independent billing
- 3 agents ≈ 3× single session cost
- Use Haiku for mechanical workers, Sonnet for judgment/strategy
- Start with 3–5 teammates; 5–6 tasks per teammate is optimal
