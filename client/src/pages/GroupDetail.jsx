import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import DocumentList from '../components/documents/DocumentList';
import DocumentUploadModal from '../components/documents/DocumentUploadModal';
import InviteMemberModal from '../components/groups/InviteMemberModal';
import { getImageUrl } from '../utils/imageHelper';

const GroupDetail = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const socket = useSocket();

  const [group, setGroup] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [comments, setComments] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroupData();

    if (socket) {
      socket.emit('join_group_room', groupId);

      const handleDocAdded = (newDoc) => {
        if (!newDoc || !newDoc._id) return;
        setDocuments((prev) => {
          if (prev.some((d) => d._id === newDoc._id)) return prev;
          return [newDoc, ...prev];
        });
      };

      const handleDocDeleted = (deletedId) => {
        setDocuments((prev) => prev.filter((d) => d._id !== deletedId));
      };

      const handleNewMessage = (newComment) => {
        if (!newComment || !newComment._id) return;
        setComments((prev) => {
          if (prev.some((c) => c._id === newComment._id)) return prev;
          return [...prev, newComment];
        });
      };

      const handleMemberJoined = (data) => {
        if (data && data.groupId === groupId) {
          fetchGroupData();
        }
      };

      socket.on('document_added', handleDocAdded);
      socket.on('document_deleted', handleDocDeleted);
      socket.on('group_message_received', handleNewMessage);
      socket.on('member_joined', handleMemberJoined);

      return () => {
        socket.emit('leave_group_room', groupId);
        socket.off('document_added', handleDocAdded);
        socket.off('document_deleted', handleDocDeleted);
        socket.off('group_message_received', handleNewMessage);
        socket.off('member_joined', handleMemberJoined);
      };
    }
  }, [groupId, socket]);

  const fetchGroupData = async () => {
    try {
      const [groupRes, docRes, commentRes] = await Promise.all([
        API.get(`/groups/${groupId}`),
        API.get(`/documents/group/${groupId}`),
        API.get(`/groups/${groupId}/comments`),
      ]);
      setGroup(groupRes.data);
      const docs = Array.isArray(docRes.data) ? docRes.data : [];
      const uniqueDocs = docs.filter(
        (doc, index, self) => doc && doc._id && index === self.findIndex((d) => d && d._id === doc._id)
      );
      setDocuments(uniqueDocs);
      setComments(Array.isArray(commentRes.data) ? commentRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mr-3"></div>
        Loading group workspace...
      </div>
    );
  }

  if (!group) {
    return <div className="p-12 text-center text-rose-400">Group not found or access denied.</div>;
  }

  const currentUserMember = group?.members?.find(
    (m) => m.user?._id === user?._id || m.user === user?._id
  );
  const isAdmin = currentUserMember?.role === 'Admin';

  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      await API.put(`/groups/${groupId}/members/${targetUserId}`, { role: newRole });
      setGroup((prev) => ({
        ...prev,
        members: prev.members.map((m) =>
          (m.user?._id || m.user) === targetUserId ? { ...m, role: newRole } : m
        ),
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update member role');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      const res = await API.post(`/groups/${groupId}/comments`, {
        message: messageText.trim(),
      });
      setComments((prev) => {
        if (prev.some((c) => c._id === res.data._id)) return prev;
        return [...prev, res.data];
      });
      setMessageText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">{group.name}</h1>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              Role: {currentUserMember?.role || 'Viewer'}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-2 max-w-xl">
            {group.description || 'No description provided.'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {isAdmin && (
            <button
              onClick={() => setIsInviteOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition"
            >
              + Invite Member
            </button>
          )}

          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition"
          >
            Upload Document
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Document Repository & Team Discussion */}
        <div className="lg:col-span-2 space-y-8">
          <DocumentList
            documents={documents}
            currentMemberRole={currentUserMember?.role}
            currentUserId={user?._id}
            onDocumentDeleted={(id) => setDocuments((prev) => prev.filter((d) => d._id !== id))}
          />

          {/* Real-time Group Discussion Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <span className="text-lg">💬</span>
                <h3 className="text-base font-bold text-white">Group Discussion ({comments.length})</h3>
              </div>
              <span className="text-xs text-slate-500 flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                Live Chat
              </span>
            </div>

            {/* Messages Feed */}
            <div className="max-h-80 overflow-y-auto space-y-3.5 pr-2 mb-4 scrollbar-thin">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No messages yet in this group. Start the conversation below!
                </div>
              ) : (
                comments.map((comment) => {
                  const isMe = (comment.author?._id || comment.author) === user?._id;
                  return (
                    <div
                      key={comment._id}
                      className={`flex items-start space-x-3 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}
                    >
                      <img
                        src={getImageUrl(comment.author?.avatarUrl)}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700 shrink-0 mt-0.5"
                      />
                      <div
                        className={`p-3.5 rounded-2xl max-w-md ${
                          isMe
                            ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-100'
                            : 'bg-slate-800/60 border border-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between space-x-3 mb-1">
                          <span className="text-xs font-semibold text-white">
                            {isMe ? 'You' : comment.author?.name || 'Member'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed break-words">{comment.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                placeholder="Share an update or comment with the team..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              <button
                type="submit"
                disabled={!messageText.trim() || sendingMessage}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Members Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-fit">
          <h3 className="text-base font-bold text-white mb-4">
            Group Members ({group.members?.length || 0})
          </h3>
          <div className="space-y-4">
            {group.members?.map((m) => {
              const memberId = m.user?._id || m.user;
              const isSelf = memberId === user?._id;

              return (
                <div key={memberId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={getImageUrl(m.user?.avatarUrl)}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-700"
                    />
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {m.user?.name || 'Member'} {isSelf ? '(You)' : ''}
                      </p>
                      <p className="text-[10px] text-slate-400">{m.user?.email || ''}</p>
                    </div>
                  </div>

                  {isAdmin && !isSelf ? (
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(memberId, e.target.value)}
                      className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Editor">Editor</option>
                      <option value="Viewer">Viewer</option>
                    </select>
                  ) : (
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        m.role === 'Admin'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : m.role === 'Editor'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {m.role}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isUploadOpen && (
        <DocumentUploadModal
          groupId={groupId}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={(newDoc) => {
            if (newDoc && newDoc._id) {
              setDocuments((prev) => {
                if (prev.some((d) => d._id === newDoc._id)) return prev;
                return [newDoc, ...prev];
              });
            }
            setIsUploadOpen(false);
          }}
        />
      )}

      {isInviteOpen && (
        <InviteMemberModal
          groupId={groupId}
          onClose={() => setIsInviteOpen(false)}
        />
      )}
    </div>
  );
};

export default GroupDetail;
