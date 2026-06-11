import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { User as UserIcon, Search } from 'lucide-react';
import { cn } from '../utils/cn';

const ROLE_COLORS = {
  super_admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  org_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  project_manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  developer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  tester: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  viewer: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-300',
};

const PAGE_SIZE = 20;

export default function Users() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data.data),
  });

  const filtered = useMemo(() => {
    if (!users) return [];
    let result = users;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [users, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input
            className="input pl-9 text-sm w-64"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 dark:bg-secondary-700/50">
              <tr>
                <th className="text-left p-3 text-xs font-medium text-secondary-500 uppercase">User</th>
                <th className="text-left p-3 text-xs font-medium text-secondary-500 uppercase">Email</th>
                <th className="text-left p-3 text-xs font-medium text-secondary-500 uppercase">Role</th>
                <th className="text-left p-3 text-xs font-medium text-secondary-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
              {paged.map(u => (
                <tr key={u._id} className="hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">{u.fullName?.charAt(0)}</div>
                      <span className="font-medium">{u.fullName}</span>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-secondary-600 dark:text-secondary-400">{u.email}</td>
                  <td className="p-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', ROLE_COLORS[u.role] || 'bg-secondary-100')}>
                      {u.role?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={cn('inline-flex items-center gap-1 text-xs', u.isOnline ? 'text-success' : 'text-secondary-400')}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isOnline ? 'bg-success' : 'bg-secondary-400'}`} />
                      {u.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-secondary-400">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-secondary-200 dark:border-secondary-700">
            <p className="text-xs text-secondary-500">{filtered.length} users total</p>
            <div className="flex gap-1">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="btn-secondary btn-xs">Previous</button>
              <span className="text-xs text-secondary-500 px-2 self-center">Page {page + 1} of {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="btn-secondary btn-xs">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
