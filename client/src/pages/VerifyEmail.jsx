import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setStatus('error'); return; }
    api.get(`/auth/verify?token=${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900">
      <div className="card p-8 max-w-md w-full text-center">
        {status === 'loading' && <Loader className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />}
        {status === 'success' && <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />}
        {status === 'error' && <XCircle className="w-12 h-12 text-danger mx-auto mb-4" />}
        <h1 className="text-2xl font-bold mb-2">
          {status === 'loading' ? 'Verifying...' : status === 'success' ? 'Email Verified!' : 'Verification Failed'}
        </h1>
        <p className="text-secondary-500 mb-6">
          {status === 'loading' ? 'Please wait while we verify your email.' : status === 'success' ? 'Your email has been verified successfully.' : 'This link is invalid or has expired.'}
        </p>
        {status !== 'loading' && <Link to="/login" className="btn-primary">Go to Login</Link>}
      </div>
    </div>
  );
}
