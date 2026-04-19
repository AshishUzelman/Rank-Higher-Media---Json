import { collection, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './config'

const onError = (label) => (err) => console.error(`[ARES Firestore] ${label}:`, err.message)
const noOp = () => {}
const notReady = (label) => {
  console.warn(`[ARES] Firestore not ready — skipping ${label} subscription`)
  return noOp
}

// Agent State — real-time listener, all agents
export function subscribeToAgentState(callback) {
  if (!db) return notReady('agent_state')
  const q = query(collection(db, 'agent_state'), orderBy('lastActive', 'desc'))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
  }, onError('agent_state'))
}

// Task Queue — real-time listener, most recent 50 tasks
export function subscribeToTasks(callback) {
  if (!db) return notReady('tasks')
  const q = query(collection(db, 'tasks'), orderBy('updatedAt', 'desc'), limit(50))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
  }, onError('tasks'))
}

// Token Usage — real-time listener, most recent 100 records
export function subscribeToTokenUsage(callback) {
  if (!db) return notReady('token_usage')
  const q = query(collection(db, 'token_usage'), orderBy('timestamp', 'desc'), limit(100))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
  }, onError('token_usage'))
}

// Memory — real-time listener, ordered by timestamp desc
export function subscribeToMemory(callback) {
  if (!db) return notReady('memory')
  const q = query(collection(db, 'memory'), orderBy('timestamp', 'desc'))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
  }, onError('memory'))
}

// Token Usage — append only. Never call update/delete on this collection.
export async function logTokenUsage({ agentId, taskId, model, promptTokens, completionTokens }) {
  return addDoc(collection(db, 'token_usage'), {
    agentId,
    taskId,
    model,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    timestamp: serverTimestamp(),
  })
}

// Latest task per agent — real-time. Returns { [agentId]: taskDoc }
export function subscribeToLatestTaskPerAgent(callback) {
  if (!db) return notReady('tasks_per_agent')
  const q = query(collection(db, 'tasks'), orderBy('updatedAt', 'desc'), limit(20))
  return onSnapshot(q, (snapshot) => {
    const byAgent = {}
    snapshot.docs.forEach((doc) => {
      const data = { id: doc.id, ...doc.data() }
      if (data.agentId && !byAgent[data.agentId]) {
        byAgent[data.agentId] = data
      }
    })
    callback(byAgent)
  }, onError('tasks_per_agent'))
}

// Summarize token usage by model from a records array
export function aggregateTokensByModel(records) {
  return records.reduce((acc, record) => {
    const model = record.model || 'unknown'
    if (!acc[model]) acc[model] = { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
    acc[model].promptTokens += record.promptTokens || 0
    acc[model].completionTokens += record.completionTokens || 0
    acc[model].totalTokens += record.totalTokens || 0
    return acc
  }, {})
}

// Articles — real-time listener, ordered by timestamp descending
export function subscribeToArticles(callback) {
  if (!db) return notReady('articles')
  const q = query(collection(db, 'articles'), orderBy('publishedAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
  }, onError('articles'))
}

// Books — real-time listener, ordered by creation descending
export function subscribeToBooks(callback) {
  if (!db) return notReady('books')
  const q = query(collection(db, 'books'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
  }, onError('books'))
}

// SEO Tool — real-time listener, ordered by last used descending
export function subscribeToSeoTool(callback) {
  if (!db) return notReady('seo_tool')
  const q = query(collection(db, 'seo_tool'), orderBy('lastUsed', 'desc'))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
  }, onError('seo_tool'))
}

// Projects — real-time listener, ordered by last updated descending
export function subscribeToProjects(callback) {
  if (!db) return notReady('projects')
  const q = query(collection(db, 'projects'), orderBy('startDate', 'desc'))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
  }, onError('projects'))
}

// Director Chat — real-time listener, chronological order for display
export function subscribeToDirectorChat(callback) {
  if (!db) return notReady('director_chat')
  const q = query(collection(db, 'director_chat'), orderBy('timestamp', 'asc'), limit(100))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
  }, onError('director_chat'))
}

// Director Chat — write a user message; Director agent reads and responds
export async function sendDirectorMessage(content) {
  if (!db) throw new Error('Firestore not ready')
  return addDoc(collection(db, 'director_chat'), {
    role: 'user',
    content,
    timestamp: serverTimestamp(),
  })
}
