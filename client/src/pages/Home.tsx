import React, { useState, useEffect } from 'react';
import { setUser, getSeededUsers, getCurrentUser } from '../lib/auth';

interface HomeProps {
  onUserReady: () => void;
}

export const Home: React.FC<HomeProps> = ({ onUserReady }) => {
  const users = getSeededUsers();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const uid = localStorage.getItem('ajaia_docs_user');
    if (uid && getCurrentUser()) onUserReady();
  }, []);

  const handleSelect = (userId: string) => {
    setUser(userId);
    onUserReady();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-surface-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-[0_8px_30px_rgba(16,185,129,0.3)] mb-5">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Ajaia Docs</h1>
          <p className="text-brand-300/80 mt-2 text-sm">Collaborative document editing, made simple</p>
        </div>

        {/* User Cards */}
        <div className="bg-white/[0.07] backdrop-blur-xl rounded-2xl border border-white/[0.1] p-6 shadow-2xl">
          <h2 className="text-sm font-semibold text-white/80 mb-1">Sign in to continue</h2>
          <p className="text-xs text-white/40 mb-5">Select a demo account to explore</p>

          <div className="space-y-2.5">
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => handleSelect(user.id)}
                onMouseEnter={() => setHoveredId(user.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`
                  w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left group
                  ${hoveredId === user.id
                    ? 'bg-white/[0.12] border-white/20 shadow-lg scale-[1.02]'
                    : 'bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.08]'
                  }
                `}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg transition-transform group-hover:scale-105"
                  style={{ backgroundColor: user.avatar_color }}
                >
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/90">{user.name}</p>
                  <p className="text-xs text-white/35">{user.email}</p>
                </div>
                <svg className={`w-4 h-4 transition-all ${hoveredId === user.id ? 'text-brand-400 translate-x-0.5' : 'text-white/20 -translate-x-0.5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-white/20 text-center mt-6">Demo environment with pre-seeded accounts for testing sharing</p>
      </div>
    </div>
  );
};