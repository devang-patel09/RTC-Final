import { useParams, Link, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { cn } from '../utils/cn';
import { LayoutDashboard, Bug, GitBranch, BarChart3, Activity, Settings, AlertCircle } from 'lucide-react';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const location = useLocation();
  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then(r => r.data.data),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  if (error) return <div className="flex items-center justify-center h-64 text-danger"><AlertCircle className="w-6 h-6 mr-2" /> Failed to load project</div>;
  if (!project) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  const tabs = [
    { path: `/projects/${projectId}`, label: 'Board', icon: LayoutDashboard, exact: true },
    { path: `/projects/${projectId}/bugs`, label: 'Bugs', icon: Bug },
    { path: `/projects/${projectId}/sprints`, label: 'Sprints', icon: GitBranch },
    { path: `/projects/${projectId}/activity`, label: 'Activity', icon: Activity },
    { path: `/projects/${projectId}/analytics`, label: 'Analytics', icon: BarChart3 },
    { path: `/projects/${projectId}/settings`, label: 'Settings', icon: Settings },
  ];

  const isActive = (tab) => {
    if (tab.exact) return location.pathname === tab.path;
    return location.pathname.startsWith(tab.path);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-lg">{project.key}</div>
          <div>
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <p className="text-sm text-secondary-500">{project.members?.length} members</p>
          </div>
        </div>
      </div>
      {project.description && (
        <p className="text-secondary-600 dark:text-secondary-400 -mt-2">{project.description}</p>
      )}
      <div className="flex gap-1 border-b border-secondary-200 dark:border-secondary-700 pb-1 overflow-x-auto -mx-1 px-1">
        {tabs.map(tab => (
          <Link
            key={tab.path}
            to={tab.path}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors',
              isActive(tab)
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50 dark:bg-primary-900/10'
                : 'text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800/50'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Link>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
