'use client';

import { useLiveTaskPhase } from '@/hooks/useLiveTaskPhase';
import { useMemo } from 'react';

const PHASE_ORDER = ['research', 'draft', 'critic', 'refine', 'supervisor'];

export default function PhaseTimeline({ task, taskId }) {
  const { task: liveTask, loading, error } = useLiveTaskPhase(taskId);
  const currentTask = taskId ? liveTask : task;

  const currentPhaseIndex = currentTask?.currentPhase
    ? PHASE_ORDER.indexOf(currentTask.currentPhase)
    : -1;

  const phases = useMemo(() => {
    return PHASE_ORDER.map((phase, i) => ({
      name: phase,
      completed: currentPhaseIndex > i,
      active: currentPhaseIndex === i,
    }));
  }, [currentPhaseIndex]);

  if (loading) return <div className="w-full bg-gray-800 rounded-lg p-4 animate-pulse h-16" />;
  if (error) return <div className="text-red-400 text-sm">Error loading task</div>;

  return (
    <div className="w-full bg-gray-800 rounded-lg p-4">
      <h3 className="font-medium text-gray-200 mb-3 text-sm">{currentTask?.title || 'Task'}</h3>
      <div className="flex justify-between items-center">
        {phases.map((phase, index) => (
          <div key={index} className="flex flex-col items-center gap-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              phase.completed ? 'bg-blue-500' :
              phase.active ? 'bg-blue-400 ring-2 ring-blue-300' :
              'bg-gray-600'
            }`}>
              {phase.completed && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={`text-xs ${
              phase.completed ? 'text-blue-400' :
              phase.active ? 'font-semibold text-blue-300' :
              'text-gray-500'
            }`}>
              {phase.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
