import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API from '../api/axiosInstance';

const JoinGroup = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const groupId = searchParams.get('groupId');
  const navigate = useNavigate();

  const [status, setStatus] = useState('Joining group...');
  const [error, setError] = useState('');

  useEffect(() => {
    const join = async () => {
      try {
        await API.post('/groups/join', { token, groupId });
        setStatus('Successfully joined group! Redirecting to workspace...');
        setTimeout(() => navigate(`/groups/${groupId}`), 1500);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to accept invitation');
      }
    };

    if (token && groupId) {
      join();
    } else {
      setError('Invalid or incomplete invitation link parameters.');
    }
  }, [token, groupId, navigate]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full text-center shadow-xl">
        {error ? (
          <div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center font-bold text-xl mb-3">
              ✕
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Invitation Error</h3>
            <p className="text-xs text-rose-400 mb-6">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div>
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-white">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinGroup;
