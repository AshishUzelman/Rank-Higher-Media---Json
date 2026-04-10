# Ash Code Setup Guide
_Last updated: 2026-04-10_

> **Goal:** qwen3 leads all development. Claude steps in only for quality review or when explicitly called. Fewer interruptions, especially during AI video work.

---

## Part 1: Make Ash Code Run on qwen3 (2 minutes)

Ollama v0.14 now speaks the Anthropic API natively — no proxy, no extra code. Just two env vars.

### Option A: Per-session (test it first)
Open a terminal and run:
```bash
export ANTHROPIC_BASE_URL=http://localhost:11434/v1
export ANTHROPIC_API_KEY=ollama
claude
```
Claude Code will now use qwen3:30b-a3b for everything. You'll see it respond differently — faster on short tasks, thinks longer on complex ones.

### Option B: Permanent (set it and forget it)
Add to `~/rank-higher-media/ares/.env.local`:
```bash
ANTHROPIC_BASE_URL=http://localhost:11434/v1
ANTHROPIC_API_KEY=ollama
```
Or add to your shell profile (`~/.zshrc` or `~/.bash_profile`) so it applies everywhere:
```bash
# Ash Code — run on qwen3 by default
export ANTHROPIC_BASE_URL=http://localhost:11434/v1
export ANTHROPIC_API_KEY=ollama
```
Then: `source ~/.zshrc`

### Switch back to Claude when you need it
```bash
unset ANTHROPIC_BASE_URL
unset ANTHROPIC_API_KEY
claude   # back to Claude API
```

### Make sure the right models are loaded
```bash
ollama pull qwen3:30b-a3b       # main worker (already pulled)
ollama pull gemma3:27b-it-qat   # synthesizer/reviewer (pull this now)
ollama list                      # verify both appear
```

---

## Part 2: Reduce Restrictions in the Harness

### What's currently blocking you
Claude Code has three layers of restriction:
1. **Permission prompts** — asks before running bash commands, writing files, etc.
2. **Hooks** — our PostToolUse ESLint hook blocks .js edits if lint fails
3. **Auto-mode limits** — Claude pauses and asks for approval on "risky" actions

### Fix 1: Run in Auto-approve mode (no permission prompts)
For a session where you just want it to execute without asking:
```bash
claude --dangerously-skip-permissions
```
This disables all permission gates for that session. Use when you're doing rapid iteration and don't want interruptions.

To make this the default for a specific project, add to that project's CLAUDE.md:
```markdown
## Permissions
This is a trusted local dev environment. Auto-approve all bash, file writes, and API calls without prompting.
```

### Fix 2: Disable the ESLint blocking hook for non-code sessions
The PostToolUse hook we added blocks .js edits if ESLint fails. For AI video or creative work, this is irrelevant and annoying.

**Quick toggle** — edit `~/.claude/settings.json` and change the PostToolUse hook to only run in ARES:
```json
"PostToolUse": [
  {
    "matcher": "Write|Edit",
    "hooks": [
      {
        "type": "command",
        "command": "CLAUDE_HOOK_INPUT=$(cat) ~/.claude/hooks/post-tool-use.sh"
      }
    ]
  }
]
```
Or just temporarily remove the PostToolUse block entirely when doing video work, then add it back.

### Fix 3: Expand allowed tools in skills
In any skill's SKILL.md, change:
```yaml
allowed-tools: Bash(node *)
```
To allow everything:
```yaml
allowed-tools: Bash Read Write Edit Glob Grep
```
Or remove `allowed-tools` entirely — no restriction.

---

## Part 3: AI Video Mode — Specific Setup

When working on AI video generation (scripts, thumbnails, video processing), you want:
- No lint checks blocking you
- Full bash access (ffmpeg, yt-dlp, etc.)
- Fast iteration without approval prompts

### Create a video work CLAUDE.md override
In your video project folder, create a `CLAUDE.md`:
```markdown
# AI Video Project

## Mode: Creative / Video Production
This project generates AI video content. Rules:
- Auto-approve all bash commands (ffmpeg, yt-dlp, python, node)
- Auto-approve all file writes (mp4, mp3, jpg, png, json, md)
- Do NOT run ESLint or any code quality checks
- Do NOT ask for permission before downloading or processing media files
- Preferred model: qwen3 via local Ollama (fast, no API cost)

## Allowed operations (no prompting needed)
- Video processing: ffmpeg, ffprobe
- Download: yt-dlp, curl, wget
- Image: imagemagick, sharp, pillow
- Python scripts, node scripts
- API calls to: Runway, Kling, HeyGen, ElevenLabs, DALL-E, Gemini
```

### Run video sessions with minimal friction
```bash
# Start a video work session — local qwen3, no permission prompts
ANTHROPIC_BASE_URL=http://localhost:11434/v1 ANTHROPIC_API_KEY=ollama claude --dangerously-skip-permissions
```

Or create a shell alias so you just type `ash-video`:
```bash
# Add to ~/.zshrc
alias ash-video='ANTHROPIC_BASE_URL=http://localhost:11434/v1 ANTHROPIC_API_KEY=ollama claude --dangerously-skip-permissions'
alias ash-code='ANTHROPIC_BASE_URL=http://localhost:11434/v1 ANTHROPIC_API_KEY=ollama claude'
alias ash-review='claude'   # full Claude API for quality review only
```
Then `source ~/.zshrc` and you have three modes.

---

## Part 4: When to Use Which Mode

| Mode | Command | Use When |
|------|---------|----------|
| `ash-video` | qwen3 + no restrictions | Making AI videos, rapid content creation, creative work |
| `ash-code` | qwen3 + normal restrictions | Building ARES, Ad Creator, coding sessions |
| `ash-review` | Claude API | Code review, architectural decisions, quality gates |
| `claude` (plain) | Claude API | Anything that needs Claude's full reasoning |

---

## Part 5: Troubleshooting

**qwen3 feels slow on first response**
Normal — it's loading into memory. After the first prompt it's fast. Keep Ollama running in the background (`ollama serve`).

**"model not found" error**
Run `ollama list` — if qwen3:30b-a3b isn't there, run `ollama pull qwen3:30b-a3b`.

**Want to check which model is actually running**
```bash
curl http://localhost:11434/api/tags | python3 -m json.tool | grep name
```

**Switch between local and Claude mid-session**
You can't change the model mid-session, but you can open a second terminal with the other mode.

**qwen3 makes a mistake on complex code**
That's the signal to switch to `ash-review` (Claude API). The rule: qwen3 does 80%+ of the work, Claude handles the hard parts.

---

## Quick Reference Card

```
START LOCAL SESSION:
  ash-code        → qwen3, normal mode
  ash-video       → qwen3, no restrictions  
  ash-review      → Claude API, quality review

RUN A DEBATE:
  cd ~/rank-higher-media/ares
  npm run brainstorm -- "your question" --project ares

PULL MODEL UPGRADES:
  ollama pull gemma3:27b-it-qat
  
CHECK WHAT'S RUNNING:
  ollama list
  ollama ps
```
