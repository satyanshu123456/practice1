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
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroupData();

    if (socket) {
      socket.emit('join_group_room', groupId);

      socket.on('document_added', (newDoc) => {
        setDocuments((prev) => [newDoc, ...prev]);
      });

      socket.on('document_deleted', (deletedId) => {
        setDocuments((prev) => prev.filter((d) => d._id !== deletedId));
      });
    }

    return () => {
      if (socket) {
        socket.emit('leave_group_room', groupId);
        socket.off('document_added');
        socket.off('document_deleted');
      }
    };
  }, [groupId, socket]);

  const fetchGroupData = async () => {
    try {
      const [groupRes, docRes] = await Promise.all([
        API.get(`/groups/${groupId}`),
        API.get(`/documents/group/${groupId}`),
      ]);
      setGroup(groupRes.data);
      setDocuments(docRes.data);
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
        {/* Document Repository */}
        <div className="lg:col-span-2">
          <DocumentList
            documents={documents}
            currentMemberRole={currentUserMember?.role}
            currentUserId={user?._id}
            onDocumentDeleted={(id) => setDocuments((prev) => prev.filter((d) => d._id !== id))}
          />
        </div>

        {/* Members Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-fit">
          <h3 className="text-base font-bold text-white mb-4">
            Group Members ({group.members?.length || 0})
          </h3>
          <div className="space-y-4">
            {group.members?.map((m) => (
              <div key={m.user?._id || m.user} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={getImageUrl(m.user?.avatarUrl)}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-700"
                  />
                  <div>
                    <p className="text-xs font-semibold text-white">{m.user?.name || 'Member'}</p>
                    <p className="text-[10px] text-slate-400">{m.user?.email || ''}</p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    m.role === 'Admin'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : m.role === 'Editor'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isUploadOpen && (
        <DocumentUploadModal
          groupId={groupId}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={(newDoc) => {
            setDocuments((prev) => [newDoc, ...prev]);
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
