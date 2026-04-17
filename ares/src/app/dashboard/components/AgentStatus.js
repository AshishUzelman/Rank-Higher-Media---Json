'use client';

export default function AgentStatus({ status }) {
  const agents = [
    { id: 'qwen', name: 'Qwen', model: 'qwen3:30b-a3b' },
    { id: 'gemma', name: 'Gemma', model: 'gemma3:12b' },
    { id: 'claude', name: 'Claude', model: 'claude-sonnet-4-6' }
  ];

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700">
      <div className="p-5 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white">Agent Status</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {agents.map(agent => {
          const agentData = status[agent.id] || {};
          const statusColor = agentData.status === 'active' ? 'bg-green-500' : 'bg-gray-500';
          const statusText = agentData.status || 'idle';

          return (
            <div key={agent.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-white">{agent.name}</h3>
                <span className={`w-2 h-2 rounded-full ${statusColor}`}></span>
              </div>
              <p className="text-gray-300 text-sm mb-2">{agent.model}</p>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Status:</span>
                <span className="font-medium">{statusText}</span>
              </div>
              {agentData.currentTask && (
                <div className="mt-2 text-xs">
                  <span className="text-gray-400">Task:</span>
                  <span className="ml-1">{agentData.currentTask}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
