import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import { Upload as UploadIcon, FileText, X, AlertCircle, Folder, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [folder, setFolder] = useState('root');
  const [tags, setTags] = useState('');
  const [folders, setFolders] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const { data } = await API.get('/documents/folders/all');
        setFolders(data);
      } catch (err) {
        console.error('Error fetching folders:', err);
      }
    };
    fetchFolders();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        showToast('File is too large. Max size is 10MB.', 'error');
        return;
      }
      setFile(selectedFile);
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, "")); // Strip extension for default title
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const selectedFile = e.dataTransfer.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        showToast('File is too large. Max size is 10MB.', 'error');
        return;
      }
      setFile(selectedFile);
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setTitle('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      return showToast('Please select a file to upload', 'error');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('folder', folder === 'root' ? '' : folder);
    
    // Parse tags into array format
    const tagsArr = tags.split(',').map(t => t.trim()).filter(Boolean);
    formData.append('tags', JSON.stringify(tagsArr));

    setUploading(true);
    setProgress(15); // Artificial starting progress

    try {
      await API.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // Reserve top end for processing on server
          setProgress(Math.min(percentCompleted, 85));
        }
      });
      
      setProgress(100);
      showToast('Document uploaded, parsed and indexed successfully!', 'success');
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err) {
      showToast(err.response?.data?.message || 'File upload failed.', 'error');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 lg:p-8 space-y-8 fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-sans">Upload Documents</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">Ingest PDF, DOCX, TXT, or Image files. Our pipeline will automatically extract text, run OCR (if needed), create search indices and structure summaries.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload form columns */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="p-6 rounded-2xl glass-card space-y-5">
            {/* File Drag Area */}
            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-brand-500 rounded-2xl py-12 px-6 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-900/30 transition duration-200"
              >
                <input
                  type="file"
                  id="file-input"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                  className="hidden"
                />
                <label htmlFor="file-input" className="cursor-pointer flex flex-col items-center">
                  <div className="p-4 rounded-full bg-brand-500/10 text-brand-500 mb-4 animate-bounce">
                    <UploadIcon className="w-8 h-8" />
                  </div>
                  <p className="font-semibold text-sm">Drag & drop your file here, or <span className="text-brand-600 dark:text-brand-400 hover:underline">browse</span></p>
                  <p className="text-xs text-slate-400 mt-2">PDF, DOCX, TXT, PNG, JPG, or JPEG up to 10MB</p>
                </label>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/30 dark:bg-slate-900/10">
                <div className="flex items-center gap-3 truncate">
                  <div className="p-3 rounded-lg bg-brand-500/10 text-brand-500">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-sm truncate">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Document Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Document Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Name your document"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm dark:text-white"
                required
                disabled={!file}
              />
            </div>

            {/* Folder Select */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                <Folder className="w-3.5 h-3.5" /> Destination Folder
              </label>
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm dark:text-white dark:bg-[#0f172a]"
                disabled={!file}
              >
                <option value="root">Workspace Root (/)</option>
                {folders.map(f => (
                  <option key={f._id} value={f._id}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* Document Tags */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Document Tags
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="finance, invoice, notes (comma-separated)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm dark:text-white"
                disabled={!file}
              />
            </div>

            {/* Upload Button / Progress Bar */}
            {uploading ? (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-brand-400">
                  <span className="flex items-center gap-1.5">
                    <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-brand-500" />
                    {progress === 85 ? 'Analyzing & indexing document...' : 'Uploading file...'}
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                type="submit"
                disabled={!file}
                className="flex items-center justify-center gap-2 w-full py-3.5 mt-6 font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 rounded-xl shadow-lg shadow-brand-500/25 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
              >
                Start Ingestion
              </button>
            )}
          </form>
        </div>

        {/* Sidebar Info Card */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl glass-card border border-brand-100/30 text-sm space-y-4">
            <h4 className="font-bold flex items-center gap-1.5 text-brand-600 dark:text-brand-400">
              <AlertCircle className="w-5 h-5" /> Processing Pipeline Info
            </h4>
            <ul className="space-y-3 text-slate-500 dark:text-slate-400 text-xs list-disc pl-4 leading-relaxed font-sans">
              <li>PDF pages are parsed individually, preserving structure for navigation.</li>
              <li>DOCX files have their layout and styles converted to clean queryable text.</li>
              <li>Images with text (PNG/JPG) undergo character-level OCR via Tesseract.</li>
              <li>Text chunks are indexed in real-time for intelligent keyword and fuzzy searches.</li>
              <li>Gemini AI compiles summaries of document themes in the background.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
