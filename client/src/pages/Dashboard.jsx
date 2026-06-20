import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  FileText,
  FolderPlus,
  Folder,
  Tag,
  Star,
  Trash2,
  Download,
  Eye,
  Plus,
  TrendingUp,
  HardDrive,
  Clock,
  ChevronRight,
  FolderOpen
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const COLORS = ['#0c85dd', '#10b981', '#8b5cf6', '#f59e0b'];

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState(null); // Filter by folder
  
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [docsRes, foldersRes, historyRes] = await Promise.all([
        API.get('/documents'),
        API.get('/documents/folders/all'),
        API.get('/search/history')
      ]);
      setDocuments(docsRes.data);
      setFolders(foldersRes.data);
      setHistory(historyRes.data);
    } catch (error) {
      showToast('Error loading dashboard analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await API.post('/documents/folders', { name: newFolderName });
      showToast('Folder created successfully', 'success');
      setNewFolderName('');
      setShowFolderModal(false);
      fetchDashboardData();
    } catch (error) {
      showToast(error.response?.data?.message || 'Error creating folder', 'error');
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!window.confirm('Delete folder? Files inside will be moved to root.')) return;
    try {
      await API.delete(`/documents/folders/${folderId}`);
      showToast('Folder deleted successfully', 'success');
      if (activeFolderId === folderId) setActiveFolderId(null);
      fetchDashboardData();
    } catch (error) {
      showToast('Error deleting folder', 'error');
    }
  };

  const handleToggleFavorite = async (docId) => {
    try {
      await API.put(`/documents/${docId}/favorite`);
      setDocuments(prev =>
        prev.map(doc => doc._id === docId ? { ...doc, isFavorite: !doc.isFavorite } : doc)
      );
      showToast('Favorite status updated', 'success');
    } catch (error) {
      showToast('Error updating favorite', 'error');
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document permanently?')) return;
    try {
      await API.delete(`/documents/${docId}`);
      showToast('Document deleted successfully', 'success');
      setDocuments(prev => prev.filter(doc => doc._id !== docId));
    } catch (error) {
      showToast('Error deleting document', 'error');
    }
  };

  // Calculations for analytics
  const totalSize = documents.reduce((acc, curr) => acc + curr.fileSize, 0);
  const favoritesCount = documents.filter(d => d.isFavorite).length;

  const fileTypeCounts = documents.reduce((acc, curr) => {
    acc[curr.fileType] = (acc[curr.fileType] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(fileTypeCounts).map(key => ({
    name: key.toUpperCase(),
    value: fileTypeCounts[key]
  }));

  const monthlyUploads = documents.reduce((acc, curr) => {
    const date = new Date(curr.createdAt);
    const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });
    acc[monthYear] = (acc[monthYear] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.keys(monthlyUploads).map(key => ({
    name: key,
    uploads: monthlyUploads[key]
  })).reverse().slice(-6); // Last 6 months

  const filteredDocs = activeFolderId
    ? documents.filter(d => d.folder === activeFolderId)
    : documents; // Showing all documents in catalog

  const recentUploads = documents.slice(0, 5);

  const getFileIconColor = (type) => {
    switch (type) {
      case 'pdf': return 'text-rose-500 bg-rose-50 dark:bg-rose-950/20';
      case 'docx': return 'text-blue-500 bg-blue-50 dark:bg-blue-950/20';
      case 'image': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
      default: return 'text-amber-500 bg-amber-50 dark:bg-amber-950/20';
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
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-sans">Workspace Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">View file storage, quick metrics and recent actions</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowFolderModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            <FolderPlus className="w-4 h-4" /> Create Folder
          </button>
          
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" /> Upload Document
          </button>
        </div>
      </div>

      {/* Cards Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl glass-card flex items-center gap-4">
          <div className="p-4 rounded-xl bg-blue-500/10 text-brand-500">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{documents.length}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Documents</div>
          </div>
        </div>

        <div className="p-6 rounded-2xl glass-card flex items-center gap-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-500">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{formatBytes(totalSize)}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Storage Used</div>
          </div>
        </div>

        <div className="p-6 rounded-2xl glass-card flex items-center gap-4">
          <div className="p-4 rounded-xl bg-violet-500/10 text-violet-500">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{favoritesCount}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Favorite Documents</div>
          </div>
        </div>

        <div className="p-6 rounded-2xl glass-card flex items-center gap-4">
          <div className="p-4 rounded-xl bg-amber-500/10 text-amber-500">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-semibold truncate max-w-[150px]">
              {history.length > 0 ? history[0].query : 'No searches yet'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Last Search Query</div>
          </div>
        </div>
      </div>

      {/* Folders Section */}
      {folders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold">Workspace Folders</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {folders.map(f => (
              <div
                key={f._id}
                onClick={() => setActiveFolderId(activeFolderId === f._id ? null : f._id)}
                className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between h-28 relative group ${
                  activeFolderId === f._id
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className={`${activeFolderId === f._id ? 'text-brand-500' : 'text-slate-400'}`}>
                    {activeFolderId === f._id ? <FolderOpen className="w-8 h-8" /> : <Folder className="w-8 h-8" />}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(f._id);
                    }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 text-slate-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="font-semibold text-sm truncate pr-2 mt-2">{f.name}</div>
                <div className="text-[10px] text-slate-500">
                  {documents.filter(d => d.folder === f._id).length} files
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart Panel */}
      {documents.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl glass-card lg:col-span-2">
            <h3 className="text-md font-bold mb-4 flex items-center gap-1.5">
              <TrendingUp className="w-5 h-5 text-brand-500" /> Upload Activity
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="uploads" fill="#0c85dd" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-6 rounded-2xl glass-card flex flex-col justify-between">
            <h3 className="text-md font-bold mb-2">Category Spread</h3>
            <div className="h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-semibold">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="truncate">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Documents Grid / List */}
      <div className="p-6 rounded-2xl glass-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">
            {activeFolderId
              ? `Files inside: ${folders.find(f => f._id === activeFolderId)?.name}`
              : 'Recent Uploads Catalog'}
          </h3>
          {activeFolderId && (
            <button
              onClick={() => setActiveFolderId(null)}
              className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            >
              Clear Filter
            </button>
          )}
        </div>

        {filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <FileText className="w-12 h-12 mb-3 text-slate-300" />
            <p className="font-semibold text-sm">No documents found</p>
            <p className="text-xs">Drag some files into the Uploads page to begin indexing.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4 hidden md:table-cell">File Size</th>
                  <th className="py-3 px-4 hidden lg:table-cell">Date Uploaded</th>
                  <th className="py-3 px-4">Tags</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredDocs.map(doc => (
                  <tr key={doc._id} className="hover:bg-slate-50/55 dark:hover:bg-slate-800/20 group">
                    <td className="py-3 px-4 font-semibold flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getFileIconColor(doc.fileType)}`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <span
                        onClick={() => navigate(`/viewer/${doc._id}`)}
                        className="hover:text-brand-600 cursor-pointer transition truncate max-w-[200px] md:max-w-xs"
                      >
                        {doc.title}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-slate-500">{formatBytes(doc.fileSize)}</td>
                    <td className="py-3 px-4 hidden lg:table-cell text-slate-500">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.length > 0 ? (
                          doc.tags.slice(0, 2).map(tag => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                            >
                              <Tag className="w-2.5 h-2.5" /> {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                        {doc.tags.length > 2 && (
                          <span className="text-[10px] font-semibold text-slate-400 px-1 pt-0.5">
                            +{doc.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleFavorite(doc._id)}
                          className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                            doc.isFavorite ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'
                          }`}
                          title="Toggle Favorite"
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                        
                        <button
                          onClick={() => navigate(`/viewer/${doc._id}`)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="View Content"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <a
                          href={`http://localhost:5050/api/documents/${doc._id}/download`}
                          download
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Download File"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        
                        <button
                          onClick={() => handleDeleteDocument(doc._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Delete Document"
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
        )}
      </div>

      {/* Folders Creation Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl mx-6">
            <h3 className="text-lg font-bold mb-4">Create New Folder</h3>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder Name"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
                required
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-xl"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
