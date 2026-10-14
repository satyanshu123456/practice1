import React, { useState } from 'react';
import API from '../../api/axiosInstance';

const InviteMemberModal = ({ groupId, onClose }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Viewer');
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    try {
      const res = await API.post(`/groups/${groupId}/invite`, { email, role });
      setInviteLink(res.data.inviteLink);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-2">Invite User to Group</h3>
        <p className="text-xs text-slate-400 mb-4">
          Invite members via their email and assign initial permission rights.
        </p>

        {error && (
          <div className="mb-4 text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/30">
            {error}
          </div>
        )}

        {!inviteLink ? (
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">User Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="colleague@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Assigned Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Viewer">Viewer (View & Download only)</option>
                <option value="Editor">Editor (Upload & Delete allowed)</option>
                <option value="Admin">Admin (Full Control & Manage members)</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Create Invite Link'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
              <p className="text-[11px] font-semibold text-slate-400 mb-1">Shareable Join Link:</p>
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="w-full bg-transparent text-xs text-indigo-400 outline-none select-all"
              />
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(inviteLink);
                alert('Copied invite link to clipboard!');
              }}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition"
            >
              Copy Link to Clipboard
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700 transition"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteMemberModal;
