import React from 'react';
import { DocumentListItem } from '../lib/api';
import { Badge } from './ui/Badge';

interface DocumentListProps {
  title: string;
  documents: DocumentListItem[];
  onSelect: (id: string) => void;
  activeId?: string;
  emptyMessage: string;
  icon: React.ReactNode;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  title, documents, onSelect, activeId, emptyMessage, icon,
}) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2.5 px-1">
        {icon}
        <h3 className="text-[11px] font-bold text-surface-400 uppercase tracking-widest">{title}</h3>
        {documents.length > 0 && (
          <span className="text-[10px] font-semibold text-surface-300 bg-surface-100 px-1.5 py-0.5 rounded-full">{documents.length}</span>
        )}
      </div>

      {documents.length === 0 ? (
        <p className="text-xs text-surface-400 px-1 py-3">{emptyMessage}</p>
      ) : (
        <div className="space-y-1">
          {documents.map(doc => (
            <button
              key={doc.id}
              onClick={() => onSelect(doc.id)}
              className={`
                w-full text-left rounded-xl transition-all duration-150 group
                ${activeId === doc.id
                  ? 'bg-brand-50 border border-brand-200 shadow-[0_0_0_1px_rgba(16,185,129,0.1)]'
                  : 'hover:bg-white border border-transparent hover:border-surface-200 hover:shadow-card'
                }
              `}
            >
              <div className="flex items-center gap-3 px-3 py-2.5">
                <div className={`
                  w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors
                  ${activeId === doc.id
                    ? 'bg-brand-100'
                    : 'bg-surface-100 group-hover:bg-surface-200/70'
                  }
                `}>
                  <svg className={`w-4 h-4 transition-colors ${activeId === doc.id ? 'text-brand-600' : 'text-surface-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${activeId === doc.id ? 'text-brand-900' : 'text-surface-700'}`}>
                    {doc.title || 'Untitled Document'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-surface-400">{formatDate(doc.updated_at)}</span>
                    {doc.type === 'shared' && (
                      <>
                        <span className="text-surface-200">·</span>
                        <span className="text-[11px] text-surface-400">from {doc.shared_by}</span>
                      </>
                    )}
                  </div>
                </div>

                {doc.type === 'shared' && (
                  <Badge variant={doc.permission === 'view' ? 'default' : 'info'} className="shrink-0">
                    {doc.permission === 'view' ? 'View' : 'Edit'}
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};