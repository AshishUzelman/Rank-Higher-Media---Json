#!/usr/bin/env node
/**
 * ARES Stop Hook
 * Fires when Claude finishes a response inside an ARES agent session.
 *
 * Reads the current task status from Firestore.
 * - If task is still 'in_progress' → return {continue: true} to keep Claude working
 * - If task is 'complete' / 'failed' / 'escalated' → let Claude stop (exit 0, no output)
 *
 * Claude Code reads stdout for hook decisions.
 * Returning {continue: true} forces another iteration.
 */

const { getTaskStatus } = require('./firestore-client')

async function main() {
  // TASK_ID is injected by agent_connector.js via env when spawning Claude
  const taskId = process.env.ARES_TASK_ID
  if (!taskId) {
    // Not running inside an ARES agent session — let Claude stop normally
    process.exit(0)
  }

  try {
    const status = await getTaskStatus(taskId)
    if (status === 'in_progress') {
      // Task not done — keep Claude working
      process.stdout.write(JSON.stringify({ continue: true }))
    }
    // Any other status (complete, failed, escalated, supervisor_review) → let Claude stop
  } catch (err) {
    // Firestore unreachable — don't block, let Claude stop
    process.stderr.write(`[stop_hook] Firestore check failed: ${err.message}\n`)
  }

  process.exit(0)
}

main()
