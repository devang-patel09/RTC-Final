import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Plus, Search, Filter } from 'lucide-react';
import { cn, severityColors, priorityColors, statusColors, statusLabels, formatDate } from '../utils/cn';

export default function Bugs() {
  const { projectId } = useParams();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const { data: bugs } = useQuery({
    queryKey: ['bugs', projectId],
    queryFn: () => api.get(`/projects/${projectId}/bugs`).then(r => r.data.data),
  });

  const filtered = (bugs || []).filter(b => {
    if (filter !== 'all' && b.status !== filter) return false;
    if (search && !b.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statuses = [...new Set(bugs?.map(b => b.status) || [])];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bugs</h1>
        <Link to={`/projects/${projectId}/bugs/new`} className="btn-primary"><Plus className="w-4 h-4" /> Report Bug</Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input className="input pl-9" placeholder="Search bugs..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Status</option>
          {statuses.map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 dark:bg-secondary-700/50">
              <tr>
                <th className="text-left p-3 text-xs font-medium text-secondary-500 uppercase">Bug</th>
                <th className="text-left p-3 text-xs font-medium text-secondary-500 uppercase">Status</th>
                <th className="text-left p-3 text-xs font-medium text-secondary-500 uppercase">Severity</th>
                <th className="text-left p-3 text-xs font-medium text-secondary-500 uppercase">Priority</th>
                <th className="text-left p-3 text-xs font-medium text-secondary-500 uppercase">Assignee</th>
                <th className="text-left p-3 text-xs font-medium text-secondary-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
              {filtered.map(bug => (
                <tr key={bug._id} className="hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors">
                  <td className="p-3">
                    <Link to={`/projects/${projectId}/bugs/${bug._id}`} className="text-sm font-medium hover:text-primary-600">{bug.title}</Link>
                    {bug.dueDate && <p className="text-xs text-secondary-400 mt-0.5">Due: {formatDate(bug.dueDate)}</p>}
                  </td>
                  <td className="p-3"><span className={cn('text-xs', statusColors[bug.status])}>{statusLabels[bug.status]}</span></td>
                  <td className="p-3"><span className={cn('text-xs', severityColors[bug.severity])}>{bug.severity}</span></td>
                  <td className="p-3"><span className={cn('text-xs', priorityColors[bug.priority])}>{bug.priority}</span></td>
                  <td className="p-3">
                    {bug.assignee ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs">{bug.assignee.fullName?.charAt(0)}</div>
                        <span className="text-sm">{bug.assignee.fullName?.split(' ')[0]}</span>
                      </div>
                    ) : <span className="text-sm text-secondary-400">Unassigned</span>}
                  </td>
                  <td className="p-3 text-sm text-secondary-500">{formatDate(bug.createdAt)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-secondary-500">No bugs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
