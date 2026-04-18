#!/usr/bin/env node
/**
 * ARES Firestore Client (Node.js, Admin SDK)
 * Uses firebase-admin with a service account key — bypasses security rules.
 * Service account: ares/service-account.json (gitignored)
 */

const fs = require('fs')
const path = require('path')
const admin = require('firebase-admin')

// --- Env loader (still used for project_id fallback) ----------------------

function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local')
  if (!fs.existsSync(envPath)) return {}
  const env = {}
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx < 0) continue
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
    env[key] = value
  }
  return env
}

const env = loadEnv()

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../service-account.json')
const hasServiceAccount = fs.existsSync(SERVICE_ACCOUNT_PATH)

// --- DB singleton ---------------------------------------------------------

let _db = null

function getDb() {
  if (_db) return _db
  if (!hasServiceAccount) {
    console.warn('[firestore-client] service-account.json not found — Firestore unavailable')
    return null
  }
  if (!admin.apps.length) {
    const serviceAccount = require(SERVICE_ACCOUNT_PATH)
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id || env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    })
  }
  _db = admin.firestore()
  return _db
}

const FV = () => admin.firestore.FieldValue.serverTimestamp()

// --- Tasks ----------------------------------------------------------------

async function createTask(taskId, data) {
  const db = getDb()
  if (!db) return null
  return db.collection('tasks').doc(taskId).set({
    ...data,
    status: 'pending',
    createdAt: FV(),
    updatedAt: FV(),
  })
}

async function updateTask(taskId, fields) {
  const db = getDb()
  if (!db) return null
  return db.collection('tasks').doc(taskId).update({
    ...fields,
    updatedAt: FV(),
  })
}

// --- Agent State ----------------------------------------------------------

async function updateAgentState(agentId, fields) {
  const db = getDb()
  if (!db) return null
  return db.collection('agent_state').doc(agentId).set({
    ...fields,
    lastActive: FV(),
  }, { merge: true })
}

// --- Memory ---------------------------------------------------------------

async function writeSessionSummary(data) {
  const db = getDb()
  if (!db) return null
  return db.collection('memory').add({
    type: 'session_summary',
    ...data,
    timestamp: FV(),
  })
}

async function getRecentMemory(limitCount = 20) {
  const db = getDb()
  if (!db) return []
  const snap = await db.collection('memory').orderBy('timestamp', 'desc').limit(limitCount).get()
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// --- Backup check ---------------------------------------------------------

async function getBackupStatus() {
  const db = getDb()
  if (!db) return { hoursSinceLastSave: null, taskCountSinceLastSave: 0 }

  const now = Date.now()

  const memSnap = await db.collection('memory').orderBy('timestamp', 'desc').get()
  const lastSave = memSnap.docs.map((d) => d.data()).find((d) => d.type === 'session_summary')
  const lastSaveMs = lastSave?.timestamp?.toMillis?.() || null
  const hoursSinceLastSave = lastSaveMs
    ? Math.floor((now - lastSaveMs) / 1000 / 60 / 60)
    : null

  const taskSnap = await db.collection('tasks').orderBy('updatedAt', 'desc').get()
  const taskCountSinceLastSave = taskSnap.docs.filter((d) => {
    const data = d.data()
    const updatedMs = data.updatedAt?.toMillis?.()
    const isComplete = data.status === 'complete'
    if (!isComplete || !updatedMs) return false
    if (!lastSaveMs) return true
    return updatedMs > lastSaveMs
  }).length

  return { hoursSinceLastSave, taskCountSinceLastSave }
}

async function getTaskStatus(taskId) {
  const db = getDb()
  if (!db) return null
  const snap = await db.collection('tasks').doc(taskId).get()
  return snap.exists ? snap.data().status : null
}

module.exports = {
  getDb,
  createTask,
  updateTask,
  updateAgentState,
  writeSessionSummary,
  getRecentMemory,
  getBackupStatus,
  getTaskStatus,
}
