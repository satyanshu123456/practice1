import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleAuthButton from '../components/common/GoogleAuthButton';

const Login = () => {
  const [authMode, setAuthMode] = useState('email-otp'); // 'email-otp' or 'password'
  const [searchParams] = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  const redirectUrl = rawRedirect ? (rawRedirect.startsWith('/') ? rawRedirect : `/${rawRedirect}`) : '/dashboard';

  // Password login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Direct Email OTP state
  const [otpStep, setOtpStep] = useState(1);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpName, setOtpName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState('');

  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, sendEmailOtp, verifyEmailOtp } = useAuth();
  const navigate = useNavigate();

  // Password Login
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate(redirectUrl);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 1: Send OTP to email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!otpEmail) return;

    setError('');
    setInfoMessage('');
    setSubmitting(true);

    try {
      const data = await sendEmailOtp(otpEmail);
      setIsNewUser(data.isNewUser);
      setInfoMessage(
        data.isNewUser
          ? 'New to CollabSpace! Enter the code sent to your email to create your account.'
          : 'Authentication code sent! Please check your inbox.'
      );
      if (data.devOtp) {
        setDevOtpHint(data.devOtp);
        setOtpCode(data.devOtp); // Auto-fill for friction-free dev testing
      }
      setOtpStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send authentication code');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode) return;

    setError('');
    setInfoMessage('');
    setSubmitting(true);

    try {
      await verifyEmailOtp(otpEmail, otpCode, otpName);
      navigate(redirectUrl);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/20">
            <span className="text-white font-black text-2xl">M</span>
          </div>
          <h2 className="text-2xl font-black text-white">Welcome to CollabSpace</h2>
          <p className="text-xs text-slate-400 mt-1">
            Sign in with Google, direct email code, or password
          </p>
        </div>

        {/* Google Authentication Button */}
        <div className="mb-6">
          <GoogleAuthButton text="Continue with Google" />
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-3 text-slate-500 font-semibold">
                Or authenticate with email
              </span>
            </div>
          </div>
        </div>

        {/* Auth Mode Toggle */}
        <div className="flex bg-slate-800/80 p-1 rounded-2xl mb-6 border border-slate-700/60">
          <button
            type="button"
            onClick={() => {
              setAuthMode('email-otp');
              setError('');
              setInfoMessage('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
              authMode === 'email-otp'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Direct Email Auth
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('password');
              setError('');
              setInfoMessage('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition ${
              authMode === 'password'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Password Sign In
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
            {error}
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300">
            {infoMessage}
          </div>
        )}

        {/* DIRECT EMAIL AUTHENTICATION FORM */}
        {authMode === 'email-otp' ? (
          <div>
            {otpStep === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Your Email Address
                  </label>
                  <input
                    type="email"
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    We'll send a 6-digit verification code. If you don't have an account yet, one will be created automatically.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
                >
                  {submitting ? 'Sending Code...' : 'Send Authentication Code →'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400 truncate max-w-[220px]">{otpEmail}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep(1);
                      setOtpCode('');
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    Change
                  </button>
                </div>

                {isNewUser && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Full Name (Optional for New Profile)
                    </label>
                    <input
                      type="text"
                      value={otpName}
                      onChange={(e) => setOtpName(e.target.value)}
                      placeholder="Alex Johnson"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-400">
                      6-Digit Verification Code
                    </label>
                    {devOtpHint && (
                      <span className="text-[11px] text-amber-400 font-mono">
                        Dev code: {devOtpHint}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    required
                    placeholder="123456"
                    className="w-full text-center tracking-widest font-mono text-xl bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
                >
                  {submitting
                    ? 'Verifying...'
                    : isNewUser
                    ? 'Create Account & Log In'
                    : 'Verify Code & Log In'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={submitting}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Didn't receive code? <span className="text-indigo-400 font-semibold">Resend</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* TRADITIONAL PASSWORD FORM */
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="user@example.com"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {submitting ? 'Signing In...' : 'Sign In with Password'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-slate-400 mt-6">
          Don't have an account?{' '}
          <Link
            to={rawRedirect ? `/register?redirect=${encodeURIComponent(rawRedirect)}` : '/register'}
            className="text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            Create an account with password
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
