import React from 'react';
import API from '../../api/axiosInstance';

const DocumentList = ({ documents, currentMemberRole, currentUserId, onDocumentDeleted }) => {
  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await API.delete(`/documents/${docId}`);
      onDocumentDeleted(docId);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (!documents || documents.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center text-slate-500">
        <div className="text-3xl mb-2">📄</div>
        <p className="font-medium text-slate-400">No documents uploaded yet in this group.</p>
        <p className="text-xs text-slate-500 mt-1">Upload PDF, DOCX, or Image files to share with group members.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
      <h3 className="text-base font-bold text-white mb-4">Shared Documents ({documents.length})</h3>
      <div className="space-y-3">
        {documents.map((doc) => {
          const isUploader = doc.uploadedBy?._id === currentUserId;
          const canDelete =
            currentMemberRole === 'Admin' ||
            doc.deleteAllowedRoles?.includes(currentMemberRole) ||
            isUploader;

          const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
          const fileDownloadUrl = `${serverUrl}${doc.fileUrl}`;

          return (
            <div
              key={doc._id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition gap-4"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs uppercase shrink-0">
                  {doc.fileType?.includes('pdf')
                    ? 'PDF'
                    : doc.fileType?.includes('image')
                    ? 'IMG'
                    : 'DOC'}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{doc.title}</h4>
                  <p className="text-[11px] text-slate-400">
                    Uploaded by <span className="text-slate-300 font-medium">{doc.uploadedBy?.name || 'User'}</span> •{' '}
                    {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB •{' '}
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <a
                  href={fileDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={doc.originalName}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-semibold transition"
                >
                  Download
                </a>

                {canDelete && (
                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white text-xs font-semibold transition"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentList;
