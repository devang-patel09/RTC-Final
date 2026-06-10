import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { User as UserIcon } from 'lucide-react';
import { cn } from '../utils/cn';

export default function Users() {
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data.data),
  });

  const roleColors = { admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', developer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', tester: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Users</h1>
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
              {users?.map(u => (
                <tr key={u._id} className="hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">{u.fullName?.charAt(0)}</div>
                      <span className="font-medium">{u.fullName}</span>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-secondary-600 dark:text-secondary-400">{u.email}</td>
                  <td className="p-3"><span className={cn('text-xs', roleColors[u.role])}>{u.role}</span></td>
                  <td className="p-3">
                    <span className={cn('inline-flex items-center gap-1 text-xs', u.isOnline ? 'text-success' : 'text-secondary-400')}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isOnline ? 'bg-success' : 'bg-secondary-400'}`} />
                      {u.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
