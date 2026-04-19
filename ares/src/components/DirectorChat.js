'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Send, User } from 'lucide-react'
import { subscribeToDirectorChat, sendDirectorMessage } from '@/lib/firebase/firestore'
import { useAgentState } from '@/hooks/useAgentState'

const QUICK_ACTIONS = [
  { label: 'Route task', desc: 'Assign model to phase', prefix: 'Route task: ' },
  { label: 'Add skill', desc: 'Teach from a file', prefix: 'Add skill from: ' },
  { label: 'Build workflow', desc: 'Chain tasks together', prefix: 'Build workflow: ' },
  { label: 'Query memory', desc: 'What did we learn?', prefix: 'Query memory: ' },
  { label: 'Pause all tasks', desc: 'Stop running agents', prefix: 'pause all', immediate: true, danger: true },
]

const DELEGATION_CHAIN = [
  { icon: '👤', label: 'YOU', iconBg: 'bg-indigo-500/15 border-indigo-500', labelColor: 'text-indigo-400' },
  { icon: '🧠', label: 'DELG.', iconBg: 'bg-amber-500/15 border-amber-500', labelColor: 'text-amber-400', pulse: true },
  { icon: '🔬', label: 'RSRCH.', iconBg: 'bg-emerald-500/10 border-emerald-500/50', labelColor: 'text-emerald-500' },
  { icon: '⚙', label: 'WRKRS', iconBg: 'bg-indigo-500/10 border-indigo-500/50', labelColor: 'text-indigo-400' },
]

function deriveProvider(agents) {
  const has = (substr) => agents.some((a) => a.model?.toLowerCase().includes(substr) && a.status === 'active')
  if (has('claude')) return 'claude'
  if (has('gemini')) return 'gemini'
  return 'local'
}

export default function DirectorChat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [expanded, setExpanded] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const { agents = [] } = useAgentState()
  const provider = deriveProvider(agents)

  useEffect(() => subscribeToDirectorChat(setMessages), [])

  useEffect(() => {
    if (expanded && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, expanded])

  async function handleSend(overrideContent) {
    const content = (overrideContent ?? input).trim()
    if (!content || sending) return
    setSending(true)
    if (!overrideContent) setInput('')
    try {
      await sendDirectorMessage(content)
    } finally {
      setSending(false)
    }
  }

  // Supervisor fallback chain for header: Gemma → Claude → Gemini → Local
  const chain = [
    { label: 'GEMMA', active: true, color: 'text-amber-400' },
    { label: 'CLAUDE', active: provider === 'claude', check: provider === 'claude', color: 'text-cyan-400' },
    { label: 'GEMINI', active: provider === 'gemini', color: 'text-purple-400' },
    { label: 'LOCAL', active: provider === 'local', color: 'text-zinc-500' },
  ]

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-xl">
      {/* ── Top chrome bar ── */}
      <div className="flex items-center gap-3 px-4 py-2 bg-zinc-950 border-b border-zinc-800 flex-shrink-0">
        <span className="font-mono text-indigo-400 text-xs font-bold tracking-widest">⬡ ARES · DIRECTOR</span>
        {/* Fallback chain mini badge */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5">
          {chain.map((node, i) => (
            <span key={node.label} className="flex items-center gap-1">
              <span className={`font-mono text-[9px] ${node.active ? node.color : 'text-zinc-800'}`}>
                {node.label}{node.check ? ' ✓' : ''}
              </span>
              {i < chain.length - 1 && (
                <span className="text-zinc-800 text-[9px]">→</span>
              )}
            </span>
          ))}
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-zinc-600 hover:text-zinc-400 transition-colors p-1"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <>
          {/* ── 3-column body ── */}
          <div className="flex border-b border-zinc-800" style={{ minHeight: '200px', maxHeight: '300px' }}>

            {/* LEFT: Gemma identity card */}
            <div className="w-60 flex-shrink-0 border-r border-zinc-800 bg-zinc-950 p-4 flex flex-col gap-3 overflow-y-auto">
              {/* Avatar + name */}
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full bg-amber-500/15 border-2 border-amber-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🧠</span>
                  <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-zinc-950 animate-pulse" />
                </div>
                <div>
                  <div className="font-bold text-zinc-100 text-[15px] leading-tight">Gemma</div>
                  <div className="font-mono text-amber-400 text-[10px]">Delegator · Master Agent</div>
                </div>
              </div>

              {/* Role description */}
              <div className="bg-zinc-900 rounded border-l-2 border-amber-500 px-2.5 py-2">
                <div className="font-mono text-[9px] text-zinc-600 mb-1.5 tracking-wider">ROLE</div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Takes your instructions → commissions a{' '}
                  <span className="text-zinc-100">Researcher</span> to build a plan → routes tasks to{' '}
                  <span className="text-zinc-100">Workers</span>
                </p>
              </div>

              {/* Delegation chain: YOU → DELG → RSRCH → WRKRS */}
              <div className="flex items-end gap-1">
                {DELEGATION_CHAIN.map((node, i) => (
                  <div key={node.label} className="flex items-end gap-1">
                    <div className="flex flex-col items-center gap-0.5">
                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] ${node.iconBg} ${node.pulse ? 'animate-pulse' : ''}`}
                      >
                        {node.icon}
                      </div>
                      <div className={`font-mono text-[8px] ${node.labelColor}`}>{node.label}</div>
                    </div>
                    {i < DELEGATION_CHAIN.length - 1 && (
                      <span className="font-mono text-zinc-700 text-[10px] mb-3.5">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* CENTER: Chat messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 min-w-0">
              {/* Session pill */}
              <div className="text-center">
                <span className="font-mono text-[9px] text-zinc-600 bg-zinc-950 rounded-full px-3 py-0.5">
                  ARES Director · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                </span>
              </div>
              {messages.length === 0 && (
                <p className="text-zinc-700 text-xs text-center pt-6">
                  Tell the Delegator what you need…
                </p>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role !== 'user' && (
                    <div className="w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                      🧠
                    </div>
                  )}
                  <div
                    className={`max-w-[76%] rounded-xl px-3 py-2 text-[13px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-100 rounded-br-sm'
                        : 'bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-bl-sm'
                    }`}
                  >
                    {msg.role !== 'user' && (
                      <div className="font-mono text-[9px] text-zinc-600 mb-1">
                        GEMMA (Delegator){msg.timestamp ? ' · ' + new Date(msg.timestamp?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    )}
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User size={11} className="text-indigo-400" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* RIGHT: Quick actions */}
            <div className="w-44 flex-shrink-0 border-l border-zinc-800 bg-zinc-950 p-3 flex flex-col gap-2 overflow-y-auto">
              <div className="font-mono text-[9px] text-zinc-600 tracking-widest mb-1">QUICK ACTIONS</div>
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => {
                    if (action.immediate) handleSend(action.prefix)
                    else setInput(action.prefix)
                  }}
                  className="bg-zinc-900 border border-zinc-800 hover:border-indigo-500/40 rounded px-2.5 py-2 text-left transition-colors group"
                >
                  <div
                    className={`text-[11px] font-semibold mb-0.5 group-hover:text-zinc-200 transition-colors ${
                      action.danger ? 'text-red-500' : 'text-zinc-400'
                    }`}
                  >
                    {action.label}
                  </div>
                  <div className="font-mono text-[9px] text-zinc-700">{action.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Input bar ── */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-zinc-950">
            {/* Model selector */}
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 flex-shrink-0 cursor-pointer">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-mono text-amber-400 text-[10px]">Gemma (Delegator)</span>
              <span className="text-zinc-700 text-[10px]">▾</span>
            </div>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Tell the Delegator what you need..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-indigo-500/50"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || sending}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded px-3 py-2 transition-colors flex-shrink-0"
            >
              <span className="font-mono text-white text-xs font-bold">↑ SEND</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
