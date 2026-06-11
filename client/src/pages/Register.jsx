import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { Bug, Eye, EyeOff, User, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'individual', label: 'Individual', icon: User },
  { key: 'organization', label: 'Organization', icon: Building2 },
];

export default function Register() {
  const [accountType, setAccountType] = useState('individual');
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', organizationName: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      await register({ ...form, accountType });
      toast.success('Account created! Check your email to verify.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const update = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  return (
    <div className="min-h-screen flex bg-secondary-50 dark:bg-secondary-900">
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 to-secondary-950 items-center justify-center p-12">
        <div className="text-white max-w-md">
          <h2 className="text-4xl font-bold mb-4">Start Your Journey</h2>
          <p className="text-primary-200 text-lg">Create your account and start building better software with AI-powered insights.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8">
            <Bug className="w-8 h-8 text-primary-600" />
            <span className="text-2xl font-bold text-secondary-900 dark:text-white">BugTracker</span>
          </div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">Create account</h1>
          <p className="text-secondary-500 mb-8">Get started with your free account</p>

          <div className="flex mb-6 bg-secondary-100 dark:bg-secondary-800 rounded-lg p-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setAccountType(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  accountType === key
                    ? 'bg-white dark:bg-secondary-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input type="text" className="input" placeholder="John Doe" value={form.fullName} onChange={update('fullName')} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="you@example.com" value={form.email} onChange={update('email')} required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input pr-10" placeholder="Min 8 chars, 1 uppercase, 1 number" value={form.password} onChange={update('password')} required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
            {accountType === 'organization' && (
              <div>
                <label className="label">Organization Name</label>
                <input type="text" className="input" placeholder="Your Company or Team" value={form.organizationName} onChange={update('organizationName')} required />
              </div>
            )}
            <div>
              <label className="label">Confirm Password</label>
              <input type="password" className="input" placeholder="Repeat your password" value={form.confirmPassword} onChange={update('confirmPassword')} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">{loading ? 'Creating account...' : 'Create account'}</button>
          </form>
          <p className="text-center text-sm text-secondary-500 mt-6">
            Already have an account? <Link to="/login" className="text-primary-600 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
