import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Plus, Play, CheckCircle, XCircle, BarChart3, Edit3, Trash2 } from 'lucide-react';
import { cn, formatDate } from '../utils/cn';
import toast from 'react-hot-toast';

function SprintStats({ sprintId, projectId }) {
  const { data: stats } = useQuery({
    queryKey: ['sprintStats', sprintId],
    queryFn: () => api.get(`/projects/${projectId}/sprints/${sprintId}/stats`).then(r => r.data.data),
    enabled: !!projectId,
  });

  if (!stats) return null;

  return (
    <div className="mt-3 grid grid-cols-4 gap-3">
      <div className="text-center p-2 bg-secondary-50 dark:bg-secondary-800/50 rounded-lg">
        <p className="text-lg font-bold text-primary-600">{stats.completionPercentage}%</p>
        <p className="text-xs text-secondary-500">Complete</p>
      </div>
      <div className="text-center p-2 bg-secondary-50 dark:bg-secondary-800/50 rounded-lg">
        <p className="text-lg font-bold text-success">{stats.completedBugs}</p>
        <p className="text-xs text-secondary-500">Done</p>
      </div>
      <div className="text-center p-2 bg-secondary-50 dark:bg-secondary-800/50 rounded-lg">
        <p className="text-lg font-bold text-warning">{stats.inProgressBugs}</p>
        <p className="text-xs text-secondary-500">In Progress</p>
      </div>
      <div className="text-center p-2 bg-secondary-50 dark:bg-secondary-800/50 rounded-lg">
        <p className="text-lg font-bold text-secondary-400">{stats.todoBugs}</p>
        <p className="text-xs text-secondary-500">To Do</p>
      </div>
      {stats.totalDays > 0 && (
        <div className="col-span-4">
          <div className="flex justify-between text-xs text-secondary-400 mb-1">
            <span>Progress</span>
            <span>{stats.elapsedDays}/{stats.totalDays} days</span>
          </div>
          <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
            <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, stats.progress)}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Sprints() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [expandedSprint, setExpandedSprint] = useState(null);
  const [form, setForm] = useState({ name: '', goal: '', startDate: '', endDate: '' });
  const [editForm, setEditForm] = useState({ name: '', goal: '', startDate: '', endDate: '' });

  const { data: sprints } = useQuery({
    queryKey: ['sprints', projectId],
    queryFn: () => api.get(`/projects/${projectId}/sprints`).then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post(`/projects/${projectId}/sprints`, data),
    onSuccess: () => { queryClient.invalidateQueries(['sprints', projectId]); setShowModal(false); setForm({ name: '', goal: '', startDate: '', endDate: '' }); toast.success('Sprint created!'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/projects/${projectId}/sprints/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries(['sprints', projectId]); setShowEditModal(null); toast.success('Sprint updated!'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/projects/${projectId}/sprints/${id}`),
    onSuccess: () => { queryClient.invalidateQueries(['sprints', projectId]); toast.success('Sprint deleted!'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }) => api.post(`/projects/${projectId}/sprints/${id}/${action}`),
    onSuccess: () => { queryClient.invalidateQueries(['sprints', projectId]); toast.success('Sprint updated!'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const update = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));
  const statusColors = { planned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', completed: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300', cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };

  const openEdit = (s) => {
    setEditForm({ name: s.name, goal: s.goal || '', startDate: s.startDate?.split('T')[0] || '', endDate: s.endDate?.split('T')[0] || '' });
    setShowEditModal(s._id);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sprints</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Sprint</button>
      </div>

      <div className="space-y-3">
        {sprints?.map(s => (
          <div key={s._id} className="card p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{s.name}</h3>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', statusColors[s.status])}>{s.status}</span>
                </div>
                {s.goal && <p className="text-sm text-secondary-500">{s.goal}</p>}
                <p className="text-xs text-secondary-400 mt-1">{formatDate(s.startDate)} - {formatDate(s.endDate)}</p>
              </div>
              <div className="flex gap-1">
                {(s.status === 'planned' || s.status === 'active') && (
                  <button onClick={() => openEdit(s)} className="btn-sm btn-ghost"><Edit3 className="w-3 h-3" /></button>
                )}
                {s.status === 'planned' && <button onClick={() => actionMutation.mutate({ id: s._id, action: 'start' })} className="btn-sm btn-secondary"><Play className="w-3 h-3" /> Start</button>}
                {s.status === 'active' && (
                  <>
                    <button onClick={() => setExpandedSprint(expandedSprint === s._id ? null : s._id)} className="btn-sm btn-ghost"><BarChart3 className="w-3 h-3" /></button>
                    <button onClick={() => actionMutation.mutate({ id: s._id, action: 'complete' })} className="btn-sm btn-primary"><CheckCircle className="w-3 h-3" /> Complete</button>
                  </>
                )}
                {s.status === 'completed' && (
                  <button onClick={() => setExpandedSprint(expandedSprint === s._id ? null : s._id)} className="btn-sm btn-ghost"><BarChart3 className="w-3 h-3" /></button>
                )}
                {(s.status === 'planned' || s.status === 'active') && <button onClick={() => actionMutation.mutate({ id: s._id, action: 'cancel' })} className="btn-sm btn-secondary text-danger"><XCircle className="w-3 h-3" /></button>}
                {s.status === 'planned' && (
                  <button onClick={() => { if (confirm('Delete this sprint?')) deleteMutation.mutate(s._id); }} className="btn-sm btn-secondary text-danger"><Trash2 className="w-3 h-3" /></button>
                )}
              </div>
            </div>
            {expandedSprint === s._id && <SprintStats sprintId={s._id} projectId={projectId} />}
          </div>
        ))}
        {(!sprints || sprints.length === 0) && <p className="text-center text-secondary-500 py-8">No sprints yet</p>}
      </div>

      {showEditModal && (() => {
        const s = sprints?.find(sp => sp._id === showEditModal);
        if (!s) return null;
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEditModal(null)}>
            <div className="bg-white dark:bg-secondary-800 rounded-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4">Edit Sprint</h2>
              <form onSubmit={e => { e.preventDefault(); updateMutation.mutate({ id: showEditModal, data: editForm }); }} className="space-y-4">
                <div><label className="label">Sprint Name</label><input className="input" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} required /></div>
                <div><label className="label">Goal</label><textarea className="input" value={editForm.goal} onChange={e => setEditForm(p => ({ ...p, goal: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="label">Start Date</label><input type="date" className="input" value={editForm.startDate} onChange={e => setEditForm(p => ({ ...p, startDate: e.target.value }))} required /></div>
                  <div><label className="label">End Date</label><input type="date" className="input" value={editForm.endDate} onChange={e => setEditForm(p => ({ ...p, endDate: e.target.value }))} required /></div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowEditModal(null)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={updateMutation.isPending} className="btn-primary">{updateMutation.isPending ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-secondary-800 rounded-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Create Sprint</h2>
            <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
              <div><label className="label">Sprint Name</label><input className="input" value={form.name} onChange={update('name')} required /></div>
              <div><label className="label">Goal</label><textarea className="input" value={form.goal} onChange={update('goal')} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Start Date</label><input type="date" className="input" value={form.startDate} onChange={update('startDate')} required /></div>
                <div><label className="label">End Date</label><input type="date" className="input" value={form.endDate} onChange={update('endDate')} required /></div>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
