# Memory Compiler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-compile Claude Code session transcripts into structured memory files via a Stop hook, with a staged review + approval step before anything is written.

**Architecture:** A `Stop` hook triggers `compile_memory.js`, which reads the session transcript from stdin, calls Claude API with 4 targeted prompts, and writes `memory_draft.md`. Running `approve_memory.js` shows a diff per file and writes on confirmation.

**Tech Stack:** Node.js (built-in modules only + `@anthropic-ai/sdk`), Claude Code hooks, Anthropic SDK

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `scripts/memory_config.js` | Create | File paths, LLM config, prompt templates |
| `scripts/compile_memory.js` | Create | Hook entry point — reads transcript, calls LLM, writes draft |
| `scripts/approve_memory.js` | Create | Parses draft, shows diff, prompts y/n/edit, writes live files |
| `scripts/test_compile.js` | Create | Unit tests for draft writing + transcript validation |
| `scripts/test_approve.js` | Create | Unit tests for draft parsing + section application |
| `scripts/fixtures/sample_transcript.json` | Create | Sample hook payload for integration testing |
| `package.json` | Create | `@anthropic-ai/sdk` dependency + test scripts |
| `.gitignore` | Modify | Add `memory_draft.md` |
| `~/.claude/settings.json` | Modify | Register Stop hook |

---

## Task 1: Project Setup

**Files:**
- Create: `~/rank-higher-media/package.json`
- Modify: `~/rank-higher-media/.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "rank-higher-media-scripts",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test:compile": "node --test scripts/test_compile.js",
    "test:approve": "node --test scripts/test_approve.js",
    "test": "node --test scripts/test_compile.js && node --test scripts/test_approve.js",
    "compile": "node scripts/compile_memory.js",
    "approve": "node scripts/approve_memory.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0"
  }
}
```

- [ ] **Step 2: Install dependency**

```bash
cd ~/rank-higher-media && npm install
```

Expected: `node_modules/@anthropic-ai/sdk` created

- [ ] **Step 3: Add memory_draft.md to .gitignore**

Open `~/rank-higher-media/.gitignore` and append:
```
memory_draft.md
scripts/fixtures/
```

- [ ] **Step 4: Create scripts and fixtures directories**

```bash
mkdir -p ~/rank-higher-media/scripts/fixtures
```

- [ ] **Step 5: Commit**

```bash
cd ~/rank-higher-media
git add package.json package-lock.json .gitignore
git commit -m "chore: add memory compiler project setup"
```

---

## Task 2: Config Module

**Files:**
- Create: `~/rank-higher-media/scripts/memory_config.js`

- [ ] **Step 1: Create memory_config.js**

```js
// scripts/memory_config.js
import { homedir } from 'os';
import { join } from 'path';

const HOME = homedir();
const PROJECT_ROOT = join(HOME, 'rank-higher-media');
const AUTO_MEMORY_ROOT = join(HOME, '.claude/projects/-Users-ashishuzelman-rank-higher-media/memory');

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
```

- [ ] **Step 2: Commit**

```bash
cd ~/rank-higher-media
git add scripts/memory_config.js
git commit -m "feat: add memory compiler config module"
```

---

## Task 3: Unit Tests — Compile Side

**Files:**
- Create: `~/rank-higher-media/scripts/test_compile.js`

- [ ] **Step 1: Write failing tests**

```js
// scripts/test_compile.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isTranscriptValid, formatTranscript, buildDraftSection } from './compile_memory.js';

describe('isTranscriptValid', () => {
  it('returns false for empty string', () => {
    assert.equal(isTranscriptValid(''), false);
  });

  it('returns false for transcript under 500 chars', () => {
    assert.equal(isTranscriptValid('short'), false);
  });

  it('returns true for transcript over 500 chars', () => {
    assert.equal(isTranscriptValid('x'.repeat(501)), true);
  });
});

describe('formatTranscript', () => {
  it('converts message array to readable string', () => {
    const messages = [
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi there' },
    ];
    const result = formatTranscript(messages);
    assert.ok(result.includes('user: hello'));
    assert.ok(result.includes('assistant: hi there'));
  });

  it('handles empty messages array', () => {
    assert.equal(formatTranscript([]), '');
  });
});

describe('buildDraftSection', () => {
  it('wraps content in correct fenced section header', () => {
    const result = buildDraftSection('rolling_summary', 'some content');
    assert.ok(result.startsWith('## [rolling_summary]'));
    assert.ok(result.includes('some content'));
  });

  it('wraps auto-memory file with filename in header', () => {
    const result = buildDraftSection('auto-memory: feedback_test.md', 'file body');
    assert.ok(result.startsWith('## [auto-memory: feedback_test.md]'));
    assert.ok(result.includes('file body'));
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd ~/rank-higher-media && npm run test:compile
```

Expected: `ERR_MODULE_NOT_FOUND` or similar — functions not yet exported

- [ ] **Step 3: Commit the failing tests**

```bash
cd ~/rank-higher-media
git add scripts/test_compile.js
git commit -m "test: add failing unit tests for compile_memory helpers"
```

---

## Task 4: compile_memory.js

**Files:**
- Create: `~/rank-higher-media/scripts/compile_memory.js`

- [ ] **Step 1: Create compile_memory.js**

```js
// scripts/compile_memory.js
import { readFileSync, writeFileSync, existsSync } from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import { PATHS, LLM, PROMPTS } from './memory_config.js';

// --- Pure helpers (exported for testing) ---

export function isTranscriptValid(transcript) {
  return typeof transcript === 'string' && transcript.length >= 500;
}

export function formatTranscript(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return '';
  return messages
    .map(m => {
      const content = typeof m.content === 'string'
        ? m.content
        : JSON.stringify(m.content);
      return `${m.role}: ${content}`;
    })
    .join('\n\n');
}

export function buildDraftSection(key, content) {
  return `## [${key}]\n${content.trim()}\n`;
}

// --- LLM call ---

async function callLLM(prompt) {
  if (LLM.provider === 'ollama') {
    const res = await fetch(`${LLM.ollama.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LLM.ollama.model,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
      }),
    });
    const data = await res.json();
    return data.message?.content || '';
  }

  // Default: Claude API
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: LLM.claude.model,
    max_tokens: LLM.claude.maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  return msg.content[0].text;
}

// --- File reader (safe — returns empty string if missing) ---

function readFile(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

// --- Main ---

async function main() {
  // Read hook payload from stdin
  let payload;
  try {
    const stdin = readFileSync('/dev/stdin', 'utf8');
    payload = JSON.parse(stdin);
  } catch {
    console.error('[memory-compiler] Failed to read hook payload');
    process.exit(0); // Exit cleanly — don't block Claude Code
  }

  // Extract transcript
  const messages = payload?.transcript || payload?.messages || [];
  const transcript = formatTranscript(messages);

  if (!isTranscriptValid(transcript)) {
    console.log('[memory-compiler] Transcript too short — skipping compilation');
    process.exit(0);
  }

  console.log('[memory-compiler] Compiling memory...');

  const sections = [];

  try {
    // 1. rolling_summary
    const rollingSummaryContent = readFile(PATHS.rollingSummary);
    const summaryResult = await callLLM(PROMPTS.rollingSummary(rollingSummaryContent, transcript));
    sections.push(buildDraftSection('rolling_summary', summaryResult));

    // 2. CONTEXT
    const contextContent = readFile(PATHS.context);
    const contextResult = await callLLM(PROMPTS.context(contextContent, transcript));
    sections.push(buildDraftSection('CONTEXT', contextResult));

    // 3. PROJECT_STATUS
    const statusContent = readFile(PATHS.projectStatus);
    const statusResult = await callLLM(PROMPTS.projectStatus(statusContent, transcript));
    sections.push(buildDraftSection('PROJECT_STATUS', statusResult));

    // 4. Auto-memory files
    const memoryIndex = readFile(PATHS.autoMemoryIndex);
    const autoMemoryResult = await callLLM(PROMPTS.autoMemory(memoryIndex, transcript));

    let autoMemoryUpdates = [];
    try {
      autoMemoryUpdates = JSON.parse(autoMemoryResult);
    } catch {
      // LLM returned non-JSON — log and skip auto-memory
      console.error('[memory-compiler] Auto-memory LLM response was not valid JSON — skipping');
    }

    for (const update of autoMemoryUpdates) {
      sections.push(buildDraftSection(`auto-memory: ${update.filename}`, update.content));
    }

  } catch (err) {
    const errorSection = buildDraftSection('ERROR', `Memory compilation failed:\n${err.message}`);
    writeFileSync(PATHS.draft, errorSection);
    console.error('[memory-compiler] Error during compilation:', err.message);
    process.exit(0);
  }

  const draft = sections.join('\n---\n\n');
  writeFileSync(PATHS.draft, draft);
  console.log(`[memory-compiler] Draft written to memory_draft.md — run 'npm run approve' to review`);
}

main();
```

- [ ] **Step 2: Run compile tests — expect PASS**

```bash
cd ~/rank-higher-media && npm run test:compile
```

Expected: all 6 tests pass

- [ ] **Step 3: Commit**

```bash
cd ~/rank-higher-media
git add scripts/compile_memory.js
git commit -m "feat: add compile_memory.js with LLM compilation + draft writing"
```

---

## Task 5: Unit Tests — Approve Side

**Files:**
- Create: `~/rank-higher-media/scripts/test_approve.js`

- [ ] **Step 1: Write failing tests**

```js
// scripts/test_approve.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseDraft, computeDiff } from './approve_memory.js';

describe('parseDraft', () => {
  it('parses a single section', () => {
    const draft = '## [rolling_summary]\nsome summary content\n';
    const result = parseDraft(draft);
    assert.equal(result.length, 1);
    assert.equal(result[0].key, 'rolling_summary');
    assert.ok(result[0].content.includes('some summary content'));
  });

  it('parses multiple sections separated by ---', () => {
    const draft = '## [rolling_summary]\nfoo\n\n---\n\n## [CONTEXT]\nbar\n';
    const result = parseDraft(draft);
    assert.equal(result.length, 2);
    assert.equal(result[0].key, 'rolling_summary');
    assert.equal(result[1].key, 'CONTEXT');
  });

  it('parses auto-memory section with filename', () => {
    const draft = '## [auto-memory: feedback_test.md]\n---\nname: test\n---\nbody\n';
    const result = parseDraft(draft);
    assert.equal(result[0].key, 'auto-memory');
    assert.equal(result[0].filename, 'feedback_test.md');
  });

  it('returns empty array for empty draft', () => {
    assert.deepEqual(parseDraft(''), []);
  });
});

describe('computeDiff', () => {
  it('shows added lines with + prefix', () => {
    const diff = computeDiff('old line\n', 'old line\nnew line\n');
    assert.ok(diff.includes('+new line'));
  });

  it('shows removed lines with - prefix', () => {
    const diff = computeDiff('removed line\nkept line\n', 'kept line\n');
    assert.ok(diff.includes('-removed line'));
  });

  it('returns "(new file)" when current is empty', () => {
    const diff = computeDiff('', 'new content\n');
    assert.ok(diff.includes('(new file)'));
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd ~/rank-higher-media && npm run test:approve
```

Expected: `ERR_MODULE_NOT_FOUND` — functions not yet exported

- [ ] **Step 3: Commit failing tests**

```bash
cd ~/rank-higher-media
git add scripts/test_approve.js
git commit -m "test: add failing unit tests for approve_memory helpers"
```

---

## Task 6: approve_memory.js

**Files:**
- Create: `~/rank-higher-media/scripts/approve_memory.js`

- [ ] **Step 1: Create approve_memory.js**

```js
// scripts/approve_memory.js
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { createInterface } from 'readline';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { PATHS } from './memory_config.js';

// --- Pure helpers (exported for testing) ---

export function parseDraft(content) {
  if (!content.trim()) return [];

  const sections = content.split(/\n---\n/).map(s => s.trim()).filter(Boolean);
  return sections.map(section => {
    const headerMatch = section.match(/^## \[(.+?)\]\n([\s\S]*)$/);
    if (!headerMatch) return null;

    const [, key, body] = headerMatch;
    if (key.startsWith('auto-memory: ')) {
      return { key: 'auto-memory', filename: key.replace('auto-memory: ', ''), content: body.trim() };
    }
    return { key, content: body.trim() };
  }).filter(Boolean);
}

export function computeDiff(current, proposed) {
  if (!current) return `(new file)\n${proposed}`;

  const currentLines = current.split('\n');
  const proposedLines = proposed.split('\n');
  const result = [];

  // Simple line-by-line diff (sufficient for review purposes)
  const maxLen = Math.max(currentLines.length, proposedLines.length);
  for (let i = 0; i < maxLen; i++) {
    const cur = currentLines[i];
    const prop = proposedLines[i];
    if (cur === prop) {
      result.push(`  ${cur ?? ''}`);
    } else {
      if (cur !== undefined) result.push(`- ${cur}`);
      if (prop !== undefined) result.push(`+ ${prop}`);
    }
  }
  return result.join('\n');
}

// --- File resolvers ---

function resolveTargetPath(section) {
  switch (section.key) {
    case 'rolling_summary': return PATHS.rollingSummary;
    case 'CONTEXT':         return PATHS.context;
    case 'PROJECT_STATUS':  return PATHS.projectStatus;
    case 'auto-memory':     return join(PATHS.autoMemoryRoot, section.filename);
    default:                return null;
  }
}

function readCurrent(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

// --- Write strategies ---

function applySection(section, targetPath) {
  const current = readCurrent(targetPath);
  const dir = targetPath.substring(0, targetPath.lastIndexOf('/'));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  switch (section.key) {
    case 'rolling_summary': {
      // Prepend new entry; keep only 3 sessions total
      const header = current.match(/^(#[^\n]+\n>[^\n]+\n>[^\n]+\n>[^\n]+\n\n---\n\n)/s)?.[1] || '';
      const sessions = current.replace(header, '').split(/\n(?=## Session)/);
      const kept = sessions.slice(0, 2); // keep 2 existing + 1 new = 3 total
      writeFileSync(targetPath, `${header}${section.content}\n\n---\n\n${kept.join('\n\n---\n\n')}`);
      break;
    }
    case 'PROJECT_STATUS': {
      // Prepend daily entry after the file header
      const header = current.match(/^(#[^\n]+\n>[^\n]+\n>[^\n]+\n>[^\n]+\n>[^\n]+\n\n---\n\n)/s)?.[1] || '';
      const rest = current.replace(header, '');
      writeFileSync(targetPath, `${header}${section.content}\n\n---\n\n${rest}`);
      break;
    }
    default:
      // CONTEXT + auto-memory: full file replace
      writeFileSync(targetPath, section.content + '\n');
  }
}

// --- Interactive prompt ---

function prompt(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function openEditor(content) {
  const tmpFile = '/tmp/memory_review_edit.md';
  writeFileSync(tmpFile, content);
  const editor = process.env.EDITOR || 'nano';
  spawnSync(editor, [tmpFile], { stdio: 'inherit' });
  return readFileSync(tmpFile, 'utf8');
}

// --- Main ---

async function main() {
  if (!existsSync(PATHS.draft)) {
    console.log('No memory_draft.md found. Run `npm run compile` first.');
    process.exit(0);
  }

  const draftContent = readFileSync(PATHS.draft, 'utf8');
  const sections = parseDraft(draftContent);

  if (sections.length === 0) {
    console.log('Draft is empty or unparseable.');
    process.exit(0);
  }

  // Check for ERROR section
  const errorSection = sections.find(s => s.key === 'ERROR');
  if (errorSection) {
    console.error(`\nCompilation error:\n${errorSection.content}\n`);
    process.exit(1);
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log(`\nReviewing ${sections.length} memory update(s)...\n`);

  for (const section of sections) {
    const targetPath = resolveTargetPath(section);
    if (!targetPath) {
      console.log(`[skip] Unknown section key: ${section.key}`);
      continue;
    }

    const label = section.key === 'auto-memory' ? section.filename : `${section.key}`;
    const current = readCurrent(targetPath);
    const diff = computeDiff(current, section.content);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`TARGET: ${label}`);
    console.log(`PATH:   ${targetPath}`);
    console.log(`${'='.repeat(60)}`);
    console.log(diff);
    console.log(`${'='.repeat(60)}\n`);

    let answer = '';
    while (!['y', 'n', 'edit'].includes(answer.toLowerCase().trim())) {
      answer = await prompt(rl, `Apply to ${label}? (y/n/edit): `);
    }

    answer = answer.toLowerCase().trim();
    if (answer === 'edit') {
      section.content = openEditor(section.content);
      answer = await prompt(rl, `Apply edited version to ${label}? (y/n): `);
    }

    if (answer === 'y') {
      applySection(section, targetPath);
      console.log(`✓ Applied to ${label}`);
    } else {
      console.log(`— Skipped ${label}`);
    }
  }

  rl.close();
  console.log('\nMemory update complete.');
}

main();
```

- [ ] **Step 2: Run approve tests — expect PASS**

```bash
cd ~/rank-higher-media && npm run test:approve
```

Expected: all 8 tests pass

- [ ] **Step 3: Run all tests**

```bash
cd ~/rank-higher-media && npm test
```

Expected: all 14 tests pass

- [ ] **Step 4: Commit**

```bash
cd ~/rank-higher-media
git add scripts/approve_memory.js
git commit -m "feat: add approve_memory.js with diff preview and interactive merge"
```

---

## Task 7: Integration Test with Fixture

**Files:**
- Create: `~/rank-higher-media/scripts/fixtures/sample_transcript.json`

- [ ] **Step 1: Create a sample fixture transcript**

```json
{
  "session_id": "test-session-001",
  "transcript": [
    {
      "role": "user",
      "content": "Let's work on the memory compiler today. I want to build a system that automatically compiles Claude Code session transcripts into structured memory files using a Stop hook."
    },
    {
      "role": "assistant",
      "content": "Great idea. I'll design this as a Node.js script triggered by Claude Code's Stop hook. It will read the transcript, call Claude API with targeted prompts for each memory file, and write a staged draft to memory_draft.md. A separate approve script will handle the review and merge step."
    },
    {
      "role": "user",
      "content": "Use Claude API for now, and we'll switch to qwen3.5:9b via Ollama once Phase 1 local LLM is stable. For the review step, use a staging file approach."
    },
    {
      "role": "assistant",
      "content": "Confirmed. LLM provider is configurable via MEMORY_LLM env var — defaults to claude, can switch to ollama. The staging file is memory_draft.md, gitignored. The approve script shows a unified diff and prompts y/n/edit per section."
    }
  ]
}
```

- [ ] **Step 2: Run compile against the fixture**

```bash
cd ~/rank-higher-media
cat scripts/fixtures/sample_transcript.json | ANTHROPIC_API_KEY=your_key node scripts/compile_memory.js
```

Expected: `[memory-compiler] Draft written to memory_draft.md — run 'npm run approve' to review`

- [ ] **Step 3: Inspect the draft**

```bash
cat ~/rank-higher-media/memory_draft.md
```

Expected: file contains `## [rolling_summary]`, `## [CONTEXT]`, `## [PROJECT_STATUS]` sections with real LLM-generated content

- [ ] **Step 4: Run approve in dry-run mode (say n to all)**

```bash
cd ~/rank-higher-media && node scripts/approve_memory.js
```

Walk through all sections, press `n` for each. Verify no files are modified.

- [ ] **Step 5: Commit fixture**

```bash
cd ~/rank-higher-media
git add scripts/fixtures/
git commit -m "test: add sample transcript fixture for integration testing"
```

---

## Task 8: Hook Registration

**Files:**
- Modify: `~/.claude/settings.json`

- [ ] **Step 1: Register the Stop hook**

Open `~/.claude/settings.json`. Current content is `{}`. Replace with:

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node /Users/ashishuzelman/rank-higher-media/scripts/compile_memory.js"
          }
        ]
      }
    ]
  }
}
```

> Note: Claude Code's hook format uses a nested structure. The `matcher` field is an empty string to match all sessions.

- [ ] **Step 2: Verify hook fires**

Start a new Claude Code session, do any small task, end it. Then check:

```bash
ls -la ~/rank-higher-media/memory_draft.md
```

Expected: file exists with a recent timestamp

- [ ] **Step 3: Run approve on the real draft**

```bash
cd ~/rank-higher-media && node scripts/approve_memory.js
```

Review each section. Apply what looks correct.

- [ ] **Step 4: Commit hook registration note**

```bash
cd ~/rank-higher-media
git add docs/
git commit -m "docs: note hook registration in settings.json (manual step)"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Stop hook trigger → Task 8
- ✅ Reads transcript from stdin → Task 4 (`readFileSync('/dev/stdin')`)
- ✅ 4 targeted LLM prompts → Task 2 (`PROMPTS` in config)
- ✅ Writes `memory_draft.md` → Task 4
- ✅ Diff preview → Task 6 (`computeDiff`)
- ✅ y/n/edit per section → Task 6 (`main()`)
- ✅ edit opens `$EDITOR` → Task 6 (`openEditor`)
- ✅ Transcript < 500 chars → skip → Task 4 (`isTranscriptValid`)
- ✅ LLM failure → write error to draft, no live writes → Task 4 (try/catch)
- ✅ Missing live file → create it → Task 6 (`mkdirSync recursive`)
- ✅ SOUL/client files never touched → Task 2 (`PROTECTED_FILES` — enforced by not including them in any prompt target)
- ✅ LLM swap: one env var → Task 2 + Task 4 (`callLLM` checks `LLM.provider`)
- ✅ rolling_summary rotation (keep 3) → Task 6 (`applySection`)
- ✅ PROJECT_STATUS prepend → Task 6 (`applySection`)
- ✅ Auto-memory frontmatter format → Task 2 (prompt instructs LLM)
- ✅ Unit tests for all pure functions → Tasks 3 + 5
- ✅ Integration test with fixture → Task 7

**Placeholder scan:** None found.

**Type consistency:** `parseDraft` returns `{key, content, filename?}` — used correctly in `resolveTargetPath` and `applySection`. `buildDraftSection` output format matches `parseDraft` regex. ✅
