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
