import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useToast } from '../context/ToastContext';
import { Search as SearchIcon, FileText, Tag, Clock, Sparkles, Trash2 } from 'lucide-react';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [latency, setLatency] = useState(0);

  const { showToast } = useToast();
  const navigate = useNavigate();
  const suggestionRef = useRef(null);

  const fetchHistory = async () => {
    try {
      const { data } = await API.get('/search/history');
      setHistory(data);
    } catch (err) {
      console.error('Error fetching search history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Suggestions handler as user types
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (query.trim().length > 1) {
        try {
          const { data } = await API.get(`/search/suggestions?q=${encodeURIComponent(query)}`);
          setSuggestions(data);
        } catch (err) {
          console.error(err);
        }
      } else {
        setSuggestions([]);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Click outside suggestions popup closes it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const executeSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setShowSuggestions(false);
    setSearching(true);
    const start = performance.now();

    try {
      const { data } = await API.get(`/search?q=${encodeURIComponent(searchQuery)}`);
      setResults(data);
      const end = performance.now();
      setLatency(Math.round(end - start));
      fetchHistory();
    } catch (err) {
      showToast('Search execution failed', 'error');
    } finally {
      setSearching(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await API.delete('/search/history');
      setHistory([]);
      showToast('Search history cleared', 'success');
    } catch (err) {
      showToast('Failed to clear search history', 'error');
    }
  };

  const getFileIconColor = (type) => {
    switch (type) {
      case 'pdf': return 'text-rose-500 bg-rose-50 dark:bg-rose-950/20';
      case 'docx': return 'text-blue-500 bg-blue-50 dark:bg-blue-950/20';
      case 'image': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
      default: return 'text-amber-500 bg-amber-50 dark:bg-amber-950/20';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-8 fade-in">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-sans">Search Workspace</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">Search through document text, titles, and tags with fuzzy keyword support.</p>
      </div>

      {/* Search Input Box */}
      <div className="relative" ref={suggestionRef}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <SearchIcon className="w-5 h-5" />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') executeSearch(query);
              }}
              placeholder="Type keywords (e.g. database design, machine learning)..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
            />
          </div>
          <button
            onClick={() => executeSearch(query)}
            disabled={searching}
            className="px-6 py-3.5 font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-2xl shadow-md transition disabled:opacity-50"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Suggestions Popup */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 z-30 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
            <ul className="py-2 divide-y divide-slate-50 dark:divide-slate-800">
              {suggestions.map((item, index) => (
                <li
                  key={index}
                  onClick={() => executeSearch(item)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer font-medium text-sm transition"
                >
                  <SearchIcon className="w-4 h-4 text-slate-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Grid: Results & Search History */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Results column */}
        <div className="lg:col-span-3 space-y-6">
          {searching && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
            </div>
          )}

          {!searching && results.length > 0 && (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-400">
                Found {results.length} results ({latency}ms)
              </div>

              <div className="space-y-4">
                {results.map((r, index) => (
                  <div
                    key={index}
                    className="p-5 rounded-2xl glass-card space-y-3 cursor-pointer"
                    onClick={() => navigate(`/viewer/${r.documentId}?page=${r.pageNumber}&q=${encodeURIComponent(query)}`)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 truncate">
                        <div className={`p-2 rounded-lg ${getFileIconColor(r.fileType)}`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <h3 className="font-semibold text-sm hover:text-brand-600 transition truncate">{r.title}</h3>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-sans">
                            <span>Uploaded {new Date(r.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="font-bold text-slate-500">Page {r.pageNumber}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Snippet text */}
                    <div
                      className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans font-medium"
                      dangerouslySetInnerHTML={{ __html: r.highlight }}
                    />

                    {/* Tags */}
                    {r.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {r.tags.map(t => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500"
                          >
                            <Tag className="w-2 h-2" /> {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!searching && query && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <SearchIcon className="w-12 h-12 mb-3 text-slate-300 animate-pulse" />
              <p className="font-semibold text-sm">No results match your query</p>
              <p className="text-xs mt-1">Try checking for spelling errors, different terms, or wider tags.</p>
            </div>
          )}

          {!searching && !query && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <Sparkles className="w-12 h-12 mb-3 text-slate-300" />
              <p className="font-semibold text-sm">Workspace Search Hub</p>
              <p className="text-xs mt-1">Type in a keyword above to find paragraphs in any indexed files.</p>
            </div>
          )}
        </div>

        {/* History column */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" /> Recent Searches
              </h3>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-rose-500 hover:underline flex items-center gap-0.5 font-semibold"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-slate-400 font-sans">No recent searches.</p>
            ) : (
              <ul className="space-y-2.5">
                {history.slice(0, 10).map((h, idx) => (
                  <li
                    key={idx}
                    onClick={() => executeSearch(h.query)}
                    className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 hover:text-brand-500 cursor-pointer transition font-medium"
                  >
                    <span className="truncate pr-2">{h.query}</span>
                    <span className="text-[10px] text-slate-400">{h.resultsCount} hits</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
