import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth, ROLES } from '../store/AuthContext';
import { Building2, Users, Mail, UserPlus, X, RefreshCw, Shield, Settings as SettingsIcon, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';

export default function Organization() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('developer');
  const [showSettings, setShowSettings] = useState(false);
  const [orgName, setOrgName] = useState('');

  const { data: org, isLoading } = useQuery({
    queryKey: ['organization'],
    queryFn: () => api.get('/organizations/me').then(r => r.data.data),
  });

  const { data: members } = useQuery({
    queryKey: ['orgMembers'],
    queryFn: () => api.get('/organizations/me/members').then(r => r.data.data),
  });

  const { data: invites } = useQuery({
    queryKey: ['orgInvites'],
    queryFn: () => api.get('/organizations/me/invites').then(r => r.data.data),
    enabled: user?.role === ROLES.ORG_ADMIN || user?.role === ROLES.SUPER_ADMIN,
  });

  const { data: orgStats } = useQuery({
    queryKey: ['orgStats'],
    queryFn: () => api.get('/organizations/me/stats').then(r => r.data.data),
  });

  const inviteMutation = useMutation({
    mutationFn: (data) => api.post('/organizations/me/invite', data),
    onSuccess: (resp) => {
      queryClient.invalidateQueries(['orgInvites']);
      setInviteEmail('');
      setShowInvite(false);
      if (resp.data?.warning) {
        toast.error(resp.data.warning, { duration: 6000 });
      } else {
        toast.success('Invite sent!');
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to invite'),
  });

  const revokeInviteMutation = useMutation({
    mutationFn: (inviteId) => api.patch(`/organizations/me/invites/${inviteId}/revoke`),
    onSuccess: () => { queryClient.invalidateQueries(['orgInvites']); toast.success('Invite revoked'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to revoke'),
  });

  const resendInviteMutation = useMutation({
    mutationFn: (inviteId) => api.post(`/organizations/me/invites/${inviteId}/resend`),
    onSuccess: (resp) => {
      if (resp.data?.warning) {
        toast.error(resp.data.warning, { duration: 6000 });
      } else {
        toast.success('Invite resent!');
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to resend'),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }) => api.patch(`/organizations/me/members/${memberId}`, { role }),
    onSuccess: () => { queryClient.invalidateQueries(['orgMembers']); toast.success('Role updated'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update role'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId) => api.delete(`/organizations/me/members/${memberId}`),
    onSuccess: () => { queryClient.invalidateQueries(['orgMembers']); toast.success('Member removed'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove member'),
  });

  const updateOrgMutation = useMutation({
    mutationFn: (data) => api.patch('/organizations/me', data),
    onSuccess: () => { queryClient.invalidateQueries(['organization']); toast.success('Organization updated'); setShowSettings(false); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const deleteOrgMutation = useMutation({
    mutationFn: () => api.delete('/organizations/me'),
    onSuccess: () => { queryClient.invalidateQueries(['organization']); toast.success('Organization deleted'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const isAdmin = user?.role === ROLES.ORG_ADMIN || user?.role === ROLES.SUPER_ADMIN;

  if (isLoading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'members', label: 'Members', icon: Users },
    ...(isAdmin ? [{ id: 'invites', label: 'Invites', icon: Mail }] : []),
    ...(isAdmin ? [{ id: 'settings', label: 'Settings', icon: SettingsIcon }] : []),
  ];

  const roleColors = {
    super_admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    org_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    project_manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    developer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    tester: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    viewer: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300',
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{org?.name || 'Organization'}</h1>
            <p className="text-sm text-secondary-500">{org?.plan} plan · {orgStats?.totalMembers || 0} members</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-secondary-200 dark:border-secondary-700 pb-2 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg capitalize whitespace-nowrap',
              activeTab === tab.id
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
            )}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5 text-center">
            <p className="text-3xl font-bold text-primary-600">{orgStats?.totalProjects || 0}</p>
            <p className="text-sm text-secondary-500 mt-1">Projects</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-3xl font-bold text-primary-600">{orgStats?.totalMembers || 0}</p>
            <p className="text-sm text-secondary-500 mt-1">Members</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-3xl font-bold text-primary-600">{orgStats?.totalBugs || 0}</p>
            <p className="text-sm text-secondary-500 mt-1">Total Bugs</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-secondary-500">Plan</p>
            <p className="text-lg font-semibold capitalize">{org?.plan || 'Free'}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-secondary-500">Members</p>
            <p className="text-lg font-semibold">{orgStats?.totalMembers || 0}/{org?.maxMembers || 10}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-secondary-500">Projects</p>
            <p className="text-lg font-semibold">{orgStats?.totalProjects || 0}/{org?.maxProjects || 5}</p>
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-secondary-200 dark:border-secondary-700 flex items-center justify-between">
            <h3 className="font-semibold">Team Members ({members?.length || 0})</h3>
            {isAdmin && (
              <button onClick={() => setShowInvite(true)} className="btn-primary btn-sm">
                <UserPlus className="w-3.5 h-3.5" /> Invite
              </button>
            )}
          </div>
          <div className="divide-y divide-secondary-200 dark:divide-secondary-700">
            {members?.map(m => (
              <div key={m._id} className="flex items-center justify-between p-4 hover:bg-secondary-50 dark:hover:bg-secondary-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
                    {m.fullName?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.fullName} {m._id === org?.owner?._id && <span className="text-xs text-primary-600">(Owner)</span>}</p>
                    <p className="text-xs text-secondary-500">{m.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', roleColors[m.role] || 'bg-secondary-100')}>
                    {m.role?.replace(/_/g, ' ')}
                  </span>
                  {isAdmin && m._id !== user?._id && m._id !== org?.owner?._id && (
                    <div className="flex gap-1">
                      <select
                        className="input w-auto text-xs py-1"
                        value={m.role}
                        onChange={e => updateRoleMutation.mutate({ memberId: m._id, role: e.target.value })}
                      >
                        <option value="org_admin">Org Admin</option>
                        <option value="project_manager">Project Manager</option>
                        <option value="developer">Developer</option>
                        <option value="tester">Tester</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        onClick={() => { if (confirm('Remove this member from organization?')) removeMemberMutation.mutate(m._id); }}
                        className="p-1.5 text-danger hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'invites' && (
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold mb-4">Pending Invites</h3>
            {invites?.length === 0 ? (
              <p className="text-sm text-secondary-500 text-center py-4">No pending invites</p>
            ) : (
              <div className="divide-y divide-secondary-200 dark:divide-secondary-700">
                {invites?.filter(i => i.status === 'pending').map(invite => (
                  <div key={invite._id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{invite.email}</p>
                      <p className="text-xs text-secondary-500 capitalize">Role: {invite.role} · Invited by {invite.invitedBy?.fullName}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => resendInviteMutation.mutate(invite._id)} className="btn-sm btn-secondary" title="Resend">
                        <RefreshCw className="w-3 h-3" />
                      </button>
                      <button onClick={() => { if (confirm('Revoke this invite?')) revokeInviteMutation.mutate(invite._id); }} className="btn-sm btn-secondary text-danger" title="Revoke">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold">Organization Settings</h3>
          <div>
            <label className="label">Organization Name</label>
            <input className="input" defaultValue={org?.name} onChange={e => setOrgName(e.target.value)} />
          </div>
          <div>
            <label className="label">Slug</label>
            <input className="input" value={org?.slug} disabled />
          </div>
          <div>
            <label className="label">Plan</label>
            <input className="input" value={org?.plan} disabled />
          </div>
          <button
            onClick={() => updateOrgMutation.mutate({ name: orgName || org?.name })}
            className="btn-primary"
          >
            Save Changes
          </button>
          <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700">
            <div className="flex justify-between items-center p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
              <div>
                <p className="font-medium text-danger">Danger Zone</p>
                <p className="text-sm text-secondary-500">Delete organization and all associated data</p>
              </div>
              <button onClick={() => { if (confirm('Are you sure you want to delete this organization and all associated data? This action cannot be undone.')) deleteOrgMutation.mutate(); }} disabled={deleteOrgMutation.isPending} className="btn-danger btn-sm"><Trash2 className="w-3 h-3" /> {deleteOrgMutation.isPending ? 'Deleting...' : 'Delete Organization'}</button>
            </div>
          </div>
        </div>
      )}

      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowInvite(false)}>
          <div className="bg-white dark:bg-secondary-800 rounded-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Invite Member</h2>
            <form onSubmit={e => { e.preventDefault(); inviteMutation.mutate({ email: inviteEmail, role: inviteRole }); }} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <input type="email" className="input" placeholder="colleague@company.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                  <option value="project_manager">Project Manager</option>
                  <option value="developer">Developer</option>
                  <option value="tester">Tester</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowInvite(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Send Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}