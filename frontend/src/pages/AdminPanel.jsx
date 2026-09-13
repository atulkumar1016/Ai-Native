import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Users, Shield, Trash2, Check, RefreshCw, AlertTriangle, UserCheck } from 'lucide-react';

const AdminPanel = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await client.get('/admin/users');
        setUsers(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Access Denied. You do not have administrator permissions.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [refreshKey]);

  const handleUpdateRole = async (userId, currentRole) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    const confirm = window.confirm(`Are you sure you want to change this user's role to ${nextRole}?`);
    if (!confirm) return;

    try {
      await client.put(`/admin/users/${userId}/role`, { role: nextRole });
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId, name) => {
    const confirm = window.confirm(`WARNING: Are you sure you want to delete user "${name}"? This action cannot be undone!`);
    if (!confirm) return;

    try {
      await client.delete(`/admin/users/${userId}`);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-brandIndigo border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 text-xs">Fetching users directory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-8 rounded-2xl border border-darkBorder max-w-md mx-auto text-center space-y-4 my-12">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-white">Permission Error</h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold font-display text-white">Admin Console</h2>
          <p className="text-sm text-gray-400">Manage user accounts, assign dashboard roles, and audit access permissions</p>
        </div>
        <button
          onClick={() => setRefreshKey(prev => prev + 1)}
          className="p-3 rounded-xl border border-darkBorder hover:bg-white/5 text-gray-400 hover:text-white transition-all duration-200"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Users directory panel */}
      <div className="glass-panel p-6 rounded-2xl border border-darkBorder space-y-4 indigo-glow">
        <h4 className="text-md font-semibold text-white flex items-center gap-1.5">
          <Users className="w-5 h-5 text-brandIndigo" /> User Directory ({users.length})
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400 border-collapse">
            <thead>
              <tr className="border-b border-darkBorder text-xs text-gray-300 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((userObj) => {
                const isSelf = userObj._id === currentUser?._id;
                return (
                  <tr key={userObj._id} className="border-b border-darkBorder/40 hover:bg-white/5 transition-all">
                    <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                      {userObj.name} {isSelf && <span className="text-[9px] font-bold bg-white/10 text-gray-300 px-1.5 py-0.5 rounded-md">You</span>}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">{userObj.email}</td>
                    <td className="py-3.5 px-4 text-xs font-bold">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${
                        userObj.role === 'admin' ? 'bg-brandViolet/10 text-brandViolet' : 'bg-gray-800 text-gray-400'
                      }`}>
                        <Shield className="w-3.5 h-3.5" />
                        {userObj.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">
                      {new Date(userObj.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {/* Demote / Promote */}
                      <button
                        onClick={() => handleUpdateRole(userObj._id, userObj.role)}
                        disabled={isSelf}
                        className={`p-1.5 rounded-lg border border-darkBorder text-xs font-semibold inline-flex items-center gap-1.5 transition-all ${
                          isSelf
                            ? 'opacity-30 cursor-not-allowed'
                            : 'hover:border-brandIndigo/30 hover:bg-brandIndigo/5 text-gray-400 hover:text-brandIndigo'
                        }`}
                        title={userObj.role === 'admin' ? 'Change to standard user' : 'Make Administrator'}
                      >
                        <UserCheck className="w-4 h-4" />
                        {userObj.role === 'admin' ? 'Demote' : 'Make Admin'}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteUser(userObj._id, userObj.name)}
                        disabled={isSelf}
                        className={`p-1.5 rounded-lg border border-darkBorder text-gray-500 inline-flex items-center transition-all ${
                          isSelf
                            ? 'opacity-30 cursor-not-allowed'
                            : 'hover:border-red-500/20 hover:bg-red-500/5 hover:text-red-400'
                        }`}
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
