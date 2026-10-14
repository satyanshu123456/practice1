import React, { useState } from 'react';
import API from '../../api/axiosInstance';

const DocumentUploadModal = ({ groupId, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [deleteRole, setDeleteRole] = useState('Admin');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      const allowed = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!allowed.includes(selected.type)) {
        setError('Invalid file type! Only PDF, JPEG, PNG, and DOCX are allowed.');
        setFile(null);
        return;
      }
      setError('');
      setFile(selected);
      if (!title) setTitle(selected.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title) {
      setError('Please provide a document title and select a valid file.');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('groupId', groupId);
    formData.append('deleteAllowedRoles', JSON.stringify([deleteRole]));

    try {
      const res = await API.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-4">Upload Group Document</h3>

        {error && (
          <div className="mb-4 text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/30">
            {error}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Document Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. Q4 Financial Report"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Select File (PDF, JPEG, DOCX)
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Who can delete this file? (Access Permissions)
            </label>
            <select
              value={deleteRole}
              onChange={(e) => setDeleteRole(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="Admin">Only Group Admins</option>
              <option value="Editor">Admins & Editors</option>
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
              disabled={uploading}
              className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload & Notify Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentUploadModal;
