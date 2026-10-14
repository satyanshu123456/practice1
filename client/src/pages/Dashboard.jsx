import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import CreateGroupModal from '../components/groups/CreateGroupModal';

const Dashboard = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await API.get('/groups');
      setGroups(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupCreated = (newGroup) => {
    setGroups((prev) => [newGroup, ...prev]);
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Your Collaborative Groups</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your existing groups or create a new workspace where you become the default Admin.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition w-fit"
        >
          + Create New Group
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500">Loading your groups...</div>
      ) : groups.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 text-2xl">
            📁
          </div>
          <h3 className="text-lg font-bold text-white">No groups yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Create a new group above to become the default Admin, or join an existing group via an invite link.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {groups.map((group) => {
            const myMembership = group.members.find(
              (m) => m.user?._id === user?._id || m.user === user?._id
            );
            const isAdmin = myMembership?.role === 'Admin';

            return (
              <Link
                key={group._id}
                to={`/groups/${group._id}`}
                className="group block p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      isAdmin
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isAdmin ? 'Default Admin' : myMembership?.role || 'Member'}
                  </span>
                  <span className="text-xs text-slate-500">{group.members?.length || 1} Members</span>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition">
                  {group.name}
                </h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                  {group.description || 'No description provided.'}
                </p>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Enter Workspace →</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <CreateGroupModal
          onClose={() => setIsModalOpen(false)}
          onGroupCreated={handleGroupCreated}
        />
      )}
    </div>
  );
};

export default Dashboard;
