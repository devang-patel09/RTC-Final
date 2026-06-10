import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

const SOCKET_URL = import.meta.env.VITE_API_URL || '';

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();
  const heartbeatRef = useRef(null);
  const typingTimeouts = useRef({});

  useEffect(() => {
    if (!user) {
      if (socket) { socket.disconnect(); setSocket(null); setConnected(false); }
      return;
    }
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
      setConnected(false);
    });

    s.on('online_users', setOnlineUsers);
    s.on('project_users', setOnlineUsers);

    s.on('user_online', (data) => setOnlineUsers(prev => [...prev.filter(u => u.userId !== data.userId), { ...data, status: 'active' }]));
    s.on('user_offline', (data) => setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId)));
    s.on('user_status_change', (data) => setOnlineUsers(prev => prev.map(u => u.userId === data.userId ? { ...u, status: data.status } : u)));

    s.on('user_typing', (data) => {
      const key = `${data.bugId}:${data.userId}`;
      setTypingUsers(prev => data.isTyping ? { ...prev, [key]: data } : (delete prev[key], { ...prev }));
      if (data.isTyping) {
        clearTimeout(typingTimeouts.current[key]);
        typingTimeouts.current[key] = setTimeout(() => {
          setTypingUsers(prev => {
            const copy = { ...prev };
            delete copy[key];
            return copy;
          });
        }, 3000);
      }
    });

    s.on('notification', (data) => {
      if ((data.type === 'mention' || data.type === 'comment') && Notification.permission === 'granted') {
        new Notification(data.title, { body: data.message });
      }
    });

    setSocket(s);

    heartbeatRef.current = setInterval(() => s.emit('heartbeat'), 60000);

    return () => {
      s.disconnect();
      clearInterval(heartbeatRef.current);
      Object.values(typingTimeouts.current).forEach(clearTimeout);
    };
  }, [user]);

  const joinProject = useCallback((pid) => socket?.emit('join_project', pid), [socket]);
  const leaveProject = useCallback((pid) => socket?.emit('leave_project', pid), [socket]);
  const joinOrg = useCallback((oid) => socket?.emit('join_org', oid), [socket]);
  const leaveOrg = useCallback((oid) => socket?.emit('leave_org', oid), [socket]);

  const startTyping = useCallback((projectId, bugId) => {
    socket?.emit('typing_start', { projectId, bugId });
  }, [socket]);

  const stopTyping = useCallback((projectId, bugId) => {
    socket?.emit('typing_stop', { projectId, bugId });
  }, [socket]);

  const changeStatus = useCallback((status) => {
    socket?.emit('status_change', status);
  }, [socket]);

  const getTypingForBug = useCallback((bugId) => {
    return Object.entries(typingUsers)
      .filter(([key]) => key.startsWith(`${bugId}:`))
      .map(([, value]) => value);
  }, [typingUsers]);

  return (
    <SocketContext.Provider value={{
      socket, onlineUsers, typingUsers, connected,
      joinProject, leaveProject, joinOrg, leaveOrg,
      startTyping, stopTyping, changeStatus, getTypingForBug,
    }}>
      {children}
    </SocketContext.Provider>
  );
};