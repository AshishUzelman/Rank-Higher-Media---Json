#!/usr/bin/env node
/**
 * ARES RSS Ingestor
 *
 * Fetches configured RSS/Atom feeds, summarizes new items with qwen3,
 * saves to knowledge/ directory + Firestore knowledge_base collection.
 *
 * Usage:
 *   node scripts/rss_ingest.js                      # all feeds in feeds.json
 *   node scripts/rss_ingest.js --feed <url>         # single feed
 *   node scripts/rss_ingest.js --limit 5            # max items per feed (default: 3)
 */

const fs   = require('fs')
const path = require('path')

const ROOT          = path.join(__dirname, '..')
const KNOWLEDGE_DIR = path.join(ROOT, 'knowledge')
const FEEDS_FILE    = path.join(__dirname, 'feeds.json')
const OLLAMA_URL    = process.env.OLLAMA_URL || 'http://localhost:11434'

// --- CLI args ---
const args = process.argv.slice(2)
function getArg(flag) {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : null
}
const singleFeed = getArg('--feed')
const limit      = parseInt(getArg('--limit') || '3', 10)

// --- Firebase init (same pattern as other scripts) ---
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
  if (!Object.values(config).every(Boolean)) return null
  const { initializeApp, getApps } = await import('firebase/app')
  const { getFirestore }           = await import('firebase/firestore')
  const app = getApps().length ? getApps()[0] : initializeApp(config)
  return getFirestore(app)
}

// --- XML parsing (no npm packages) ---
function extractAll(xml, tag) {
  const results = []
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi')
  let m
  while ((m = re.exec(xml)) !== null) results.push(m[1].trim())
  return results
}

function extractOne(xml, tag) {
  return extractAll(xml, tag)[0] || ''
}

function stripHtml(str) {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseItems(xml) {
  // Handle both RSS <item> and Atom <entry>
  const itemTag = xml.includes('<entry') ? 'entry' : 'item'
  const rawItems = extractAll(xml, itemTag)

  return rawItems.map(item => {
    const title = stripHtml(extractOne(item, 'title'))
    // Atom uses <link href="..."/> or <link>url</link>; RSS uses <link>url</link>
    const linkMatch = item.match(/<link[^>]*href=["']([^"']+)["']/) ||
                      item.match(/<link[^>]*>([^<]+)<\/link>/)
    const link    = linkMatch ? linkMatch[1].trim() : ''
    const pubDate = extractOne(item, 'pubDate') || extractOne(item, 'published') || extractOne(item, 'updated')
    const desc    = stripHtml(
      extractOne(item, 'description') ||
      extractOne(item, 'summary') ||
      extractOne(item, 'content')
    ).slice(0, 3000)

    return { title, link, pubDate, description: desc }
  }).filter(i => i.title && i.link)
}

// --- Slug + dedup ---
function slugify(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 40)
    .replace(/-+$/, '')
}

function alreadyProcessed(title) {
  if (!fs.existsSync(KNOWLEDGE_DIR)) return false
  const slug = slugify(title)
  return fs.readdirSync(KNOWLEDGE_DIR).some(f => f.includes(`rss_${slug}`))
}

// --- qwen3 summarization ---
async function summarizeItem(title, description, feedTags) {
  const prompt = `Summarize this article for an AI developer building agentic systems.

Title: ${title}
Content: ${description}

Output JSON:
{
  "summary": "2-3 sentence overview",
  "key_points": ["point 1", "point 2"],
  "action_items": ["what to try or build based on this"],
  "ares_relevance": "how this applies to ARES or local LLM development (1 sentence)",
  "tags": ["tag1", "tag2"]
}`

  const resp = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen3:30b-a3b',
      prompt,
      format: 'json',
      stream: false,
      options: { temperature: 0.1 },
    }),
    signal: AbortSignal.timeout(60000),
  })
  if (!resp.ok) throw new Error(`Ollama ${resp.status}`)
  const data = await resp.json()
  return JSON.parse(data.response)
}

// --- Save item ---
async function saveItem(item, summary, feedTags, db) {
  if (!fs.existsSync(KNOWLEDGE_DIR)) fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true })

  const date     = new Date().toISOString().split('T')[0]
  const slug     = slugify(item.title)
  const fileName = `rss_${slug}_${date}.md`
  const allTags  = [...new Set([...feedTags, ...(summary.tags || []), 'rss'])]

  const markdown = `# ${item.title}

**Source:** ${item.link}
**Date:** ${date}
**Tags:** ${allTags.join(', ')}

## Summary
${summary.summary}

## Key Points
${summary.key_points.map(p => `- ${p}`).join('\n')}

## Action Items
${summary.action_items.map(a => `- ${a}`).join('\n')}

## ARES Relevance
${summary.ares_relevance}
`
  fs.writeFileSync(path.join(KNOWLEDGE_DIR, fileName), markdown)

  if (db) {
    try {
      const { collection, addDoc } = await import('firebase/firestore')
      await addDoc(collection(db, 'knowledge_base'), {
        type:          'rss',
        url:           item.link,
        title:         item.title,
        summary:       summary.summary,
        key_points:    summary.key_points,
        action_items:  summary.action_items,
        ares_relevance: summary.ares_relevance,
        tags:          allTags,
        ingestedAt:    new Date().toISOString(),
      })
    } catch (err) {
      // Firestore failure is non-fatal
    }
  }

  return fileName
}

// --- Process one feed ---
async function processFeed(feedUrl, feedTags, db) {
  let xml
  try {
    const resp = await fetch(feedUrl, { signal: AbortSignal.timeout(10000) })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    xml = await resp.text()
  } catch (err) {
    console.warn(`   ⚠️  ${feedUrl} — fetch failed: ${err.message}`)
    return 0
  }

  const items = parseItems(xml).slice(0, limit)
  if (items.length === 0) {
    console.log(`   ℹ️  No items found in feed`)
    return 0
  }

  console.log(`   Feed: ${feedUrl} (${items.length} item(s) to check)`)
  let ingested = 0

  for (const item of items) {
    if (alreadyProcessed(item.title)) {
      console.log(`   ⏭️  ${item.title.slice(0, 60)} — already processed`)
      continue
    }
    try {
      const summary  = await summarizeItem(item.title, item.description, feedTags)
      const fileName = await saveItem(item, summary, feedTags, db)
      console.log(`   ✅ ${item.title.slice(0, 60)} → knowledge/${fileName}`)
      ingested++
    } catch (err) {
      console.warn(`   ⚠️  ${item.title.slice(0, 60)} — skipped: ${err.message}`)
    }
  }

  return ingested
}

// --- Main ---
async function main() {
  console.log('📡 RSS Ingest')

  const db = await getDb().catch(() => null)

  let feeds = []
  if (singleFeed) {
    feeds = [{ url: singleFeed, tags: ['rss'] }]
  } else {
    if (!fs.existsSync(FEEDS_FILE)) {
      console.error(`feeds.json not found at ${FEEDS_FILE}`)
      process.exit(1)
    }
    feeds = JSON.parse(fs.readFileSync(FEEDS_FILE, 'utf8'))
  }

  let totalIngested = 0
  for (const feed of feeds) {
    totalIngested += await processFeed(feed.url, feed.tags || [], db)
  }

  console.log(`\n🎉 Done — ${totalIngested} item(s) ingested`)
}

main().catch(err => {
  console.error('❌ RSS ingest failed:', err.message)
  process.exit(1)
})
