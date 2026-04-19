'use client'

import { useMemo } from 'react'
import { useAgentState } from '@/hooks/useAgentState'
import { useMemoryState } from '@/hooks/useMemoryState'
import { useTaskQueue } from '@/hooks/useTaskQueue'

function deriveProvider(agents) {
  const has = (substr) =>
    agents.some((a) => a.model?.toLowerCase().includes(substr) && a.status === 'active')
  if (has('claude')) return 'claude'
  if (has('gemini')) return 'gemini'
  return 'local'
}

export default function AgentPipelineViz() {
  const { agents = [] } = useAgentState()
  const { tasks = [] } = useTaskQueue()
  const { activeRules = 0 } = useMemoryState()
  const provider = deriveProvider(agents)

  const runningCount = useMemo(
    () => tasks.filter((t) => t.status === 'in-progress' || t.status === 'in_progress').length,
    [tasks]
  )

  const inCriticRefine = useMemo(
    () => tasks.some((t) => ['critic', 'refine'].includes(t.currentPhase)),
    [tasks]
  )

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] text-zinc-600 tracking-widest">
          SUPERVISOR ESCALATION CHAIN
        </span>
        {runningCount > 0 && (
          <span className="font-mono text-[9px] text-amber-400 animate-pulse">
            {runningCount} TASK{runningCount !== 1 ? 'S' : ''} RUNNING
          </span>
        )}
      </div>

      <div className="flex items-stretch gap-0 overflow-x-auto pb-1">

        {/* 1. Local Agents */}
        <div className={`border rounded px-3 py-2.5 text-center flex-shrink-0 ${runningCount > 0 ? 'border-amber-500/40 bg-zinc-800' : 'border-amber-500/20 bg-zinc-900/50'}`}>
          <div className="font-mono text-[9px] text-amber-400 mb-1.5 tracking-wide">LOCAL AGENTS</div>
          <div className="flex gap-1 justify-center mb-1">
            <span className="font-mono text-[9px] bg-zinc-950 border border-amber-500/25 rounded px-1 text-amber-400">QWEN</span>
            <span className="font-mono text-[9px] bg-zinc-950 border border-amber-500/25 rounded px-1 text-amber-400">GEMMA</span>
          </div>
          <div className="font-mono text-[8px] text-zinc-700">work · learn · fix</div>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center justify-center px-2 flex-shrink-0">
          <span className="font-mono text-[8px] text-zinc-700">pass to</span>
          <span className="font-mono text-zinc-700 text-sm leading-none">──→</span>
        </div>

        {/* 2. Self-Review */}
        <div className={`border rounded px-3 py-2.5 text-center flex-shrink-0 ${inCriticRefine ? 'border-indigo-500/40 bg-zinc-800' : 'border-indigo-500/20 bg-zinc-900/50'}`}>
          <div className="font-mono text-[9px] text-indigo-400 mb-1.5 tracking-wide">SELF-REVIEW</div>
          <div className="flex gap-1.5 justify-center mb-1">
            <span className="text-sm">🎭</span>
            <span className="text-sm">🔧</span>
          </div>
          <div className="font-mono text-[8px] text-zinc-700">critic · refine</div>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center justify-center px-2 flex-shrink-0">
          <span className="font-mono text-[8px] text-zinc-700">escalate to</span>
          <span className="font-mono text-zinc-700 text-sm leading-none">──→</span>
        </div>

        {/* 3. Claude Supervisor */}
        <div className={`border rounded px-3 py-2.5 text-center flex-shrink-0 ${provider === 'claude' ? 'border-cyan-500/50 bg-zinc-800' : 'border-cyan-500/20 bg-zinc-900/50'}`}>
          <div className="font-mono text-[9px] text-cyan-400 mb-1.5 tracking-wide">SUPERVISOR</div>
          <div className={`font-mono text-[11px] font-bold mb-1 ${provider === 'claude' ? 'text-cyan-300' : 'text-cyan-500/60'}`}>
            CLAUDE
          </div>
          <div className="font-mono text-[8px] text-zinc-700">review · save learnings</div>
          {provider === 'claude' && activeRules > 0 && (
            <div className="mt-1 font-mono text-[9px] text-violet-400">{activeRules} learned</div>
          )}
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center justify-center px-2 flex-shrink-0">
          <span className="font-mono text-[8px] text-amber-600/70">if offline</span>
          <span className="font-mono text-zinc-700 text-sm leading-none">──→</span>
        </div>

        {/* 4. Gemini Fallback 1 */}
        <div className={`border rounded px-3 py-2.5 text-center flex-shrink-0 ${provider === 'gemini' ? 'border-purple-500/50 bg-zinc-800' : 'border-purple-500/20 bg-zinc-900/50 opacity-70'}`}>
          <div className="font-mono text-[9px] text-purple-400 mb-1.5 tracking-wide">FALLBACK 1</div>
          <div className={`font-mono text-[11px] font-bold mb-1 ${provider === 'gemini' ? 'text-purple-300' : 'text-purple-500/60'}`}>
            GEMINI
          </div>
          <div className="font-mono text-[8px] text-zinc-700">cloud backup</div>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center justify-center px-2 flex-shrink-0">
          <span className="font-mono text-[8px] text-amber-600/70">if offline</span>
          <span className="font-mono text-zinc-700 text-sm leading-none">──→</span>
        </div>

        {/* 5. Local Supervisor Fallback 2 */}
        <div className={`border rounded px-3 py-2.5 text-center flex-shrink-0 ${provider === 'local' ? 'border-zinc-600/60 bg-zinc-800' : 'border-zinc-700/40 bg-zinc-900/50 opacity-50'}`}>
          <div className="font-mono text-[9px] text-zinc-500 mb-1.5 tracking-wide">FALLBACK 2</div>
          <div className={`font-mono text-[11px] font-bold mb-1 ${provider === 'local' ? 'text-zinc-400' : 'text-zinc-700'}`}>
            LOCAL SUP
          </div>
          <div className="font-mono text-[8px] text-zinc-700">offline capable</div>
        </div>

        {/* Spacer */}
        <div className="flex-1 min-w-4" />

        {/* Save learnings box (always-on, right side) */}
        <div className="border border-dashed border-indigo-500/20 rounded px-3 py-2.5 text-center flex-shrink-0 bg-zinc-950">
          <div className="font-mono text-[8px] text-zinc-700 mb-1">ALWAYS</div>
          <div className="font-mono text-[9px] text-indigo-400">↺ save learnings</div>
          <div className="font-mono text-[8px] text-zinc-700 mt-0.5">per project · per agent</div>
        </div>
      </div>
    </div>
  )
}
