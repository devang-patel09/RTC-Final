import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { Bug, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-secondary-50 dark:bg-secondary-900">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8">
            <Bug className="w-8 h-8 text-primary-600" />
            <span className="text-2xl font-bold text-secondary-900 dark:text-white">BugTracker</span>
          </div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">Welcome back</h1>
          <p className="text-secondary-500 mb-8">Sign in to your account to continue</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input pr-10" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:underline">Forgot password?</Link>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p className="text-center text-sm text-secondary-500 mt-6">
            Don't have an account? <Link to="/register" className="text-primary-600 hover:underline font-medium">Sign up</Link>
          </p>
        </div>
      </div>
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 to-secondary-950 items-center justify-center p-12">
        <div className="text-white max-w-md">
          <h2 className="text-4xl font-bold mb-4">AI-Powered Bug Tracking</h2>
          <p className="text-primary-200 text-lg mb-6">Manage projects, track bugs, collaborate in real-time, and let AI help you resolve issues faster.</p>
          <div className="space-y-4">
            {['Real-time collaboration', 'AI bug analysis', 'Smart sprint management', 'GitHub integration'].map((f, i) => (
              <div key={i} className="flex items-center gap-3"><div className="w-2 h-2 bg-primary-300 rounded-full" />{f}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
