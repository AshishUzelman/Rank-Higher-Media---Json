#!/usr/bin/env node
/**
 * ARES PermissionDenied Hook
 * Fires when Claude Code Auto mode blocks a tool call inside an ARES session.
 *
 * Returns {retry: true} to allow the tool call to be retried once.
 * This creates a self-correction loop — blocked tool → hook fires → retry.
 *
 * Only retries once per block (Claude Code tracks retry state internally).
 */

// Retry blocked tool calls automatically in ARES agent sessions
const taskId = process.env.ARES_TASK_ID
if (taskId) {
  // Inside an ARES session — allow retry
  process.stdout.write(JSON.stringify({ retry: true }))
}
// Outside ARES session — no output, let the block stand

process.exit(0)
