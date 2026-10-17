import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import API from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import GoogleAuthButton from '../components/common/GoogleAuthButton';

const JoinGroup = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const groupId = searchParams.get('groupId');

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [inviteInfo, setInviteInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch public invitation details
  useEffect(() => {
    let isMounted = true;

    const fetchInviteDetails = async () => {
      if (!token || !groupId) {
        if (isMounted) {
          setError('Invalid or incomplete invitation link. Missing token or workspace ID.');
          setLoadingInfo(false);
        }
        return;
      }

      try {
        const res = await API.get('/groups/invite-info', {
          params: { token, groupId },
        });

        if (isMounted) {
          if (res.data.valid) {
            setInviteInfo(res.data);
          } else {
            setError(res.data.message || 'This invitation is invalid or has expired.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              'This invitation link is invalid or has expired. Please ask the group administrator for a new invite.'
          );
        }
      } finally {
        if (isMounted) {
          setLoadingInfo(false);
        }
      }
    };

    fetchInviteDetails();

    return () => {
      isMounted = false;
    };
  }, [token, groupId]);

  // 2. Handle Join Group
  const handleAcceptInvite = async () => {
    if (!token || !groupId || joining) return;

    setJoining(true);
    setError('');

    try {
      const res = await API.post('/groups/join', { token, groupId });

      if (res.data.alreadyMember) {
        setAlreadyMember(true);
      } else {
        setJoinSuccess(true);
      }

      // Smoothly navigate into the group workspace
      setTimeout(() => {
        navigate(`/groups/${groupId}`);
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept invitation. Please try again.');
      setJoining(false);
    }
  };

  const currentRedirectParam = encodeURIComponent(location.pathname + location.search);

  // Role badge color helper
  const getRoleBadge = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Editor':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  // State A: Loading Invite Info
  if (loadingInfo || authLoading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-white font-bold text-base mb-1">Validating Invitation</h3>
          <p className="text-xs text-slate-400">Verifying secure workspace access token...</p>
        </div>
      </div>
    );
  }

  // State B: Error State (Invalid / Expired token)
  if (error && !inviteInfo) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center font-black text-2xl mb-4 border border-rose-500/30">
            ✕
          </div>
          <h3 className="text-white font-bold text-xl mb-2">Invitation Unavailable</h3>
          <p className="text-xs text-rose-300 bg-rose-950/40 p-3 rounded-xl border border-rose-800/40 mb-6 leading-relaxed">
            {error}
          </p>
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700 transition"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State C: Successfully joined or Already a member
  if (joinSuccess || alreadyMember) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center font-black text-2xl mb-4 border border-emerald-500/30 animate-bounce">
            ✓
          </div>
          <h3 className="text-white font-bold text-xl mb-1">
            {alreadyMember ? 'Workspace Ready!' : 'Welcome to the Workspace!'}
          </h3>
          <p className="text-xs text-emerald-400 mb-6">
            {alreadyMember
              ? 'You are already a member of this workspace. Taking you there now...'
              : `You have successfully joined ${inviteInfo?.groupName || 'the workspace'}. Redirecting...`}
          </p>
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[11px] text-slate-500">Entering workspace...</p>
        </div>
      </div>
    );
  }

  // State D: Valid Invitation Landing View
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Icon & Tag */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/20 text-white font-black text-2xl">
            {inviteInfo?.groupName ? inviteInfo.groupName.charAt(0).toUpperCase() : 'W'}
          </div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold mb-2">
            <span>✨</span>
            <span>Workspace Team Invitation</span>
          </div>
          <h2 className="text-2xl font-black text-white">{inviteInfo?.groupName}</h2>
          {inviteInfo?.description && (
            <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
              {inviteInfo.description}
            </p>
          )}
        </div>

        {/* Invitation Metadata Card */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 mb-6 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Invited by:</span>
            <span className="text-white font-semibold">{inviteInfo?.inviterName}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Assigned Permission:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${getRoleBadge(
                inviteInfo?.role
              )}`}
            >
              {inviteInfo?.role || 'Viewer'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Team Members:</span>
            <span className="text-slate-300 font-medium">
              {inviteInfo?.memberCount || 1} {inviteInfo?.memberCount === 1 ? 'member' : 'members'}
            </span>
          </div>
          {inviteInfo?.targetEmail && (
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/40">
              <span className="text-slate-400">Addressed To:</span>
              <span className="text-indigo-300 font-mono text-[11px] truncate max-w-[200px]">
                {inviteInfo.targetEmail}
              </span>
            </div>
          )}
        </div>

        {/* Error Alert if Join Action failed */}
        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
            {error}
          </div>
        )}

        {/* LOGGED IN USER EXPERIENCE */}
        {user ? (
          <div className="space-y-4">
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                  {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-white font-medium">{user.name}</p>
                  <p className="text-[11px] text-slate-400">{user.email}</p>
                </div>
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                Logged In
              </span>
            </div>

            <button
              onClick={handleAcceptInvite}
              disabled={joining}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {joining ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Joining Workspace...</span>
                </>
              ) : (
                <>
                  <span>Accept & Enter Workspace</span>
                  <span>→</span>
                </>
              )}
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-2.5 text-xs text-slate-400 hover:text-white transition font-semibold"
            >
              Decline & Go to Dashboard
            </button>
          </div>
        ) : (
          /* GUEST / LOGGED-OUT USER EXPERIENCE */
          <div className="space-y-4">
            <p className="text-xs text-center text-slate-300">
              Sign in or create an account to accept this invitation and enter the workspace.
            </p>

            {/* Google Quick Sign-In */}
            <div className="mb-2">
              <GoogleAuthButton text="Continue with Google" />
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-3 text-slate-500 font-semibold">
                  Or use email
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link
                to={`/login?redirect=${currentRedirectParam}`}
                className="py-2.5 text-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
              >
                Sign In
              </Link>
              <Link
                to={`/register?redirect=${currentRedirectParam}`}
                className="py-2.5 text-center bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
              >
                Create Account
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinGroup;
