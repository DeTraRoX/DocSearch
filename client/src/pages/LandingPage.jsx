import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Search, MessageSquare, Database, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      title: 'Full-Text Document Search',
      description: 'Search inside PDFs, DOCX, TXT, and scanned images instantly with fuzzy match highlights.',
      icon: <Search className="w-6 h-6 text-brand-500" />,
    },
    {
      title: 'Context-Aware RAG AI Chat',
      description: 'Carry out conversations with your documents. Ask questions, summarize, and extract key details with grounded sources.',
      icon: <MessageSquare className="w-6 h-6 text-brand-500" />,
    },
    {
      title: 'Optical Character Recognition (OCR)',
      description: 'Scan images, screenshots, and receipts with Tesseract OCR to make their printed contents searchable.',
      icon: <Zap className="w-6 h-6 text-brand-500" />,
    },
    {
      title: 'Folder Structure & Tagging',
      description: 'Organize files into dynamic directory hierarchies, tag topics, and filter folders with ease.',
      icon: <Database className="w-6 h-6 text-brand-500" />,
    },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-brand-500/10 to-transparent blur-[150px] pointer-events-none rounded-full" />

      {/* Header navbar */}
      <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-6 md:px-12 glass-panel shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-400 text-white font-bold text-lg">
            D
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent font-sans">
            DocSearch
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 rounded-lg shadow-lg shadow-brand-500/20 transition-all duration-200"
            >
              Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-sm font-medium hover:text-brand-500 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                Create Account
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 md:px-12 py-16 flex flex-col items-center text-center justify-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-6 text-xs font-semibold rounded-full bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900/20">
          <Shield className="w-3.5 h-3.5" /> Next-Generation Intelligent Document Search
        </div>

        <h1 className="max-w-4xl text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-slate-950 via-slate-800 to-slate-950 dark:from-white dark:via-slate-200 dark:to-slate-100 bg-clip-text text-transparent leading-[1.15] font-sans">
          The Intelligent Document Search Engine for Scans, PDFs & AI RAG Chat
        </h1>

        <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-400 mb-10">
          Upload PDFs, Word docs, scanned notes, and images. Automatically extract texts, index with full-fuzzy searches, summarize topics, and chat with files side-by-side using Gemini.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <button
            onClick={() => navigate(user ? '/' : '/register')}
            className="flex items-center justify-center gap-2 px-7 py-3.5 font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 rounded-xl shadow-xl shadow-brand-500/25 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="flex items-center justify-center gap-2 px-7 py-3.5 font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-200"
          >
            Explore Sandbox <ArrowUpRight className="w-5 h-5" />
          </button>
        </div>

        {/* Feature Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-10 border-t border-slate-200 dark:border-slate-800/40">
          {features.map((f, idx) => (
            <div
              key={idx}
              className="flex flex-col items-start text-left p-6 rounded-2xl glass-card"
            >
              <div className="p-3 mb-4 rounded-xl bg-brand-50 dark:bg-brand-950/20 border border-brand-100/30">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-sans">{f.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-slate-200/60 dark:border-slate-800/40 text-center text-xs text-slate-500 dark:text-slate-400 glass-panel mt-auto">
        <p>&copy; {new Date().getFullYear()} DocSearch Inc. Built with React, Elasticsearch & Google Gemini.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
