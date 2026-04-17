'use client';

export default function FileTree() {
  const files = [
    { name: 'src/', type: 'folder', status: 'modified' },
    { name: 'app/', type: 'folder', status: 'added' },
    { name: 'dashboard/', type: 'folder', status: 'modified' },
    { name: 'page.js', type: 'file', status: 'modified' },
    { name: 'components/', type: 'folder', status: 'modified' },
    { name: 'ProjectCard.js', type: 'file', status: 'modified' },
    { name: 'TaskQueue.js', type: 'file', status: 'added' },
    { name: 'README.md', type: 'file', status: 'unchanged' }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'modified': return 'M';
      case 'added': return '+';
      case 'deleted': return '-';
      default: return '✓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'modified': return 'text-yellow-400';
      case 'added': return 'text-green-400';
      case 'deleted': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700">
      <div className="p-5 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white">Project Files</h2>
      </div>
      <div className="overflow-y-auto max-h-96">
        {files.map((file, index) => (
          <div key={index} className="flex items-center px-4 py-2 hover:bg-gray-700 transition-colors">
            <span className={`mr-2 text-sm ${getStatusColor(file.status)}`}>
              {getStatusIcon(file.status)}
            </span>
            <div className="flex-1">
              <div className="flex items-center">
                <span className="mr-2 text-gray-400">
                  {file.type === 'folder' ? '📁' : '📄'}
                </span>
                <span className="text-white">{file.name}</span>
              </div>
              {file.type === 'folder' && (
                <div className="ml-6 text-xs text-gray-400">
                  {file.name} (folder)
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
