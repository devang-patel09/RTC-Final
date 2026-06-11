import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../store/AuthContext';
import { FolderKanban, Bug, CheckCircle, TrendingUp, Activity, User, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatDateShort } from '../utils/cn';

const COLORS = ['#285A48', '#408A71', '#B0E4CC', '#5DBF96', '#8AD4B3'];

export default function Dashboard() {
  const { user } = useAuth();
  const isIndividual = user?.accountType === 'individual';
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: () => api.get('/projects').then(r => r.data.data) });
  const { data: userAnalytics } = useQuery({ queryKey: ['userAnalytics'], queryFn: () => api.get('/analytics/user').then(r => r.data.data) });

  const stats = [
    { label: 'Active Projects', value: projects?.length || 0, icon: FolderKanban, color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' },
    { label: 'Assigned Bugs', value: userAnalytics?.assignedBugs || 0, icon: Bug, color: 'text-danger bg-red-50 dark:bg-red-900/20' },
    { label: 'Completed', value: userAnalytics?.completedBugs || 0, icon: CheckCircle, color: 'text-success bg-green-50 dark:bg-green-900/20' },
    { label: 'Completion Rate', value: `${userAnalytics?.completionRate || 0}%`, icon: TrendingUp, color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' },
  ];

  const chartData = userAnalytics?.bugsByWeek?.length > 0
    ? userAnalytics.bugsByWeek.map(d => ({ name: d._id || d.date, bugs: d.count }))
    : [];

  const STATUS_NAMES = { backlog: 'Backlog', todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', resolved: 'Resolved', closed: 'Closed' };
  const pieData = userAnalytics?.statusDistribution?.length > 0
    ? userAnalytics.statusDistribution.map(d => ({ name: STATUS_NAMES[d._id] || d._id, value: d.count }))
    : [];

  const COLORS_MAP = ['#285A48', '#408A71', '#B0E4CC', '#5DBF96', '#8AD4B3', '#2D6A4F'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${isIndividual ? 'bg-green-50 dark:bg-green-900/20' : 'bg-primary-50 dark:bg-primary-900/20'}`}>
          {isIndividual ? <User className="w-5 h-5 text-green-600" /> : <Building2 className="w-5 h-5 text-primary-600" />}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{isIndividual ? 'Personal Dashboard' : 'Organization Dashboard'}</h1>
          <p className="text-sm text-secondary-500">{isIndividual ? 'Your personal workspace overview' : 'Team-wide overview'}</p>
        </div>
      </div>
      {isIndividual && (
        <div className="flex items-center justify-between p-4 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-primary-600" />
            <div>
              <p className="text-sm font-medium text-primary-800 dark:text-primary-300">Working with a team?</p>
              <p className="text-xs text-primary-600 dark:text-primary-400">Create an organization to collaborate with others.</p>
            </div>
          </div>
          <Link to="/settings" className="btn-primary btn-sm text-xs">Create Organization</Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-lg ${s.color}`}><s.icon className="w-5 h-5" /></div>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-secondary-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Bug Activity (This Week)</h3>
          {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#c5d9ce" />
              <XAxis dataKey="name" stroke="#6d917d" fontSize={12} />
              <YAxis stroke="#6d917d" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="bugs" fill="#285A48" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          ) : <p className="text-sm text-secondary-400 text-center py-8">No data available yet</p>}
        </div>
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Bug Status Distribution</h3>
          {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS_MAP[i % COLORS_MAP.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          ) : <p className="text-sm text-secondary-400 text-center py-8">No data available yet</p>}
          {pieData.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS_MAP[i] }} />{d.name}</div>
            ))}
          </div>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {userAnalytics?.recentActivity?.slice(0, 5).map((a, i) => (
            <div key={a._id || i} className="flex items-start gap-3 p-3 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg">
              <Activity className="w-4 h-4 text-secondary-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium capitalize">{a.action.replace(/_/g, ' ')}</p>
                <p className="text-xs text-secondary-500">{a.bug?.title || 'Bug'}</p>
              </div>
              <span className="text-xs text-secondary-400 ml-auto">{formatDateShort(a.createdAt)}</span>
            </div>
          ))}
          {(!userAnalytics?.recentActivity || userAnalytics.recentActivity.length === 0) && (
            <p className="text-sm text-secondary-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold mb-4">Your Projects</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects?.slice(0, 6).map(p => (
            <Link key={p._id} to={`/projects/${p._id}`} className="p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-sm">{p.key}</div>
                <p className="font-medium truncate">{p.title}</p>
              </div>
              <p className="text-xs text-secondary-500">{p.members?.length || 0} members</p>
            </Link>
          ))}
          {(!projects || projects.length === 0) && (
            <div className="col-span-full text-center py-8">
              <p className="text-secondary-500 mb-4">No projects yet</p>
              <Link to="/projects" className="btn-primary">Create your first project</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
