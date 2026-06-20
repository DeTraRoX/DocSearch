import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Sparkles,
  Download,
  Send,
  HelpCircle,
  Folder,
  Tag,
  Star,
  Eye,
  FileDown
} from 'lucide-react';

const DocumentViewer = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [doc, setDoc] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Search inside document
  const [docSearchQuery, setDocSearchQuery] = useState('');
  
  // AI Chat states
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  
  const chatBottomRef = useRef(null);

  // Fetch document details
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/documents/${id}`);
        setDoc(data);

        // Split text into pages based on form feeds (pdf standard)
        let pageTexts = [];
        if (data.extractedText) {
          pageTexts = data.extractedText.split(/\u000c|\f/).map(p => p.trim()).filter(Boolean);
        }
        
        if (pageTexts.length === 0) {
          pageTexts = [data.extractedText || 'This document contains no extractable text.'];
        }
        setPages(pageTexts);

        // Set initial page from URL query param if present
        const urlPage = searchParams.get('page');
        if (urlPage) {
          const pageNum = parseInt(urlPage);
          if (pageNum > 0 && pageNum <= pageTexts.length) {
            setCurrentPage(pageNum);
          }
        }

        // Set initial search highlight from URL if present
        const urlQuery = searchParams.get('q');
        if (urlQuery) {
          setDocSearchQuery(urlQuery);
        }

        // Prepopulate chat history with a greeting
        setChatHistory([
          {
            sender: 'ai',
            text: `Hi! I'm your AI Document Assistant. Ask me anything about "${data.title}" or click the summarize button below to extract key themes.`
          }
        ]);

      } catch (err) {
        showToast('Error loading document details', 'error');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchDocument();
  }, [id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  const handleGenerateSummary = async () => {
    if (!doc) return;
    setSummaryLoading(true);
    try {
      const { data } = await API.post('/ai/summarize', { documentId: doc._id });
      setDoc(prev => ({ ...prev, summary: data.summary }));
      
      // Append summary to chat history
      setChatHistory(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `Here is the AI generated summary of the document:\n\n${data.summary}`
        }
      ]);
      showToast('Summary loaded successfully', 'success');
    } catch (err) {
      showToast('Error generating summary', 'error');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !doc) return;

    const userMsgText = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsgText }]);
    setChatLoading(true);

    try {
      const { data } = await API.post('/ai/chat', {
        documentId: doc._id,
        message: userMsgText
      });

      setChatHistory(prev => [
        ...prev,
        {
          sender: 'ai',
          text: data.answer,
          sources: data.sources
        }
      ]);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch AI response', 'error');
    } finally {
      setChatLoading(false);
    }
  };

  // Helper to dynamically highlight matching text in viewer
  const renderHighlightedText = (text) => {
    if (!docSearchQuery.trim()) return text;
    const escapedQuery = docSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  const handleToggleFavorite = async () => {
    if (!doc) return;
    try {
      await API.put(`/documents/${doc._id}/favorite`);
      setDoc(prev => ({ ...prev, isFavorite: !prev.isFavorite }));
      showToast('Favorite status updated', 'success');
    } catch (err) {
      showToast('Error updating favorite', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
      </div>
    );
  }

  const isImageFile = doc.fileType === 'image';
  const fileDownloadUrl = `http://localhost:5050/api/documents/${doc._id}/download`;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden fade-in">
      {/* LEFT PANEL: Document Previewer & Search */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-[#070b14] border-r border-slate-200 dark:border-slate-800">
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 gap-4">
          <div className="flex items-center gap-3 truncate max-w-md w-full">
            <div className={`p-2 rounded-lg ${isImageFile ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h2 className="font-bold text-sm truncate">{doc.title}</h2>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-sans">
                <span className="capitalize">{doc.fileType}</span>
                <span>•</span>
                <span>Page {currentPage} of {pages.length}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Local text search input */}
            <div className="relative flex-1 md:w-60">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={docSearchQuery}
                onChange={(e) => setDocSearchQuery(e.target.value)}
                placeholder="Find in document..."
                className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none dark:text-white"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleToggleFavorite}
                className={`p-2 rounded-lg border transition ${
                  doc.isFavorite
                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20 text-amber-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-400'
                }`}
                title="Favorite"
              >
                <Star className="w-4 h-4 fill-current" />
              </button>
              
              <a
                href={fileDownloadUrl}
                download
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-500 dark:text-slate-400 transition"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Content Preview Canvas */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col items-center">
          {isImageFile && doc.fileUrl && (
            <div className="mb-6 max-w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 p-2 shadow-sm">
              <img
                src={`http://localhost:5050${doc.fileUrl}`}
                alt={doc.title}
                className="max-h-96 object-contain"
              />
            </div>
          )}

          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 rounded-2xl p-6 md:p-8 shadow-sm font-sans min-h-[400px] leading-relaxed text-sm dark:text-slate-200 break-words whitespace-pre-wrap">
            {docSearchQuery.trim() ? (
              <div dangerouslySetInnerHTML={{ __html: renderHighlightedText(pages[currentPage - 1] || '') }} />
            ) : (
              pages[currentPage - 1] || ''
            )}
          </div>
        </div>

        {/* Bottom Pagination Control */}
        {pages.length > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-xs font-bold text-slate-500 font-sans">
              Page {currentPage} of {pages.length}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(pages.length, prev + 1))}
              disabled={currentPage === pages.length}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-40"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: AI Document Assistant Side Panel */}
      <div className="w-full lg:w-96 flex flex-col h-full bg-white dark:bg-[#0c1220] border-l border-slate-200 dark:border-slate-800">
        {/* Assistant Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-500">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <h3 className="font-bold text-sm">AI Doc Assistant</h3>
          </div>
          
          {!doc.summary && (
            <button
              onClick={handleGenerateSummary}
              disabled={summaryLoading}
              className="text-xs font-semibold text-brand-600 hover:text-brand-500 flex items-center gap-1 bg-brand-50 dark:bg-brand-950/20 px-2 py-1 rounded-md transition"
            >
              {summaryLoading ? 'Summarizing...' : 'Summarize'}
            </button>
          )}
        </div>

        {/* Chat Message Logs Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.map((chat, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                chat.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed font-sans ${
                  chat.sender === 'user'
                    ? 'bg-brand-600 text-white rounded-br-none shadow-sm shadow-brand-500/15'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-line">{chat.text}</div>
                
                {/* Citations list */}
                {chat.sources && chat.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Document Sources:</div>
                    <div className="flex flex-wrap gap-1">
                      {chat.sources.map((src) => (
                        <button
                          key={src.sourceId}
                          onClick={() => setCurrentPage(src.pageNumber)}
                          className="inline-flex items-center px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-950/40 text-[9px] font-bold text-brand-700 dark:text-brand-400 border border-brand-100 dark:border-brand-900/20 hover:bg-brand-100 transition"
                          title={src.snippet}
                        >
                          Page {src.pageNumber}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 dark:bg-slate-800/80 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Chat Input form */}
        <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="flex gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Ask document questions..."
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none dark:text-white"
              required
              disabled={chatLoading}
            />
            <button
              type="submit"
              disabled={chatLoading || !chatMessage.trim()}
              className="p-2 rounded-xl bg-brand-600 text-white hover:bg-brand-500 transition disabled:opacity-50 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentViewer;
