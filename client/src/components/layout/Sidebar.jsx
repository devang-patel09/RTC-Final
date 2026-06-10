import { NavLink, useParams } from 'react-router-dom';
import { useAuth, ROLES } from '../../store/AuthContext';
import {
  LayoutDashboard, FolderKanban, Bug, Settings, Users, BarChart3, Layers,
  ChevronLeft, Bug as BugIcon, Building2, Shield,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../utils/cn';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const { projectId } = useParams();

  const mainLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/users', icon: Users, label: 'Users' },
    ...(user?.role === ROLES.ORG_ADMIN || user?.role === ROLES.SUPER_ADMIN
      ? [{ to: '/organization', icon: Building2, label: 'Organization' }]
      : []),
    ...(user?.role === ROLES.SUPER_ADMIN
      ? [{ to: '/admin', icon: Shield, label: 'Admin' }]
      : []),
  ];

  const projectLinks = (pid) => [
    { to: `/projects/${pid}/board`, icon: Layers, label: 'Board' },
    { to: `/projects/${pid}/bugs`, icon: Bug, label: 'Bugs' },
    { to: `/projects/${pid}/sprints`, icon: BugIcon, label: 'Sprints' },
    { to: `/projects/${pid}/analytics`, icon: BarChart3, label: 'Analytics' },
    { to: `/projects/${pid}/settings`, icon: Settings, label: 'Settings' },
  ];

  const NavItems = ({ items }) => items.map(item => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) => cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
          : 'text-secondary-500 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800'
      )}
    >
      <item.icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  ));

  return (
    <aside className={cn(
      'flex flex-col bg-white dark:bg-secondary-800 border-r border-secondary-200 dark:border-secondary-700 transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      <div className="flex items-center justify-between p-4 border-b border-secondary-200 dark:border-secondary-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <BugIcon className="w-6 h-6 text-primary-600" />
            <span className="font-bold text-lg">BugTracker</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700">
          <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <NavItems items={mainLinks} />
        {projectId && (
          <>
            <div className="my-3 border-t border-secondary-200 dark:border-secondary-700" />
            <NavItems items={projectLinks(projectId)} />
          </>
        )}
      </nav>

      <div className="p-3 border-t border-secondary-200 dark:border-secondary-700">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
            {user?.fullName?.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.fullName}</p>
              <p className="text-xs text-secondary-500 truncate capitalize">{user?.role?.replace(/_/g, ' ')}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}