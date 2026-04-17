// src/components/workflow/WorkflowMap.js
'use client'
import { useState } from 'react'
import { useWorkflowState, NODE_IDS } from '@/hooks/useWorkflowState'
import WorkflowNode from './WorkflowNode'
import WorkflowEdge from './WorkflowEdge'
import NodeDetail from './NodeDetail'

// Canvas dimensions
const W = 1520
const H = 440
const NODE_W = 180
const NODE_H = 52

// Node definitions — x/y = top-left corner
const NODES = [
  // ── Flow 1: Task Execution ──
  { id: NODE_IDS.FILE_WATCHER,    x: 10,   y: 80,  icon: '📂', label: 'File Watcher',      sublabel: 'agent_inbox/ · trigger',         isStatic: true,  isLive: false },
  { id: NODE_IDS.LOAD_CONTEXT,    x: 220,  y: 80,  icon: '📋', label: 'load_context.js',   sublabel: 'soul stack + Firestore mem',      isStatic: false, isLive: true },
  { id: NODE_IDS.ROUTE_TASK,      x: 430,  y: 80,  icon: '🔀', label: 'Route Task',         sublabel: 'bulk · quality · manager',        isStatic: true,  isLive: false },
  { id: NODE_IDS.OLLAMA,          x: 640,  y: 20,  icon: '💻', label: 'Ollama · local',     sublabel: 'qwen2.5-coder:32b · free',        isStatic: false, isLive: true },
  { id: NODE_IDS.CLAUDE,          x: 640,  y: 94,  icon: '⚡', label: 'Claude API',         sublabel: 'Scrutinizer · client work',        isStatic: false, isLive: true },
  { id: NODE_IDS.GEMINI,          x: 640,  y: 168, icon: '✦',  label: 'Gemini API',         sublabel: 'Manager decisions · loop',         isStatic: false, isLive: true },
  { id: NODE_IDS.WRITE_OUTBOX,    x: 850,  y: 57,  icon: '📤', label: 'Write Outbox',       sublabel: 'agent_outbox/ · result',           isStatic: true,  isLive: false },
  { id: NODE_IDS.FIRESTORE,       x: 1060, y: 57,  icon: '🔥', label: 'Update Firestore',   sublabel: 'tasks · token_usage · state',      isStatic: true,  isLive: false },
  { id: NODE_IDS.DASHBOARD,       x: 1270, y: 57,  icon: '📊', label: 'Dashboard live',     sublabel: 'onSnapshot → React UI',            isStatic: true,  isLive: false },

  // ── Flow 2: Memory Compiler ──
  { id: NODE_IDS.STOP_HOOK,       x: 10,   y: 300, icon: '🛑', label: 'Stop Hook',          sublabel: 'session end · auto-fires',         isStatic: true,  isLive: false },
  { id: NODE_IDS.MEMORY_COMPILER, x: 220,  y: 300, icon: '🧠', label: 'memory_compiler.js', sublabel: '14 tests ✅ · Stop hook live',      isStatic: false, isLive: true },
  { id: 'ollama-parallel',        x: 430,  y: 300, icon: '⊞',  label: 'Ollama ×4 parallel', sublabel: 'qwen2.5-coder:32b · free',         isStatic: false, isLive: true },
  { id: NODE_IDS.CONTEXT_MD,      x: 640,  y: 260, icon: '📄', label: 'CONTEXT.md',         sublabel: 'session state · always current',   isStatic: true,  isLive: false },
  { id: NODE_IDS.ROLLING_SUMMARY, x: 640,  y: 350, icon: '🔄', label: 'rolling_summary.md', sublabel: 'last 3 sessions buffer',            isStatic: true,  isLive: false },
  { id: NODE_IDS.GIT_COMMIT,      x: 850,  y: 300, icon: '✅', label: 'Git Commit',          sublabel: 'auto-push memory files',            isStatic: true,  isLive: false },
  { id: NODE_IDS.DRIVE_BACKUP,    x: 1060, y: 300, icon: '☁️', label: 'Drive Backup',        sublabel: 'OAuth pending',                     isStatic: true,  isLive: false },
]

// Helpers: get right-edge and left-edge anchor point of a node by id
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

  const selectedNode = selectedId ? NODES.find((n) => n.id === selectedId) : null
  const selectedNodeWithStatus = selectedNode
    ? { ...selectedNode, status: getStatus(selectedNode.id) }
    : null

  function handleNodeClick(nodeId) {
    setSelectedId((prev) => (prev === nodeId ? null : nodeId))
  }

  // Edge definitions: [x1, y1, x2, y2, variant, dashed]
  const EDGES = [
    // Flow 1 — Task Execution
    [nodeRight(NODE_IDS.FILE_WATCHER).x,    nodeRight(NODE_IDS.FILE_WATCHER).y,    nodeLeft(NODE_IDS.LOAD_CONTEXT).x,    nodeLeft(NODE_IDS.LOAD_CONTEXT).y,    'trigger', false],
    [nodeRight(NODE_IDS.LOAD_CONTEXT).x,    nodeRight(NODE_IDS.LOAD_CONTEXT).y,    nodeLeft(NODE_IDS.ROUTE_TASK).x,      nodeLeft(NODE_IDS.ROUTE_TASK).y,      'default', false],
    [nodeRight(NODE_IDS.ROUTE_TASK).x,      nodeRight(NODE_IDS.ROUTE_TASK).y,      nodeLeft(NODE_IDS.OLLAMA).x,          nodeLeft(NODE_IDS.OLLAMA).y,          'llm',     false],
    [nodeRight(NODE_IDS.ROUTE_TASK).x,      nodeRight(NODE_IDS.ROUTE_TASK).y,      nodeLeft(NODE_IDS.CLAUDE).x,          nodeLeft(NODE_IDS.CLAUDE).y,          'trigger', false],
    [nodeRight(NODE_IDS.ROUTE_TASK).x,      nodeRight(NODE_IDS.ROUTE_TASK).y,      nodeLeft(NODE_IDS.GEMINI).x,          nodeLeft(NODE_IDS.GEMINI).y,          'gemini',  false],
    [nodeRight(NODE_IDS.OLLAMA).x,          nodeRight(NODE_IDS.OLLAMA).y,          nodeLeft(NODE_IDS.WRITE_OUTBOX).x,    nodeLeft(NODE_IDS.WRITE_OUTBOX).y,    'llm',     false],
    [nodeRight(NODE_IDS.CLAUDE).x,          nodeRight(NODE_IDS.CLAUDE).y,          nodeLeft(NODE_IDS.WRITE_OUTBOX).x,    nodeLeft(NODE_IDS.WRITE_OUTBOX).y,    'llm',     false],
    [nodeRight(NODE_IDS.WRITE_OUTBOX).x,    nodeRight(NODE_IDS.WRITE_OUTBOX).y,    nodeLeft(NODE_IDS.FIRESTORE).x,       nodeLeft(NODE_IDS.FIRESTORE).y,       'db',      false],
    [nodeRight(NODE_IDS.FIRESTORE).x,       nodeRight(NODE_IDS.FIRESTORE).y,       nodeLeft(NODE_IDS.DASHBOARD).x,       nodeLeft(NODE_IDS.DASHBOARD).y,       'ui',      false],
    // Flow 2 — Memory Compiler
    [nodeRight(NODE_IDS.STOP_HOOK).x,       nodeRight(NODE_IDS.STOP_HOOK).y,       nodeLeft(NODE_IDS.MEMORY_COMPILER).x, nodeLeft(NODE_IDS.MEMORY_COMPILER).y, 'memory',  false],
    [nodeRight(NODE_IDS.MEMORY_COMPILER).x, nodeRight(NODE_IDS.MEMORY_COMPILER).y, nodeLeft('ollama-parallel').x,        nodeLeft('ollama-parallel').y,        'memory',  false],
    [nodeRight('ollama-parallel').x,        nodeRight('ollama-parallel').y,         nodeLeft(NODE_IDS.CONTEXT_MD).x,      nodeLeft(NODE_IDS.CONTEXT_MD).y,      'memory',  false],
    [nodeRight('ollama-parallel').x,        nodeRight('ollama-parallel').y,         nodeLeft(NODE_IDS.ROLLING_SUMMARY).x, nodeLeft(NODE_IDS.ROLLING_SUMMARY).y, 'memory',  false],
    [nodeRight(NODE_IDS.CONTEXT_MD).x,      nodeRight(NODE_IDS.CONTEXT_MD).y,       nodeLeft(NODE_IDS.GIT_COMMIT).x,      nodeLeft(NODE_IDS.GIT_COMMIT).y,      'default', false],
    [nodeRight(NODE_IDS.ROLLING_SUMMARY).x, nodeRight(NODE_IDS.ROLLING_SUMMARY).y,  nodeLeft(NODE_IDS.GIT_COMMIT).x,      nodeLeft(NODE_IDS.GIT_COMMIT).y,      'default', false],
    [nodeRight(NODE_IDS.GIT_COMMIT).x,      nodeRight(NODE_IDS.GIT_COMMIT).y,       nodeLeft(NODE_IDS.DRIVE_BACKUP).x,    nodeLeft(NODE_IDS.DRIVE_BACKUP).y,    'dashed',  true ],
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
        {/* Edges layer */}
        <svg width={W} height={H} className="absolute inset-0">
          <defs>
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="0.8" cy="0.8" r="0.8" fill="#1f2937" />
            </pattern>
            <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3z" fill="#3d4a5c" />
            </marker>
          </defs>
          <rect width={W} height={H} fill="url(#dots)" />
          {/* Flow divider */}
          <line x1="0" y1="240" x2={W} y2="240" stroke="#1f2937" strokeWidth="1" strokeDasharray="6,4" />

          {EDGES.map(([x1, y1, x2, y2, variant, dashed], i) => (
            <WorkflowEdge key={i} x1={x1} y1={y1} x2={x2} y2={y2} variant={variant} dashed={dashed} />
          ))}
        </svg>

        {/* Nodes layer — foreignObject enables HTML/Tailwind inside SVG */}
        <svg width={W} height={H} className="absolute inset-0" style={{ pointerEvents: 'none' }}>
          {NODES.map((node) => (
            <WorkflowNode
              key={node.id}
              x={node.x} y={node.y}
              width={NODE_W} height={NODE_H}
              icon={node.icon}
              label={node.label}
              sublabel={node.sublabel}
              status={getStatus(node.id)}
              isStatic={node.isStatic}
              isSelected={selectedId === node.id}
              onClick={() => handleNodeClick(node.id)}
            />
          ))}
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
