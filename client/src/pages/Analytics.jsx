import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { BarChart3, Bug, CheckCircle, TrendingUp, Download, Filter, Users, Calendar } from 'lucide-react';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';

const COLORS = ['#285A48', '#408A71', '#B0E4CC', '#5DBF96', '#8AD4B3', '#1E4537'];

const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csv = [headers.join(','), ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`;
  a.click(); URL.revokeObjectURL(url);
};

export default function Analytics() {
  const { projectId } = useParams();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const queryParams = new URLSearchParams();
  if (startDate) queryParams.set('startDate', startDate);
  if (endDate) queryParams.set('endDate', endDate);

  const { data: projectAnalytics } = useQuery({
    queryKey: ['projectAnalytics', projectId, startDate, endDate],
    queryFn: () => api.get(`/projects/${projectId}/analytics?${queryParams}`).then(r => r.data.data),
    enabled: !!projectId,
  });

  const { data: userAnalytics } = useQuery({
    queryKey: ['userAnalytics', startDate, endDate],
    queryFn: () => api.get(`/analytics/user?${queryParams}`).then(r => r.data.data),
    enabled: !projectId,
  });

  const analytics = projectAnalytics || userAnalytics || {};

  const stats = [
    { label: 'Total Bugs', value: analytics.totalBugs ?? analytics.assignedBugs ?? 0, icon: Bug, color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' },
    { label: 'Open Bugs', value: analytics.openBugs ?? analytics.inProgressBugs ?? 0, icon: Bug, color: 'text-danger bg-red-50 dark:bg-red-900/20' },
    { label: 'Resolved', value: analytics.resolvedBugs ?? analytics.completedBugs ?? 0, icon: CheckCircle, color: 'text-success bg-green-50 dark:bg-green-900/20' },
    { label: 'Resolution Rate', value: `${analytics.resolutionRate ?? analytics.completionRate ?? 0}%`, icon: TrendingUp, color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' },
  ];

  if (projectAnalytics && analytics.avgResolutionTime !== undefined) {
    stats.push({ label: 'Avg Resolution', value: `${analytics.avgResolutionTime}d`, icon: Calendar, color: 'text-secondary-600 bg-secondary-100 dark:bg-secondary-800/50' });
  }

  const statusData = analytics.statusDistribution?.map(s => ({ name: s._id, value: s.count })) || [];
  const severityData = analytics.severityDistribution?.map(s => ({ name: s._id, value: s.count })) || [];
  const priorityData = analytics.priorityDistribution?.map(s => ({ name: s._id, value: s.count })) || [];
  const trendData = analytics.bugsByDay?.map(d => ({ date: d._id, created: d.count })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6" /> Analytics</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-secondary-400" />
            <input type="date" className="input text-xs w-auto" value={startDate} onChange={e => setStartDate(e.target.value)} placeholder="Start" />
            <span className="text-xs text-secondary-400">to</span>
            <input type="date" className="input text-xs w-auto" value={endDate} onChange={e => setEndDate(e.target.value)} placeholder="End" />
            {(startDate || endDate) && (
              <button onClick={() => { setStartDate(''); setEndDate(''); }} className="btn-secondary btn-xs">Clear</button>
            )}
          </div>
          {projectAnalytics?.memberWorkload?.length > 0 && (
            <button onClick={() => exportToCSV(projectAnalytics.memberWorkload.map(m => ({ Name: m.name, Assigned: m.assigned, 'In Progress': m.inProgress, Resolved: m.resolved })), 'team-workload')} className="btn-secondary btn-sm"><Download className="w-3.5 h-3.5" /> Export</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map(s => (
          <div key={s.label} className="card p-5">
            <div className={`p-2.5 rounded-lg w-fit ${s.color} mb-3`}><s.icon className="w-5 h-5" /></div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-secondary-500">{s.label}</p>
          </div>
        ))}
      </div>

      {trendData.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Bug Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#c5d9ce" />
              <XAxis dataKey="date" stroke="#6d917d" fontSize={11} tick={{ angle: -45 }} height={60} />
              <YAxis stroke="#6d917d" fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="created" stroke="#285A48" strokeWidth={2} dot={{ fill: '#285A48', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {statusData.length > 0 && (
          <div className="card p-5">
            <h3 className="font-semibold mb-4">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {severityData.length > 0 && (
          <div className="card p-5">
            <h3 className="font-semibold mb-4 flex items-center justify-between">
              <span>Severity Distribution</span>
              <button onClick={() => exportToCSV(severityData, 'severity-distribution')} className="text-xs text-secondary-400 hover:text-primary-600 flex items-center gap-1"><Download className="w-3 h-3" /> CSV</button>
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={severityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#c5d9ce" />
                <XAxis dataKey="name" stroke="#6d917d" fontSize={12} />
                <YAxis stroke="#6d917d" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#285A48" radius={[4, 4, 0, 0]}>
                  {severityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {priorityData.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priorityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#c5d9ce" />
              <XAxis type="number" stroke="#6d917d" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="name" stroke="#6d917d" fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="#408A71" radius={[0, 4, 4, 0]}>
                {priorityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {projectAnalytics?.memberWorkload?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Team Workload</h3>
          <ResponsiveContainer width="100%" height={Math.max(200, projectAnalytics.memberWorkload.length * 50)}>
            <BarChart data={projectAnalytics.memberWorkload.map(m => ({ name: m.name, Assigned: m.assigned, 'In Progress': m.inProgress, Resolved: m.resolved }))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#c5d9ce" />
              <XAxis type="number" stroke="#6d917d" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="name" stroke="#6d917d" fontSize={12} width={120} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Assigned" fill="#408A71" stackId="a" />
              <Bar dataKey="In Progress" fill="#B0E4CC" stackId="a" />
              <Bar dataKey="Resolved" fill="#285A48" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {userAnalytics?.recentActivity?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-2">
            {userAnalytics.recentActivity.slice(0, 10).map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-xs text-secondary-400 w-16 flex-shrink-0">{new Date(a.createdAt).toLocaleDateString()}</span>
                <span className="text-secondary-500 capitalize">{a.action}</span>
                {a.bug?.title && <span className="text-primary-600 truncate">{a.bug.title}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {(!projectAnalytics && !userAnalytics) && (
        <div className="text-center py-12 text-secondary-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No analytics data available yet. Create bugs and projects to see insights.</p>
        </div>
      )}
    </div>
  );
}