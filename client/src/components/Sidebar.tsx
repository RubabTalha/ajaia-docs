import React from 'react';
import { DocumentListItem } from '../lib/api';
import { DocumentList } from './DocumentList';
import { Button } from './ui/Button';
import { Avatar } from './ui/Avatar';
import { getCurrentUser, logout, getSeededUsers, setUser } from '../lib/auth';

interface SidebarProps {
  owned: DocumentListItem[];
  shared: DocumentListItem[];
  activeId?: string;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
  onUserSwitch: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  owned, shared, activeId, onSelect, onCreateNew, onUserSwitch,
}) => {
  const user = getCurrentUser();
  const allUsers = getSeededUsers();

  return (
    <div className="w-[280px] h-full bg-surface-50/80 border-r border-surface-200/80 flex flex-col shrink-0">
      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-bold text-surface-800 tracking-tight">Ajaia Docs</span>
            <p className="text-[10px] text-surface-400 font-medium">Collaborative Editor</p>
          </div>
        </div>

        <Button onClick={onCreateNew} className="w-full" icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        }>
          New Document
        </Button>
      </div>

      {/* Document Lists */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4">
        <DocumentList
          title="My Documents"
          documents={owned}
          onSelect={onSelect}
          activeId={activeId}
          emptyMessage="No documents yet"
          icon={
            <svg className="w-3 h-3 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          }
        />

        <DocumentList
          title="Shared with me"
          documents={shared}
          onSelect={onSelect}
          activeId={activeId}
          emptyMessage="No shared documents"
          icon={
            <svg className="w-3 h-3 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
      </div>

      {/* User Switcher */}
      <div className="px-3 py-3 border-t border-surface-200/80 bg-white/60">
        <div className="flex items-center gap-1.5 mb-2.5 px-1">
          <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">Switch User</span>
        </div>
        <div className="flex items-center gap-1.5 mb-3 px-1">
          {allUsers.map(u => (
            <button
              key={u.id}
              onClick={() => { setUser(u.id); onUserSwitch(); }}
              className="transition-all hover:scale-110"
              title={`Switch to ${u.name}`}
            >
              <Avatar
                name={u.name}
                color={u.avatar_color}
                size="sm"
                className={user?.id === u.id ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-white scale-110' : 'opacity-60 hover:opacity-100'}
              />
            </button>
          ))}
        </div>

        {user && (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-surface-50 border border-surface-100">
            <Avatar name={user.name} color={user.avatar_color} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-surface-700 truncate">{user.name}</p>
              <p className="text-[10px] text-surface-400 truncate">{user.email}</p>
            </div>
            <button
              onClick={() => { logout(); onUserSwitch(); }}
              className="p-1 text-surface-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
              title="Sign out"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};