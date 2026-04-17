#!/usr/bin/env node
/**
 * ARES MCP Server — Ollama Integration
 * Exposes local LLMs (Qwen, Gemma) as tools
 *
 * Usage:
 *   node ollama-mcp.js --prompt "Build X" --model qwen
 *   node ollama-mcp.js --task-file task_name.md --model gemma
 */

const fs = require('fs');
const path = require('path');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'qwen3:30b-a3b';

// Parse CLI args
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  let positionalArgs = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      opts[key] = args[i + 1] || true;
      i++;
    } else {
      positionalArgs.push(args[i]);
    }
  }
  opts._ = positionalArgs;
  return opts;
}

// Load context from ARES files
function loadContext() {
  const contextParts = [];

  // Load schema
  const schemaPath = path.join(__dirname, '../src/lib/firebase/schema.js');
  if (fs.existsSync(schemaPath)) {
    contextParts.push(`## Current Firestore Schema\n\n\`\`\`javascript\n${fs.readFileSync(schemaPath, 'utf8')}\n\`\`\``);
  }

  // Load soul files for ARES conventions
  const soulPath = path.join(__dirname, '../../SOUL_ARES.md');
  if (fs.existsSync(soulPath)) {
    contextParts.push(`## ARES Architecture Rules\n\n${fs.readFileSync(soulPath, 'utf8')}`);
  }

  return contextParts.join('\n\n---\n\n');
}

// Build system prompt
function buildSystemPrompt(model) {
  const isGemma = model.includes('gemma');
  const isSupervisor = isGemma;

  if (isSupervisor) {
    return `You are Gemma, the ARES Supervisor. Review code quality, performance, and architecture.
- Check for N+1 queries, memory leaks, security issues
- Verify Firebase patterns match ARES conventions
- Give clear approval/rejection with actionable feedback
- Be concise but thorough`;
  }

  return `You are Qwen, the ARES Worker. Build code that solves the task.
- Write JavaScript only (no TypeScript)
- Follow ARES conventions (Firebase patterns, component structure)
- Include error handling and comments
- Make code ready to run immediately
- Full file content always (no // continues stubs)`;
}

// Stream from Ollama
async function askOllama(prompt, model = DEFAULT_MODEL) {
  const systemPrompt = buildSystemPrompt(model);
  const context = loadContext();

  const fullPrompt = `${systemPrompt}\n\n---\n\n${context}\n\n---\n\n## Task\n\n${prompt}`;

  console.log(`[ares-ask] Model: ${model}`);
  console.log(`[ares-ask] Streaming response...\n`);

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: fullPrompt,
        stream: true,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 4096,
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Ollama error ${response.status}: ${err}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value);
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line) continue;
        try {
          const chunk = JSON.parse(line);
          if (chunk.response) {
            process.stdout.write(chunk.response);
          }
          if (chunk.done) {
            console.log('\n');
            return;
          }
        } catch (e) {
          // Skip malformed JSON
        }
      }
    }
  } catch (err) {
    console.error(`[ares-ask] Error:`, err.message);
    process.exit(1);
  }
}

// Main
async function main() {
  const opts = parseArgs();

  // Check Ollama is running
  try {
    const health = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!health.ok) throw new Error('Ollama not responding');
  } catch (err) {
    console.error(`[ares-ask] Ollama not running at ${OLLAMA_URL}`);
    console.error(`Start Ollama: ollama serve`);
    process.exit(1);
  }

  // Parse: model can be positional (qwen) or from --model flag
  // Remaining positional args are the prompt
  let model = opts.model || DEFAULT_MODEL;
  let prompt = opts.prompt || '';

  // If first positional arg is a model name, use it
  if (opts._ && opts._.length > 0) {
    const firstArg = opts._[0];
    const modelPrefix = firstArg.split(':')[0];
    // Check if it's a model (starts with qwen or gemma, or is the full model name)
    if (modelPrefix.startsWith('qwen') || modelPrefix.startsWith('gemma') ||
        ['qwen3:30b-a3b', 'gemma3:27b-it-qat', 'gemma3:12b', 'qwen2.5-coder:32b'].includes(firstArg)) {
      model = firstArg;
      prompt = opts._.slice(1).join(' ');
    } else {
      prompt = opts._.join(' ');
    }
  }

  // Or load from task file
  if (opts['task-file']) {
    const taskPath = path.join(__dirname, `../agent_inbox/${opts['task-file']}`);
    if (fs.existsSync(taskPath)) {
      prompt = fs.readFileSync(taskPath, 'utf8');
    } else {
      console.error(`Task file not found: ${taskPath}`);
      process.exit(1);
    }
  }

  if (!prompt) {
    console.error('Usage:');
    console.error('  npm run ares-ask qwen "Your task here"');
    console.error('  npm run ares-ask gemma --task-file task_name.md');
    console.error('  node scripts/ollama-mcp.js qwen "Build Firestore collections"');
    process.exit(1);
  }

  await askOllama(prompt, model);
}

main().catch(err => {
  console.error('[ares-ask]', err.message);
  process.exit(1);
});
