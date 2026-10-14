import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axiosInstance';
import { getImageUrl } from '../utils/imageHelper';

const Profile = () => {
  const { user, updateProfileState } = useAuth();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    title: user?.title || '',
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || '',
    skills: user?.skills?.join(', ') || '',
    location: user?.location || '',
    phoneNumber: user?.phoneNumber || '',
  });

  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle direct file upload for profile image (img)
  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate image format
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, GIF, WebP).');
      return;
    }

    setUploadingImg(true);
    setError('');
    setMessage('');

    const imgFormData = new FormData();
    imgFormData.append('avatar', file);

    try {
      const res = await API.post('/auth/upload-avatar', imgFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData((prev) => ({ ...prev, avatarUrl: res.data.avatarUrl }));
      updateProfileState({ avatarUrl: res.data.avatarUrl });
      setMessage('Profile image uploaded and updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload profile image.');
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await API.put('/auth/profile', formData);
      updateProfileState(res.data);
      setMessage('Profile details updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
        {/* Profile Header with Avatar / Image Upload */}
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 pb-8 border-b border-slate-800">
          <div className="relative group">
            <img
              src={getImageUrl(formData.avatarUrl || user?.avatarUrl)}
              alt="Profile"
              className="w-28 h-28 rounded-2xl object-cover ring-4 ring-indigo-500/30 shadow-lg"
            />
            
            {/* Quick Upload Button Overlay on Avatar */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImg}
              className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition duration-200 cursor-pointer disabled:opacity-50"
              title="Change Profile Image"
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-[10px] font-semibold">Change Img</span>
            </button>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="text-center md:text-left flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImg}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 transition w-fit mx-auto sm:mx-0"
              >
                {uploadingImg ? 'Uploading...' : '📷 Upload New Image'}
              </button>
            </div>
            <p className="text-sm text-indigo-400 font-medium mt-1">{user?.title || 'Collaborator'}</p>
            <p className="text-xs text-slate-400 mt-1">{user?.email}</p>
          </div>
        </div>

        {/* Feedback Messages */}
        {message && (
          <div className="my-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
            {message}
          </div>
        )}

        {error && (
          <div className="my-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Profile Fields Form */}
        <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full bg-slate-800/70 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Job Title / Role</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Lead Developer"
              className="w-full bg-slate-800/70 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Profile Image URL or Upload Option */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-400">
                Profile Image (Direct Upload or Image URL)
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Browse device file...
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                name="avatarUrl"
                value={formData.avatarUrl}
                onChange={handleChange}
                placeholder="Upload file above or paste an image URL here (https://...)"
                className="w-full bg-slate-800/70 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImg}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 shrink-0 transition"
              >
                {uploadingImg ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 mb-2">Bio</label>
            <textarea
              name="bio"
              rows="3"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell other group members about your background..."
              className="w-full bg-slate-800/70 border border-slate-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 mb-2">Skills (Comma-separated)</label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="e.g. Node.js, React, MongoDB, System Design"
              className="w-full bg-slate-800/70 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. San Francisco, CA / Remote"
              className="w-full bg-slate-800/70 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Phone Number</label>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
              className="w-full bg-slate-800/70 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="md:col-span-2 pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
