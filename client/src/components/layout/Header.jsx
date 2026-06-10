import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Bell, LogOut, Settings } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

export default function Header() {
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const { data } = await api.get('/notifications?limit=5');
        setNotifications(data.data.notifications || []);
      } catch {}
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="bg-white dark:bg-secondary-950 border-b border-secondary-200 dark:border-secondary-800 px-6 py-3 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-white">Welcome back, {user?.fullName?.split(' ')[0]}</h2>
        <p className="text-sm text-secondary-500">Here's what's happening today</p>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors">
          {dark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-secondary-600" />}
        </button>

        <div className="relative" ref={notifRef}>
          <button onClick={() => setShowNotif(!showNotif)} className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors relative">
            <Bell className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger text-white text-xs rounded-full flex items-center justify-center">{unreadCount}</span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-secondary-800 rounded-xl shadow-lg border border-secondary-200 dark:border-secondary-700 z-50">
              <div className="p-3 border-b border-secondary-200 dark:border-secondary-700">
                <p className="font-semibold text-sm">Notifications</p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-secondary-500 text-center">No notifications</p>
                ) : notifications.map(n => (
                  <div key={n._id} className={`p-3 border-b border-secondary-100 dark:border-secondary-700 ${!n.isRead ? 'bg-primary-50 dark:bg-primary-900/10' : ''}`}>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-secondary-500 mt-0.5">{n.message}</p>
                  </div>
                ))}
              </div>
              {unreadCount > 0 && (
                <button onClick={async () => { await api.patch('/notifications/read-all'); setNotifications(prev => prev.map(n => ({...n, isRead: true}))); setShowNotif(false); }} className="w-full p-2 text-xs text-primary-600 font-medium hover:bg-secondary-50 dark:hover:bg-secondary-700 rounded-b-xl">Mark all as read</button>
              )}
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button onClick={() => setShowMenu(!showMenu)} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-secondary-800 rounded-xl shadow-lg border border-secondary-200 dark:border-secondary-700 z-50">
              <div className="p-3 border-b border-secondary-200 dark:border-secondary-700">
                <p className="text-sm font-medium">{user?.fullName}</p>
                <p className="text-xs text-secondary-500">{user?.email}</p>
              </div>
              <button onClick={() => { navigate('/settings'); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary-50 dark:hover:bg-secondary-700">
                <Settings className="w-4 h-4" /> Settings
              </button>
              <button onClick={() => { logout(); navigate('/login'); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-secondary-50 dark:hover:bg-secondary-700 rounded-b-xl">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
