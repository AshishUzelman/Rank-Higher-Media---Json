#!/usr/bin/env node
/**
 * ARES YouTube Pipeline
 *
 * Takes a YouTube URL → extracts transcript via yt-dlp → summarizes with qwen3
 * → saves structured knowledge to Firestore + local knowledge/ directory.
 *
 * Usage:
 *   node scripts/youtube_ingest.js --url "https://www.youtube.com/watch?v=XXXX" --tags "ai,tools"
 */

const { execSync } = require('child_process')
const fs   = require('fs')
const path = require('path')

const ROOT         = path.join(__dirname, '..')
const KNOWLEDGE_DIR = path.join(ROOT, 'knowledge')
const OLLAMA_URL   = process.env.OLLAMA_URL || 'http://localhost:11434'

// --- CLI args ---
const args = process.argv.slice(2)
function getArg(flag) {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : null
}

const url  = getArg('--url')
const tags = getArg('--tags')?.split(',').map(t => t.trim()).filter(Boolean) || []

if (!url) {
  console.error('Usage: node scripts/youtube_ingest.js --url <youtube_url> [--tags tag1,tag2]')
  process.exit(1)
}

// --- Extract video ID ---
function extractVideoId(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)
  return match ? match[1] : null
}

const videoId = extractVideoId(url)
if (!videoId) {
  console.error('Error: Invalid YouTube URL — could not extract video ID')
  process.exit(1)
}

// --- Firebase init (same pattern as firestore-client.js) ---
function loadEnv() {
  const envPath = path.join(ROOT, '.env.local')
  if (!fs.existsSync(envPath)) return {}
  const env = {}
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx < 0) continue
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
  }
  return env
}

async function getDb() {
  const env = loadEnv()
  const config = {
    apiKey:            env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain:        env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId:         env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket:     env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId:             env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }
  const hasConfig = Object.values(config).every(Boolean)
  if (!hasConfig) throw new Error('Firebase credentials missing in .env.local')

  const { initializeApp, getApps } = await import('firebase/app')
  const { getFirestore }           = await import('firebase/firestore')
  const app = getApps().length ? getApps()[0] : initializeApp(config)
  return getFirestore(app)
}

// --- Main ---
async function main() {
  console.log('📺 YouTube Pipeline')
  console.log(`   URL: ${url}`)

  // Step 1: Extract transcript via yt-dlp
  const tmpDir = path.join(ROOT, '.yt-tmp')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)

  try {
    execSync(
      `yt-dlp --write-auto-sub --sub-lang en --skip-download --output "${path.join(tmpDir, videoId)}" "${url}"`,
      { stdio: 'pipe' }
    )
  } catch (e) {
    console.error('❌ yt-dlp failed. Install with: brew install yt-dlp')
    process.exit(1)
  }

  const transcriptFile = [`${videoId}.en.vtt`, `${videoId}.en.ttml`]
    .map(f => path.join(tmpDir, f))
    .find(f => fs.existsSync(f))

  if (!transcriptFile) {
    console.warn(`⚠️  No transcript found for ${videoId} — video may not have captions`)
    process.exit(0)
  }

  // Step 2: Clean transcript — strip VTT timestamps and formatting
  const raw = fs.readFileSync(transcriptFile, 'utf8')
  const cleaned = raw
    .split('\n')
    .filter(line =>
      !/^\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}/.test(line) &&
      !/^WEBVTT/.test(line) &&
      !/^Kind:/.test(line) &&
      !/^Language:/.test(line) &&
      line.trim() !== ''
    )
    // Remove VTT inline tags like <00:00:01.234><c>text</c>
    .map(line => line.replace(/<[^>]+>/g, '').trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  const transcript = cleaned.length > 8000 ? cleaned.slice(0, 8000) : cleaned
  console.log(`   ✅ Transcript extracted (~${Math.round(transcript.length / 5)} words)`)

  // Step 3: Summarize with qwen3
  console.log('   🤖 Summarizing with qwen3...')
  const prompt = `You are a knowledge extraction agent. Summarize this YouTube video transcript into structured intelligence.

Transcript:
${transcript}

Output JSON with this exact structure:
{
  "title": "inferred video title",
  "summary": "2-3 sentence overview",
  "key_points": ["point 1", "point 2"],
  "action_items": ["what to build or try"],
  "ares_relevance": "how this applies to ARES or Ashish's projects (1-2 sentences)",
  "tags": ["tag1", "tag2"],
  "source_url": "${url}"
}`

  const ollamaResp = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'qwen3:30b-a3b', prompt, format: 'json', stream: false, options: { temperature: 0.1 } }),
    signal: AbortSignal.timeout(120000),
  })

  if (!ollamaResp.ok) throw new Error(`Ollama error: ${ollamaResp.status}`)
  const ollamaData = await ollamaResp.json()
  const summary = JSON.parse(ollamaData.response)
  console.log('   ✅ Summary generated')

  // Step 4: Save to Firestore
  try {
    const db = await getDb()
    const { collection, addDoc } = await import('firebase/firestore')
    const docRef = await addDoc(collection(db, 'knowledge_base'), {
      type:          'youtube',
      url,
      videoId,
      title:         summary.title,
      summary:       summary.summary,
      key_points:    summary.key_points,
      action_items:  summary.action_items,
      ares_relevance: summary.ares_relevance,
      tags:          [...tags, ...( summary.tags || []), 'youtube'],
      ingestedAt:    new Date().toISOString(),
      wordCount:     Math.round(transcript.length / 5),
    })
    console.log(`   📝 Firestore: knowledge_base/${docRef.id} saved`)
  } catch (err) {
    console.warn(`   ⚠️  Firestore save failed: ${err.message} — continuing`)
  }

  // Step 5: Save to knowledge/ directory
  if (!fs.existsSync(KNOWLEDGE_DIR)) fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true })
  const date     = new Date().toISOString().split('T')[0]
  const fileName = `youtube_${videoId}_${date}.md`
  const mdPath   = path.join(KNOWLEDGE_DIR, fileName)

  const markdown = `# ${summary.title}

**Source:** ${url}
**Date:** ${date}
**Tags:** ${[...tags, ...(summary.tags || [])].join(', ')}

## Summary
${summary.summary}

## Key Points
${summary.key_points.map(p => `- ${p}`).join('\n')}

## Action Items
${summary.action_items.map(a => `- ${a}`).join('\n')}

## ARES Relevance
${summary.ares_relevance}
`
  fs.writeFileSync(mdPath, markdown)
  console.log(`   📁 knowledge/${fileName} saved`)

  // Cleanup
  fs.unlinkSync(transcriptFile)
  try { fs.rmdirSync(tmpDir) } catch { /* not empty — ok */ }

  console.log('   🎉 Done')
}

main().catch(err => {
  console.error('❌ YouTube pipeline failed:', err.message)
  process.exit(1)
})
