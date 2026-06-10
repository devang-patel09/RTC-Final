import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../store/AuthContext';
import { useTheme } from '../store/ThemeContext';
import { User, Shield, Bell, Github, Palette, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const queryClient = useQueryClient();

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then(r => r.data.data),
    enabled: !!projectId,
  });

  const inviteMutation = useMutation({
    mutationFn: (data) => api.post(`/projects/${projectId}/members/invite`, data),
    onSuccess: () => { queryClient.invalidateQueries(['project', projectId]); toast.success('Member invited!'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to invite'),
  });

  const removeMutation = useMutation({
    mutationFn: (memberId) => api.delete(`/projects/${projectId}/members/${memberId}`),
    onSuccess: () => { queryClient.invalidateQueries(['project', projectId]); toast.success('Member removed'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove'),
  });

  const roleMutation = useMutation({
    mutationFn: ({ memberId, role }) => api.patch(`/projects/${projectId}/members/${memberId}/role`, { role }),
    onSuccess: () => { queryClient.invalidateQueries(['project', projectId]); toast.success('Role updated'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update role'),
  });

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('developer');

  const isOwner = String(project?.owner?._id) === String(user?._id);

  const tabs = projectId ? ['general', 'members', 'github'] : ['profile', 'appearance', 'notifications'];
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <div className="max-w-3xl animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="flex gap-2 mb-6 border-b border-secondary-200 dark:border-secondary-700 pb-2">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-t-lg capitalize ${activeTab === tab ? 'text-primary-600 border-b-2 border-primary-600' : 'text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'}`}>
            {tab === 'general' && <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> General</span>}
            {tab === 'members' && <span className="flex items-center gap-1"><Users className="w-4 h-4" /> Members</span>}
            {tab === 'github' && <span className="flex items-center gap-1"><Github className="w-4 h-4" /> GitHub</span>}
            {tab === 'profile' && <span className="flex items-center gap-1"><User className="w-4 h-4" /> Profile</span>}
            {tab === 'appearance' && <span className="flex items-center gap-1"><Palette className="w-4 h-4" /> Appearance</span>}
            {tab === 'notifications' && <span className="flex items-center gap-1"><Bell className="w-4 h-4" /> Notifications</span>}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold">Profile Information</h3>
          <div><label className="label">Full Name</label><input className="input" defaultValue={user?.fullName} /></div>
          <div><label className="label">Email</label><input className="input" defaultValue={user?.email} disabled /></div>
          <div><label className="label">Role</label><input className="input" value={user?.role} disabled /></div>
          <button onClick={() => toast.success('Profile updated')} className="btn-primary">Save Changes</button>
        </div>
      )}

      {activeTab === 'appearance' && (
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold">Appearance</h3>
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary-50 dark:bg-secondary-700/50">
            <div><p className="font-medium">Dark Mode</p><p className="text-sm text-secondary-500">Toggle dark/light theme</p></div>
            <button onClick={toggleTheme} className={`relative w-12 h-6 rounded-full transition-colors ${dark ? 'bg-primary-600' : 'bg-secondary-300'}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${dark ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'general' && project && (
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold">Project Settings</h3>
          <div><label className="label">Project Name</label><input className="input" defaultValue={project.title} /></div>
          <div><label className="label">Description</label><textarea className="input min-h-[80px]" defaultValue={project.description} /></div>
          <div className="flex justify-between items-center p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <div><p className="font-medium text-danger">Danger Zone</p><p className="text-sm text-secondary-500">Archive this project permanently</p></div>
            <button className="btn-danger btn-sm"><Trash2 className="w-3 h-3" /> Archive Project</button>
          </div>
        </div>
      )}

      {activeTab === 'members' && project && (
        <div className="space-y-4">
          {isOwner && (
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Invite Member</h3>
              <div className="flex gap-3">
                <input className="input flex-1" placeholder="Email address" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                <select className="input w-auto" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                  <option value="developer">Developer</option>
                  <option value="tester">Tester</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={() => { inviteMutation.mutate({ email: inviteEmail, role: inviteRole }); setInviteEmail(''); }} className="btn-primary">Invite</button>
              </div>
            </div>
          )}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Team Members ({project.members?.length})</h3>
            <div className="space-y-3">
              {project.members?.map(m => (
                <div key={m.user._id} className="flex items-center justify-between p-3 rounded-lg bg-secondary-50 dark:bg-secondary-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-medium">{m.user.fullName?.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-medium">{m.user.fullName} {m.user._id === project.owner._id && <span className="text-xs text-primary-600">(Owner)</span>}</p>
                      <p className="text-xs text-secondary-500">{m.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOwner && m.user._id !== project.owner._id && (
                      <>
                        <select className="input w-auto text-xs py-1" value={m.role} onChange={e => roleMutation.mutate({ memberId: m.user._id, role: e.target.value })}>
                          <option value="admin">Admin</option>
                          <option value="developer">Developer</option>
                          <option value="tester">Tester</option>
                        </select>
                        <button onClick={() => { if (confirm('Remove this member?')) removeMutation.mutate(m.user._id); }} className="p-1.5 text-danger hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Trash2 className="w-4 h-4" /></button>
                      </>
                    )}
                    {!isOwner && <span className="text-xs capitalize px-2 py-1 rounded bg-secondary-200 dark:bg-secondary-600">{m.role}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'github' && (
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><Github className="w-5 h-5" /> GitHub Integration</h3>
          <p className="text-sm text-secondary-500">Connect your project to a GitHub repository to link PRs and auto-close bugs on merge.</p>
          <div className="p-4 rounded-lg bg-secondary-50 dark:bg-secondary-700/50">
            <label className="label">Repository (owner/repo)</label>
            <input className="input" placeholder="e.g., octocat/hello-world" />
            <button onClick={() => toast.success('GitHub integration coming soon')} className="btn-primary mt-3">Connect Repository</button>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold">Notification Preferences</h3>
          {['Email notifications', 'Push notifications', 'Assignment alerts', 'Deadline reminders'].map(n => (
            <div key={n} className="flex items-center justify-between p-3 rounded-lg bg-secondary-50 dark:bg-secondary-700/50">
              <p className="text-sm font-medium">{n}</p>
              <div className="relative w-10 h-5 rounded-full bg-primary-600 cursor-pointer"><div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-white shadow" /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
