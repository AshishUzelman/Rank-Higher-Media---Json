'use client';

import { useState, useEffect } from 'react';
import ProjectCard from './ProjectCard';
import TaskQueue from './TaskQueue';
import AgentStatus from './AgentStatus';
import BrainstormPanel from './BrainstormPanel';
import FileTree from './FileTree';

export default function DashboardLayout({ projects, tasks, agentStatus, brainstorms }) {
  const [activeTab, setActiveTab] = useState('projects');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Toggle sidebar for mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const tabs = [
    { id: 'projects', label: 'Projects', icon: 'folder' },
    { id: 'tasks', label: 'Task Queue', icon: 'list' },
    { id: 'agents', label: 'Agents', icon: 'users' },
    { id: 'brainstorm', label: 'Brainstorm', icon: 'message-circle' },
    { id: 'files', label: 'Files', icon: 'file' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">ARES Dashboard</h1>
        </div>
        <nav className="mt-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="mr-3">{tab.icon === 'folder' && '📁'}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className={`ml-0 transition-all duration-300 ease-in-out ${sidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-700 text-white"
            >
              {sidebarOpen ? '←' : '→'}
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'projects' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}

          {activeTab === 'tasks' && (
            <TaskQueue tasks={tasks} />
          )}

          {activeTab === 'agents' && (
            <AgentStatus status={agentStatus} />
          )}

          {activeTab === 'brainstorm' && (
            <BrainstormPanel brainstorms={brainstorms} />
          )}

          {activeTab === 'files' && (
            <FileTree />
          )}
        </div>
      </div>
    </div>
  );
}
