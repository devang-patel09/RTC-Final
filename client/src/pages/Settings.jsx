import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../store/AuthContext';
import { useTheme } from '../store/ThemeContext';
import { User, Shield, Bell, Github, Palette, Trash2, Users, Building2 } from 'lucide-react';
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

  const { data: github } = useQuery({
    queryKey: ['github', projectId],
    queryFn: () => api.get(`/github/${projectId}`).then(r => r.data.data),
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

  const updateProjectMutation = useMutation({
    mutationFn: (data) => api.patch(`/projects/${projectId}`, data),
    onSuccess: () => { queryClient.invalidateQueries(['project', projectId]); toast.success('Project updated!'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update project'),
  });

  const archiveProjectMutation = useMutation({
    mutationFn: () => api.delete(`/projects/${projectId}`),
    onSuccess: () => { queryClient.invalidateQueries(['projects']); toast.success('Project archived!'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to archive project'),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => api.patch('/auth/me', data),
    onSuccess: () => { queryClient.invalidateQueries(['user']); toast.success('Profile updated!'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update profile'),
  });

  const githubConnectMutation = useMutation({
    mutationFn: (repo) => api.post(`/github/${projectId}`, { repo }),
    onSuccess: () => { queryClient.invalidateQueries(['github', projectId]); toast.success('Repository connected!'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to connect repository'),
  });

  const createOrgMutation = useMutation({
    mutationFn: (data) => api.post('/auth/create-organization', data),
    onSuccess: () => { queryClient.invalidateQueries(['user']); toast.success('Organization created!'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create organization'),
  });

  const [orgName, setOrgName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('developer');
  const [profileName, setProfileName] = useState(user?.fullName || '');
  const [githubRepo, setGithubRepo] = useState('');
  const [notifPrefs, setNotifPrefs] = useState({
    email: true, push: true, assignments: true, deadlines: true,
  });

  const isOwner = String(project?.owner?._id) === String(user?._id);

  const tabs = projectId
    ? ['general', 'members', 'github']
    : user?.accountType === 'individual'
      ? ['profile', 'appearance', 'notifications', 'organization']
      : ['profile', 'appearance', 'notifications'];
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
            {tab === 'organization' && <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> Organization</span>}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold">Profile Information</h3>
          <div><label className="label">Full Name</label><input className="input" value={profileName} onChange={e => setProfileName(e.target.value)} /></div>
          <div><label className="label">Email</label><input className="input" defaultValue={user?.email} disabled /></div>
          <div><label className="label">Role</label><input className="input" value={user?.role} disabled /></div>
          <button onClick={() => updateProfileMutation.mutate({ fullName: profileName })} disabled={updateProfileMutation.isPending} className="btn-primary">{updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}</button>
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
          <form onSubmit={e => { e.preventDefault(); const fd = new FormData(e.target); updateProjectMutation.mutate({ title: fd.get('title'), description: fd.get('description') }); }}>
            <div><label className="label">Project Name</label><input className="input" name="title" defaultValue={project.title} /></div>
            <div><label className="label">Description</label><textarea className="input min-h-[80px]" name="description" defaultValue={project.description} /></div>
            <button type="submit" disabled={updateProjectMutation.isPending} className="btn-primary mt-4">{updateProjectMutation.isPending ? 'Saving...' : 'Save Changes'}</button>
          </form>
          <div className="flex justify-between items-center p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
            <div><p className="font-medium text-danger">Danger Zone</p><p className="text-sm text-secondary-500">Archive this project permanently</p></div>
            <button onClick={() => { if (confirm('Are you sure you want to archive this project?')) archiveProjectMutation.mutate(); }} disabled={archiveProjectMutation.isPending} className="btn-danger btn-sm"><Trash2 className="w-3 h-3" /> {archiveProjectMutation.isPending ? 'Archiving...' : 'Archive Project'}</button>
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
                <button onClick={() => { inviteMutation.mutate({ email: inviteEmail, role: inviteRole }); setInviteEmail(''); }} disabled={inviteMutation.isPending} className="btn-primary">{inviteMutation.isPending ? '...' : 'Invite'}</button>
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
            <input className="input" placeholder="e.g., octocat/hello-world" value={githubRepo} onChange={e => setGithubRepo(e.target.value)} />
            <button onClick={() => { if (!githubRepo.trim()) return toast.error('Please enter a repository'); githubConnectMutation.mutate(githubRepo.trim()); }} disabled={githubConnectMutation.isPending} className="btn-primary mt-3">{githubConnectMutation.isPending ? 'Connecting...' : 'Connect Repository'}</button>
          </div>
          {github?.repository && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">Connected to: {github.repository}</p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">Linked PRs: {github.linkedPRs?.length || 0}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'organization' && (
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><Building2 className="w-5 h-5" /> Create Organization</h3>
          <p className="text-sm text-secondary-500">Upgrade your personal account to an organization to collaborate with a team.</p>
          <form onSubmit={e => { e.preventDefault(); createOrgMutation.mutate({ organizationName: orgName }); }}>
            <div>
              <label className="label">Organization Name</label>
              <input className="input" placeholder="Your Company or Team" value={orgName} onChange={e => setOrgName(e.target.value)} required />
            </div>
            <button type="submit" disabled={createOrgMutation.isPending || !orgName.trim()} className="btn-primary mt-4">{createOrgMutation.isPending ? 'Creating...' : 'Create Organization'}</button>
          </form>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold">Notification Preferences</h3>
          {[
            { key: 'email', label: 'Email notifications' },
            { key: 'push', label: 'Push notifications' },
            { key: 'assignments', label: 'Assignment alerts' },
            { key: 'deadlines', label: 'Deadline reminders' },
          ].map(n => (
            <div key={n.key} className="flex items-center justify-between p-3 rounded-lg bg-secondary-50 dark:bg-secondary-700/50">
              <p className="text-sm font-medium">{n.label}</p>
              <button
                onClick={() => setNotifPrefs(p => ({ ...p, [n.key]: !p[n.key] }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${notifPrefs[n.key] ? 'bg-primary-600' : 'bg-secondary-300 dark:bg-secondary-600'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${notifPrefs[n.key] ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
