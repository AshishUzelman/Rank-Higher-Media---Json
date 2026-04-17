# ARES Supervisor Pattern Implementation Plan

**Goal:** After the Claude Worker writes its result to `agent_outbox/`, gemma3:12b automatically reviews it (APPROVED → continue to Firestore, REJECTED → re-queue to inbox with feedback, max 3 retries).

**Files to modify:**
- `scripts/agent_connector.js` — add `runSupervisor()` + loop logic
- `src/lib/firebase/schema.js` — add `supervisor_review` / `supervisor_rejected` statuses

---

## Task 1: Update schema.js — add new task statuses

**File:** `src/lib/firebase/schema.js`

- [ ] **Step 1:** In schema.js, update the `status` comment for the `tasks` collection:

Replace:
```
 * - status: 'pending' | 'in-progress' | 'complete' | 'escalated'
```
With:
```
 * - status: 'pending' | 'in-progress' | 'complete' | 'escalated' | 'supervisor_review' | 'supervisor_rejected'
 * - retryCount: number  (0–3, incremented on each REJECTED loop; at 3 → escalated to human)
 * - supervisorFeedback: string | null  (gemma3:12b feedback on REJECTED tasks)
```

- [ ] **Step 2:** Commit
```bash
git add src/lib/firebase/schema.js
git commit -m "feat(supervisor): add supervisor_review + supervisor_rejected task statuses to schema"
```

---

## Task 2: Add runSupervisor() to agent_connector.js

**File:** `scripts/agent_connector.js`

- [ ] **Step 1:** Add require for memory_config at the top, after the existing requires:

After the line:
```js
const { buildContextPacket } = require('./load_context')
```
Add:
```js
const { SUPERVISOR_MODEL, SUPERVISOR_MAX_RETRIES, OLLAMA_URL: CONFIG_OLLAMA_URL } = require('./memory_config')
```

- [ ] **Step 2:** Add `runSupervisor()` function after the `runBackupIfNeeded()` function (before `processTask`):

```js
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
```

- [ ] **Step 3:** Commit
```bash
git add scripts/agent_connector.js
git commit -m "feat(supervisor): add runSupervisor() calling gemma3:12b via Ollama"
```

---

## Task 3: Wire supervisor into processTask() loop

**File:** `scripts/agent_connector.js`

The insertion point is **after** step 6 (read outbox result) and **before** step 7 (final Firestore update → complete/failed).

- [ ] **Step 1:** Replace the block from step 6 through step 7 in `processTask()`.

Find the existing block:
```js
  // 6. Read outbox result
  let resultExcerpt = '(no result file found)'
  if (fs.existsSync(outboxFile)) {
    const result = fs.readFileSync(outboxFile, 'utf8')
    resultExcerpt = result.slice(0, 500) // first 500 chars for Firestore
    console.log(`\n✅ Result file found: ${outboxFile}`)
  } else {
    console.warn(`\n⚠️  No result file at ${outboxFile}`)
  }

  // 7. Update Firestore → complete (or failed)
  const finalStatus = claudeSuccess ? 'complete' : 'failed'
  try {
    await updateTask(taskId, { status: finalStatus, resultExcerpt })
    console.log(`   📝 Firestore: task status → ${finalStatus}`)
  } catch (err) {
    console.warn(`   [Firestore] final updateTask failed: ${err.message}`)
  }
```

Replace with:
```js
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

  // 6b. Supervisor review (gemma3:12b) — only if Worker succeeded
  const retryCount = parseInt(taskContent.match(/^\*\*RetryCount\*\*:\s*(\d+)/im)?.[1] || '0', 10)
  let supervisorDecision = { decision: 'APPROVED', reason: 'worker failed — skip review', feedback: '' }

  if (claudeSuccess && workerResultFull) {
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

      // Skip the normal "complete" path — task is re-queued or escalated
      // Jump to cleanup
      if (fs.existsSync(contextFile)) fs.unlinkSync(contextFile)
      console.log('\n🔍 Checking backup status...')
      await runBackupIfNeeded()
      const archiveDir = path.join(INBOX_DIR, 'archive')
      if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir)
      fs.renameSync(filePath, path.join(archiveDir, filename))
      console.log(`\n📁 Task archived: agent_inbox/archive/${filename}`)
      console.log(`── Task ${taskId} REJECTED by supervisor (retry ${retryCount + 1}) ──\n`)
      return
    }
  }

  // 7. Supervisor APPROVED (or worker failed) — update Firestore → complete/failed
  const finalStatus = claudeSuccess ? 'complete' : 'failed'
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
```

- [ ] **Step 2:** Commit
```bash
git add scripts/agent_connector.js
git commit -m "feat(supervisor): wire supervisor review loop into processTask() — APPROVED/REJECTED/escalate"
```

---

## Task 4: Update header comment in agent_connector.js

Update the top comment block to reflect the new flow.

- [ ] **Step 1:** Replace the old flow comment:

Find:
```js
 * Per-task flow:
 *  1. Detect task file → parse task ID and metadata
 *  2. Write task to Firestore (status: pending)
 *  3. Update agent_state: claude-terminal → working
 *  4. Load Agent Context Packet (soul files + Firestore memory)
 *  5. Write context to temp file
 *  6. Update Firestore: status → in_progress
 *  7. Invoke Claude Code with context + task
 *  8. Read outbox result
 *  9. Update Firestore: status → complete, save result excerpt
 * 10. Update agent_state: claude-terminal → idle
 * 11. Check backup triggers (>24h since last save OR ≥10 tasks since last save)
 * 12. Run save_to_drive.js if backup is needed
 * 13. Archive task file
```

Replace with:
```js
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
```

- [ ] **Step 2:** Commit
```bash
git add scripts/agent_connector.js
git commit -m "docs(supervisor): update agent_connector.js flow comment to include supervisor step"
```

---

## Task 5: Build verification

- [ ] **Step 1:** Syntax check — no build step for Node scripts, use node --check:
```bash
node --check scripts/agent_connector.js && echo "syntax OK"
node --check scripts/memory_config.js && echo "syntax OK"
```
Expected: `syntax OK` for both.

- [ ] **Step 2:** Next.js build still clean (schema.js is imported by dashboard):
```bash
PATH="/opt/homebrew/bin:/usr/local/bin:$PATH" npm run build
```
Expected: `✓ Compiled successfully`

- [ ] **Step 3:** Final commit if anything unstaged
```bash
git status
```
