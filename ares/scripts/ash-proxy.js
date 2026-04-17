#!/usr/bin/env node
/**
 * Ash Code Proxy
 * Bridges Claude Code (Anthropic API format) → Ollama (native format)
 * No npm packages needed — pure Node.js built-ins only
 *
 * Usage:
 *   node scripts/ash-proxy.js
 *   # then in another terminal:
 *   ANTHROPIC_BASE_URL=http://localhost:4000 ANTHROPIC_API_KEY=ollama claude
 */

'use strict'
const http = require('http')

const OLLAMA_HOST  = '127.0.0.1'
const OLLAMA_PORT  = 11434
const PROXY_PORT   = parseInt(process.env.PORT || '4000')
const TARGET_MODEL = process.env.ASH_MODEL || 'qwen3:30b-a3b'

console.log(`\n🔥 Ash Code Proxy`)
console.log(`   Local model:  ${TARGET_MODEL}`)
console.log(`   Proxy port:   ${PROXY_PORT}`)
console.log(`   Ollama:       http://${OLLAMA_HOST}:${OLLAMA_PORT}\n`)

// ── Helpers ───────────────────────────────────────────────────────────────────

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => data += chunk)
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}) }
      catch (e) { reject(new Error('Invalid JSON body')) }
    })
    req.on('error', reject)
  })
}

// Convert Anthropic messages array + system string → Ollama messages array
function toOllamaMessages(messages = [], system = '') {
  const result = []
  if (system) result.push({ role: 'system', content: system })
  for (const msg of messages) {
    const content = Array.isArray(msg.content)
      ? msg.content.map(c => c.text || c.content || '').join('')
      : (msg.content || '')
    result.push({ role: msg.role, content })
  }
  return result
}

// Stream Ollama /api/chat response → Anthropic SSE format
function streamResponse(ollamaRes, res) {
  return new Promise((resolve, reject) => {
    const msgId = `msg_${Date.now()}`

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',
    })

    const send = (event, data) =>
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)

    send('message_start', {
      type: 'message_start',
      message: {
        id: msgId, type: 'message', role: 'assistant',
        content: [], model: 'claude-sonnet-4-6',
        stop_reason: null, stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 0 },
      },
    })
    send('content_block_start', {
      type: 'content_block_start', index: 0,
      content_block: { type: 'text', text: '' },
    })
    send('ping', { type: 'ping' })

    let buffer = ''
    let outputTokens = 0

    ollamaRes.on('data', chunk => {
      buffer += chunk.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop()

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const obj = JSON.parse(line)
          const text = obj.message?.content || ''
          if (text) {
            outputTokens++
            send('content_block_delta', {
              type: 'content_block_delta', index: 0,
              delta: { type: 'text_delta', text },
            })
          }
          if (obj.done) {
            send('content_block_stop', { type: 'content_block_stop', index: 0 })
            send('message_delta', {
              type: 'message_delta',
              delta: { stop_reason: 'end_turn', stop_sequence: null },
              usage: { output_tokens: obj.eval_count || outputTokens },
            })
            send('message_stop', { type: 'message_stop' })
            res.end()
            resolve()
          }
        } catch { /* skip non-JSON lines */ }
      }
    })

    ollamaRes.on('error', err => { res.end(); reject(err) })
    ollamaRes.on('close', () => { if (!res.writableEnded) res.end(); resolve() })
  })
}

// ── Server ────────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  // Health check
  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end(`Ash Proxy OK — routing to ${TARGET_MODEL}`)
    return
  }

  if (req.method !== 'POST') {
    res.writeHead(405)
    res.end('Method not allowed')
    return
  }

  try {
    const body = await readBody(req)

    const ollamaBody = JSON.stringify({
      model:    TARGET_MODEL,
      messages: toOllamaMessages(body.messages, body.system),
      stream:   true,
      options:  { num_ctx: 32768, temperature: 0.7 },
    })

    const options = {
      hostname: OLLAMA_HOST,
      port:     OLLAMA_PORT,
      path:     '/api/chat',
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(ollamaBody),
      },
    }

    const ollamaReq = http.request(options, async ollamaRes => {
      if (ollamaRes.statusCode !== 200) {
        let err = ''
        ollamaRes.on('data', d => err += d)
        ollamaRes.on('end', () => {
          console.error('[proxy] Ollama error:', err.slice(0, 200))
          res.writeHead(ollamaRes.statusCode, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: err } }))
        })
        return
      }
      await streamResponse(ollamaRes, res)
    })

    ollamaReq.on('error', err => {
      console.error('[proxy] Cannot reach Ollama:', err.message)
      res.writeHead(503, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        type: 'error',
        error: { type: 'api_error', message: `Ollama not reachable on port ${OLLAMA_PORT}. Is it running?` },
      }))
    })

    ollamaReq.write(ollamaBody)
    ollamaReq.end()

  } catch (err) {
    console.error('[proxy] Error:', err.message)
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ type: 'error', error: { type: 'invalid_request_error', message: err.message } }))
  }
})

server.listen(PROXY_PORT, '127.0.0.1', () => {
  console.log(`✅ Ready. In a new terminal run:\n`)
  console.log(`   ANTHROPIC_BASE_URL=http://localhost:${PROXY_PORT} ANTHROPIC_API_KEY=ollama claude\n`)
})
