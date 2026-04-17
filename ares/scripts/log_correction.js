#!/usr/bin/env node
/**
 * ARES Corrections Logger
 *
 * Records when Claude corrects a local LLM's output.
 * These corrections are the training dataset for Active Dreaming (Phase 2 — MLX LoRA).
 *
 * Each correction is stored as a ChatML-compatible JSON entry:
 *   { task_id, model, date, task_prompt, llm_output, corrected_output, correction_notes, chatml }
 *
 * Usage (from agent_connector.js or manually):
 *   node scripts/log_correction.js \
 *     --task   task_actor_critic_loop \
 *     --model  qwen3:30b-a3b \
 *     --notes  "Stripped existing constants, referenced non-existent modules" \
 *     --llm    agent_outbox/task_actor_critic_loop_complete.md \
 *     --fix    corrections/task_actor_critic_loop_corrected.md
 *
 * Output: corrections/YYYY-MM-DD_<task_id>.json
 */

const fs   = require('fs')
const path = require('path')

const ROOT        = path.join(__dirname, '..')
const CORRECTIONS = path.join(ROOT, 'corrections')
const INBOX       = path.join(ROOT, 'agent_inbox')
const OUTBOX      = path.join(ROOT, 'agent_outbox')

if (!fs.existsSync(CORRECTIONS)) fs.mkdirSync(CORRECTIONS, { recursive: true })

// --- Parse CLI args ---
const args = process.argv.slice(2)
function getArg(flag) {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : null
}

const taskId      = getArg('--task')
const model       = getArg('--model') || 'qwen3:30b-a3b'
const notes       = getArg('--notes') || ''
const llmPath     = getArg('--llm')
const fixPath     = getArg('--fix')

if (!taskId) {
  console.error('Usage: node log_correction.js --task <task_id> --notes "why it was wrong" [--llm <path>] [--fix <path>]')
  process.exit(1)
}

// --- Read files ---
const taskFile = path.join(INBOX, 'archive', `${taskId}.md`)
const taskPrompt = fs.existsSync(taskFile) ? fs.readFileSync(taskFile, 'utf8') : '[task file not found]'

const llmOutput = llmPath && fs.existsSync(llmPath)
  ? fs.readFileSync(llmPath, 'utf8')
  : fs.existsSync(path.join(OUTBOX, `${taskId}_complete.md`))
    ? fs.readFileSync(path.join(OUTBOX, `${taskId}_complete.md`), 'utf8')
    : '[llm output not found]'

const correctedOutput = fixPath && fs.existsSync(fixPath)
  ? fs.readFileSync(fixPath, 'utf8')
  : '[corrected output not provided — add manually]'

// --- Build ChatML format (for MLX LoRA fine-tuning) ---
const chatml = [
  { role: 'system',    content: 'You are an expert AI coding assistant working inside ARES.' },
  { role: 'user',      content: taskPrompt },
  { role: 'assistant', content: correctedOutput }, // the CORRECT answer
]

// --- Write correction entry ---
const date    = new Date().toISOString().split('T')[0]
const outFile = path.join(CORRECTIONS, `${date}_${taskId}.json`)

const entry = {
  task_id:          taskId,
  model,
  date,
  correction_notes:  notes,
  task_prompt:       taskPrompt,
  llm_output:        llmOutput,
  corrected_output:  correctedOutput,
  chatml,
}

fs.writeFileSync(outFile, JSON.stringify(entry, null, 2), 'utf8')
console.log(`✅ Correction logged: corrections/${date}_${taskId}.json`)
console.log(`   Model:  ${model}`)
console.log(`   Notes:  ${notes || '(none)'}`)
console.log(`   ChatML: ${chatml.length} turns — ready for MLX LoRA`)
