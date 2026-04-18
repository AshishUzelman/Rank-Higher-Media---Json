#!/usr/bin/env node
/**
 * ARES Agent Connector — Enhanced
 *
 * Watches agent_inbox/ for task files and orchestrates Claude execution.
 *
 * Per-task flow:
 *  1. Detect task file → parse task ID and metadata
 *  2. Write task to Firestore (status: pending)
 *  3. Update agent_state: claude-terminal → working
 *  4. Load Agent Context Packet (soul files + Firestore memory)
 *  5. Write context to temp file
 *  6. Update Firestore: status → in_progress
 *  7. Invoke Claude Code (Worker) with context + task
 *  8. Read outbox result
 *  8b. Supervisor review: gemma3:12b reviews Worker output
 *      APPROVED → continue to step 9
 *      REJECTED → re-queue to inbox with feedback (max 3 retries, then escalate)
 *  9. Update Firestore: status → complete/failed, save result excerpt
 * 10. Update agent_state: claude-terminal → idle
 * 11. Check backup triggers (>24h since last save OR ≥10 tasks since last save)
 * 12. Run save_to_drive.js if backup is needed
 * 13. Archive task file
 */

const fs   = require('fs')
const path = require('path')
const { execSync, spawnSync } = require('child_process')

// --- Local LLM endpoint check ---
// ash-proxy (port 4000) is not yet working — use Ollama directly at port 11434.
// When ash-proxy is fixed, set ASH_PROXY_URL=http://localhost:4000 to re-enable.
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const ASH_PROXY_URL = process.env.ASH_PROXY_URL || null; // disabled until ash-proxy is fixed

async function checkLocalLLM() {
  // Try Ollama directly first
  try {
    const resp = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(2000)
    });
    if (resp.ok) {
      const data = await resp.json();
      const models = data.models?.map(m => m.name) || [];
      return { available: models.length > 0, ollama: true, models };
    }
  } catch {
    // Ollama not reachable
  }
  return { available: false };
}

// TODO [Phase 3]: Replace direct Claude API call with MoE routing.
// checkLocalLLM() → if available + task is bulk/research → route to ash-proxy
// else → route to Claude API (current behavior)
const { buildContextPacket } = require('./load_context')
const { retrieveKnowledge } = require('./knowledge_retrieval')
const {
  createTask,
  updateTask,
  updateAgentState,
  getBackupStatus,
} = require('./firestore-client')
const {
  WORKER_MODEL,
  SUPERVISOR_MODEL,
  CLAUDE_OLLAMA_MODEL,
  SUPERVISOR_MAX_RETRIES,
  ACTOR_CRITIC_TURNS,
  ACTOR_CRITIC_ENABLED,
  WORKER_SYSTEM_PROMPT,
  CRITIC_SYSTEM_PROMPT,
  OLLAMA_URL: CONFIG_OLLAMA_URL,
  GEMINI_MODEL,
  routeModel,
  parseTaskType,
} = require('./memory_config')
const { generateText: geminiGenerateText } = require('./gemini_provider')

const INBOX_DIR  = path.join(__dirname, '../agent_inbox')
const OUTBOX_DIR = path.join(__dirname, '../agent_outbox')
const TMP_DIR    = '/tmp'

// --- Ensure directories exist ---------------------------------------------

if (!fs.existsSync(INBOX_DIR))  fs.mkdirSync(INBOX_DIR,  { recursive: true })
if (!fs.existsSync(OUTBOX_DIR)) fs.mkdirSync(OUTBOX_DIR, { recursive: true })

// --- Task metadata parsing ------------------------------------------------

function parseTaskMetadata(content) {
  const title      = (content.match(/^#\s+(.+)/m)               || [])[1]?.trim() || 'Unknown Task'
  const priority   = (content.match(/^\*\*Priority\*\*:\s*(.+)/im)   || [])[1]?.trim() || 'normal'
  const assignee   = (content.match(/^\*\*Assignee\*\*:\s*(.+)/im)   || [])[1]?.trim() || 'claude-terminal'
  const initiator  = (content.match(/^\*\*Initiator\*\*:\s*(.+)/im)  || [])[1]?.trim() || 'unknown'
  // workerType: 'ollama' (default) | 'claude' (explicit escalation only)
  const workerType = (content.match(/^\*\*Worker\*\*:\s*(.+)/im)     || [])[1]?.trim() || 'ollama'
  // ResearchFiles: comma-separated paths to read before retry (optional)
  const researchFiles = (content.match(/^\*\*ResearchFiles\*\*:\s*(.+)/im) || [])[1]?.trim() || ''
  return { title, priority, assignee, initiator, workerType, researchFiles }
}

// --- Research phase (knowledge base query before first draft) -------------

async function runResearchPhase(taskContent, taskId) {
  const title = (taskContent.match(/^#\s+(.+)/m) || [])[1]?.trim() || ''
  const preview = taskContent.slice(0, 200).replace(/\n/g, ' ').trim()
  const query = (title + ' ' + preview).trim()
  if (!query) return ''

  console.log(`   🔬 Research query: "${query.slice(0, 80)}..."`)
  try {
    await updateTask(taskId, { currentPhase: 'research' })
  } catch {}

  try {
    const results = await retrieveKnowledge(query, { topK: 3 })
    if (!results?.length) { console.log('   🔬 No knowledge results'); return '' }
    const notes = '## Research Notes\n' + results.map(r => `- [${r.source}]: ${r.content?.slice(0, 300)}`).join('\n')
    console.log(`   🔬 Research complete (${results.length} results, ${notes.length} chars)`)
    return notes
  } catch (err) {
    console.warn(`   [research] knowledge query failed: ${err.message}`)
    return ''
  }
}

// --- Backup trigger check -------------------------------------------------

async function runBackupIfNeeded() {
  try {
    const { hoursSinceLastSave, taskCountSinceLastSave } = await getBackupStatus()
    const neverSaved = hoursSinceLastSave === null
    const stale      = hoursSinceLastSave !== null && hoursSinceLastSave > 24
    const manyTasks  = taskCountSinceLastSave >= 10

    if (neverSaved || stale || manyTasks) {
      const reason = neverSaved  ? 'never saved to Drive'
                   : stale       ? `${hoursSinceLastSave}h since last save`
                   : `${taskCountSinceLastSave} tasks since last save`
      console.log(`\n📦 Backup triggered (${reason})`)
      spawnSync('node', [path.join(__dirname, 'save_to_drive.js')], { stdio: 'inherit' })
    } else {
      console.log(`✅ Backup not needed (${hoursSinceLastSave}h ago, ${taskCountSinceLastSave} tasks since save)`)
    }
  } catch (err) {
    console.warn('[connector] Backup check failed:', err.message)
  }
}

// --- Supervisor review (gemma3:12b) ---------------------------------------

async function runSupervisor(taskId, workerResult, originalTask) {
  const supervisorPrompt = `You are a Supervisor agent reviewing a Worker's completed task output.
Original task: ${originalTask}
Worker result: ${workerResult}

Review for:
1. Task completion — did the Worker actually do what was asked?
2. Quality — is the output coherent and correct?
3. Safety — does it follow SOUL_BASE.md principles (no deception, no data loss, no unapproved spend)?

Respond with JSON only:
{
  "decision": "APPROVED",
  "reason": "one sentence",
  "feedback": ""
}

Or if rejected:
{
  "decision": "REJECTED",
  "reason": "one sentence",
  "feedback": "specific instruction for Worker to fix"
}`

  try {
    const ollamaUrl = CONFIG_OLLAMA_URL || OLLAMA_URL
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: SUPERVISOR_MODEL,
        system: CRITIC_SYSTEM_PROMPT,
        prompt: supervisorPrompt,
        stream: false,
        format: 'json',
      }),
      signal: AbortSignal.timeout(120000), // 2min timeout
    })
    const data = await response.json()
    const parsed = JSON.parse(data.response)
    // Validate shape
    if (!parsed.decision || !['APPROVED', 'REJECTED'].includes(parsed.decision)) {
      console.warn('[supervisor] Unexpected response shape — defaulting APPROVED')
      return { decision: 'APPROVED', reason: 'parse fallback', feedback: '' }
    }
    return parsed
  } catch (err) {
    console.warn(`[supervisor] runSupervisor failed: ${err.message} — defaulting APPROVED`)
    return { decision: 'APPROVED', reason: `supervisor error: ${err.message}`, feedback: '' }
  }
}

// --- Critic review (gemma3:12b) — structured JSON feedback ---------------

async function runCriticReview(taskContent, draft, turn) {
  const ollamaUrl = CONFIG_OLLAMA_URL || OLLAMA_URL
  const prompt = `You are a Critic agent in a multi-turn Actor-Critic debate.

Original task:
${taskContent.slice(0, 2000)}

Actor's current draft:
${draft.slice(0, 3000)}

Identify specific improvements only. Be brief and direct.
Focus on: completeness, correctness, edge cases missed, quality issues.

Respond with JSON only:
{
  "score": 8,
  "issues": ["issue 1", "issue 2"],
  "suggestion": "one concrete revision instruction"
}`

  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: SUPERVISOR_MODEL,
        system: CRITIC_SYSTEM_PROMPT,
        prompt,
        stream: false,
        format: 'json',
        options: { temperature: 0.1 },
      }),
      signal: AbortSignal.timeout(90000), // 90s — gemma3:27b cold start
    })
    const data = await response.json()
    const parsed = JSON.parse(data.response)
    return {
      score: parsed.score ?? 5,
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      suggestion: parsed.suggestion ?? '',
    }
  } catch (err) {
    console.warn(`   [critic] turn ${turn} failed: ${err.message} — skipping`)
    return { score: 10, issues: [], suggestion: '' } // fail-safe: treat as approved
  }
}

// --- Actor-Critic loop (qwen3 drafts → gemma3 critiques → qwen3 revises) --

async function runActorCriticLoop(taskContent, contextPacket, outboxFile, researchFiles, initialFeedback, model, researchNotes = '') {
  let criticFeedback = initialFeedback // carry in any existing supervisor retry feedback

  for (let turn = 1; turn <= ACTOR_CRITIC_TURNS; turn++) {
    console.log(`\n🎭 Actor-Critic — Actor turn ${turn}/${ACTOR_CRITIC_TURNS}`)
    await runOllamaWorker(taskContent, contextPacket, outboxFile, criticFeedback, researchFiles, model, turn === 1 ? researchNotes : '')

    // Skip critic on the final turn — output is ready
    if (turn >= ACTOR_CRITIC_TURNS) break

    const draft = fs.existsSync(outboxFile) ? fs.readFileSync(outboxFile, 'utf8') : ''
    if (!draft) { console.warn('   [actor-critic] empty draft — stopping loop'); break }

    console.log(`\n🎭 Phase: CRITIC (evaluating turn ${turn}...)`)
    console.log(`\n🎭 Actor-Critic — Critic reviewing turn ${turn} output...`)
    const result = await runCriticReview(taskContent, draft, turn)
    const issuesSummary = result.issues.length ? result.issues[0] : 'looks good'
    console.log(`🎭 Actor-Critic turn ${turn}/${ACTOR_CRITIC_TURNS} | Critic score: ${result.score}/10 — ${issuesSummary}`)

    if (result.score >= 9 || result.issues.length === 0) {
      console.log('   ✅ Critic satisfied — exiting loop early')
      break
    }

    criticFeedback = `CRITIC FEEDBACK (turn ${turn}):\nScore: ${result.score}/10\nIssues: ${result.issues.join('; ')}\nRequired revision: ${result.suggestion}`
  }
}

// --- Ollama Worker + improvement loop -------------------------------------

async function runOllamaWorker(taskContent, contextPacket, outboxFile, supervisorFeedback = '', researchFiles = '', model = WORKER_MODEL, researchNotes = '') {
  const ollamaUrl = CONFIG_OLLAMA_URL || OLLAMA_URL

  // Retry research pass — only on retries with supervisor feedback + researchFiles
  let retryResearchNotes = ''
  if (supervisorFeedback && researchFiles) {
    const paths = researchFiles.split(',').map(p => p.trim()).filter(Boolean)
    const snippets = paths.map(p => {
      try {
        const abs = p.startsWith('/') ? p : path.join(process.env.HOME, p.replace(/^~\//, ''))
        const content = fs.readFileSync(abs, 'utf8').slice(0, 3000)
        return `### ${p}\n${content}`
      } catch {
        return `### ${p}\n[could not read file]`
      }
    }).join('\n\n')

    const retryResearchPrompt = `You are a research assistant. The following task was REJECTED by a Supervisor.

Supervisor feedback: ${supervisorFeedback}

Relevant files to review:
${snippets}

Summarize in 200 words or less: what specific changes are needed to satisfy the Supervisor's feedback? Be concrete and actionable.`

    try {
      const res = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: WORKER_MODEL, prompt: retryResearchPrompt, stream: false, options: { num_ctx: 16384, temperature: 0.2 } }),
        signal: AbortSignal.timeout(120000),
      })
      const data = await res.json()
      retryResearchNotes = data.response?.trim() || ''
      if (retryResearchNotes) console.log(`   🔬 Retry research complete (${retryResearchNotes.length} chars)`)
    } catch (err) {
      console.warn(`   [worker] retry research failed: ${err.message}`)
    }
  }

  const retryContext = supervisorFeedback
    ? `\n\nSUPERVISOR FEEDBACK (previous attempt was rejected):\n${supervisorFeedback}${retryResearchNotes ? `\n\nRETRY RESEARCH NOTES:\n${retryResearchNotes}` : ''}\n\nAddress all feedback before producing your output.\n`
    : ''

  const researchContext = (!supervisorFeedback && researchNotes)
    ? `\n\nRESEARCH NOTES (from knowledge base — use these to inform your response):\n${researchNotes}\n`
    : ''

  const workerPrompt = `You are an expert AI coding and analysis assistant working inside the ARES platform.

AGENT CONTEXT:
${contextPacket}
${retryContext}${researchContext}
TASK:
${taskContent}

Produce your complete response below. Be thorough, precise, and follow the task instructions exactly.
When the task involves code, output the full working implementation.
When the task involves analysis or summaries, be structured and concise.`

  console.log(`\n🤖 Invoking Worker (${model})...\n`)
  const res = await fetch(`${ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, system: WORKER_SYSTEM_PROMPT, prompt: workerPrompt, stream: true, options: { num_ctx: 32768, temperature: 0.3 } }),
    signal: AbortSignal.timeout(600000), // 10 min max
  })

  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`)

  // Stream tokens to stdout as they arrive
  let output = ''
  const reader = res.body.getReader()
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
  console.log('\n') // newline after stream ends
  output = output.trim()
  if (!output) throw new Error('Ollama returned empty response')

  fs.writeFileSync(outboxFile, output, 'utf8')
  console.log(`✅ Worker output written (${output.length} chars)`)
  return output
}

// --- Gemini Worker --------------------------------------------------------

async function runGeminiWorker(taskContent, contextPacket, outboxFile, supervisorFeedback, model) {
  const geminiModel = model === 'gemini' ? GEMINI_MODEL : model  // resolve alias

  const retryContext = supervisorFeedback
    ? `\nSUPERVISOR FEEDBACK (retry):\n${supervisorFeedback}\n`
    : ''

  const userPrompt = `AGENT CONTEXT:\n${contextPacket}\n${retryContext}\nTASK:\n${taskContent}\n\nProduce your complete response below. Be thorough, precise, and follow the task instructions exactly.\nWhen the task involves code, output the full working implementation.\nWhen the task involves analysis or summaries, be structured and concise.`

  const output = await geminiGenerateText(geminiModel, WORKER_SYSTEM_PROMPT, userPrompt)
  if (!output) throw new Error('Gemini returned empty response')

  fs.writeFileSync(outboxFile, output, 'utf8')
  console.log(`✅ Gemini Worker output written (${output.length} chars)`)
  return output
}

// --- qwen3 Agent Picker — LLM-based routing decision ---------------------
// Wraps routeModel() with an LLM judgment call for ambiguous tasks.
// Uses qwen3:30b-a3b in JSON mode (temp 0.0, short prompt) — fast via MoE.
// Falls back to routeModel() on error or timeout.

const AGENT_MANIFEST = `Available agents and their strengths:
- qwen3:30b-a3b   : best for research, analysis, reasoning, long context (128K), general tasks
- qwen2.5-coder:14b : best for fast/simple code tasks, short context, low priority
- qwen2.5-coder:32b : best for complex code, architecture, high priority code tasks
- gemma3:12b      : best for review, critique, routing decisions, structured JSON output, supervisor tasks
- claude-sonnet-4-6 : best for high-stakes code, complex multi-file refactors, escalations (uses Ollama-native API)
- gemini-2.5-flash  : best for long context (1M tokens), multimodal tasks, when local context window is exceeded`

async function agentPicker({ taskType, taskTitle, taskContent, priority, contextSize }) {
  const ollamaUrl = CONFIG_OLLAMA_URL || OLLAMA_URL

  const pickerPrompt = `You are a routing agent. Given a task, select the best worker model.

${AGENT_MANIFEST}

Task title: ${taskTitle}
Task type: ${taskType}
Priority: ${priority}
Estimated tokens: ${contextSize}
Task preview (first 500 chars): ${taskContent.slice(0, 500)}

Respond with JSON only:
{
  "worker": "<model name>",
  "reason": "<one sentence>"
}`

  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: SUPERVISOR_MODEL, // gemma3:12b — fast, JSON-specialist, already loaded for supervision
        prompt: pickerPrompt,
        stream: false,
        format: 'json',
        options: { temperature: 0.0, num_ctx: 4096 },
      }),
      signal: AbortSignal.timeout(60000), // 60s — gemma3:27b needs time on cold start
    })
    const data = await response.json()
    const parsed = JSON.parse(data.response)
    if (!parsed.worker || typeof parsed.worker !== 'string') throw new Error('invalid picker response shape')

    // Normalize: picker may return bare name (e.g. "qwen3") — resolve to full tagged name
    const chosen = normalizeModelName(parsed.worker)
    console.log(`   🧭 Agent Picker → ${chosen} (${parsed.reason})`)
    return chosen
  } catch (err) {
    console.warn(`   [picker] LLM routing failed: ${err.message} — falling back to routeModel()`)
    return null // caller falls back to routeModel()
  }
}

// Map bare model names to their full Ollama-tagged equivalents.
// Picker LLMs sometimes drop the tag suffix (e.g. "qwen3" instead of "qwen3:30b-a3b").
const MODEL_NAME_MAP = {
  'qwen3':              'qwen3:30b-a3b',
  'gemma3':             'gemma3:27b-it-qat',
  'gemma3:12b':         'gemma3:12b',
  'claude-sonnet-4-6':  'claude-sonnet-4-6:latest',
  'qwen2.5-coder':      'qwen2.5-coder:14b',
  'gemini':             'gemini',
  'gemini-2.5-flash':   'gemini',
}

function normalizeModelName(name) {
  if (!name) return name
  const lower = name.toLowerCase().trim()
  return MODEL_NAME_MAP[lower] || MODEL_NAME_MAP[name] || name
}

// --- Core task processor --------------------------------------------------

async function processTask(filename) {
  const filePath = path.join(INBOX_DIR, filename)
  if (!fs.existsSync(filePath)) return

  // Extract task ID from filename: task_001.md → task_001
  const taskId = filename.replace(/\.md$/, '')
  const outboxFile = path.join(OUTBOX_DIR, `${taskId}_complete.md`)
  const contextFile = path.join(TMP_DIR, `ares_context_${taskId}.md`)

  console.log(`\n🔔 Task received: ${filename}`)

  const taskContent = fs.readFileSync(filePath, 'utf8')
  const { title, priority, assignee, initiator, workerType, researchFiles } = parseTaskMetadata(taskContent)
  const supervisorFeedbackFromTask = (taskContent.match(/^\*\*SupervisorFeedback[^:]*\*\*:\s*(.+)/im) || [])[1]?.trim() || ''

  // Route to best model — explicit 'claude' tag skips picker
  const taskType    = parseTaskType(taskContent)
  const contextSize = taskContent.length / 4  // rough token estimate

  let routedModel
  if (workerType === 'claude') {
    routedModel = CLAUDE_OLLAMA_MODEL
  } else if (workerType === 'gemini') {
    routedModel = 'gemini'  // resolved to GEMINI_MODEL at call time
  } else if (workerType !== 'ollama') {
    // explicit model name in task file — normalize bare names then honor it directly
    routedModel = routeModel({ taskType, contextSize, priority, forceModel: normalizeModelName(workerType) })
  } else {
    // Ask qwen3 Agent Picker first, fall back to rule-based routeModel()
    const pickerChoice = await agentPicker({ taskType, taskTitle: title, taskContent, priority, contextSize })
    routedModel = pickerChoice || routeModel({ taskType, contextSize, priority })
  }

  console.log(`   Title:    ${title}`)
  console.log(`   Priority: ${priority} | Assignee: ${assignee} | From: ${initiator}`)

  // 1. Write to Firestore (pending)
  try {
    await createTask(taskId, { title, priority, assignee, initiator, source: 'agent_inbox' })
    console.log(`   📝 Firestore: task created (pending)`)
  } catch (err) {
    console.warn(`   [Firestore] createTask failed: ${err.message}`)
  }

  // 2. Set agent state → working
  const activeModel = routedModel
  console.log(`   Worker: ${activeModel} (taskType: ${taskType}, routed from: ${workerType})`)
  try {
    await updateAgentState('claude-terminal', {
      agentId: 'claude-terminal',
      model: activeModel,
      status: 'working',
      currentTask: taskId,
      tier: 'worker',
    })
    console.log(`   📝 Firestore: agent_state updated (working)`)
  } catch (err) {
    console.warn(`   [Firestore] updateAgentState failed: ${err.message}`)
  }

  // 3. Build context packet
  console.log('   🧠 Loading context packet...')
  let contextPacket = ''
  try {
    contextPacket = await buildContextPacket(taskId)
    fs.writeFileSync(contextFile, contextPacket, 'utf8')
    console.log(`   ✅ Context written to ${contextFile}`)
  } catch (err) {
    console.warn(`   [Context] Build failed: ${err.message}`)
    contextPacket = `[Context load failed: ${err.message}]`
    fs.writeFileSync(contextFile, contextPacket, 'utf8')
  }

  // 4. Update Firestore → in_progress
  try {
    await updateTask(taskId, { status: 'in_progress' })
    console.log(`   📝 Firestore: task status → in_progress`)
  } catch (err) {
    console.warn(`   [Firestore] updateTask failed: ${err.message}`)
  }

  // 5. RESEARCH phase — query knowledge base before first draft
  console.log('\n   🔬 Phase: RESEARCH (querying knowledge base...)')
  const researchNotes = await runResearchPhase(taskContent, taskId)

  // 5b. Invoke Worker — route debate tasks to brainstorm.js, else ollama/claude
  console.log('   📝 Phase: DRAFT (invoking worker...)')
  try { await updateTask(taskId, { currentPhase: 'draft' }) } catch {}

  let workerSuccess = false

  if (taskType === 'debate') {
    // Extract topic from task content (uses **Topic**: field or falls back to title)
    const topic   = (taskContent.match(/^\*\*Topic\*\*:\s*(.+)/im) || [])[1]?.trim() || title
    const project = (taskContent.match(/^\*\*Project\*\*:\s*(.+)/im) || [])[1]?.trim() || 'ares'

    console.log(`\n🎭 Debate task → brainstorm.js`)
    console.log(`   Topic:   ${topic}`)
    console.log(`   Project: ${project}`)

    try {
      spawnSync('node', [
        path.join(__dirname, 'brainstorm.js'),
        topic,
        '--project', project,
      ], {
        stdio: 'inherit',
        env: { ...process.env, ARES_TASK_ID: taskId },
      })

      // Check output file was created
      const debateDir = path.join(__dirname, `../../knowledge/debates/${project}`)
      const today     = new Date().toISOString().slice(0, 10)
      const files     = fs.existsSync(debateDir)
        ? fs.readdirSync(debateDir).filter(f => f.startsWith(today))
        : []

      workerSuccess = files.length > 0
      if (workerSuccess) {
        fs.writeFileSync(outboxFile, `Debate complete. Output: knowledge/debates/${project}/${files[0]}`, 'utf8')
      }
    } catch (err) {
      console.error(`[debate] brainstorm.js error: ${err.message}`)
    }
  } else if (workerType === 'claude') {
    // claude-sonnet-4-6 via Ollama native Anthropic API (v0.14+)
    // Falls back to cloud claude CLI if ANTHROPIC_BASE_URL not set
    console.log(`\n🤖 Routing to ${CLAUDE_OLLAMA_MODEL} (Ollama-native or cloud fallback)...\n`)
    try {
      await runOllamaWorker(taskContent, contextPacket, outboxFile, supervisorFeedbackFromTask, researchFiles, CLAUDE_OLLAMA_MODEL, researchNotes)
      workerSuccess = true
    } catch (err) {
      console.warn(`   [claude-ollama] failed: ${err.message} — falling back to claude CLI`)
      const prompt = [
        `First, read and internalize the Agent Context Packet at: ${contextFile}`,
        `Then read and execute the task instructions at: ${filePath}`,
        `When finished, create a summary file at: ${outboxFile}`,
        `detailing what you did, what decisions were made, and any follow-up recommendations.`,
        `Rules from the context packet are always in effect. Do not skip any step.`,
      ].join('\n')
      try {
        execSync(`claude ${JSON.stringify(prompt)}`, {
          stdio: 'inherit',
          env: { ...process.env, ARES_TASK_ID: taskId },
        })
        workerSuccess = true
      } catch (err2) {
        console.error(`\n❌ Claude execution error: ${err2.message}`)
      }
    }
  } else if (routedModel === 'gemini' || routedModel?.startsWith('gemini-')) {
    console.log(`\n🌟 Routing to Gemini (${routedModel})...\n`)
    try {
      await runGeminiWorker(taskContent, contextPacket, outboxFile, supervisorFeedbackFromTask, routedModel)
      workerSuccess = true
    } catch (err) {
      console.error(`\n❌ Gemini Worker error: ${err.message}`)
    }
  } else {
    // Default: local Ollama Worker — Actor-Critic loop if enabled, single-shot if not
    try {
      if (ACTOR_CRITIC_ENABLED) {
        await runActorCriticLoop(taskContent, contextPacket, outboxFile, researchFiles, supervisorFeedbackFromTask, routedModel, researchNotes)
      } else {
        await runOllamaWorker(taskContent, contextPacket, outboxFile, supervisorFeedbackFromTask, researchFiles, routedModel, researchNotes)
      }
      workerSuccess = true
    } catch (err) {
      console.error(`\n❌ Ollama Worker error: ${err.message}`)
    }
  }

  // 6. Read outbox result
  let resultExcerpt = '(no result file found)'
  let workerResultFull = ''
  if (fs.existsSync(outboxFile)) {
    workerResultFull = fs.readFileSync(outboxFile, 'utf8')
    resultExcerpt = workerResultFull.slice(0, 500) // first 500 chars for Firestore
    console.log(`\n✅ Result file found: ${outboxFile}`)
  } else {
    console.warn(`\n⚠️  No result file at ${outboxFile}`)
  }

  // 6b. Supervisor review (gemma3:12b) — only if Worker succeeded and produced output
  const retryCount = parseInt(taskContent.match(/^\*\*RetryCount\*\*:\s*(\d+)/im)?.[1] || '0', 10)
  let supervisorDecision = { decision: 'APPROVED', reason: 'worker failed — skip review', feedback: '' }

  if (workerSuccess && workerResultFull) {
    console.log('\n   🧐 Phase: SUPERVISOR (reviewing...)')
    console.log('\n🧐 Supervisor reviewing Worker output (gemma3:12b)...')
    try {
      await updateTask(taskId, { status: 'supervisor_review' })
      console.log('   📝 Firestore: task status → supervisor_review')
    } catch (err) {
      console.warn(`   [Firestore] supervisor_review update failed: ${err.message}`)
    }

    supervisorDecision = await runSupervisor(taskId, workerResultFull, taskContent)
    console.log(`   🧐 Supervisor decision: ${supervisorDecision.decision} — ${supervisorDecision.reason}`)

    if (supervisorDecision.decision === 'REJECTED') {
      const newRetryCount = retryCount + 1
      console.log(`\n🔁 Supervisor REJECTED (retry ${newRetryCount}/${SUPERVISOR_MAX_RETRIES})`)

      if (newRetryCount >= SUPERVISOR_MAX_RETRIES) {
        // Max retries hit — escalate to human
        console.log('   ⚠️  Max retries reached — escalating to human')
        try {
          await updateTask(taskId, {
            status: 'escalated',
            supervisorFeedback: supervisorDecision.feedback,
            retryCount: newRetryCount,
            resultExcerpt,
          })
          console.log('   📝 Firestore: task status → escalated (max retries)')
        } catch (err) {
          console.warn(`   [Firestore] escalated update failed: ${err.message}`)
        }
      } else {
        // Re-queue to inbox with feedback appended
        const feedbackBlock = [
          '',
          '---',
          `**SupervisorFeedback (retry ${newRetryCount}):** ${supervisorDecision.feedback}`,
          `**RetryCount:** ${newRetryCount}`,
        ].join('\n')
        const retryFilename = filename.replace(/\.md$/, `_retry${newRetryCount}.md`)
        const retryPath = path.join(INBOX_DIR, retryFilename)
        fs.writeFileSync(retryPath, taskContent + feedbackBlock, 'utf8')
        console.log(`   📥 Re-queued to inbox: ${retryFilename}`)

        try {
          await updateTask(taskId, {
            status: 'supervisor_rejected',
            supervisorFeedback: supervisorDecision.feedback,
            retryCount: newRetryCount,
            resultExcerpt,
          })
          console.log('   📝 Firestore: task status → supervisor_rejected')
        } catch (err) {
          console.warn(`   [Firestore] supervisor_rejected update failed: ${err.message}`)
        }
      }

      // Skip normal "complete" path — task is re-queued or escalated
      // Set agent state → idle, run cleanup, then return early
      try {
        await updateAgentState('claude-terminal', { status: 'idle', currentTask: null })
      } catch (err) {
        console.warn(`   [Firestore] updateAgentState idle failed: ${err.message}`)
      }
      if (fs.existsSync(contextFile)) fs.unlinkSync(contextFile)
      console.log('\n🔍 Checking backup status...')
      await runBackupIfNeeded()
      const archiveDir = path.join(INBOX_DIR, 'archive')
      if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir)
      if (fs.existsSync(filePath)) fs.renameSync(filePath, path.join(archiveDir, filename))
      console.log(`\n📁 Task archived: agent_inbox/archive/${filename}`)
      console.log(`── Task ${taskId} REJECTED by supervisor (retry ${newRetryCount}/${SUPERVISOR_MAX_RETRIES}) ──\n`)
      return
    }
  }

  // 7. Supervisor APPROVED (or worker failed) — update Firestore → complete/failed
  const finalStatus = workerSuccess ? 'complete' : 'failed'
  try {
    await updateTask(taskId, {
      status: finalStatus,
      resultExcerpt,
      supervisorFeedback: supervisorDecision.reason,
      retryCount,
    })
    console.log(`   📝 Firestore: task status → ${finalStatus} (supervisor: ${supervisorDecision.decision})`)
  } catch (err) {
    console.warn(`   [Firestore] final updateTask failed: ${err.message}`)
  }

  // 8. Set agent state → idle
  try {
    await updateAgentState('claude-terminal', { status: 'idle', currentTask: null })
    console.log(`   📝 Firestore: agent_state → idle`)
  } catch (err) {
    console.warn(`   [Firestore] updateAgentState idle failed: ${err.message}`)
  }

  // 9. Cleanup temp context file
  if (fs.existsSync(contextFile)) fs.unlinkSync(contextFile)

  // 10. Check backup triggers
  console.log('\n🔍 Checking backup status...')
  await runBackupIfNeeded()

  // 11. Archive task file
  const archiveDir = path.join(INBOX_DIR, 'archive')
  if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir)
  if (fs.existsSync(filePath)) fs.renameSync(filePath, path.join(archiveDir, filename))
  console.log(`\n📁 Task archived: agent_inbox/archive/${filename}`)
  console.log(`── Task ${taskId} complete ──\n`)
}

// --- Startup: drain inbox then watch -------------------------------------

console.log('\n🤖 ARES Agent Connector (Hybrid LLM)')
console.log(`Inbox:  ${INBOX_DIR}`)
console.log(`Outbox: ${OUTBOX_DIR}`)
console.log(`Worker (default): ${WORKER_MODEL} (Ollama) | Worker (explicit): claude-sonnet-4-6`)
console.log(`Supervisor: ${SUPERVISOR_MODEL} | Max retries: ${SUPERVISOR_MAX_RETRIES}`)
console.log(`Tag **Worker**: claude in task file to route to Claude.\n`)
console.log(`Gemini: ${GEMINI_MODEL} (GEMINI_API_KEY ${process.env.GEMINI_API_KEY ? 'set' : 'NOT SET — add to .env.local'})`)

const existingTasks = fs.readdirSync(INBOX_DIR).filter((f) => f.endsWith('.md'))
if (existingTasks.length > 0) {
  console.log(`📦 ${existingTasks.length} task(s) queued on startup — processing...`)
  ;(async () => {
    for (const f of existingTasks) await processTask(f)
  })()
} else {
  console.log('⏳ Waiting for tasks...')
}

fs.watch(INBOX_DIR, (eventType, filename) => {
  if (eventType === 'rename' && filename && filename.endsWith('.md')) {
    const fullPath = path.join(INBOX_DIR, filename)
    if (fs.existsSync(fullPath)) {
      processTask(filename).catch((err) => {
        console.error(`[connector] processTask error: ${err.message}`)
      })
    }
  }
})
