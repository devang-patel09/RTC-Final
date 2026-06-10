import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Sparkles } from 'lucide-react';

export default function CreateBug() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '', description: '', stepsToReproduce: '', expectedBehavior: '',
    actualBehavior: '', severity: 'minor', priority: 'medium', assignee: '', dueDate: '',
  });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then(r => r.data.data),
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post(`/projects/${projectId}/bugs`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['bugs', projectId]);
      toast.success('Bug created!');
      navigate(`/projects/${projectId}/bugs/${res.data.data._id}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create bug'),
  });

  const handleAiPriority = async () => {
    try {
      const { data } = await api.post('/ai/auto-priority', { title: form.title, description: form.description, severity: form.severity });
      setForm(p => ({ ...p, priority: data.data.suggestedPriority }));
      if (data.data.autoApplied) toast.success(`Priority set to ${data.data.suggestedPriority} (AI, ${Math.round(data.data.confidence * 100)}% confidence)`);
      else toast(`Suggested: ${data.data.suggestedPriority} (${Math.round(data.data.confidence * 100)}% confidence)`, { icon: '🤖' });
    } catch { toast.error('AI priority detection failed'); }
  };

  const update = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));
  const handleSubmit = (e) => { e.preventDefault(); mutation.mutate(form); };

  return (
    <div className="max-w-2xl animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Report New Bug</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label">Title *</label>
          <input className="input" placeholder="Brief description of the bug" value={form.title} onChange={update('title')} required />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-[100px]" placeholder="Detailed description..." value={form.description} onChange={update('description')} />
        </div>
        <div>
          <label className="label">Steps to Reproduce</label>
          <textarea className="input min-h-[80px]" placeholder="1. Go to...\n2. Click on...\n3. See error..." value={form.stepsToReproduce} onChange={update('stepsToReproduce')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Expected Behavior</label>
            <textarea className="input min-h-[60px]" placeholder="What should happen?" value={form.expectedBehavior} onChange={update('expectedBehavior')} />
          </div>
          <div>
            <label className="label">Actual Behavior</label>
            <textarea className="input min-h-[60px]" placeholder="What actually happened?" value={form.actualBehavior} onChange={update('actualBehavior')} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Severity</label>
            <select className="input" value={form.severity} onChange={update('severity')}>
              <option value="critical">Critical</option>
              <option value="major">Major</option>
              <option value="minor">Minor</option>
              <option value="trivial">Trivial</option>
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <div className="flex gap-2">
              <select className="input flex-1" value={form.priority} onChange={update('priority')}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <button type="button" onClick={handleAiPriority} className="btn-secondary btn-sm" title="AI Auto-detect priority">
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Assignee</label>
            <select className="input" value={form.assignee} onChange={update('assignee')}>
              <option value="">Unassigned</option>
              {project?.members?.map(m => (
                <option key={m.user._id} value={m.user._id}>{m.user.fullName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Due Date</label>
            <input type="date" className="input" value={form.dueDate} onChange={update('dueDate')} />
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-4">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary">{mutation.isPending ? 'Creating...' : 'Create Bug'}</button>
        </div>
      </form>
    </div>
  );
}
