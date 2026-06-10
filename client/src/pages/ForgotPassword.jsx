import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Bug, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900 p-4">
      <div className="card p-8 max-w-md w-full">
        <div className="flex items-center gap-2 mb-6"><Bug className="w-6 h-6 text-primary-600" /><span className="font-bold text-lg">BugTracker</span></div>
        {sent ? (
          <>
            <h1 className="text-2xl font-bold mb-2">Check your email</h1>
            <p className="text-secondary-500 mb-6">If an account exists with that email, we've sent a password reset link.</p>
            <Link to="/login" className="btn-primary w-full text-center">Back to Login</Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-2">Forgot password?</h1>
            <p className="text-secondary-500 mb-6">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Sending...' : 'Send reset link'}</button>
            </form>
            <Link to="/login" className="flex items-center gap-1 text-sm text-primary-600 mt-4 hover:underline"><ArrowLeft className="w-3 h-3" /> Back to login</Link>
          </>
        )}
      </div>
    </div>
  );
}
