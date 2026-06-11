import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, ROLES } from './store/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Board from './pages/Board';
import Bugs from './pages/Bugs';
import BugDetail from './pages/BugDetail';
import CreateBug from './pages/CreateBug';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import Sprints from './pages/Sprints';
import Users from './pages/Users';
import Organization from './pages/Organization';
import AdminDashboard from './pages/AdminDashboard';
import ProjectActivity from './pages/ProjectActivity';
import AcceptInvite from './pages/AcceptInvite';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  return user ? children : <Navigate to="/login" />;
};

const RoleRoute = ({ role, children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === ROLES.SUPER_ADMIN) return children;
  if (user.role === role) return children;
  return <Navigate to="/" />;
};

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen bg-white dark:bg-secondary-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/invite/:token" element={<AcceptInvite />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:projectId" element={<ProjectDetail />}>
          <Route index element={<Board />} />
        </Route>
        <Route path="projects/:projectId/board" element={<Board />} />
        <Route path="projects/:projectId/bugs" element={<Bugs />} />
        <Route path="projects/:projectId/bugs/new" element={<CreateBug />} />
        <Route path="projects/:projectId/bugs/:bugId" element={<BugDetail />} />
        <Route path="projects/:projectId/sprints" element={<Sprints />} />
        <Route path="projects/:projectId/settings" element={<Settings />} />
        <Route path="projects/:projectId/activity" element={<ProjectActivity />} />
        <Route path="projects/:projectId/analytics" element={<Analytics />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} />
        <Route path="organization" element={<Organization />} />
        <Route path="admin" element={
          <RoleRoute role={ROLES.SUPER_ADMIN}>
            <AdminDashboard />
          </RoleRoute>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}