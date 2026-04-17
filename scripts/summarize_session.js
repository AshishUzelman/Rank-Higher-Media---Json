#!/usr/bin/env node
/**
 * summarize_session.js — End-of-session memory compiler
 *
 * What it does:
 *  1. Reads CONTEXT.md, PROJECT_STATUS.md (TODAY), recent git log from all active repos
 *  2. Sends to qwen3 (local Ollama) — zero Claude tokens
 *  3. Writes new session block to rolling_summary.md (keeps last 3, archives older)
 *  4. Updates PROJECT_STATUS.md TODAY section (marks completed, resets in-progress)
 *  5. Logs what changed to stdout
 *
 * Usage:
 *   node ares/scripts/summarize_session.js
 *   node ares/scripts/summarize_session.js --session-num 11  (override session number)
 *   node ares/scripts/summarize_session.js --dry-run         (print output, don't write)
 */

const fs   = require('fs')
const path = require('path')

const ROOT   = path.join(process.env.HOME, 'rank-higher-media')
const ARES   = path.join(ROOT, 'ares')
const ADCR   = path.join(process.env.HOME, 'ad-creator')

const ROLLING_SUMMARY = path.join(ROOT, 'rolling_summary.md')
const CONTEXT_FILE    = path.join(ROOT, 'CONTEXT.md')
const STATUS_FILE     = path.join(ROOT, 'PROJECT_STATUS.md')

const { MEMORY_MODEL, OLLAMA_URL: CONFIG_URL } = require('./memory_config')
const OLLAMA_URL = CONFIG_URL || 'http://localhost:11434'

const DRY_RUN = process.argv.includes('--dry-run')
const SESSION_NUM_ARG = (() => {
  const idx = process.argv.indexOf('--session-num')
  return idx !== -1 ? parseInt(process.argv[idx + 1], 10) : null
})()

// ── Helpers ──────────────────────────────────────────────────────────────────

function readFile(p, fallback = '') {
  try { return fs.readFileSync(p, 'utf8') } catch { return fallback }
}

function gitLog(repoPath, lines = 15) {
  try {
    const { execSync } = require('child_process')
    return execSync(
      `git -C ${JSON.stringify(repoPath)} log --oneline --since="24 hours ago" 2>/dev/null || true`,
      { encoding: 'utf8', timeout: 5000 }
    ).trim()
  } catch { return '' }
}

function detectSessionNumber(rollingSummary) {
  const match = rollingSummary.match(/## Session (\d+)/g)
  if (!match) return 1
  const nums = match.map(m => parseInt(m.replace('## Session ', ''), 10))
  return Math.max(...nums) + 1
}

function extractTodaySection(statusContent) {
  const match = statusContent.match(/(## TODAY[^\n]*\n[\s\S]*?)(?=\n## TODAY|\n## THIS WEEK|$)/)
  return match ? match[1].trim() : '[no TODAY section found]'
}

function shiftSessions(rollingSummary, newSessionBlock) {
  // Extract archive protocol block (keep it at end)
  const archiveMatch = rollingSummary.match(/\n## Archive Protocol[\s\S]*$/)
  const archiveBlock = archiveMatch ? archiveMatch[0] : ''

  // Extract existing sessions
  const sessionMatches = [...rollingSummary.matchAll(/## Session \d+[^\n]*\n[\s\S]*?(?=\n## Session \d+|\n## Archive Protocol|$)/g)]
  const sessions = sessionMatches.map(m => m[0].trim())

  // Keep only last 2 (we're prepending new one → 3 total)
  const kept = sessions.slice(0, 2)

  const header = rollingSummary.split('\n## Session')[0].trim()

  return [
    header,
    '',
    newSessionBlock,
    '',
    ...kept.map(s => s),
    archiveBlock,
  ].join('\n')
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n📝 ARES Session Summarizer')
  console.log(`Model: ${MEMORY_MODEL} | Endpoint: ${OLLAMA_URL}`)
  if (DRY_RUN) console.log('⚠️  DRY RUN — no files will be written\n')

  // 1. Gather source material
  const context    = readFile(CONTEXT_FILE, '[CONTEXT.md not found]').slice(0, 6000)
  const statusFull = readFile(STATUS_FILE, '[PROJECT_STATUS.md not found]')
  const todayBlock = extractTodaySection(statusFull)
  const gitLogAres = gitLog(ARES)
  const gitLogAdCr = gitLog(ADCR)
  const gitLogRoot = gitLog(ROOT)

  const gitSection = [
    gitLogAres ? `ARES commits:\n${gitLogAres}` : '',
    gitLogAdCr ? `Ad Creator commits:\n${gitLogAdCr}` : '',
    gitLogRoot ? `RHM commits:\n${gitLogRoot}` : '',
  ].filter(Boolean).join('\n\n') || '[no commits in last 24h]'

  const rolling   = readFile(ROLLING_SUMMARY, '')
  const sessionNum = SESSION_NUM_ARG || detectSessionNumber(rolling)
  const today = new Date().toISOString().split('T')[0]

  // 2. Build prompt
  const prompt = `You are the ARES memory compiler. Your job is to write a concise, accurate session summary for a software developer's project log.

TODAY IS: ${today}
SESSION NUMBER: ${sessionNum}

---
CONTEXT.md (current project state):
${context}
---
PROJECT_STATUS.md — TODAY section:
${todayBlock}
---
Git commits (last 24h):
${gitSection}
---

Write a session summary block in EXACTLY this format (fill in real content, do not leave placeholders):

## Session ${sessionNum} — [Most Recent]
**Date:** ${today}
**Primary Work:**
- [bullet: what was built/changed — be specific, include file names and outcomes]
- [repeat for each major item]

**Decisions Made:**
- [key architectural or product decisions — only if notable]

**Open Items (carried forward):**
- [things that were in-progress or blocked — pull from TODAY → In Progress and Blocked]

**Next Session Should Start With:**
1. Load memory stack
2. [first concrete task — specific file/feature]
3. [second task if applicable]

Rules:
- Be specific (file names, function names, what worked)
- Mark completed items with ✅
- Keep total length under 400 words
- Do NOT include any explanation outside the ## Session block
- Output only the session block, nothing else`

  console.log('🤖 Calling qwen3 to write session summary...')

  // 3. Call Ollama
  let summary = ''
  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MEMORY_MODEL,
        prompt,
        stream: false,
        options: { num_ctx: 16384, temperature: 0.2 },
      }),
      signal: AbortSignal.timeout(180000),
    })
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`)
    const data = await res.json()
    summary = data.response?.trim() || ''
  } catch (err) {
    console.error(`❌ Ollama call failed: ${err.message}`)
    process.exit(1)
  }

  // Strip any markdown fence if model wrapped it
  summary = summary.replace(/^```[^\n]*\n?/, '').replace(/\n?```$/, '').trim()

  if (!summary.startsWith('## Session')) {
    // Try to extract just the session block
    const match = summary.match(/(## Session \d+[\s\S]*)/)
    if (match) summary = match[1].trim()
    else {
      console.error('❌ Model output did not contain a valid ## Session block')
      console.error('Raw output:\n', summary.slice(0, 500))
      process.exit(1)
    }
  }

  console.log('\n✅ Summary generated:\n')
  console.log(summary)
  console.log()

  if (DRY_RUN) {
    console.log('(Dry run — not writing files)')
    return
  }

  // 4. Shift rolling_summary.md
  const updatedRolling = shiftSessions(rolling, summary)
  fs.writeFileSync(ROLLING_SUMMARY, updatedRolling, 'utf8')
  console.log(`✅ rolling_summary.md updated (Session ${sessionNum} prepended)`)

  // 5. Append new TODAY block to PROJECT_STATUS.md
  const newTodayBlock = `\n## TODAY — ${today}\n\n### Completed\n- [x] Session ${sessionNum} summary written by qwen3 ✅\n\n### In Progress\n- [ ] (carry forward from previous session)\n\n### Blocked\n- (carry forward)\n\n---\n`

  // Insert after the first --- in the file (after the header)
  const updatedStatus = statusFull.replace(
    /(\n---\n\n)(## TODAY)/,
    `$1${newTodayBlock}\n$2`
  )

  if (updatedStatus !== statusFull) {
    fs.writeFileSync(STATUS_FILE, updatedStatus, 'utf8')
    console.log(`✅ PROJECT_STATUS.md: new TODAY — ${today} block added`)
  } else {
    console.warn('⚠️  Could not inject new TODAY block — check PROJECT_STATUS.md format')
  }

  console.log('\n🎉 Session summary complete. No Claude tokens used.')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
