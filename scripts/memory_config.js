// scripts/memory_config.js
import { homedir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const HOME = homedir();
const PROJECT_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const AUTO_MEMORY_ROOT = join(HOME, '.claude/projects/-Users-ashishuzelman-rank-higher-media/memory');
// AUTO_MEMORY_ROOT slug: Claude Code converts the absolute repo path to a directory key
// by replacing '/' with '-'. On this machine: /Users/ashishuzelman/rank-higher-media → -Users-ashishuzelman-rank-higher-media

export const PATHS = {
  rollingSummary:  join(PROJECT_ROOT, 'rolling_summary.md'),
  context:         join(PROJECT_ROOT, 'CONTEXT.md'),
  projectStatus:   join(PROJECT_ROOT, 'PROJECT_STATUS.md'),
  draft:           join(PROJECT_ROOT, 'memory_draft.md'),
  autoMemoryRoot:  AUTO_MEMORY_ROOT,
  autoMemoryIndex: join(AUTO_MEMORY_ROOT, 'MEMORY.md'),
};

// Never touch these — constitution + client data files
export const PROTECTED_FILES = [
  'SOUL_BASE.md', 'SOUL_ARES.md', 'SOUL.md',
  'permanent.json', 'client_override.json',
];

export const LLM = {
  provider: process.env.MEMORY_LLM || 'claude', // 'claude' | 'ollama'
  claude: {
    model: 'claude-sonnet-4-6',
    maxTokens: 2048,
  },
  ollama: {
    model: 'qwen3.5:9b',
    baseUrl: 'http://localhost:4000',
  },
};

const today = () => new Date().toISOString().slice(0, 10);

export const PROMPTS = {
  rollingSummary: (currentContent, transcript) => `
You are updating a session summary file. The file keeps the last 3 sessions.

CURRENT FILE CONTENT:
${currentContent}

SESSION TRANSCRIPT:
${transcript}

Write a new session entry to PREPEND to the file (it becomes the new [Most Recent]).
Format EXACTLY as:
## Session N — [Most Recent]
**Date:** ${today()}
**Primary Work:**
- [bullet points of what was done]

**Open Items (carried forward):**
- [unresolved items from this session]

**Next Session Should Start With:**
1. [ordered list of next actions]

Rules:
- ~200 words max
- If there are already 3 sessions in the file, drop the oldest one
- Do not reproduce the file header — only return the new session block
- Be specific: mention file names, decisions, outcomes
`.trim(),

  context: (currentContent, transcript) => `
You are updating a live project context file for a developer.

CURRENT FILE CONTENT:
${currentContent}

SESSION TRANSCRIPT:
${transcript}

Return the FULL updated file content. Update only the sections that changed this session.
Update the "Last updated" line in the header to: ${today()}
Keep all sections that didn't change verbatim. Be specific about what changed.
`.trim(),

  projectStatus: (currentContent, transcript) => `
You are adding a daily entry to a project status file.

CURRENT FILE CONTENT:
${currentContent}

SESSION TRANSCRIPT:
${transcript}

Return ONLY the new daily entry block to PREPEND (do not return the full file):
## TODAY — ${today()}

### Completed
- [x] [specific items completed this session]

### In Progress
- [ ] [items started but not done]

### Blocked
- [any new blockers discovered]

Rules:
- Only include items from THIS session
- Be specific: name files, features, decisions
- If nothing was blocked, omit the Blocked section
`.trim(),

  autoMemory: (currentMemoryIndex, transcript) => `
You are extracting memory updates from a Claude Code session transcript.

CURRENT MEMORY INDEX:
${currentMemoryIndex}

SESSION TRANSCRIPT:
${transcript}

Identify any NEW or UPDATED information in these 4 memory categories:
1. user — role, preferences, knowledge
2. feedback — corrections or validated approaches
3. project — project facts, decisions, status changes
4. reference — external resource locations

For each update, return a JSON array like:
[
  {
    "filename": "feedback_concise_responses.md",
    "action": "create" | "update",
    "content": "---\\nname: ...\\ndescription: ...\\ntype: feedback\\n---\\n\\n[body]"
  }
]

Rules:
- Only include genuinely new or changed information
- Do not re-state things already in the memory index
- Return [] if nothing new was learned
- Use the same frontmatter format as existing memory files
- Filenames: lowercase, underscores, descriptive (e.g. feedback_terse_responses.md)
`.trim(),
};
