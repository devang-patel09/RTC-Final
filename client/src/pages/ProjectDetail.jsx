import { useParams, Link, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then(r => r.data.data),
  });

  if (!project) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-lg">{project.key}</div>
        <div>
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <p className="text-sm text-secondary-500">{project.members?.length} members</p>
        </div>
      </div>
      <p className="text-secondary-600 dark:text-secondary-400">{project.description || 'No description'}</p>
      <Outlet />
    </div>
  );
}
