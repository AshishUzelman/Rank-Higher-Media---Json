'use client';

export default function ProjectCard({ project }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700 hover:shadow-xl transition-shadow duration-300">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-white">{project.name}</h3>
            <p className="text-gray-400 text-sm mt-1">{project.client}</p>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
        </div>
        <div className="mt-4">
          <p className="text-gray-300 text-sm">
            Last updated: {new Date(project.updated).toLocaleDateString()}
          </p>
          <div className="mt-2 flex space-x-2">
            <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors">
              View
            </button>
            <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
