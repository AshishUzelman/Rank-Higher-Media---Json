// src/hooks/useWorkflowState.js
'use client'
import { useState, useEffect } from 'react'
import { subscribeToAgentState } from '@/lib/firebase/firestore'
import { subscribeToLatestTaskPerAgent } from '@/lib/firebase/firestore'

// Node IDs — must match the ids used in WorkflowMap node config
export const NODE_IDS = {
  FILE_WATCHER:    'file-watcher',
  LOAD_CONTEXT:    'load-context',
  ROUTE_TASK:      'route-task',
  OLLAMA:          'ollama-worker',
  CLAUDE:          'claude-worker',
  GEMINI:          'gemini-manager',
  WRITE_OUTBOX:    'write-outbox',
  FIRESTORE:       'firestore-sink',
  DASHBOARD:       'dashboard',
  STOP_HOOK:       'stop-hook',
  MEMORY_COMPILER: 'memory-compiler',
  CONTEXT_MD:      'context-md',
  ROLLING_SUMMARY: 'rolling-summary',
  GIT_COMMIT:      'git-commit',
  DRIVE_BACKUP:    'drive-backup',
}

// Maps agent_state doc IDs to our node IDs
const AGENT_TO_NODE = {
  'ollama-worker':    NODE_IDS.OLLAMA,
  'claude-worker':    NODE_IDS.CLAUDE,
  'gemini-manager':   NODE_IDS.GEMINI,
  'memory-compiler':  NODE_IDS.MEMORY_COMPILER,
}

function deriveStatus(agent) {
  if (!agent) return 'idle'
  if (agent.status === 'error') return 'error'
  if (agent.status === 'active') return 'active'
  return 'idle'
}

export function useWorkflowState() {
  const [nodeStatus, setNodeStatus] = useState({})
  const [latestTask, setLatestTask] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubAgents = subscribeToAgentState((agents) => {
      const status = {}
      agents.forEach((agent) => {
        const nodeId = AGENT_TO_NODE[agent.id]
        if (nodeId) status[nodeId] = deriveStatus(agent)
      })
      setNodeStatus((prev) => ({ ...prev, ...status }))
      setLoading(false)
    })

    const unsubTasks = subscribeToLatestTaskPerAgent((byAgent) => {
      const mapped = {}
      Object.entries(byAgent).forEach(([agentId, task]) => {
        const nodeId = AGENT_TO_NODE[agentId]
        if (nodeId) mapped[nodeId] = task
      })
      setLatestTask(mapped)
    })

    return () => {
      unsubAgents()
      unsubTasks()
    }
  }, [])

  // Helper: get status for a node, default idle
  function getStatus(nodeId) {
    return nodeStatus[nodeId] || 'idle'
  }

  // Helper: get last task for a node
  function getLastTask(nodeId) {
    return latestTask[nodeId] || null
  }

  return { getStatus, getLastTask, loading }
}
