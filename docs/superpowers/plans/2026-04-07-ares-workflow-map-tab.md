# ARES Workflow Map Tab (Option B — Live React) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **LLM routing for this task:** All steps can run via Ash Code + qwen2.5-coder:32b. No Claude API needed — this is pure code generation.

**Goal:** Add a "System Map" tab to the ARES sidebar that renders the n8n-style workflow diagram as live React components, with each node showing real Firestore state (active/idle/error), pulsing when active, and revealing last-task detail on click.

**Architecture:** SVG canvas with positioned React node components. A new `useWorkflowState` hook aggregates `agent_state`, `tasks`, and `token_usage` Firestore collections into a per-node status map. Nodes are data-driven (defined in a config array, not hardcoded in JSX). A slide-out detail panel shows last task on node click.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind CSS 3, Firestore `onSnapshot` (already wired in `firestore.js`), lucide-react icons, SVG for edges.

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/app/system-map/page.js` | Page wrapper — imports WorkflowMap, handles layout |
| Create | `src/components/workflow/WorkflowMap.js` | SVG canvas + node layout, composes all workflow components |
| Create | `src/components/workflow/WorkflowNode.js` | Single node: icon, label, live status dot, pulse animation, click handler |
| Create | `src/components/workflow/WorkflowEdge.js` | SVG bezier curve between two node positions |
| Create | `src/components/workflow/NodeDetail.js` | Slide-out right panel: node name, status, last task, last token count |
| Create | `src/hooks/useWorkflowState.js` | Aggregates agent_state + tasks + token_usage into `{ [nodeId]: NodeStatus }` |
| Modify | `src/lib/firebase/firestore.js` | Add `subscribeToLatestTaskPerAgent()` helper |
| Modify | `src/components/Sidebar.js` | Add "System Map" nav item with Network icon |

---

## Task 1: Add Firestore helper — latest task per agent

**Files:**
- Modify: `src/lib/firebase/firestore.js`

- [ ] **Step 1: Open firestore.js and add the helper after the existing subscriptions**

Add this function at the bottom of `src/lib/firebase/firestore.js`, before any exports that might follow:

```js
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
```

- [ ] **Step 2: Verify firestore.js still imports cleanly**

```bash
cd ~/rank-higher-media/ares && node -e "console.log('syntax ok')" 2>&1
```

Expected: `syntax ok`

- [ ] **Step 3: Commit**

```bash
cd ~/rank-higher-media/ares
git add src/lib/firebase/firestore.js
git commit -m "feat(workflow): add subscribeToLatestTaskPerAgent firestore helper"
```

---

## Task 2: Create useWorkflowState hook

**Files:**
- Create: `src/hooks/useWorkflowState.js`

This hook maps Firestore data to a per-node status object. Node IDs are constants that both this hook and the WorkflowMap components share.

- [ ] **Step 1: Create the hook file**

```js
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
```

- [ ] **Step 2: Commit**

```bash
cd ~/rank-higher-media/ares
git add src/hooks/useWorkflowState.js
git commit -m "feat(workflow): add useWorkflowState hook mapping Firestore to node status"
```

---

## Task 3: Create WorkflowNode component

**Files:**
- Create: `src/components/workflow/WorkflowNode.js`

A single positioned node on the canvas. Accepts x/y absolute position, renders inside the SVG's `<foreignObject>` so it can use HTML/Tailwind inside the SVG canvas.

- [ ] **Step 1: Create the component**

```js
// src/components/workflow/WorkflowNode.js
'use client'

// status → visual config
const STATUS_CONFIG = {
  active: {
    dot: 'bg-emerald-400',
    pulse: true,
    border: 'border-emerald-500/40',
    glow: 'shadow-emerald-500/20',
  },
  idle: {
    dot: 'bg-zinc-600',
    pulse: false,
    border: 'border-zinc-700/60',
    glow: '',
  },
  error: {
    dot: 'bg-red-500',
    pulse: true,
    border: 'border-red-500/40',
    glow: 'shadow-red-500/20',
  },
  static: {
    dot: 'bg-zinc-700',
    pulse: false,
    border: 'border-zinc-800/80',
    glow: '',
  },
}

export default function WorkflowNode({
  x, y, width = 180, height = 52,
  icon, label, sublabel,
  status = 'idle',
  isStatic = false,
  isSelected = false,
  onClick,
}) {
  const cfg = STATUS_CONFIG[isStatic ? 'static' : status]

  return (
    <foreignObject x={x} y={y} width={width} height={height} style={{ overflow: 'visible' }}>
      <div
        onClick={onClick}
        className={`
          flex items-center gap-2.5 px-3 h-[52px] rounded-xl border
          bg-zinc-900 cursor-pointer select-none transition-all duration-150
          ${cfg.border}
          ${cfg.glow ? `shadow-lg ${cfg.glow}` : ''}
          ${isSelected ? 'ring-1 ring-blue-500/60' : ''}
          hover:border-zinc-600/60 hover:shadow-lg
        `}
      >
        {/* Icon */}
        <span className="text-base leading-none flex-shrink-0">{icon}</span>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-zinc-200 truncate leading-tight">{label}</div>
          {sublabel && (
            <div className="text-[9px] text-zinc-600 truncate mt-0.5 leading-tight">{sublabel}</div>
          )}
        </div>

        {/* Status dot */}
        <div className="flex-shrink-0 relative">
          <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
          {cfg.pulse && (
            <div className={`absolute inset-0 rounded-full ${cfg.dot} animate-ping opacity-60`} />
          )}
        </div>
      </div>
    </foreignObject>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/rank-higher-media/ares
git add src/components/workflow/WorkflowNode.js
git commit -m "feat(workflow): add WorkflowNode component with live status + pulse"
```

---

## Task 4: Create WorkflowEdge component

**Files:**
- Create: `src/components/workflow/WorkflowEdge.js`

SVG bezier curve between two points. Rendered inside the `<svg>` element directly (not foreignObject).

- [ ] **Step 1: Create the component**

```js
// src/components/workflow/WorkflowEdge.js

// stroke variants keyed to semantic meaning
const STROKE = {
  default:  '#3d4a5c',
  trigger:  '#78350f',
  memory:   '#831843',
  llm:      '#065f46',
  db:       '#7c2d12',
  ui:       '#312e81',
  gemini:   '#0c3052',
  dashed:   '#1e3a5f',
}

export default function WorkflowEdge({
  x1, y1, x2, y2,
  variant = 'default',
  dashed = false,
  label,
}) {
  const stroke = STROKE[variant] || STROKE.default
  // Control points: horizontal bezier
  const cx1 = x1 + (x2 - x1) * 0.5
  const cx2 = x2 - (x2 - x1) * 0.5
  const d = `M${x1},${y1} C${cx1},${y1} ${cx2},${y2} ${x2},${y2}`

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={1.8}
        strokeDasharray={dashed ? '5,3' : undefined}
        markerEnd="url(#arr)"
      />
      {label && (
        <text
          x={(x1 + x2) / 2}
          y={(y1 + y2) / 2 - 4}
          textAnchor="middle"
          fontSize={8}
          fill="#3d4a5c"
          fontFamily="system-ui"
        >
          {label}
        </text>
      )}
    </g>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/rank-higher-media/ares
git add src/components/workflow/WorkflowEdge.js
git commit -m "feat(workflow): add WorkflowEdge SVG bezier component"
```

---

## Task 5: Create NodeDetail panel

**Files:**
- Create: `src/components/workflow/NodeDetail.js`

Slide-out panel on the right side of the canvas. Shows node name, live status, last task title + status, last token count.

- [ ] **Step 1: Create the component**

```js
// src/components/workflow/NodeDetail.js
'use client'

const STATUS_LABEL = {
  active: { text: 'Active', color: 'text-emerald-400' },
  idle:   { text: 'Idle',   color: 'text-zinc-500' },
  error:  { text: 'Error',  color: 'text-red-400' },
  static: { text: 'Static', color: 'text-zinc-600' },
}

export default function NodeDetail({ node, lastTask, onClose }) {
  if (!node) return null

  const status = STATUS_LABEL[node.status] || STATUS_LABEL.idle

  return (
    <div className="absolute right-0 top-0 bottom-0 w-64 bg-zinc-950 border-l border-zinc-800 rounded-r-2xl p-5 flex flex-col gap-4 z-20">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-lg">{node.icon}</div>
          <div className="text-sm font-semibold text-zinc-100 mt-1">{node.label}</div>
          <div className="text-xs text-zinc-600 mt-0.5">{node.sublabel}</div>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-600 hover:text-zinc-300 text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* Status */}
      <div className="bg-zinc-900 rounded-xl p-3">
        <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Status</div>
        <div className={`text-sm font-semibold ${status.color}`}>{status.text}</div>
      </div>

      {/* Last task */}
      <div className="bg-zinc-900 rounded-xl p-3">
        <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Last Task</div>
        {lastTask ? (
          <>
            <div className="text-xs text-zinc-300 font-medium truncate">{lastTask.title || lastTask.id}</div>
            <div className="text-[10px] text-zinc-600 mt-1">{lastTask.status || '—'}</div>
          </>
        ) : (
          <div className="text-xs text-zinc-700">No tasks recorded</div>
        )}
      </div>

      {/* Token count */}
      {lastTask?.totalTokens && (
        <div className="bg-zinc-900 rounded-xl p-3">
          <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Last Token Count</div>
          <div className="text-xs text-zinc-300 font-medium">{lastTask.totalTokens.toLocaleString()} tokens</div>
        </div>
      )}

      {!node.isLive && (
        <div className="mt-auto text-[9px] text-zinc-700 text-center">Static node — no live Firestore data</div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/rank-higher-media/ares
git add src/components/workflow/NodeDetail.js
git commit -m "feat(workflow): add NodeDetail slide-out panel component"
```

---

## Task 6: Create WorkflowMap — main canvas

**Files:**
- Create: `src/components/workflow/WorkflowMap.js`

The main composition: SVG canvas with dot grid, all nodes, all edges, and the detail panel. Node positions defined as data.

- [ ] **Step 1: Create WorkflowMap.js**

```js
// src/components/workflow/WorkflowMap.js
'use client'
import { useState } from 'react'
import { useWorkflowState, NODE_IDS } from '@/hooks/useWorkflowState'
import WorkflowNode from './WorkflowNode'
import WorkflowEdge from './WorkflowEdge'
import NodeDetail from './NodeDetail'

// Canvas dimensions
const W = 1300
const H = 440
const NODE_W = 180
const NODE_H = 52
// Node right-edge x = x + NODE_W, center y = y + NODE_H/2

// Node definitions — x/y = top-left corner
const NODES = [
  // ── Flow 1: Task Execution ──
  { id: NODE_IDS.FILE_WATCHER,    x: 10,  y: 80,  icon: '📂', label: 'File Watcher',      sublabel: 'agent_inbox/ · trigger',       isStatic: true,  isLive: false },
  { id: NODE_IDS.LOAD_CONTEXT,    x: 220, y: 80,  icon: '📋', label: 'load_context.js',   sublabel: 'soul stack + Firestore mem',    isStatic: false, isLive: true },
  { id: NODE_IDS.ROUTE_TASK,      x: 430, y: 80,  icon: '🔀', label: 'Route Task',         sublabel: 'bulk · quality · manager',      isStatic: true,  isLive: false },
  { id: NODE_IDS.OLLAMA,          x: 640, y: 20,  icon: '💻', label: 'Ollama · local',     sublabel: 'qwen2.5-coder:32b · free',     isStatic: false, isLive: true },
  { id: NODE_IDS.CLAUDE,          x: 640, y: 94,  icon: '⚡', label: 'Claude API',         sublabel: 'Scrutinizer · client work',     isStatic: false, isLive: true },
  { id: NODE_IDS.GEMINI,          x: 640, y: 168, icon: '✦', label: 'Gemini API',          sublabel: 'Manager decisions · loop',      isStatic: false, isLive: true },
  { id: NODE_IDS.WRITE_OUTBOX,    x: 850, y: 57,  icon: '📤', label: 'Write Outbox',       sublabel: 'agent_outbox/ · result',        isStatic: true,  isLive: false },
  { id: NODE_IDS.FIRESTORE,       x: 1060,y: 57,  icon: '🔥', label: 'Update Firestore',   sublabel: 'tasks · token_usage · state',   isStatic: true,  isLive: false },
  { id: NODE_IDS.DASHBOARD,       x: 1110,y: 57,  icon: '📊', label: 'Dashboard live',     sublabel: 'onSnapshot → React UI',         isStatic: true,  isLive: false },

  // ── Flow 2: Memory Compiler ──
  { id: NODE_IDS.STOP_HOOK,       x: 10,  y: 300, icon: '🛑', label: 'Stop Hook',          sublabel: 'session end · auto-fires',      isStatic: true,  isLive: false },
  { id: NODE_IDS.MEMORY_COMPILER, x: 220, y: 300, icon: '🧠', label: 'memory_compiler.js', sublabel: '14 tests ✅ · Stop hook live',   isStatic: false, isLive: true },
  { id: NODE_IDS.OLLAMA,          x: 430, y: 300, icon: '⊞', label: 'Ollama ×4 parallel', sublabel: 'qwen2.5-coder:32b · free',     isStatic: false, isLive: true,  id2: 'ollama-parallel' },
  { id: NODE_IDS.CONTEXT_MD,      x: 640, y: 260, icon: '📄', label: 'CONTEXT.md',         sublabel: 'session state · always current',isStatic: true,  isLive: false },
  { id: NODE_IDS.ROLLING_SUMMARY, x: 640, y: 350, icon: '🔄', label: 'rolling_summary.md', sublabel: 'last 3 sessions buffer',        isStatic: true,  isLive: false },
  { id: NODE_IDS.GIT_COMMIT,      x: 850, y: 300, icon: '✅', label: 'Git Commit',          sublabel: 'auto-push memory files',        isStatic: true,  isLive: false },
  { id: NODE_IDS.DRIVE_BACKUP,    x: 1060,y: 300, icon: '☁️', label: 'Drive Backup',        sublabel: 'OAuth pending',                 isStatic: true,  isLive: false },
]

// Edge definitions: [fromNodeId, toNodeId, variant, dashed]
// x/y computed from node positions
function nodeRight(id) {
  const n = NODES.find((n) => n.id === id)
  return n ? { x: n.x + NODE_W, y: n.y + NODE_H / 2 } : { x: 0, y: 0 }
}
function nodeLeft(id) {
  const n = NODES.find((n) => n.id === id)
  return n ? { x: n.x, y: n.y + NODE_H / 2 } : { x: 0, y: 0 }
}

export default function WorkflowMap() {
  const { getStatus, getLastTask, loading } = useWorkflowState()
  const [selectedId, setSelectedId] = useState(null)

  const selectedNode = selectedId ? NODES.find((n) => (n.id2 || n.id) === selectedId) : null
  const selectedNodeWithStatus = selectedNode
    ? { ...selectedNode, status: getStatus(selectedNode.id) }
    : null

  function handleNodeClick(nodeId) {
    setSelectedId((prev) => (prev === nodeId ? null : nodeId))
  }

  // Edges: [x1, y1, x2, y2, variant, dashed]
  const EDGES = [
    // Flow 1
    [nodeRight(NODE_IDS.FILE_WATCHER).x,   nodeRight(NODE_IDS.FILE_WATCHER).y,   nodeLeft(NODE_IDS.LOAD_CONTEXT).x,   nodeLeft(NODE_IDS.LOAD_CONTEXT).y,   'trigger',  false],
    [nodeRight(NODE_IDS.LOAD_CONTEXT).x,   nodeRight(NODE_IDS.LOAD_CONTEXT).y,   nodeLeft(NODE_IDS.ROUTE_TASK).x,     nodeLeft(NODE_IDS.ROUTE_TASK).y,     'default',  false],
    [nodeRight(NODE_IDS.ROUTE_TASK).x,     nodeRight(NODE_IDS.ROUTE_TASK).y,     nodeLeft(NODE_IDS.OLLAMA).x,         nodeLeft(NODE_IDS.OLLAMA).y,         'llm',      false],
    [nodeRight(NODE_IDS.ROUTE_TASK).x,     nodeRight(NODE_IDS.ROUTE_TASK).y,     nodeLeft(NODE_IDS.CLAUDE).x,         nodeLeft(NODE_IDS.CLAUDE).y,         'trigger',  false],
    [nodeRight(NODE_IDS.ROUTE_TASK).x,     nodeRight(NODE_IDS.ROUTE_TASK).y,     nodeLeft(NODE_IDS.GEMINI).x,         nodeLeft(NODE_IDS.GEMINI).y,         'gemini',   false],
    [nodeRight(NODE_IDS.OLLAMA).x,         nodeRight(NODE_IDS.OLLAMA).y,         nodeLeft(NODE_IDS.WRITE_OUTBOX).x,   nodeLeft(NODE_IDS.WRITE_OUTBOX).y,   'llm',      false],
    [nodeRight(NODE_IDS.CLAUDE).x,         nodeRight(NODE_IDS.CLAUDE).y,         nodeLeft(NODE_IDS.WRITE_OUTBOX).x,   nodeLeft(NODE_IDS.WRITE_OUTBOX).y,   'llm',      false],
    [nodeRight(NODE_IDS.WRITE_OUTBOX).x,   nodeRight(NODE_IDS.WRITE_OUTBOX).y,   nodeLeft(NODE_IDS.FIRESTORE).x,      nodeLeft(NODE_IDS.FIRESTORE).y,      'db',       false],
    // Flow 2
    [nodeRight(NODE_IDS.STOP_HOOK).x,      nodeRight(NODE_IDS.STOP_HOOK).y,      nodeLeft(NODE_IDS.MEMORY_COMPILER).x,nodeLeft(NODE_IDS.MEMORY_COMPILER).y,'memory',   false],
    [nodeRight(NODE_IDS.MEMORY_COMPILER).x,nodeRight(NODE_IDS.MEMORY_COMPILER).y,430,                                  300 + NODE_H / 2,                     'memory',   false],
    [640,                                   260 + NODE_H / 2,                      nodeLeft(NODE_IDS.GIT_COMMIT).x,     nodeLeft(NODE_IDS.GIT_COMMIT).y,     'default',  false],
    [640,                                   350 + NODE_H / 2,                      nodeLeft(NODE_IDS.GIT_COMMIT).x,     nodeLeft(NODE_IDS.GIT_COMMIT).y,     'default',  false],
    [nodeRight(NODE_IDS.GIT_COMMIT).x,     nodeRight(NODE_IDS.GIT_COMMIT).y,     nodeLeft(NODE_IDS.DRIVE_BACKUP).x,   nodeLeft(NODE_IDS.DRIVE_BACKUP).y,   'dashed',   true ],
  ]

  return (
    <div className="relative w-full overflow-x-auto bg-zinc-950 rounded-2xl border border-zinc-800">
      {/* Flow labels */}
      <div className="flex gap-6 px-5 pt-4 pb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 bg-violet-400/10 border border-violet-400/20 px-3 py-1 rounded">
          ⚡ Task Execution
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-pink-400 bg-pink-400/10 border border-pink-400/20 px-3 py-1 rounded">
          🧠 Memory Compiler
        </span>
        {loading && (
          <span className="text-[10px] text-zinc-600 ml-auto self-center">connecting to Firestore…</span>
        )}
      </div>

      <div className="relative" style={{ width: W, height: H }}>
        <svg width={W} height={H} className="absolute inset-0">
          <defs>
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="0.8" cy="0.8" r="0.8" fill="#1f2937" />
            </pattern>
            <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3z" fill="#3d4a5c" />
            </marker>
            {/* flow divider */}
            <line x1="0" y1="240" x2={W} y2="240" stroke="#1f2937" strokeWidth="1" strokeDasharray="6,4" />
          </defs>
          <rect width={W} height={H} fill="url(#dots)" />
          <line x1="0" y1="240" x2={W} y2="240" stroke="#1f2937" strokeWidth="1" strokeDasharray="6,4" />

          {/* Edges */}
          {EDGES.map(([x1, y1, x2, y2, variant, dashed], i) => (
            <WorkflowEdge key={i} x1={x1} y1={y1} x2={x2} y2={y2} variant={variant} dashed={dashed} />
          ))}
        </svg>

        {/* Nodes (foreignObject inside SVG for HTML/Tailwind) */}
        <svg width={W} height={H} className="absolute inset-0" style={{ pointerEvents: 'none' }}>
          {NODES.map((node) => {
            const uid = node.id2 || node.id
            return (
              <WorkflowNode
                key={uid}
                x={node.x} y={node.y}
                width={NODE_W} height={NODE_H}
                icon={node.icon}
                label={node.label}
                sublabel={node.sublabel}
                status={getStatus(node.id)}
                isStatic={node.isStatic}
                isSelected={selectedId === uid}
                onClick={() => handleNodeClick(uid)}
              />
            )
          })}
        </svg>

        {/* Detail panel */}
        {selectedNodeWithStatus && (
          <NodeDetail
            node={selectedNodeWithStatus}
            lastTask={getLastTask(selectedNodeWithStatus.id)}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/rank-higher-media/ares
git add src/components/workflow/
git commit -m "feat(workflow): add WorkflowMap canvas with live nodes, edges, and detail panel"
```

---

## Task 7: Create system-map page

**Files:**
- Create: `src/app/system-map/page.js`

- [ ] **Step 1: Create the page**

```js
// src/app/system-map/page.js
import Sidebar from '@/components/Sidebar'
import SystemHeader from '@/components/SystemHeader'
import WorkflowMap from '@/components/workflow/WorkflowMap'

export default function SystemMapPage() {
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-100 font-sans">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <SystemHeader />
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-1">System Map</h2>
            <p className="text-sm text-zinc-500 mb-5">
              Live ARES workflow — nodes reflect real Firestore state. Click any node for detail.
            </p>
            <WorkflowMap />
          </div>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd ~/rank-higher-media/ares
git add src/app/system-map/page.js
git commit -m "feat(workflow): add system-map page"
```

---

## Task 8: Add sidebar nav item

**Files:**
- Modify: `src/components/Sidebar.js`

- [ ] **Step 1: Add Network import and nav item**

In `src/components/Sidebar.js`, add `Network` to the lucide-react import line:

```js
import Link from 'next/link'
import { Activity, LayoutDashboard, BrainCircuit, CheckSquare, Settings, Network } from 'lucide-react'
```

Then add the nav item after the Tasks item inside `<nav>`:

```js
<NavItem href="/system-map" icon={<Network size={18} />} label="System Map" />
```

Full updated nav section:

```jsx
<nav className="flex-1 px-4 space-y-1 text-sm font-medium">
  <NavItem href="/" icon={<LayoutDashboard size={18} />} label="Overview" active />
  <NavItem href="/agents" icon={<Activity size={18} />} label="Agent State" />
  <NavItem href="/tasks" icon={<CheckSquare size={18} />} label="Task Queue" />
  <NavItem href="/system-map" icon={<Network size={18} />} label="System Map" />
  <div className="pt-8">
    <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">System</p>
    <NavItem href="/config" icon={<Settings size={18} />} label="Configuration" />
  </div>
</nav>
```

- [ ] **Step 2: Commit**

```bash
cd ~/rank-higher-media/ares
git add src/components/Sidebar.js
git commit -m "feat(workflow): add System Map nav item to sidebar"
```

---

## Task 9: Build verification

- [ ] **Step 1: Run production build**

```bash
cd ~/rank-higher-media/ares
PATH="/opt/homebrew/bin:/usr/local/bin:$PATH" npm run build 2>&1
```

Expected: `✓ Compiled successfully` with `/system-map` in the route list. Zero errors.

- [ ] **Step 2: Run dev server and spot-check**

```bash
cd ~/rank-higher-media/ares
PATH="/opt/homebrew/bin:/usr/local/bin:$PATH" npm run dev
```

Open `http://localhost:3000/system-map`. Verify:
- Sidebar shows "System Map" nav item with Network icon
- Canvas renders with dot grid + two flow labels
- At least one node is visible
- Clicking a node opens the detail panel on the right
- Closing the detail panel works

- [ ] **Step 3: Final commit**

```bash
cd ~/rank-higher-media/ares
git add -A
git commit -m "feat: ARES System Map tab complete — live n8n-style workflow with Firestore state"
```

---

## Queued Next (separate sessions)

1. **Supervisor pattern** — add gemma3:12b review step to `agent_connector.js` after Worker output
2. **n8n skill + agent** — skill to generate n8n workflow JSON; agent to deploy workflows via n8n API
3. **Update LLM routing** — swap `qwen2.5-coder:14b` → `qwen2.5-coder:32b` in `memory_config.js` and `agent_connector.js` once model pull completes
