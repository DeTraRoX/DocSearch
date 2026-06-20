import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import { Sparkles, MessageSquare, Send, BookOpen, AlertCircle, FileText, Download } from 'lucide-react';

const AIAssistant = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  
  // Chat details
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const { showToast } = useToast();
  const chatBottomRef = useRef(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const { data } = await API.get('/documents');
        setDocuments(data);
      } catch (err) {
        showToast('Error loading documents for assistant', 'error');
      }
    };
    fetchDocuments();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  const handleDocChange = async (e) => {
    const docId = e.target.value;
    setSelectedDocId(docId);
    
    if (!docId) {
      setSelectedDoc(null);
      setChatHistory([]);
      return;
    }

    try {
      setSummaryLoading(true);
      const { data } = await API.get(`/documents/${docId}`);
      setSelectedDoc(data);
      
      // Initialize chat session
      setChatHistory([
        {
          sender: 'ai',
          text: `I've loaded the document "${data.title}". You can now ask questions about its content, request summaries, or extract key action items.`
        }
      ]);
    } catch (err) {
      showToast('Error loading document details', 'error');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!selectedDoc) return;
    setSummaryLoading(true);
    try {
      const { data } = await API.post('/ai/summarize', { documentId: selectedDoc._id });
      setSelectedDoc(prev => ({ ...prev, summary: data.summary }));
      
      setChatHistory(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `Summary of "${selectedDoc.title}":\n\n${data.summary}`
        }
      ]);
      showToast('Document summary generated', 'success');
    } catch (err) {
      showToast('Failed to generate summary', 'error');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedDoc) return;

    const userMsgText = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsgText }]);
    setChatLoading(true);

    try {
      const { data } = await API.post('/ai/chat', {
        documentId: selectedDoc._id,
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
      showToast(err.response?.data?.message || 'Failed to fetch response', 'error');
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-8 h-[calc(100vh-4rem)] flex flex-col fade-in">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-brand-500 animate-pulse" /> AI Knowledge Assistant
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Select any uploaded file to begin summaries, Q&A and extracts.</p>
        </div>

        {/* Dropdown File Selector */}
        <div className="w-full md:w-72">
          <select
            value={selectedDocId}
            onChange={handleDocChange}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-sm focus:outline-none dark:text-white dark:bg-[#0f172a]"
          >
            <option value="">-- Choose a Document --</option>
            {documents.map(d => (
              <option key={d._id} value={d._id}>{d.title} ({d.fileType.toUpperCase()})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main chat layout */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {selectedDoc ? (
          <>
            {/* Left Info Column */}
            <div className="lg:col-span-1 flex flex-col gap-6 overflow-y-auto pr-2">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-500/10 text-brand-500 rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <h4 className="font-bold text-sm truncate">{selectedDoc.title}</h4>
                    <p className="text-xs text-slate-400 capitalize">{selectedDoc.fileType}</p>
                  </div>
                </div>

                {!selectedDoc.summary ? (
                  <button
                    onClick={handleGenerateSummary}
                    disabled={summaryLoading}
                    className="w-full py-2 text-xs font-semibold bg-brand-50 hover:bg-brand-100 text-brand-600 dark:bg-brand-950/20 dark:text-brand-400 rounded-xl transition"
                  >
                    {summaryLoading ? 'Generating Summary...' : 'Generate AI Summary'}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">AI Summary:</div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans font-medium whitespace-pre-line bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-900">
                      {selectedDoc.summary}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Column */}
            <div className="lg:col-span-2 flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-950/20">
                <MessageSquare className="w-4 h-4 text-brand-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Document Chat Stream</span>
              </div>

              {/* Messages log */}
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
                      
                      {/* Citation pages */}
                      {chat.sources && chat.sources.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 space-y-1">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Sources Cited:</div>
                          <div className="flex flex-wrap gap-1">
                            {chat.sources.map((src) => (
                              <span
                                key={src.sourceId}
                                className="inline-flex items-center px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-950/40 text-[9px] font-bold text-brand-700 dark:text-brand-400 border border-brand-100 dark:border-brand-900/20"
                                title={src.snippet}
                              >
                                Page {src.pageNumber}
                              </span>
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

              {/* Form Input */}
              <form onSubmit={handleSendChatMessage} className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder={`Ask questions about ${selectedDoc.title}...`}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none dark:text-white"
                    required
                    disabled={chatLoading}
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatMessage.trim()}
                    className="px-4 py-2.5 rounded-xl bg-brand-600 text-white hover:bg-brand-500 transition disabled:opacity-50 flex-shrink-0 text-xs font-semibold"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="lg:col-span-3 flex flex-col items-center justify-center py-20 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/50">
            <BookOpen className="w-16 h-16 mb-4 text-slate-300" />
            <h3 className="font-bold text-base text-slate-700 dark:text-slate-300">No Document Selected</h3>
            <p className="text-xs text-center max-w-sm mt-1 leading-relaxed">
              Select one of your uploaded files from the dropdown in the top right to start summaries and chats.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
