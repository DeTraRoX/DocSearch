import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto p-6 lg:p-8 space-y-8 fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-sans">Account Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">Manage your profile information and active roles</p>
      </div>

      <div className="p-6 rounded-2xl glass-card space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-brand-500/20">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="text-lg font-bold">{user?.name}</h3>
            <p className="text-xs text-slate-400 font-sans">DocSearch Sandbox Member</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Full Name</div>
              <div className="font-semibold">{user?.name}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email Address</div>
              <div className="font-semibold">{user?.email}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Account Role</div>
              <div className="font-semibold capitalize">{user?.role}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
