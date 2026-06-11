import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const acceptInvite = async () => {
      try {
        const { data } = await api.post(`/invites/accept`, { token });
        setStatus('success');
        setMessage(data.message || 'Invitation accepted successfully!');
        setTimeout(() => navigate('/'), 2000);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Invalid or expired invitation link.');
      }
    };
    acceptInvite();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-secondary-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <div className="py-8">
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
            <p className="text-secondary-500">Accepting invitation...</p>
          </div>
        )}
        {status === 'success' && (
          <div className="py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Welcome!</h2>
            <p className="text-secondary-500">{message}</p>
            <p className="text-xs text-secondary-400 mt-4">Redirecting to dashboard...</p>
          </div>
        )}
        {status === 'error' && (
          <div className="py-8">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Invitation Failed</h2>
            <p className="text-secondary-500 mb-6">{message}</p>
            <Link to="/" className="btn-primary">Go to Dashboard</Link>
          </div>
        )}
      </div>
    </div>
  );
}
