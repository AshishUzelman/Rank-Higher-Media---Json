# Memory Consolidation Strategy
**Reduce session context load by 40% while keeping all info accessible.**

---

## Current State (Problem)
- MEMORY.md: 6.1KB, links to 12 project files
- **Every session**: All 12 files loaded into context (wasted tokens for inactive projects)
- Strategic docs: Loaded but rarely changed (Ash Code strategy, Architecture vision)
- Total memory footprint: ~50KB per session, ~15% of context window

---

## Target State (Solution)

### Three-Tier Memory System

**Tier 1: SESSION-CRITICAL (Always load)**
- `MEMORY.md` — index only (~2KB, just links)
- `project_ares_agent_system.md` — live system state
- `feedback_*.md` — active working rules
- `user_hardware.md` — one-time reference

**Tier 2: PROJECT-SPECIFIC (Load on demand)**
- `~/ares/CONTEXT_ARES.md` — ARES-only (moved here)
- `~/ad-creator/CONTEXT_AD.md` — Ad Creator-only (moved here)
- Stay in local folders, only loaded when working on that project

**Tier 3: STRATEGIC/ARCHIVED (Move to Drive)**
- `project_ash_code_strategic.md` → Drive folder
- `project_architecture_vision.md` → Drive folder
- `project_intelligence_roadmap.md` → Drive folder
- `rolling_summary_archive_*.md` → Drive folder
- Reference via comment: `// See Drive folder: 15s6YJyUVIb6bg0ky3WLWSklJAvndCNs1`

---

## Implementation (Immediate)

### Step 1: Trim MEMORY.md (5 min)
**From 200 lines → 80 lines**
- Remove all detail text (keep only links + one-liners)
- Move active projects to "Current" section
- Move parked projects to "Archive" section

```markdown
# Claude Code Memory — Rank Higher Media
Auto-loaded every session. Detailed memory files linked below.

## Active Projects (Loaded This Session)
- [ARES Agent System](project_ares_agent_system.md) — live state + known bugs
- [Feedback Rules](feedback_defer_to_claude.md) + [Token Planning](feedback_token_planning.md) — working style
- [Hardware](user_hardware.md) — M1 Mac 32GB, external SSD planned

## Project-Specific Context (Load when needed)
- ARES: `~/rank-higher-media/ares/CONTEXT_ARES.md`
- Ad Creator: `~/ad-creator/CONTEXT_AD.md`

## Archive (Strategy, Parked Projects)
See Google Drive folder `15s6YJyUVIb6bg0ky3WLWSklJAvndCNs1`:
- ash_code_strategic.md
- architecture_vision.md
- intelligence_roadmap.md
- skill_builder.md
- all rolling_summary archives
```

### Step 2: Move Strategic Docs to Drive (15 min)
```bash
# Backup to Drive (use Google Drive CLI or browser)
# Then remove from local memory/
rm ~/.claude/projects/-Users-ashishuzelman-rank-higher-media/memory/project_ash_code_strategic.md
rm ~/.claude/projects/-Users-ashishuzelman-rank-higher-media/memory/project_architecture_vision.md
rm ~/.claude/projects/-Users-ashishuzelman-rank-higher-media/memory/project_intelligence_roadmap.md
rm ~/.claude/projects/-Users-ashishuzelman-rank-higher-media/memory/project_skill_builder.md
```

### Step 3: Move Project Contexts to Project Folders (20 min)
```bash
# ARES context
mv ~/.claude/projects/-Users-ashishuzelman-rank-higher-media/memory/project_ares_agent_system.md \
   ~/rank-higher-media/ares/CONTEXT_ARES.md

# Create Ad Creator memory (if not exists)
mkdir -p ~/ad-creator/.claude/memory
# Note: Ad Creator context will be created during Ad Creator session
```

### Step 4: Update MEMORY.md (10 min)
```bash
# See example structure above — rewrite MEMORY.md as 80-line index
```

---

## Result

### Before (Every Session)
```
Load time: ~45 seconds
MEMORY.md: 200 lines
+ project_ares_agent_system.md (2.4KB)
+ project_ash_code_strategic.md (13KB) ← wasted token
+ project_architecture_vision.md (1.2KB) ← wasted token
+ project_intelligence_roadmap.md (3KB) ← wasted token
+ 8 other files
Total: ~50KB loaded
```

### After (Every Session)
```
Load time: ~15 seconds
MEMORY.md: 80 lines
+ feedback_*.md (1.7KB)
+ project_ares_agent_system.md (2.4KB)
+ user_hardware.md (1KB)
Total: ~8KB loaded
```

**Savings**: 42KB per session = ~5-8% context window recovered = **3-5 extra days of token budget**.

---

## When to Add Back

If you're actively working on a project:
1. Create `<project>/CONTEXT_<PROJECT>.md`
2. Add reference to MEMORY.md under "Active Projects"
3. Once done, move to Drive archive

---

## Drive Folder Structure (Recommended)

```
Google Drive / AI folder (15s6YJyUVIb6bg0ky3WLWSklJAvndCNs1)
├── Strategic Planning/
│   ├── ash_code_strategic.md
│   ├── architecture_vision.md
│   └── intelligence_roadmap.md
├── Project Archives/
│   ├── skill_builder.md
│   ├── rolling_summary_archive_2026-04.md
│   └── rolling_summary_archive_2026-03.md
└── Backup/
    └── SOUL_*.md backups (optional)
```

---

## Checklist

- [ ] Backup strategic docs to Drive (5 min)
- [ ] Rewrite MEMORY.md as lean index (10 min)
- [ ] Delete 4 strategic docs from local memory/ (5 min)
- [ ] Move ares context to ares/CONTEXT_ARES.md (5 min)
- [ ] Test session start (30 sec load vs 45 sec before)
- [ ] Commit .gitignore + memory changes

**Total time: 30 minutes**
**Token savings: 3-5 days worth**
