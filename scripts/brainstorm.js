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
  "status": "complete",
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

async function callOllama(model, systemPrompt, userPrompt, temperature = 0.4, numCtx = 32768, timeoutMs = 600000) {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      stream: true,
      options: { num_ctx: numCtx, temperature },
    }),
    signal: AbortSignal.timeout(timeoutMs),
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

// ── Strategist Agent ──────────────────────────────────────────────────────────

async function runStrategist(topic, expertProfile, round, priorContext = '') {
  console.log(`\n🎯 Strategist — Round ${round}/2...`)

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

  const systemPrompt = isFinalWord ? DA_FINAL_SYSTEM : DA_SYSTEM

  let prompt
  if (isFinalWord) {
    // Final word: no KB reload needed (already used in Round 1), short context
    prompt = [
      `## Strategist's Final Position\n${strategistOutput}`,
      `## Your Task`,
      'Give your final word in 2-3 short paragraphs only. Is the topic resolved? Any open questions? Be very brief.',
    ].join('\n\n')
  } else {
    const kb = loadProjectKnowledge(project)
    prompt = [
      `## Knowledge Base (project: ${project})\n${kb}`,
      `## Strategist's Position (Round ${round})\n${strategistOutput}`,
      `## Your Task`,
      'Research the KB first. Then fact-check and challenge the Strategist\'s position with evidence. End with concrete improvements.',
    ].join('\n\n')
  }

  // Final word uses smaller context window (brief response) and shorter timeout
  const numCtx   = isFinalWord ? 8192 : 32768
  const timeout  = isFinalWord ? 180000 : 600000 // 3 min vs 10 min
  const temp     = isFinalWord ? 0.3 : 0.6

  return callOllama(WORKER_MODEL, systemPrompt, prompt, temp, numCtx, timeout)
}

// ── Gemma 4 Cloud Synthesizer (free via Google AI Studio) ─────────────────────

async function callGemma4Cloud(prompt) {
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY not set')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemma-4-31b-it:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${SYNTHESIZER_SYSTEM}\n\n${prompt}` }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
      }),
      signal: AbortSignal.timeout(60000),
    }
  )

  if (!res.ok) {
    console.warn(`[gemma4-cloud] HTTP ${res.status} — falling back to local gemma3`)
    return callOllama(SUPERVISOR_MODEL, SYNTHESIZER_SYSTEM, prompt, 0.1)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  if (!text) {
    console.warn('[gemma4-cloud] No response — falling back to local gemma3')
    return callOllama(SUPERVISOR_MODEL, SYNTHESIZER_SYSTEM, prompt, 0.1)
  }
  return text
}

// ── Synthesizer Agent (gemma3) ────────────────────────────────────────────────

async function runSynthesizer(topic, fullTranscript) {
  console.log('\n⚖️  Synthesizer...')

  const prompt = `Topic under debate: "${topic}"\n\nComplete debate transcript:\n\n${fullTranscript}\n\nProduce your synthesis as JSON only. No other text.`

  let raw
  if (process.env.SYNTHESIZER_USE_CLOUD === '1' && GEMINI_KEY) {
    console.log('   Using Gemma 4 31B cloud synthesizer...')
    raw = await callGemma4Cloud(prompt)
  } else {
    raw = await callOllama(SUPERVISOR_MODEL, SYNTHESIZER_SYSTEM, prompt, 0.1)
  }

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

// ── CLI Entry Point ────────────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2)
  const topic = args[0]
  const projectIdx = args.indexOf('--project')
  const project = projectIdx !== -1 ? args[projectIdx + 1] : 'ares'

  if (!topic) {
    console.error('Usage: node scripts/brainstorm.js "topic" --project <project>')
    console.error('       npm run brainstorm -- "topic" --project ares')
    process.exit(1)
  }

  runBrainstorm({ topic, project }).catch(err => {
    console.error('[brainstorm] Fatal error:', err.message)
    process.exit(1)
  })
}

module.exports = {
  callOllama,
  callGemma4Cloud,
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
