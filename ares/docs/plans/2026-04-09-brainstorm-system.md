# Brainstorm System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local multi-agent debate engine (Strategist + DA + Synthesizer + Gemini tie-breaker) with project-tagged KB, Claude Code skill entry point, and Ash Code process checklist skill.

**Architecture:** `brainstorm.js` runs a 2-round local Ollama debate (qwen3 Strategist → qwen3 DA research-first → qwen3 Strategist revision → DA final word → gemma3 Synthesizer → optional Gemini tie-breaker). Results saved to `knowledge/debates/{project}/`. Invokable via CLI or `/brainstorm` skill.

**Tech Stack:** Node.js (CommonJS), Ollama (qwen3:30b-a3b + gemma3:12b), Gemini 1.5 Flash API (free tier), existing memory_config.js constants, existing knowledge/ directory structure.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `ares/scripts/brainstorm.js` | **CREATE** | Full debate engine — all agent calls, output writer, expert profile regeneration |
| `ares/scripts/knowledge_retrieval.js` | **MODIFY** | Fix KNOWLEDGE_DIR path bug + add project-scoped filtering |
| `ares/scripts/agent_connector.js` | **MODIFY** | Add `**TaskType**: debate` routing to brainstorm.js |
| `ares/package.json` | **MODIFY** | Add `brainstorm` npm script |
| `knowledge/debates/ares/.gitkeep` | **CREATE** | Scaffold per-project debate dirs |
| `knowledge/debates/ad-creator/.gitkeep` | **CREATE** | Scaffold |
| `knowledge/debates/rhm/.gitkeep` | **CREATE** | Scaffold |
| `knowledge/debates/skill-factory/.gitkeep` | **CREATE** | Scaffold |
| `knowledge/debates/ash-code/.gitkeep` | **CREATE** | Scaffold |
| `knowledge/projects/ares-context.md` | **CREATE** | Seed expert profile (auto-updated after each debate) |
| `~/.claude/skills/brainstorm/SKILL.md` | **CREATE** | Claude Code `/brainstorm` entry point |
| `~/.claude/skills/ash-brainstorm/SKILL.md` | **CREATE** | Ash Code 9-step process checklist |
| `~/.claude/settings.json` | **MODIFY** | Add SessionStart + SubagentStart + PostToolUse hooks |
| `~/.claude/hooks/session-start.sh` | **CREATE** | SessionStart hook script |
| `~/.claude/hooks/post-tool-use.sh` | **CREATE** | PostToolUse ESLint hook script |

---

## Task 1: Fix knowledge_retrieval.js path + add project-scoped filtering

**Files:**
- Modify: `ares/scripts/knowledge_retrieval.js`

**Problem:** `KNOWLEDGE_DIR` currently resolves to `ares/knowledge/` (doesn't exist). Actual knowledge files are at `~/rank-higher-media/knowledge/`. Also needs project-scoped filtering.

- [ ] **Step 1: Write a smoke test to verify the path bug**

```bash
cd ~/rank-higher-media/ares
node -e "
const path = require('path')
const current = path.join(__dirname, 'scripts/../knowledge')
const correct = path.join(__dirname, '../knowledge')
console.log('Current (wrong):', current)
console.log('Correct:', correct)
const fs = require('fs')
console.log('Current exists:', fs.existsSync(current))
console.log('Correct exists:', fs.existsSync(correct))
"
```

Expected output: Current exists: false, Correct exists: true

- [ ] **Step 2: Replace knowledge_retrieval.js with fixed + enhanced version**

Replace the entire contents of `ares/scripts/knowledge_retrieval.js` with:

```javascript
/**
 * ARES Knowledge Retrieval
 *
 * Searches knowledge/*.md files for content relevant to a given task.
 * Uses keyword overlap scoring — no vector DB, no embeddings, no npm packages.
 *
 * Usage:
 *   const { retrieveKnowledge } = require('./knowledge_retrieval')
 *   // All knowledge (existing API — unchanged)
 *   const chunks = await retrieveKnowledge(taskContent, { maxChunks: 3, maxCharsPerChunk: 800 })
 *
 *   // Project-scoped (new)
 *   const chunks = await retrieveKnowledge(taskContent, { project: 'ares', maxChunks: 5 })
 *
 *   // returns [{ file, excerpt, relevanceScore }]
 */

const fs   = require('fs')
const path = require('path')

// FIX: was '../knowledge' (ares/knowledge/ — doesn't exist)
// Correct: '../../knowledge' → ~/rank-higher-media/knowledge/
const KNOWLEDGE_ROOT = path.join(__dirname, '../../knowledge')

function extractWords(str) {
  return (str.toLowerCase().match(/\b[a-z]+\b/g) || [])
    .filter(word => word.length > 4)
}

function cleanMarkdown(str) {
  return str
    .replace(/#+/g, '')
    .replace(/\*\*/g, '')
    .replace(/^[-*]\s*/gm, '')
    .replace(/\n+/g, ' ')
    .trim()
}

function scoreRelevance(taskContent, fileContent) {
  const taskWords = new Set(extractWords(taskContent))
  const fileWords = new Set(extractWords(fileContent))
  if (taskWords.size === 0) return 0
  let matched = 0
  for (const word of taskWords) {
    if (fileWords.has(word)) matched++
  }
  return matched / taskWords.size
}

function extractFileContent(rawContent) {
  const summaryMatch = rawContent.match(/##\s+Summary\s*\n([\s\S]*?)(?=\n##|\n#|$)/)
  const summary = summaryMatch ? summaryMatch[1].trim().slice(0, 200) : rawContent.slice(0, 200)

  const kpMatch = rawContent.match(/##\s+Key Points\s*\n([\s\S]*?)(?=\n##|\n#|$)/)
  const keyPoints = kpMatch
    ? kpMatch[1].split('\n').map(l => l.replace(/^[-*]\s*/, '').trim()).filter(Boolean).slice(0, 5)
    : []

  const tagsMatch = rawContent.match(/\*\*Tags:\*\*\s*(.+)/)
  const tags = tagsMatch ? tagsMatch[1].trim() : ''

  return { summary, keyPoints, tags }
}

/**
 * Collect all .md file paths to search, optionally filtered by project.
 *
 * project: 'ares' → searches knowledge/debates/ares/ + knowledge/ares/ + knowledge/projects/ares-context.md
 * project: null   → searches all knowledge/ subdirectories (original behavior)
 * type: 'debates' → only debates subdirectory
 * type: null      → all types
 */
function collectFiles(project = null, type = null) {
  if (!fs.existsSync(KNOWLEDGE_ROOT)) return []

  const files = []

  if (project) {
    // Project-scoped: only load relevant dirs
    const candidates = [
      type !== 'debates' ? path.join(KNOWLEDGE_ROOT, project) : null,
      type !== 'youtube' && type !== 'rss' ? path.join(KNOWLEDGE_ROOT, 'debates', project) : null,
      path.join(KNOWLEDGE_ROOT, 'projects', `${project}-context.md`),
    ].filter(Boolean)

    for (const candidate of candidates) {
      if (!fs.existsSync(candidate)) continue
      const stat = fs.statSync(candidate)
      if (stat.isFile() && candidate.endsWith('.md')) {
        files.push(candidate)
      } else if (stat.isDirectory()) {
        fs.readdirSync(candidate)
          .filter(f => f.endsWith('.md'))
          .forEach(f => files.push(path.join(candidate, f)))
      }
    }
  } else {
    // All knowledge — walk top-level and one level deep (original behavior + debates/)
    const walk = (dir) => {
      if (!fs.existsSync(dir)) return
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(path.join(dir, entry.name))
        } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
          // One level deep
          const sub = path.join(dir, entry.name)
          fs.readdirSync(sub)
            .filter(f => f.endsWith('.md'))
            .forEach(f => files.push(path.join(sub, f)))
        }
      }
    }
    walk(KNOWLEDGE_ROOT)
  }

  return files
}

async function retrieveKnowledge(taskContent, {
  maxChunks = 3,
  maxCharsPerChunk = 800,
  project = null,
  type = null,
} = {}) {
  const files = collectFiles(project, type)
  if (files.length === 0) return []

  const scored = []

  for (const filePath of files) {
    try {
      const raw = fs.readFileSync(filePath, 'utf8')
      const { summary, keyPoints, tags } = extractFileContent(raw)
      const combined = `${summary} ${keyPoints.join(' ')} ${tags}`
      const score    = scoreRelevance(taskContent, combined)

      if (score > 0.1) {
        const excerpt = cleanMarkdown(`${summary}\n${keyPoints.map(p => `- ${p}`).join('\n')}\nTags: ${tags}`)
        const relPath = path.relative(KNOWLEDGE_ROOT, filePath)
        scored.push({ file: relPath, excerpt: excerpt.slice(0, maxCharsPerChunk), relevanceScore: score })
      }
    } catch { /* skip unreadable files */ }
  }

  return scored
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxChunks)
}

module.exports = { retrieveKnowledge, KNOWLEDGE_ROOT }
```

- [ ] **Step 3: Verify the fix works**

```bash
cd ~/rank-higher-media/ares
node -e "
const { retrieveKnowledge, KNOWLEDGE_ROOT } = require('./scripts/knowledge_retrieval')
console.log('KNOWLEDGE_ROOT:', KNOWLEDGE_ROOT)
const fs = require('fs')
console.log('Exists:', fs.existsSync(KNOWLEDGE_ROOT))
retrieveKnowledge('brainstorm agent debate ares project').then(chunks => {
  console.log('Chunks found:', chunks.length)
  chunks.forEach(c => console.log(' -', c.file, '(score:', c.relevanceScore.toFixed(2) + ')'))
  process.exit(0)
})
"
```

Expected: KNOWLEDGE_ROOT path ends in `rank-higher-media/knowledge`, Exists: true

- [ ] **Step 4: Commit**

```bash
cd ~/rank-higher-media/ares
git add scripts/knowledge_retrieval.js
git commit -m "fix: knowledge_retrieval path bug + add project-scoped filtering"
```

---

## Task 2: Scaffold knowledge directories + seed expert profile

**Files:**
- Create: `knowledge/debates/ares/.gitkeep` (and 4 siblings)
- Create: `knowledge/projects/ares-context.md`

- [ ] **Step 1: Create directory structure**

```bash
cd ~/rank-higher-media
mkdir -p knowledge/debates/ares
mkdir -p knowledge/debates/ad-creator
mkdir -p knowledge/debates/rhm
mkdir -p knowledge/debates/skill-factory
mkdir -p knowledge/debates/ash-code
mkdir -p knowledge/projects
touch knowledge/debates/ares/.gitkeep
touch knowledge/debates/ad-creator/.gitkeep
touch knowledge/debates/rhm/.gitkeep
touch knowledge/debates/skill-factory/.gitkeep
touch knowledge/debates/ash-code/.gitkeep
```

- [ ] **Step 2: Create seed ares expert profile**

Create `knowledge/projects/ares-context.md`:

```markdown
# ares Expert Profile
_Seeded manually: 2026-04-09 — auto-updated after each debate_

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
- npm run brainstorm -- "topic" --project ares — debate engine (after Task 9)
- npm run connector — manual connector run
```

- [ ] **Step 3: Commit scaffolding**

```bash
cd ~/rank-higher-media
git add knowledge/debates/ knowledge/projects/ares-context.md
git commit -m "feat: scaffold knowledge/debates/ dirs + seed ares expert profile"
```

---

## Task 3: Create brainstorm.js — config, constants, system prompts, and helpers

**Files:**
- Create: `ares/scripts/brainstorm.js`

- [ ] **Step 1: Create the file with all config, constants, and helper functions**

Create `ares/scripts/brainstorm.js`:

```javascript
#!/usr/bin/env node
/**
 * ARES Brainstorm Engine
 *
 * Local multi-agent debate: Strategist (qwen3) + DA (qwen3, research-first)
 * + Synthesizer (gemma3) + optional Gemini 1.5 Flash tie-breaker.
 *
 * Usage: node scripts/brainstorm.js "topic" --project ares
 *        npm run brainstorm -- "topic" --project ad-creator
 */

'use strict'

const fs   = require('fs')
const path = require('path')

const {
  WORKER_MODEL,
  SUPERVISOR_MODEL,
  WORKER_SYSTEM_PROMPT,
  OLLAMA_URL: CONFIG_OLLAMA_URL,
} = require('./memory_config')

// ── Constants ────────────────────────────────────────────────────────────────

const OLLAMA_URL     = process.env.OLLAMA_URL || CONFIG_OLLAMA_URL || 'http://localhost:11434'
const GEMINI_KEY     = process.env.GEMINI_API_KEY || ''
const KNOWLEDGE_ROOT = path.join(__dirname, '../../knowledge')

// ── System Prompts ───────────────────────────────────────────────────────────

const STRATEGIST_SYSTEM = `You are the Strategist agent in a structured multi-agent debate inside the ARES platform.

Your role: propose well-reasoned positions. Think big-picture — opportunity, direction, recommendation.

RULES:
- Start EVERY response with a JSON header block inside triple backticks tagged json
- Be specific and concrete — vague positions get rejected
- Reference the project context you've been given
- Do not repeat the DA's words back — respond to the substance

JSON HEADER FORMAT (required, first thing in your response):
\`\`\`json
{
  "agent": "strategist",
  "round": <1 or 2>,
  "status": "complete",
  "confidence": <0.0-1.0>,
  "next_action": "continue",
  "word_count": <approximate word count of your markdown section>
}
\`\`\`

Then write your full position in markdown after a --- separator.`

const DA_SYSTEM = `You are the Devil's Advocate agent in a structured debate inside the ARES platform.

Your role: evidence-driven skeptic. Research FIRST, challenge SECOND.

PROCESS (always in this exact order):
1. Research pass — review all provided knowledge base content
2. Fact-check — identify where the Strategist's position lacks evidence or conflicts with the KB
3. Challenge — argue against weak points using specific citations from the KB
4. Suggest improvements — give concrete ways to strengthen the proposal based on evidence

RULES:
- NEVER challenge without citing specific evidence from the knowledge base
- If the KB supports the Strategist's position, say so and propose improvements instead
- Start EVERY response with a JSON header block
- Use section headers: ## Research Findings / ## Fact-Check / ## Suggested Improvements

JSON HEADER FORMAT (required, first thing in your response):
\`\`\`json
{
  "agent": "devil-advocate",
  "round": <1 or 2>,
  "status": "complete",
  "confidence": <0.0-1.0>,
  "next_action": "continue",
  "word_count": <approximate>
}
\`\`\`

Then write your challenge in markdown after a --- separator.`

const DA_FINAL_SYSTEM = `You are the Devil's Advocate giving your final word in a structured debate.

Be brief (2-3 paragraphs). State clearly:
- Are you satisfied with the Strategist's revision? Why or why not?
- Is the topic resolved or still contested?
- Any remaining open questions?

Start with the JSON header, then your final word after ---.

JSON HEADER FORMAT:
\`\`\`json
{
  "agent": "devil-advocate",
  "round": 2,
  "status": "complete" or "contested",
  "confidence": <0.0-1.0>,
  "next_action": "synthesize",
  "word_count": <approximate>
}
\`\`\``

const SYNTHESIZER_SYSTEM = `You are the Synthesizer (Arbitrator) in a structured debate. Output ONLY valid JSON — no markdown, no explanation, no fences.

Read the full debate transcript and produce a decisive final decision.

Output this exact JSON structure:
{
  "agent": "synthesizer",
  "status": "resolved",
  "decision": "<one sentence decision>",
  "confidence": <0.0-1.0>,
  "reasoning": "<2-3 sentences explaining the decision>",
  "open_questions": ["<question>"],
  "next_action": "done"
}

Set next_action to "tie-breaker" and confidence below 0.7 only if the topic is genuinely unresolvable from the debate. Be decisive — commit to a recommendation.`

// ── Ollama Helper ─────────────────────────────────────────────────────────────

async function callOllama(model, systemPrompt, userPrompt, temperature = 0.4) {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      stream: true,
      options: { num_ctx: 32768, temperature },
    }),
    signal: AbortSignal.timeout(600000), // 10 min max
  })

  if (!response.ok) throw new Error(`Ollama HTTP ${response.status}: ${model}`)

  let output = ''
  const reader  = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const lines = decoder.decode(value, { stream: true }).split('\n').filter(Boolean)
    for (const line of lines) {
      try {
        const chunk = JSON.parse(line)
        if (chunk.response) {
          process.stdout.write(chunk.response)
          output += chunk.response
        }
      } catch { /* partial JSON line — skip */ }
    }
  }
  console.log('\n')
  return output.trim()
}

// ── JSON Header Parser ────────────────────────────────────────────────────────

function parseAgentHeader(output) {
  const match = output.match(/```json\s*([\s\S]*?)\s*```/)
  if (!match) return null
  try { return JSON.parse(match[1]) } catch { return null }
}

// ── Knowledge Loader (for DA research pass) ───────────────────────────────────

function loadProjectKnowledge(project) {
  const searchDirs = [
    path.join(KNOWLEDGE_ROOT, 'debates', project),
    path.join(KNOWLEDGE_ROOT, project),
  ]

  const chunks = []
  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue
    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.md') && !f.startsWith('.'))
      .sort().reverse()  // newest first
      .slice(0, 5)       // max 5 files per dir

    for (const file of files) {
      const content = fs.readFileSync(path.join(dir, file), 'utf8')
      chunks.push(`### [KB: ${file}]\n${content.slice(0, 1500)}`)
    }
  }

  return chunks.length > 0
    ? chunks.join('\n\n---\n\n')
    : `No prior knowledge found for project: ${project}. Base your analysis on first principles.`
}

function loadExpertProfile(project) {
  const profilePath = path.join(KNOWLEDGE_ROOT, 'projects', `${project}-context.md`)
  return fs.existsSync(profilePath)
    ? fs.readFileSync(profilePath, 'utf8')
    : `No expert profile found for project: ${project}.`
}

// ── Slug Utility ──────────────────────────────────────────────────────────────

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

module.exports = {
  callOllama,
  parseAgentHeader,
  loadProjectKnowledge,
  loadExpertProfile,
  slugify,
  KNOWLEDGE_ROOT,
  STRATEGIST_SYSTEM,
  DA_SYSTEM,
  DA_FINAL_SYSTEM,
  SYNTHESIZER_SYSTEM,
  OLLAMA_URL,
  GEMINI_KEY,
  WORKER_MODEL,
  SUPERVISOR_MODEL,
}
```

- [ ] **Step 2: Verify it loads without errors**

```bash
cd ~/rank-higher-media/ares
node -e "
const b = require('./scripts/brainstorm')
console.log('WORKER_MODEL:', b.WORKER_MODEL)
console.log('KNOWLEDGE_ROOT exists:', require('fs').existsSync(b.KNOWLEDGE_ROOT))
console.log('loadExpertProfile ares:', b.loadExpertProfile('ares').slice(0, 50))
console.log('✅ brainstorm.js loads OK')
"
```

Expected: Prints WORKER_MODEL (qwen3:30b-a3b), KNOWLEDGE_ROOT exists: true

- [ ] **Step 3: Commit**

```bash
cd ~/rank-higher-media/ares
git add scripts/brainstorm.js
git commit -m "feat: brainstorm.js — config, system prompts, helpers"
```

---

## Task 4: Add agent functions (Strategist, DA, Synthesizer, Gemini) to brainstorm.js

**Files:**
- Modify: `ares/scripts/brainstorm.js`

- [ ] **Step 1: Add all agent runner functions to the BOTTOM of brainstorm.js (before module.exports)**

Append these functions to `ares/scripts/brainstorm.js` — replace the `module.exports` block with the full set including these new functions:

```javascript
// ── Strategist Agent ──────────────────────────────────────────────────────────

async function runStrategist(topic, expertProfile, round, priorContext = '') {
  console.log(`\n🎯 Strategist — Round ${round}/${round === 1 ? '2' : '2'}...`)

  const prompt = [
    `## Project Context\n${expertProfile}`,
    priorContext ? `## Prior Debate (read carefully before responding)\n${priorContext}` : '',
    `## Topic\n"${topic}"`,
    `## Your Task (Round ${round})`,
    round === 1
      ? 'Propose your initial position. State your recommendation clearly with reasoning. Be specific.'
      : 'The Devil\'s Advocate has challenged your position (see above). Revise or defend — address their specific evidence citations. Do not ignore their KB references.',
  ].filter(Boolean).join('\n\n')

  return callOllama(WORKER_MODEL, STRATEGIST_SYSTEM, prompt, 0.4)
}

// ── Devil's Advocate Agent ────────────────────────────────────────────────────

async function runDA(topic, project, strategistOutput, round, isFinalWord = false) {
  console.log(`\n🔍 Devil's Advocate — ${isFinalWord ? 'Final Word' : `Round ${round} (research + challenge)`}...`)

  const kb = loadProjectKnowledge(project)

  const systemPrompt = isFinalWord ? DA_FINAL_SYSTEM : DA_SYSTEM

  const prompt = [
    `## Knowledge Base (project: ${project})\n${kb}`,
    `## Strategist's Position (Round ${round})\n${strategistOutput}`,
    `## Your Task`,
    isFinalWord
      ? 'Give your final word. Are you satisfied with the Strategist\'s revision? Is the topic resolved or still contested? Be brief.'
      : 'Research the KB first. Then fact-check and challenge the Strategist\'s position with evidence. End with concrete improvements.',
  ].join('\n\n')

  return callOllama(WORKER_MODEL, systemPrompt, prompt, isFinalWord ? 0.3 : 0.6)
}

// ── Synthesizer Agent (gemma3) ────────────────────────────────────────────────

async function runSynthesizer(topic, fullTranscript) {
  console.log('\n⚖️  Synthesizer (gemma3)...')

  const prompt = `Topic under debate: "${topic}"\n\nComplete debate transcript:\n\n${fullTranscript}\n\nProduce your synthesis as JSON only. No other text.`

  const raw = await callOllama(SUPERVISOR_MODEL, SYNTHESIZER_SYSTEM, prompt, 0.1)

  try {
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    console.warn('[synthesizer] JSON parse failed — using safe defaults')
    return {
      agent: 'synthesizer',
      status: 'unresolved',
      decision: 'Synthesis parse failed — manual review of transcript required',
      confidence: 0.5,
      reasoning: 'gemma3 did not return valid JSON. Review transcript manually.',
      open_questions: ['Manual review needed'],
      next_action: 'done',
    }
  }
}

// ── Gemini Tie-Breaker ────────────────────────────────────────────────────────

async function runGeminiTieBreaker(topic, synthesis, s2Output, daFinalOutput) {
  if (!GEMINI_KEY) {
    console.warn('[gemini] GEMINI_API_KEY not set — skipping tie-breaker. Set in .env.local or shell env.')
    return null
  }

  console.log('\n🌐 Gemini 1.5 Flash tie-breaker...')

  const summary = [
    `Topic: "${topic}"`,
    `gemma3 Synthesizer confidence: ${synthesis.confidence} (below threshold)`,
    `gemma3 reasoning: ${synthesis.reasoning}`,
    '',
    `Strategist final position (excerpt):`,
    s2Output.slice(0, 600),
    '',
    `Devil's Advocate final word (excerpt):`,
    daFinalOutput.slice(0, 600),
  ].join('\n')

  const prompt = `You are a neutral arbitrator reviewing a low-confidence AI agent debate. Give a decisive recommendation.

${summary}

Respond with:
1. Decision: [one sentence]
2. Reasoning: [2-3 sentences]
3. Confidence: [0.0-1.0]`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
        }),
        signal: AbortSignal.timeout(30000),
      }
    )

    if (!res.ok) {
      console.warn(`[gemini] HTTP ${res.status} — skipping`)
      return null
    }

    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null
  } catch (err) {
    console.warn(`[gemini] Error: ${err.message} — skipping`)
    return null
  }
}

// ── Output Writer ─────────────────────────────────────────────────────────────

function writeDebateOutput({ topic, project, transcript, synthesis, geminiResult }) {
  const date     = new Date().toISOString().slice(0, 10)
  const slug     = slugify(topic)
  const dir      = path.join(KNOWLEDGE_ROOT, 'debates', project)

  fs.mkdirSync(dir, { recursive: true })

  const filename = `${date}-${slug}.md`
  const filepath = path.join(dir, filename)

  const frontmatter = [
    '---',
    `project: ${project}`,
    `date: ${date}`,
    `topic: "${topic}"`,
    `slug: ${slug}`,
    `tags: [${project}, debate]`,
    `status: ${synthesis.status}`,
    `confidence: ${synthesis.confidence}`,
    `decision: "${synthesis.decision}"`,
    '---',
  ].join('\n')

  const synthSection  = `\n## Synthesis (gemma3)\n${synthesis.reasoning}`
  const geminiSection = geminiResult ? `\n## Gemini Tie-Breaker\n${geminiResult}` : ''
  const decisionLines = [
    '\n## Final Decision',
    `**Decision:** ${synthesis.decision}`,
    `**Confidence:** ${synthesis.confidence}`,
    `**Status:** ${synthesis.status}`,
  ]
  if (synthesis.open_questions?.length) {
    decisionLines.push(`**Open questions:**`)
    synthesis.open_questions.forEach(q => decisionLines.push(`- ${q}`))
  }

  const content = [
    frontmatter,
    '',
    transcript,
    synthSection,
    geminiSection,
    decisionLines.join('\n'),
  ].join('\n')

  fs.writeFileSync(filepath, content, 'utf8')
  console.log(`\n✅ Debate saved: knowledge/debates/${project}/${filename}`)
  return filepath
}

// ── Expert Profile Regeneration ───────────────────────────────────────────────

async function regenerateExpertProfile(project) {
  console.log(`\n🧠 Regenerating expert profile for: ${project}...`)

  const recentDebates  = loadProjectKnowledge(project)
  const soulPath       = path.join(__dirname, '../../SOUL_ARES.md')
  const soulContent    = fs.existsSync(soulPath)
    ? fs.readFileSync(soulPath, 'utf8').slice(0, 2000)
    : ''

  const prompt = `Create a concise expert context profile for the "${project}" project. Max 800 tokens.

Sections to include:
1. Tech Stack (from SOUL_ARES below)
2. Last 3 Architectural Decisions (from recent debates below)
3. Current Priorities
4. Key Conventions and Gotchas

SOUL_ARES (excerpt):
${soulContent}

Recent debates for this project:
${recentDebates}

Output clean, scannable markdown. No fluff. This file is loaded into agent context before every task.`

  try {
    const profile = await callOllama(
      WORKER_MODEL,
      'You are a technical documentation specialist. Be concise, precise, and scannable.',
      prompt,
      0.2
    )

    const profileDir  = path.join(KNOWLEDGE_ROOT, 'projects')
    const profilePath = path.join(profileDir, `${project}-context.md`)

    fs.mkdirSync(profileDir, { recursive: true })
    fs.writeFileSync(
      profilePath,
      `# ${project} Expert Profile\n_Auto-generated: ${new Date().toISOString()}_\n\n${profile}`,
      'utf8'
    )
    console.log(`✅ Expert profile updated: knowledge/projects/${project}-context.md`)
  } catch (err) {
    console.warn(`[profile] Regeneration failed: ${err.message} — existing profile unchanged`)
  }
}

// ── Main Orchestrator ─────────────────────────────────────────────────────────

async function runBrainstorm({ topic, project }) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🎭 ARES Brainstorm Engine`)
  console.log(`   Topic:      ${topic}`)
  console.log(`   Project:    ${project}`)
  console.log(`   Worker:     ${WORKER_MODEL}`)
  console.log(`   Supervisor: ${SUPERVISOR_MODEL}`)
  console.log(`${'='.repeat(60)}\n`)

  const expertProfile = loadExpertProfile(project)
  const transcript    = []

  // Round 1: Strategist
  const s1 = await runStrategist(topic, expertProfile, 1)
  transcript.push(`## Strategist — Round 1\n${s1}`)

  // Round 1: DA research + challenge
  const da1 = await runDA(topic, project, s1, 1)
  transcript.push(`## Devil's Advocate — Round 1\n${da1}`)

  // Round 2: Strategist revision
  const priorContext = `${s1}\n\n---\n\n${da1}`
  const s2 = await runStrategist(topic, expertProfile, 2, priorContext)
  transcript.push(`## Strategist — Round 2\n${s2}`)

  // DA final word
  const daFinal = await runDA(topic, project, s2, 2, true)
  transcript.push(`## Devil's Advocate — Final Word\n${daFinal}`)

  const fullTranscript = transcript.join('\n\n---\n\n')

  // Synthesizer
  const synthesis = await runSynthesizer(topic, fullTranscript)
  console.log(`⚖️  Decision: "${synthesis.decision}" (confidence: ${synthesis.confidence})`)

  // Gemini tie-breaker if low confidence
  let geminiResult = null
  if (synthesis.confidence < 0.7 || synthesis.next_action === 'tie-breaker') {
    console.log('   Low confidence — calling Gemini tie-breaker...')
    geminiResult = await runGeminiTieBreaker(topic, synthesis, s2, daFinal)
    if (geminiResult) console.log(`   Gemini: ${geminiResult.slice(0, 80)}...`)
  }

  // Save
  const outputPath = writeDebateOutput({
    topic, project, transcript: fullTranscript, synthesis, geminiResult,
  })

  // Regenerate expert profile
  await regenerateExpertProfile(project)

  // Summary
  console.log(`\n${'='.repeat(60)}`)
  console.log(`✅ Brainstorm complete`)
  console.log(`   Decision:   ${synthesis.decision}`)
  console.log(`   Confidence: ${synthesis.confidence}`)
  console.log(`   Status:     ${synthesis.status}`)
  console.log(`   Output:     ${outputPath}`)
  if (synthesis.open_questions?.length) {
    console.log(`   Open:       ${synthesis.open_questions.slice(0, 2).join(' | ')}`)
  }
  console.log(`${'='.repeat(60)}\n`)

  return { synthesis, outputPath }
}

module.exports = {
  callOllama,
  parseAgentHeader,
  loadProjectKnowledge,
  loadExpertProfile,
  slugify,
  writeDebateOutput,
  regenerateExpertProfile,
  runStrategist,
  runDA,
  runSynthesizer,
  runGeminiTieBreaker,
  runBrainstorm,
  KNOWLEDGE_ROOT,
  STRATEGIST_SYSTEM,
  DA_SYSTEM,
  DA_FINAL_SYSTEM,
  SYNTHESIZER_SYSTEM,
  OLLAMA_URL,
  GEMINI_KEY,
  WORKER_MODEL,
  SUPERVISOR_MODEL,
}

// ── CLI Entry Point ───────────────────────────────────────────────────────────

if (require.main === module) {
  const args    = process.argv.slice(2)
  const topic   = args.find(a => !a.startsWith('-'))
  const pIdx    = args.indexOf('--project')
  const project = pIdx !== -1 ? args[pIdx + 1] : 'ares'

  if (!topic) {
    console.error('Usage: node scripts/brainstorm.js "topic" --project <project>')
    console.error('       npm run brainstorm -- "topic" --project ares')
    process.exit(1)
  }

  runBrainstorm({ topic, project }).catch(err => {
    console.error('[brainstorm] Fatal:', err.message)
    process.exit(1)
  })
}
```

- [ ] **Step 2: Verify module loads and exports are complete**

```bash
cd ~/rank-higher-media/ares
node -e "
const b = require('./scripts/brainstorm')
const fns = ['callOllama','runStrategist','runDA','runSynthesizer','runGeminiTieBreaker','runBrainstorm','writeDebateOutput','regenerateExpertProfile']
fns.forEach(fn => console.log(fn + ':', typeof b[fn] === 'function' ? '✅' : '❌ MISSING'))
"
```

Expected: All functions show ✅

- [ ] **Step 3: Commit**

```bash
cd ~/rank-higher-media/ares
git add scripts/brainstorm.js
git commit -m "feat: brainstorm.js — all agent functions + orchestrator + CLI"
```

---

## Task 5: Add npm script + smoke test brainstorm.js end-to-end

**Files:**
- Modify: `ares/package.json`

- [ ] **Step 1: Add brainstorm script to package.json**

In `ares/package.json`, add to the `"scripts"` block:

```json
"brainstorm": "node scripts/brainstorm.js"
```

Result (scripts block should include):
```json
"brainstorm": "node scripts/brainstorm.js",
"connector": "node scripts/agent_connector.js",
```

- [ ] **Step 2: Verify Ollama is running**

```bash
curl -s http://localhost:11434/api/tags | node -e "
const d = require('fs').readFileSync('/dev/stdin','utf8')
const j = JSON.parse(d)
const models = j.models?.map(m=>m.name) || []
console.log('Models:', models.join(', '))
const hasWorker = models.some(m => m.includes('qwen3'))
const hasSupervisor = models.some(m => m.includes('gemma3'))
console.log('Worker (qwen3):', hasWorker ? '✅' : '❌')
console.log('Supervisor (gemma3):', hasSupervisor ? '✅' : '❌')
"
```

Expected: Both ✅. If not, run `ollama pull qwen3:30b-a3b` and `ollama pull gemma3:12b`.

- [ ] **Step 3: Run a quick smoke test (short topic)**

```bash
cd ~/rank-higher-media/ares
npm run brainstorm -- "should the brainstorm script use streaming output" --project ares
```

Watch for:
- `🎯 Strategist — Round 1` with streaming tokens
- `🔍 Devil's Advocate` with streaming tokens
- `⚖️  Synthesizer (gemma3)` output
- `✅ Debate saved: knowledge/debates/ares/YYYY-MM-DD-*.md`
- `✅ Expert profile updated`
- Final summary table

- [ ] **Step 4: Verify output file was created**

```bash
ls ~/rank-higher-media/knowledge/debates/ares/
cat ~/rank-higher-media/knowledge/debates/ares/*.md | head -20
```

Expected: File exists with YAML frontmatter including `project: ares`, `decision:`, `confidence:`

- [ ] **Step 5: Commit**

```bash
cd ~/rank-higher-media/ares
git add package.json
git commit -m "feat: add brainstorm npm script"
```

---

## Task 6: Add debate TaskType to agent_connector.js

**Files:**
- Modify: `ares/scripts/agent_connector.js`

The connector already has `parseTaskType()` from memory_config.js. We add a debate branch before the existing Ollama/Claude routing.

- [ ] **Step 1: Add debate routing to processTask() in agent_connector.js**

Find this block in `agent_connector.js` (around line 420):

```javascript
  // 5. Invoke Worker (ollama by default, claude if explicitly tagged)
  let workerSuccess = false
  if (workerType === 'claude') {
```

Add a new branch BEFORE the `if (workerType === 'claude')` block:

```javascript
  // 5. Invoke Worker — route debate tasks to brainstorm.js
  let workerSuccess = false

  if (taskType === 'debate') {
    // Extract topic from task content (uses **Topic**: field or falls back to title)
    const topic = (taskContent.match(/^\*\*Topic\*\*:\s*(.+)/im) || [])[1]?.trim() || title
    const project = (taskContent.match(/^\*\*Project\*\*:\s*(.+)/im) || [])[1]?.trim() || 'ares'

    console.log(`\n🎭 Debate task → brainstorm.js`)
    console.log(`   Topic:   ${topic}`)
    console.log(`   Project: ${project}`)

    try {
      spawnSync('node', [
        path.join(__dirname, 'brainstorm.js'),
        topic,
        '--project', project,
      ], { stdio: 'inherit' })

      // Check output file was created
      const debateDir = path.join(__dirname, `../../knowledge/debates/${project}`)
      const today     = new Date().toISOString().slice(0, 10)
      const fs_local  = require('fs')
      const files     = fs_local.existsSync(debateDir)
        ? fs_local.readdirSync(debateDir).filter(f => f.startsWith(today))
        : []

      workerSuccess = files.length > 0
      if (workerSuccess) {
        fs_local.writeFileSync(outboxFile, `Debate complete. Output: knowledge/debates/${project}/${files[0]}`, 'utf8')
      }
    } catch (err) {
      console.error(`[debate] brainstorm.js error: ${err.message}`)
    }
  } else if (workerType === 'claude') {
```

Also close the else-if chain by finding `} else {` (the existing Ollama branch) and ensuring it remains intact as the final else.

- [ ] **Step 2: Verify connector syntax is valid**

```bash
cd ~/rank-higher-media/ares
node --check scripts/agent_connector.js && echo "✅ Syntax OK" || echo "❌ Syntax error"
```

Expected: ✅ Syntax OK

- [ ] **Step 3: Write a test task file for debate routing**

```bash
cat > /tmp/test_debate_task.md << 'EOF'
# Test Debate Task

**Priority**: normal
**Assignee**: claude-terminal
**Initiator**: test
**Worker**: ollama
**TaskType**: debate
**Topic**: should ARES use structured JSON output contracts for all agent responses
**Project**: ares

Run this brainstorm and report the decision.
EOF

cp /tmp/test_debate_task.md ~/rank-higher-media/ares/agent_inbox/task_debate_test.md
```

- [ ] **Step 4: Run connector manually on the test file (verify routing works)**

```bash
cd ~/rank-higher-media/ares
# Run connector for just the one file — Ctrl+C after debate completes
timeout 900 node scripts/agent_connector.js
```

Watch for `🎭 Debate task → brainstorm.js` in the output. Let it run to completion.

- [ ] **Step 5: Commit**

```bash
cd ~/rank-higher-media/ares
git add scripts/agent_connector.js
git commit -m "feat: agent_connector debate TaskType → brainstorm.js routing"
```

---

## Task 7: Create /brainstorm Claude Code skill

**Files:**
- Create: `~/.claude/skills/brainstorm/SKILL.md`

- [ ] **Step 1: Create skill directory**

```bash
mkdir -p ~/.claude/skills/brainstorm
```

- [ ] **Step 2: Write SKILL.md**

Create `~/.claude/skills/brainstorm/SKILL.md`:

```markdown
---
name: brainstorm
description: "Multi-agent local debate on any topic or decision. Strategist (qwen3) proposes, Devil's Advocate (qwen3, research-first) challenges with KB evidence, gemma3 synthesizes, Gemini tie-breaks if needed. Zero Claude API cost. Use when exploring ideas, planning features, or making architectural decisions."
disable-model-invocation: true
allowed-tools: Bash(node *)
argument-hint: "[topic] [project]"
---

# Brainstorm — Local Multi-Agent Debate

Running a structured debate on: **$0**
Project: **$1**

## Project Expert Context
!`cat ~/rank-higher-media/knowledge/projects/$1-context.md 2>/dev/null || echo "(No expert profile yet — will be generated after first debate)"`

## Recent Debates ($1)
!`ls ~/rank-higher-media/knowledge/debates/$1/ 2>/dev/null | grep -v '\.gitkeep' | sort -r | head -5 || echo "(No prior debates for this project)"`

---

Running debate engine. This will take 5-15 minutes depending on model speed.

```bash
node ~/rank-higher-media/ares/scripts/brainstorm.js "$0" --project "$1"
```

After the debate completes, read the output file and present:
1. The **Final Decision** (one sentence)
2. The **Confidence** score
3. Any **Open Questions** that need follow-up
4. The **full output file path** so the user can read the transcript if interested
```

- [ ] **Step 3: Verify skill appears in Claude Code**

In Claude Code, type `/` and verify `brainstorm` appears in the skill list.

- [ ] **Step 4: Test the skill with a simple topic**

In Claude Code:
```
/brainstorm "should knowledge/debates files use YAML frontmatter or JSON frontmatter" ares
```

Watch for the expert context injection and debate output.

---

## Task 8: Create /ash-brainstorm Ash Code process checklist skill

**Files:**
- Create: `~/.claude/skills/ash-brainstorm/SKILL.md`

- [ ] **Step 1: Create skill directory**

```bash
mkdir -p ~/.claude/skills/ash-brainstorm
```

- [ ] **Step 2: Write SKILL.md**

Create `~/.claude/skills/ash-brainstorm/SKILL.md`:

```markdown
---
name: ash-brainstorm
description: "Ash Code brainstorm process — 9-step checklist with HARD-GATE. Use before ANY new feature, component, or architectural change. Enforces explore→clarify→debate→design→spec→review→plan flow. Integrates local debate engine for complex decisions."
disable-model-invocation: true
allowed-tools: Bash(node *) Read Glob Grep
---

# Ash Code Brainstorm — 9-Step Process

**HARD-GATE: Do NOT write any code until Step 6 (design) is approved.**

## Project Context Injection
!`cat ~/rank-higher-media/knowledge/projects/$0-context.md 2>/dev/null || echo "(No expert profile for project: $0)"`

## Recent Decisions ($0)
!`ls ~/rank-higher-media/knowledge/debates/$0/ 2>/dev/null | grep -v '\.gitkeep' | sort -r | head -3 || echo "(No debates yet)"`

---

You are running the Ash Code brainstorm process. Use the TodoWrite tool to track these 9 steps. Create ALL todos now, then work through them in order.

## The 9 Steps

Create todos for each step below, then execute in sequence:

**Step 1 — Explore context**
Read relevant files, recent commits (`git log --oneline -10`), and the KB debates listed above. Understand current state before forming any opinion.

**Step 2 — Visual companion (if needed)**
If the topic involves UI, layouts, or diagrams — offer the visual companion in its own message. Otherwise skip.

**Step 3 — Clarifying questions**
Ask ONE question at a time. Research first (like the DA agent) — check the KB for existing answers before asking. Keep going until you have enough to propose approaches.

**Step 4 — Local debate (for complex decisions)**
If the topic is architectural or has real trade-offs, run the debate engine:

```bash
node ~/rank-higher-media/ares/scripts/brainstorm.js "$ARGUMENTS" --project $0
```

Read the output and incorporate findings into your approach proposals.

**Step 5 — Propose 2-3 approaches**
Present options with trade-offs. Lead with your recommendation. Reference debate findings if Step 4 was run.

**Step 6 — Present design → get approval**
Present each design section. Get approval before moving to the next. HARD-GATE: no code until this step is complete and approved.

**Step 7 — Write spec**
Save to: `docs/specs/YYYY-MM-DD-{topic}-design.md` (for ARES) or the project-appropriate location.

**Step 8 — Spec self-review**
Check for: TBD/TODO placeholders, internal contradictions, scope issues, ambiguous requirements. Fix inline.

**Step 9 — User review → invoke writing-plans**
Ask user to review the spec. When approved, invoke the writing-plans skill.

---

**Start now:** Use TodoWrite to create todos for Steps 1-9, mark Step 1 as in_progress, and begin exploring context.
```

- [ ] **Step 3: Verify skill loads**

In Claude Code, type `/ash-brainstorm ares` and verify the project context injection runs correctly.

---

## Task 9: Add hooks to ~/.claude/settings.json

**Files:**
- Create: `~/.claude/hooks/session-start.sh`
- Create: `~/.claude/hooks/post-tool-use.sh`
- Modify: `~/.claude/settings.json`

- [ ] **Step 1: Create hooks directory**

```bash
mkdir -p ~/.claude/hooks
```

- [ ] **Step 2: Write session-start.sh**

Create `~/.claude/hooks/session-start.sh`:

```bash
#!/bin/bash
# SessionStart hook — inject active project expert profile as additional context

PROJECT="${ARES_PROJECT:-ares}"
PROFILE="$HOME/rank-higher-media/knowledge/projects/${PROJECT}-context.md"

if [ -f "$PROFILE" ]; then
  CONTEXT=$(cat "$PROFILE")
  jq -n \
    --arg ctx "## Active Project Expert Profile (${PROJECT})\n${CONTEXT}" \
    '{
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: $ctx
      }
    }'
else
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: "No expert profile found. Run /brainstorm to generate one."
    }
  }'
fi
```

```bash
chmod +x ~/.claude/hooks/session-start.sh
```

- [ ] **Step 3: Write post-tool-use.sh**

Create `~/.claude/hooks/post-tool-use.sh`:

```bash
#!/bin/bash
# PostToolUse hook — run ESLint after Write/Edit on .js files

TOOL_NAME=$(echo "$CLAUDE_HOOK_INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
FILE_PATH=$(echo "$CLAUDE_HOOK_INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Only act on Write or Edit tools
if [[ "$TOOL_NAME" != "Write" && "$TOOL_NAME" != "Edit" ]]; then
  exit 0
fi

# Only act on .js files
if [[ "$FILE_PATH" != *.js ]]; then
  exit 0
fi

# Skip node_modules and .next
if [[ "$FILE_PATH" == *node_modules* || "$FILE_PATH" == *.next* ]]; then
  exit 0
fi

# Run eslint on the file
PROJECT_DIR=$(dirname "$FILE_PATH")
while [[ "$PROJECT_DIR" != "/" ]]; do
  if [[ -f "$PROJECT_DIR/package.json" ]]; then
    break
  fi
  PROJECT_DIR=$(dirname "$PROJECT_DIR")
done

if [[ -f "$PROJECT_DIR/node_modules/.bin/eslint" ]]; then
  RESULT=$("$PROJECT_DIR/node_modules/.bin/eslint" "$FILE_PATH" 2>&1)
  EXIT_CODE=$?
  if [[ $EXIT_CODE -ne 0 ]]; then
    jq -n \
      --arg reason "ESLint found issues in ${FILE_PATH}:\n${RESULT}" \
      '{decision: "block", reason: $reason}'
    exit 0
  fi
fi

exit 0
```

```bash
chmod +x ~/.claude/hooks/post-tool-use.sh
```

- [ ] **Step 4: Update ~/.claude/settings.json with new hooks**

Replace the entire contents of `~/.claude/settings.json` with:

```json
{
  "enabledPlugins": {
    "superpowers@claude-plugins-official": true
  },
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
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
    ],
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "/Users/ashishuzelman/.claude/hooks/session-start.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "CLAUDE_HOOK_INPUT=$(cat) /Users/ashishuzelman/.claude/hooks/post-tool-use.sh"
          }
        ]
      }
    ]
  }
}
```

Note: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1"` enables agent teams feature from our research.

- [ ] **Step 5: Verify hooks file is valid JSON**

```bash
cat ~/.claude/settings.json | node -e "
const d = require('fs').readFileSync('/dev/stdin','utf8')
JSON.parse(d)
console.log('✅ settings.json is valid JSON')
"
```

Expected: ✅ settings.json is valid JSON

- [ ] **Step 6: Test session-start hook manually**

```bash
~/.claude/hooks/session-start.sh | jq .
```

Expected: JSON with `additionalContext` containing the ares expert profile or fallback message.

- [ ] **Step 7: Commit hook scripts**

```bash
cd ~/rank-higher-media
git add .claude/hooks/ 2>/dev/null || true
# hooks live in ~/.claude/ — no git tracking needed, but note the location
echo "Hooks saved to ~/.claude/hooks/ — not git tracked (personal config)"
```

---

## Task 10: Final end-to-end verification

- [ ] **Step 1: Full brainstorm CLI smoke test**

```bash
cd ~/rank-higher-media/ares
npm run brainstorm -- "what is the most important next feature for ARES after the brainstorm system" --project ares
```

Expected full flow:
1. ✅ Strategist Round 1 streams output
2. ✅ DA Round 1 shows `## Research Findings` section with KB citations
3. ✅ Strategist Round 2 streams output
4. ✅ DA Final Word is brief (2-3 paragraphs)
5. ✅ Synthesizer produces valid JSON
6. ✅ Output file saved to `knowledge/debates/ares/YYYY-MM-DD-*.md`
7. ✅ Expert profile updated at `knowledge/projects/ares-context.md`

- [ ] **Step 2: Verify output file format**

```bash
LATEST=$(ls ~/rank-higher-media/knowledge/debates/ares/*.md | grep -v gitkeep | sort -r | head -1)
echo "=== FRONTMATTER ==="
head -15 "$LATEST"
echo "=== FINAL DECISION ==="
grep -A 5 "## Final Decision" "$LATEST"
```

Expected: YAML frontmatter with `project:`, `confidence:`, `decision:` fields. Final Decision section present.

- [ ] **Step 3: Verify knowledge_retrieval.js picks up new debate**

```bash
cd ~/rank-higher-media/ares
node -e "
const { retrieveKnowledge } = require('./scripts/knowledge_retrieval')
retrieveKnowledge('ARES next feature brainstorm', { project: 'ares', maxChunks: 3 }).then(chunks => {
  console.log('Chunks found:', chunks.length)
  chunks.forEach(c => console.log(' -', c.file, 'score:', c.relevanceScore.toFixed(2)))
  process.exit(0)
})
"
```

Expected: At least 1 chunk from `debates/ares/` with non-zero score.

- [ ] **Step 4: Verify debate task routing via connector**

Create `~/rank-higher-media/ares/agent_inbox/task_debate_verify.md`:

```markdown
# Verify debate routing

**Priority**: normal
**Assignee**: claude-terminal
**Initiator**: verification
**Worker**: ollama
**TaskType**: debate
**Topic**: should we add TBench2 evaluation for qwen3 local models
**Project**: ares

Run brainstorm and confirm the debate system is fully integrated.
```

```bash
cd ~/rank-higher-media/ares
timeout 900 node scripts/agent_connector.js
```

Expected: `🎭 Debate task → brainstorm.js` in output, full debate runs, task marked complete in Firestore.

- [ ] **Step 5: Final commit with version tag**

```bash
cd ~/rank-higher-media/ares
git add -A
git commit -m "feat: brainstorm system complete — local multi-agent debate engine

- brainstorm.js: Strategist + DA (research-first) + Synthesizer + Gemini tie-breaker
- knowledge_retrieval.js: path fix + project-scoped filtering
- agent_connector.js: TaskType debate routing
- knowledge/debates/{project}/ directory structure
- knowledge/projects/{project}-context.md expert profiles
- ~/.claude/skills/brainstorm/ Claude Code entry point
- ~/.claude/skills/ash-brainstorm/ Ash Code 9-step checklist
- ~/.claude/settings.json: SessionStart + PostToolUse hooks added

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage check:**
- ✅ §1 Overview — brainstorm.js CLI + skill entry (Tasks 3-4, 7)
- ✅ §2 Agent roles — Strategist, DA, Synthesizer, Gemini (Task 4)
- ✅ §3 Debate flow — 2 rounds + DA final + synthesis + tie-breaker (Task 4)
- ✅ §4 Output format — YAML frontmatter + transcript + decision (Task 4: writeDebateOutput)
- ✅ §5 Expert profiles — auto-generated by qwen3 (Task 4: regenerateExpertProfile)
- ✅ §6 Output contract — JSON header in system prompts (Task 3: STRATEGIST_SYSTEM, DA_SYSTEM)
- ✅ §7 Claude Code skill — /brainstorm with context injection (Task 7)
- ✅ §8 knowledge_retrieval.js — project-scoped (Task 1)
- ✅ §9 agent_connector.js — debate routing (Task 6)
- ✅ §10 Hooks — SessionStart + PostToolUse (Task 9)
- ✅ §11 ash-brainstorm skill — 9-step checklist (Task 8)
- ✅ §12 File map — all files accounted for

**Placeholder scan:** No TBD, TODO, or "implement later" found.

**Type consistency:** `runBrainstorm`, `runStrategist`, `runDA`, `runSynthesizer`, `runGeminiTieBreaker`, `writeDebateOutput`, `regenerateExpertProfile` — all defined in Task 4, all exported, all referenced consistently.

**Note on hooks:** The `PostToolUse` hook reads input via `CLAUDE_HOOK_INPUT=$(cat)` — this assumes the hook runtime pipes the JSON input to stdin, which is the Claude Code hook convention. Verify behavior in first live session.
