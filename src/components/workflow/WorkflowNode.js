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
