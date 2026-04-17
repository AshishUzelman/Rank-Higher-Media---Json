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
