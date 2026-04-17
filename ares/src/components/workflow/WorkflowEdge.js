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
