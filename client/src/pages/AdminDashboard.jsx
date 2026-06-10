import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Shield, Building2, Users, Bug, BarChart3, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const { data: orgs } = useQuery({
    queryKey: ['adminOrgs'],
    queryFn: () => api.get('/organizations/me').then(r => [r.data.data]),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data.data),
  });

  const stats = [
    { label: 'Organizations', value: orgs?.length || 0, icon: Building2, color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' },
    { label: 'Total Users', value: users?.length || 0, icon: Users, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Active Projects', value: '—', icon: Bug, color: 'text-success bg-green-50 dark:bg-green-900/20' },
    { label: 'System Health', value: 'Good', icon: Activity, color: 'text-success bg-green-50 dark:bg-green-900/20' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Shield className="w-7 h-7 text-primary-600" />
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="card p-5">
            <div className={`p-2.5 rounded-lg w-fit ${s.color} mb-3`}><s.icon className="w-5 h-5" /></div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-secondary-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Platform Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg">
              <span className="text-sm">Total Organizations</span>
              <span className="font-bold">{orgs?.length || 0}</span>
            </div>
            <div className="flex justify-between p-3 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg">
              <span className="text-sm">Total Users</span>
              <span className="font-bold">{users?.length || 0}</span>
            </div>
            <div className="flex justify-between p-3 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg">
              <span className="text-sm">System Status</span>
              <span className="font-bold text-success">Operational</span>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full text-left p-3 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors flex items-center gap-3">
              <Users className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium">Manage Users</span>
            </button>
            <button className="w-full text-left p-3 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors flex items-center gap-3">
              <Building2 className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium">Manage Organizations</span>
            </button>
            <button className="w-full text-left p-3 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors flex items-center gap-3">
              <BarChart3 className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium">View System Analytics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}