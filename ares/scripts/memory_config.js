/**
 * ARES Memory & Model Configuration
 * Central constants for LLM routing, model names, and memory settings.
 * Update here when switching models — all scripts import from this file.
 */

// ── LLM Model Constants ─────────────────────────────────────────────────────

const WORKER_MODEL          = 'qwen3:30b-a3b'         // code, agentic, long ctx (128K), MoE 3B active
const SUPERVISOR_MODEL      = 'gemma3:27b-it-qat'     // critic/supervisor (upgraded, already pulled)
const WORKER_FALLBACK_MODEL = 'qwen2.5-coder:32b'    // deep code, fallback if qwen3 unavailable
const WORKER_FAST_MODEL     = 'qwen2.5-coder:14b'    // fast code tasks, short context
const MEMORY_MODEL          = 'gemma2:9b'             // session summarizer (lightweight, ~9GB)
const CLAUDE_OLLAMA_MODEL   = 'claude-sonnet-4-6'    // Claude via Ollama native Anthropic API (v0.14+)
const GEMINI_MODEL          = 'gemini-2.5-flash'      // Google Gemini via API — long context (1M), multimodal, fallback
const GEMINI_MODEL_PRO      = 'gemini-2.5-pro'        // Gemini Pro — deeper reasoning, higher cost

// ── Ollama Endpoint ──────────────────────────────────────────────────────────
// Cloud Gemma 4 option: gemma-4-31b-it via GEMINI_API_KEY (free on Google AI Studio)
// To use: set SYNTHESIZER_USE_CLOUD=1 env var (feature flag — see brainstorm.js)
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'

// ── System Prompts ───────────────────────────────────────────────────────────

const WORKER_SYSTEM_PROMPT = `You are an expert AI coding assistant working inside ARES — Ashish Uzelman's agentic orchestration platform.

STACK:
- ARES: Next.js 16, Tailwind 4, Firebase Web SDK v12, JavaScript (no TypeScript)
- Ad Creator: Next.js 15, Tailwind 3, Firebase (Auth/Firestore/Storage), JavaScript
- Local LLMs: Ollama on M1 Mac — qwen3:30b-a3b (Worker/Picker), gemma3:27b-it-qat (Supervisor/Critic), claude-sonnet-4-6 (Ollama-native escalation)
- Path alias: @/ maps to src/ (ARES) or root (Ad Creator)

CONVENTIONS:
- JavaScript only — no .ts/.tsx files, no TypeScript interfaces
- Tailwind only — no CSS Modules, no inline styles
- Firebase 12: guard initializeApp with hasConfig check (throws at module load if apiKey is empty string)
- React hooks: never call Date.now(), Math.random() in render phase — use async callbacks
- App Router only — no pages/ directory
- 'use client' at top of any component that uses hooks or browser APIs
- Always output the FULL file content when writing code — no partial snippets or stubs

AGENT ARCHITECTURE:
- Director (Gemini) → Manager → Worker (you) → Supervisor (gemma3:27b-it-qat reviews your output)
- Tasks arrive via agent_inbox/, results go to agent_outbox/
- Your output will be reviewed and applied by Claude — be complete and precise

ASHISH'S PRIORITIES:
- Ship working code, not perfect code
- Always produce full file content — no "// existing code continues..." stubs
- No TypeScript, no over-engineering, no speculative abstractions
- Follow the exact file structure and module imports already in the codebase`

const CRITIC_SYSTEM_PROMPT = `You are a Critic agent in the ARES platform. Your job is to review a Worker's output and give precise, actionable feedback. Be direct and brief. Focus on: correctness, completeness, adherence to the task, and ARES stack conventions (JavaScript only, Tailwind, Firebase 12, App Router). Flag any partial stubs or placeholder comments as incomplete.`

const SUPERVISOR_SYSTEM_PROMPT = `You are the Supervisor agent in the ARES platform. Your job is to make a final APPROVED or REJECTED decision on a Worker's completed output before it is committed to the codebase.

You are the last line of defence. Be strict. REJECT anything that is incomplete, wrong, or violates conventions.

REJECT if ANY of the following are true:
- Output contains partial stubs: "// continues...", "// existing code", "// TODO", "// ...remaining logic", or any placeholder comment
- Output uses TypeScript (.ts/.tsx files, type annotations, interfaces, enums)
- Output uses ESM import/export syntax in a .js script file (scripts/ folder must use CommonJS require/module.exports)
- Output is missing a section the task explicitly required
- Success criteria checkboxes in the task are not all satisfied by the output
- Code references functions, variables, or files that don't exist in the task context
- Output is clearly truncated or cut off mid-sentence/mid-function

APPROVE if:
- All task requirements are met
- Output is complete (no stubs, no placeholders)
- Stack conventions are followed
- Success criteria are satisfied

Be direct. One sentence reason. Specific feedback on what to fix if REJECTED.`

// ── Memory Settings ───────────────────────────────────────────────────────────
const BACKUP_TASK_THRESHOLD  = 10  // backup after N completed tasks
const BACKUP_HOURS_THRESHOLD = 24  // backup after N hours since last save
const SUPERVISOR_MAX_RETRIES = 3   // max REJECTED loops before escalating
const ACTOR_CRITIC_TURNS    = 2   // Actor→Critic debate rounds before final output
const ACTOR_CRITIC_ENABLED  = true // set false to bypass loop (fallback to single-shot)

// ── LLM Router ───────────────────────────────────────────────────────────────
/**
 * routeModel(taskMeta) → model name string
 *
 * taskMeta fields (all optional, parsed from task file headers):
 *   taskType    : 'code' | 'review' | 'research' | 'summary' | 'agentic' | 'general'
 *   contextSize : estimated token count of context (number)
 *   priority    : 'low' | 'normal' | 'high'
 *   forceModel  : explicit model name — always wins
 *
 * Routing rules (in priority order):
 *  1. forceModel set → use it
 *  2. review/supervisor tasks → gemma3:12b (fast, lightweight)
 *  3. context > 50K tokens → 'gemini' (1M ctx window, Ollama cap is 128K)
 *  4. context > 32K tokens → qwen3:30b-a3b (only local model with 128K ctx)
 *  5. code tasks, normal priority → qwen2.5-coder:14b (faster, cheaper)
 *  6. code tasks, high priority → qwen2.5-coder:32b (best code quality)
 *  7. research/summary → qwen3:30b-a3b (reasoning + long ctx)
 *  8. default → qwen3:30b-a3b
 */
function routeModel({ taskType = 'general', contextSize = 0, priority = 'normal', forceModel = null } = {}) {
  if (forceModel) return forceModel

  if (taskType === 'review' || taskType === 'supervisor') return SUPERVISOR_MODEL

  // Context exceeds local model capacity — route to Gemini (1M window)
  if (contextSize > 50000) return 'gemini'

  if (contextSize > 32000) return WORKER_MODEL  // needs 128K window

  if (taskType === 'code') {
    // qwen2.5-coder:32b is too slow on M1 (times out at 5min) — use qwen3 MoE for all code tasks
    return priority === 'high' ? WORKER_MODEL : WORKER_FAST_MODEL
  }

  if (taskType === 'research' || taskType === 'summary') return WORKER_MODEL

  return WORKER_MODEL  // default
}

/**
 * parseTaskType(taskContent) → taskType string
 * Reads **TaskType**: field from task markdown header.
 * Falls back to 'general'.
 */
function parseTaskType(taskContent) {
  // Handles: **TaskType**: value  AND  **TaskType:** value
  const match = taskContent.match(/^\*\*TaskType[:\*]*\s*(.+)/im)
  return match ? match[1].trim().toLowerCase() : 'general'
}

module.exports = {
  WORKER_MODEL,
  SUPERVISOR_MODEL,
  WORKER_FALLBACK_MODEL,
  WORKER_FAST_MODEL,
  MEMORY_MODEL,
  CLAUDE_OLLAMA_MODEL,
  GEMINI_MODEL,
  GEMINI_MODEL_PRO,
  OLLAMA_URL,
  BACKUP_TASK_THRESHOLD,
  BACKUP_HOURS_THRESHOLD,
  SUPERVISOR_MAX_RETRIES,
  ACTOR_CRITIC_TURNS,
  ACTOR_CRITIC_ENABLED,
  WORKER_SYSTEM_PROMPT,
  CRITIC_SYSTEM_PROMPT,
  SUPERVISOR_SYSTEM_PROMPT,
  routeModel,
  parseTaskType,
}
