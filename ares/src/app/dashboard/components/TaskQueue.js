'use client';

export default function TaskQueue({ tasks }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'in-progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700">
      <div className="p-5 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white">Task Queue</h2>
      </div>
      <div className="divide-y divide-gray-700">
        {tasks.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            No tasks in queue
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="p-4 flex justify-between items-center hover:bg-gray-700 transition-colors">
              <div>
                <h3 className="font-medium text-white">{task.title}</h3>
                <p className="text-gray-400 text-sm mt-1">{task.description}</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`}></span>
                <span className="text-sm text-gray-300">{task.status}</span>
                <span className="text-xs text-gray-500">{new Date(task.created).toLocaleTimeString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
