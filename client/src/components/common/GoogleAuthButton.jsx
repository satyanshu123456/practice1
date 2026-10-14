import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const GoogleAuthButton = ({ text = 'Continue with Google' }) => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');
      if (!credentialResponse?.credential) {
        throw new Error('No credential received from Google');
      }
      await loginWithGoogle(credentialResponse.credential);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleError = () => {
    setError('Google Sign In was cancelled or failed.');
  };

  // If no Google Client ID is configured yet in .env
  if (!googleClientId || googleClientId === 'your_google_client_id_here') {
    return (
      <div className="w-full">
        <button
          type="button"
          onClick={() => {
            alert(
              'To enable live Google OAuth:\n\n1. Go to console.cloud.google.com\n2. Create an OAuth 2.0 Client ID (Web Application)\n3. Add http://localhost:5173 to Authorized JavaScript origins\n4. Add VITE_GOOGLE_CLIENT_ID in client/.env'
            );
          }}
          className="w-full flex items-center justify-center space-x-3 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-sm font-semibold transition group shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{text} (Setup required)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      {error && (
        <div className="w-full mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 text-center">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-2 text-xs text-indigo-400 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
          Authenticating with Google...
        </div>
      ) : (
        <div className="w-full flex justify-center [&>div]:w-full">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            theme="filled_black"
            shape="pill"
            size="large"
            width="100%"
            text="continue_with"
          />
        </div>
      )}
    </div>
  );
};

export default GoogleAuthButton;
