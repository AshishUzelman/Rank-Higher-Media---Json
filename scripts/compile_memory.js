// scripts/compile_memory.js
import { readFileSync, writeFileSync, existsSync } from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import { PATHS, LLM, PROMPTS } from './memory_config.js';

// --- Anthropic client singleton (instantiated once at module scope) ---
const anthropicClient = LLM.provider === 'claude' ? new Anthropic() : null;

// --- Pure helpers (exported for testing) ---

export function isTranscriptValid(transcript) {
  return typeof transcript === 'string' && transcript.length >= 500;
}

export function formatTranscript(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return '';
  return messages
    .map(m => {
      const content = typeof m.content === 'string'
        ? m.content
        : JSON.stringify(m.content);
      return `${m.role}: ${content}`;
    })
    .join('\n\n');
}

export function buildDraftSection(key, content) {
  return `## [${key}]\n${content.trim()}\n`;
}

// --- LLM call ---

async function callLLM(prompt) {
  if (LLM.provider === 'ollama') {
    const res = await fetch(`${LLM.ollama.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LLM.ollama.model,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
      }),
    });
    if (!res.ok) {
      throw new Error(`Ollama request failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return data.message?.content || '';
  }

  // Default: Claude API
  const msg = await anthropicClient.messages.create({
    model: LLM.claude.model,
    max_tokens: LLM.claude.maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  return msg.content[0].text;
}

// --- File reader (safe — returns empty string if missing) ---

function readFile(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

// --- Main ---

async function main() {
  // Read hook payload from stdin
  let payload;
  try {
    // Note: /dev/stdin is POSIX-only (macOS/Linux). This script targets macOS (M1 Mac).
    const stdin = readFileSync('/dev/stdin', 'utf8');
    payload = JSON.parse(stdin);
  } catch {
    console.error('[memory-compiler] Failed to read hook payload');
    process.exit(0); // Exit cleanly — don't block Claude Code
  }

  // Extract transcript
  const messages = payload?.transcript || payload?.messages || [];
  const transcript = formatTranscript(messages);

  if (!isTranscriptValid(transcript)) {
    console.log('[memory-compiler] Transcript too short — skipping compilation');
    process.exit(0);
  }

  console.log('[memory-compiler] Compiling memory...');

  const sections = [];

  try {
    // 1. rolling_summary
    const rollingSummaryContent = readFile(PATHS.rollingSummary);
    const summaryResult = await callLLM(PROMPTS.rollingSummary(rollingSummaryContent, transcript));
    sections.push(buildDraftSection('rolling_summary', summaryResult));

    // 2. CONTEXT
    const contextContent = readFile(PATHS.context);
    const contextResult = await callLLM(PROMPTS.context(contextContent, transcript));
    sections.push(buildDraftSection('CONTEXT', contextResult));

    // 3. PROJECT_STATUS
    const statusContent = readFile(PATHS.projectStatus);
    const statusResult = await callLLM(PROMPTS.projectStatus(statusContent, transcript));
    sections.push(buildDraftSection('PROJECT_STATUS', statusResult));

    // 4. Auto-memory files
    const memoryIndex = readFile(PATHS.autoMemoryIndex);
    const autoMemoryResult = await callLLM(PROMPTS.autoMemory(memoryIndex, transcript));

    let autoMemoryUpdates = [];
    try {
      // Strip markdown code fences if present (qwen/local LLMs often wrap JSON in ```json...```)
      const cleaned = autoMemoryResult.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
      autoMemoryUpdates = JSON.parse(cleaned);
    } catch {
      // LLM returned non-JSON — log and skip auto-memory
      console.error('[memory-compiler] Auto-memory LLM response was not valid JSON — skipping');
    }

    for (const update of autoMemoryUpdates) {
      if (!update?.filename || !update?.content) continue;
      sections.push(buildDraftSection(`auto-memory: ${update.filename}`, update.content));
    }

  } catch (err) {
    const errorSection = buildDraftSection('ERROR', `Memory compilation failed:\n${err.message}`);
    writeFileSync(PATHS.draft, errorSection);
    console.error('[memory-compiler] Error during compilation:', err.message);
    process.exit(0);
  }

  const draft = sections.join('\n---\n\n');
  writeFileSync(PATHS.draft, draft);
  console.log(`[memory-compiler] Draft written to memory_draft.md — run 'npm run approve' to review`);
}

// Only run main when executed directly (not when imported by tests)
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  main();
}
