import React, { useState } from 'react';
import API from '../../api/axiosInstance';

const InviteMemberModal = ({ groupId, onClose }) => {
  const [inviteMode, setInviteMode] = useState('shareable'); // 'shareable' or 'email'
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Viewer');
  const [inviteLink, setInviteLink] = useState('');
  const [invitedEmail, setInvitedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setCopied(false);

    try {
      const payload = {
        role,
        email: inviteMode === 'email' ? email.trim() : '',
      };

      const res = await API.post(`/groups/${groupId}/invite`, payload);
      setInviteLink(res.data.inviteLink);
      setInvitedEmail(res.data.email || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const resetForm = () => {
    setInviteLink('');
    setEmail('');
    setInvitedEmail('');
    setError('');
    setCopied(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Invite to Workspace</h3>
            <p className="text-xs text-slate-400">
              Generate invite links or send direct email invitations.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm transition"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/30 flex items-start space-x-2">
            <span className="font-bold">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {!inviteLink ? (
          <div>
            {/* Mode Toggle */}
            <div className="flex bg-slate-800/80 p-1 rounded-2xl mb-4 border border-slate-700/60">
              <button
                type="button"
                onClick={() => {
                  setInviteMode('shareable');
                  setError('');
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition ${
                  inviteMode === 'shareable'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🔗 Shareable Link
              </button>
              <button
                type="button"
                onClick={() => {
                  setInviteMode('email');
                  setError('');
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition ${
                  inviteMode === 'email'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ✉️ Direct Email Invite
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              {inviteMode === 'email' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Recipient Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="colleague@example.com"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    We will send an invitation email containing the workspace join link.
                  </p>
                </div>
              )}

              {inviteMode === 'shareable' && (
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300">
                  Anyone who has this shareable link can join this workspace with the permission role selected below.
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Assigned Permission Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Viewer">Viewer (Read & download documents only)</option>
                  <option value="Editor">Editor (Upload, edit, and organize files)</option>
                  <option value="Admin">Admin (Full control & manage team members)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>
                    {loading
                      ? 'Generating...'
                      : inviteMode === 'email'
                      ? 'Send Email & Create Link'
                      : 'Generate Shareable Link'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            {invitedEmail ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
                <span>📧</span>
                <span>
                  Invitation dispatched to <strong>{invitedEmail}</strong>!
                </span>
              </div>
            ) : (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 flex items-center space-x-2">
                <span>🔗</span>
                <span>
                  Shareable link generated for <strong>{role}</strong> access.
                </span>
              </div>
            )}

            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Invite Link
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Valid for 7 days</span>
              </div>
              <input
                type="text"
                readOnly
                value={inviteLink}
                onClick={(e) => e.target.select()}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-indigo-300 outline-none select-all font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleCopy}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-lg ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                }`}
              >
                <span>{copied ? '✓ Copied to Clipboard!' : '📋 Copy Link'}</span>
              </button>
              <a
                href={inviteLink}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center justify-center space-x-1.5"
              >
                <span>↗ Open Preview</span>
              </a>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-2 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                + Create Another Invite
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteMemberModal;
