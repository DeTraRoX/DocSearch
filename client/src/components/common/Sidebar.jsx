import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Search,
  Upload,
  MessageSquare,
  User,
  ShieldAlert,
  X,
  Database
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Smart Search', path: '/search', icon: <Search className="w-5 h-5" /> },
    { name: 'Upload Files', path: '/upload', icon: <Upload className="w-5 h-5" /> },
    { name: 'AI Assistant', path: '/ai-assistant', icon: <MessageSquare className="w-5 h-5" /> },
    { name: 'Profile Settings', path: '/profile', icon: <User className="w-5 h-5" /> },
  ];

  if (user && user.role === 'admin') {
    menuItems.push({
      name: 'Admin Panel',
      path: '/admin',
      icon: <ShieldAlert className="w-5 h-5" />,
    });
  }

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 border-r border-slate-200/60 dark:border-slate-800/40 bg-white dark:bg-[#0f172a] transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200/60 dark:border-slate-800/40">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => { navigate('/'); handleLinkClick(); }}>
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-400 text-white shadow-md shadow-brand-500/25">
              <Database className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent font-sans">
              DocSearch
            </span>
          </div>
          
          <button
            onClick={onClose}
            className="p-1 rounded-lg lg:hidden hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 shadow-sm border border-brand-100 dark:border-brand-900/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/40'
                }`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-200/60 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Local DB Connected</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
