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
    // All knowledge — walk up to 2 levels deep (handles knowledge/debates/ares/*.md)
    const walk = (dir, depth = 0) => {
      if (!fs.existsSync(dir)) return
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath)
        } else if (entry.isDirectory() && !entry.name.startsWith('.') && depth < 2) {
          walk(fullPath, depth + 1)
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
    } catch (e) { console.warn('[knowledge_retrieval] Skipped:', filePath, e.message) }
  }

  return scored
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxChunks)
}

module.exports = { retrieveKnowledge, KNOWLEDGE_ROOT }
