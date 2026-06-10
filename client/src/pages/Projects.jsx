import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Plus, FolderKanban, MoreHorizontal, Settings, Users, BarChart3, Archive } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Projects() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const queryClient = useQueryClient();

  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: () => api.get('/projects').then(r => r.data.data) });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/projects', data),
    onSuccess: () => { queryClient.invalidateQueries(['projects']); setShowModal(false); setForm({ title: '', description: '' }); toast.success('Project created!'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create project'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/projects/${id}`),
    onSuccess: () => { queryClient.invalidateQueries(['projects']); toast.success('Project archived'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Project</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects?.filter(p => p.status !== 'deleted').map(p => (
          <div key={p._id} className="card p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold">{p.key}</div>
                <div>
                  <Link to={`/projects/${p._id}`} className="font-semibold hover:text-primary-600">{p.title}</Link>
                  <p className="text-xs text-secondary-500">{p.members?.length || 0} members</p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link to={`/projects/${p._id}/settings`} className="p-1.5 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded"><Settings className="w-4 h-4" /></Link>
                <button onClick={() => { if (confirm('Archive this project?')) deleteMutation.mutate(p._id); }} className="p-1.5 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded text-danger"><Archive className="w-4 h-4" /></button>
              </div>
            </div>
            <p className="text-sm text-secondary-600 dark:text-secondary-400 line-clamp-2 mb-3">{p.description || 'No description'}</p>
            <div className="flex items-center gap-3 text-xs text-secondary-500">
              <Link to={`/projects/${p._id}/board`} className="flex items-center gap-1 hover:text-primary-600"><BarChart3 className="w-3 h-3" /> Board</Link>
              <Link to={`/projects/${p._id}/bugs`} className="flex items-center gap-1 hover:text-primary-600"><Users className="w-3 h-3" /> Bugs</Link>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-secondary-800 rounded-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Create Project</h2>
            <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
              <div>
                <label className="label">Project Name</label>
                <input className="input" placeholder="My Project" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[80px]" placeholder="Describe your project..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary">{createMutation.isPending ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
