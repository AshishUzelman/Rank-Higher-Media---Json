#!/usr/bin/env node
/**
 * Seed Firestore with test data for ARES dashboard widgets.
 * Collections: agent_state, tasks, token_usage, memory
 */

const { getDb } = require('./firestore-client')

async function seed() {
  const db = await getDb()
  if (!db) {
    console.error('Firestore not available — check .env.local')
    process.exit(1)
  }

  const { doc, setDoc, collection, addDoc, serverTimestamp, Timestamp } = await import('firebase/firestore')

  const now = Date.now()

  // --- agent_state ---
  console.log('Seeding agent_state...')
  const agents = [
    { id: 'gemini-manager', name: 'Gemini Manager', model: 'gemini-2.0-flash', tier: 'Manager', status: 'idle', activeTaskId: null, currentLoopCount: 0 },
    { id: 'claude-terminal', name: 'Claude Terminal', model: 'claude-sonnet-4-6', tier: 'Worker', status: 'idle', activeTaskId: null, currentLoopCount: 0 },
    { id: 'ash-local', name: 'Ash Local (Qwen)', model: 'qwen2.5-coder:14b', tier: 'Worker', status: 'idle', activeTaskId: null, currentLoopCount: 0 },
  ]
  for (const agent of agents) {
    const { id, ...data } = agent
    await setDoc(doc(db, 'agent_state', id), { ...data, lastActive: serverTimestamp() })
    console.log(`  + agent_state/${id}`)
  }

  // --- tasks ---
  console.log('Seeding tasks...')
  const tasks = [
    { id: 'task_001', title: 'Audit Centre Willow landing pages', status: 'complete', priority: 'high', assignedTo: 'claude-terminal' },
    { id: 'task_002', title: 'Generate Goldwater Law FR ad copy', status: 'in-progress', priority: 'medium', assignedTo: 'gemini-manager' },
    { id: 'task_003', title: 'Research competitor PPC keywords', status: 'pending', priority: 'low', assignedTo: null },
  ]
  for (const task of tasks) {
    const { id, ...data } = task
    await setDoc(doc(db, 'tasks', id), { ...data, updatedAt: serverTimestamp() })
    console.log(`  + tasks/${id}`)
  }

  // --- token_usage ---
  console.log('Seeding token_usage...')
  const usages = [
    { agentId: 'claude-terminal', taskId: 'task_001', model: 'claude-sonnet-4-6', promptTokens: 3200, completionTokens: 1800, totalTokens: 5000 },
    { agentId: 'gemini-manager', taskId: 'task_002', model: 'gemini-2.0-flash', promptTokens: 1500, completionTokens: 900, totalTokens: 2400 },
  ]
  for (const usage of usages) {
    const ref = await addDoc(collection(db, 'token_usage'), { ...usage, timestamp: serverTimestamp() })
    console.log(`  + token_usage/${ref.id}`)
  }

  // --- memory ---
  console.log('Seeding memory...')
  const memories = [
    { type: 'session_summary', content: 'Session 1: Set up ARES dashboard, configured Firestore widgets, integrated agent_connector pipeline.', archivedAt: null },
    { type: 'learned_rule', content: 'Always guard Firebase initializeApp with hasConfig check — empty apiKey throws at module load.', archivedAt: null },
  ]
  for (const mem of memories) {
    const ref = await addDoc(collection(db, 'memory'), { ...mem, timestamp: serverTimestamp() })
    console.log(`  + memory/${ref.id}`)
  }

  console.log('\nDone! All collections seeded.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
