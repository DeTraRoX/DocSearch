import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import { Users, FileText, HardDrive, Trash2, ShieldAlert, Key } from 'lucide-react';

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const AdminPanel = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const { showToast } = useToast();

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        API.get('/admin/analytics'),
        API.get('/admin/users'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      showToast('Error loading admin control panel', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateRole = async (userId, currentRole) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change user role to ${nextRole}?`)) return;
    try {
      await API.put(`/admin/users/${userId}/role`, { role: nextRole });
      showToast('User role updated successfully', 'success');
      fetchAdminData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update user role', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete user and all their uploaded files permanently? This action is irreversible.')) return;
    try {
      await API.delete(`/admin/users/${userId}`);
      showToast('User account and documents removed', 'success');
      fetchAdminData();
    } catch (err) {
      showToast('Failed to delete user account', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 lg:p-8 fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 font-sans">
          <ShieldAlert className="w-8 h-8 text-rose-500" /> Administrative Console
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">Monitor storage, manage users, modify privileges and view logs</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl glass-card flex items-center gap-4">
            <div className="p-4 bg-blue-500/10 text-brand-500 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Registered Users</div>
            </div>
          </div>

          <div className="p-6 rounded-2xl glass-card flex items-center gap-4">
            <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalDocs}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Global File Uploads</div>
            </div>
          </div>

          <div className="p-6 rounded-2xl glass-card flex items-center gap-4">
            <div className="p-4 bg-violet-500/10 text-violet-500 rounded-xl">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{formatBytes(stats.totalStorageUsed)}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Aggregate Storage Used</div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 rounded-2xl glass-card">
        <h3 className="text-lg font-bold mb-4">User Accounts Catalog</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">System Role</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {users.map(u => (
                <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                  <td className="py-3.5 px-4 font-semibold">{u.name}</td>
                  <td className="py-3.5 px-4 text-slate-500">{u.email}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.role === 'admin' 
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-300'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleUpdateRole(u._id, u.role)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-805 text-slate-500 dark:text-slate-400 transition"
                        title="Toggle Admin Privilege"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-red-50 hover:text-red-500 text-slate-400 transition"
                        title="Delete User & Files"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {stats && stats.recentQueries && stats.recentQueries.length > 0 && (
        <div className="p-6 rounded-2xl glass-card">
          <h3 className="text-lg font-bold mb-4">Recent Global Query Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Search Term</th>
                  <th className="py-3 px-4">Triggered By</th>
                  <th className="py-3 px-4">Result Hits</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {stats.recentQueries.map((q, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                    <td className="py-3 px-4 font-semibold font-mono text-brand-600 dark:text-brand-400">"{q.query}"</td>
                    <td className="py-3 px-4 font-medium">{q.userId ? `${q.userId.name} (${q.userId.email})` : 'Deleted User'}</td>
                    <td className="py-3 px-4 text-slate-500 font-semibold">{q.resultsCount} matches</td>
                    <td className="py-3 px-4 text-slate-400">{new Date(q.searchedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
