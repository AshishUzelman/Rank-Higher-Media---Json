'use client'

import { useEffect, useState } from 'react'
import { subscribeToProjects } from '@/lib/firebase/firestore'

const STATUS_CONFIG = {
  'active':      { label: 'ACTIVE',      dot: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'in-progress': { label: 'IN PROGRESS', dot: 'bg-amber-500',   text: 'text-amber-400',   border: 'border-amber-500/30' },
  'concept':     { label: 'CONCEPT',     dot: 'bg-indigo-500',  text: 'text-indigo-400',  border: 'border-indigo-500/30' },
  'parked':      { label: 'PARKED',      dot: 'bg-zinc-600',    text: 'text-zinc-500',    border: 'border-zinc-700/40' },
}

const CATEGORY_CONFIG = {
  'product':  { label: 'PRODUCTS',  icon: '📦' },
  'agent':    { label: 'AGENTS',    icon: '🤖' },
  'solution': { label: 'SOLUTIONS', icon: '🔧' },
}

function ProjectCard({ project }) {
  const cfg = STATUS_CONFIG[project.status] ?? STATUS_CONFIG['concept']
  const blockers = project.openBlockers ?? []

  return (
    <div className={`bg-zinc-900 border ${cfg.border} rounded-xl p-4 flex flex-col gap-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-zinc-100 text-sm truncate">{project.name}</div>
          <div className="font-mono text-[10px] text-zinc-600 mt-0.5">{project.firebase || project.slug}</div>
        </div>
        <span className={`flex items-center gap-1 flex-shrink-0 font-mono text-[9px] ${cfg.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      <p className="text-zinc-500 text-[11px] leading-relaxed line-clamp-2">{project.description}</p>

      <div className="font-mono text-[9px] text-zinc-700 bg-zinc-950 rounded px-2 py-1 truncate">
        {project.stack || '—'}
      </div>

      {blockers.length > 0 && (
        <div className="space-y-0.5">
          {blockers.slice(0, 2).map((b, i) => (
            <div key={i} className="flex items-start gap-1.5 font-mono text-[9px] text-amber-600/80">
              <span className="flex-shrink-0 mt-0.5">⚠</span>
              <span className="line-clamp-1">{b}</span>
            </div>
          ))}
        </div>
      )}

      {project.taskCount > 0 && (
        <div className="font-mono text-[9px] text-zinc-600">
          {project.taskCount} task{project.taskCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

function CategorySection({ category, projects }) {
  const cfg = CATEGORY_CONFIG[category] ?? { label: category.toUpperCase(), icon: '•' }
  if (projects.length === 0) return null
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">{cfg.icon}</span>
        <span className="font-mono text-[9px] text-zinc-500 tracking-widest">{cfg.label}</span>
        <span className="font-mono text-[9px] text-zinc-700">{projects.length}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
      </div>
    </div>
  )
}

export default function ProjectsPanel() {
  const [projects, setProjects] = useState([])

  useEffect(() => subscribeToProjects(setProjects), [])

  const byCategory = {
    product:  projects.filter((p) => p.category === 'product'  || !p.category),
    agent:    projects.filter((p) => p.category === 'agent'),
    solution: projects.filter((p) => p.category === 'solution'),
  }

  const totalActive = projects.filter((p) => p.status === 'active' || p.status === 'in-progress').length

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-semibold text-zinc-100 text-sm">Projects & Solutions</h2>
          <p className="font-mono text-[10px] text-zinc-600 mt-0.5">
            {totalActive} active · {projects.length} total
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[9px] text-zinc-600">
          <span className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1">
            {byCategory.product.length} products
          </span>
          <span className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1">
            {byCategory.agent.length} agents
          </span>
          <span className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1">
            {byCategory.solution.length} solutions
          </span>
        </div>
      </div>

      {projects.length === 0 && (
        <p className="text-zinc-700 text-xs text-center py-8">
          No projects yet — run <code className="text-zinc-500">node scripts/seed-projects.js</code>
        </p>
      )}

      <div className="space-y-6">
        <CategorySection category="product"  projects={byCategory.product} />
        <CategorySection category="agent"    projects={byCategory.agent} />
        <CategorySection category="solution" projects={byCategory.solution} />
      </div>
    </div>
  )
}
