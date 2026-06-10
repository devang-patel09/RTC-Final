import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Bug, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token: params.get('token'), password, confirmPassword: confirm });
      toast.success('Password reset successfully');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900 p-4">
      <div className="card p-8 max-w-md w-full">
        <div className="flex items-center gap-2 mb-6"><Bug className="w-6 h-6 text-primary-600" /><span className="font-bold text-lg">BugTracker</span></div>
        <h1 className="text-2xl font-bold mb-2">Reset password</h1>
        <p className="text-secondary-500 mb-6">Enter your new password.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} className="input pr-10" placeholder="Min 8 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
          </div>
          <div><label className="label">Confirm Password</label><input type="password" className="input" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} required /></div>
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Resetting...' : 'Reset password'}</button>
        </form>
      </div>
    </div>
  );
}
