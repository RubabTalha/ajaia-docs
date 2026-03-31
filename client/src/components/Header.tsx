import React, { useState } from 'react';
import { DocumentDetail } from '../lib/api';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Dropdown, DropdownItem, DropdownSeparator } from './ui/Dropdown';
import { ShareModal } from './ShareModal';
import { useToast } from './ui/Toast';

interface HeaderProps { document: DocumentDetail | null; onBack: () => void; onDeleted: () => void; }

export const Header: React.FC<HeaderProps> = ({ document, onBack, onDeleted }) => {
  const [shareOpen, setShareOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { showToast } = useToast();

  const handleDelete = async () => {
    if (!document || !confirm('Delete this document? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const { documentsApi } = await import('../lib/api');
      await documentsApi.delete(document.id);
      showToast('Document deleted', 'success');
      onDeleted();
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setDeleting(false); }
  };

  if (!document) return null;

  const permLabel = { owner: 'Owner', edit: 'Can edit', view: 'Can view' };
  const permVariant = { owner: 'owner' as const, edit: 'info' as const, view: 'default' as const };

  return (
    <>
      <div className="h-12 border-b border-surface-100 bg-white/80 backdrop-blur-sm flex items-center justify-between px-4 no-print">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 -ml-1 rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="h-4 w-px bg-surface-200" />
          <span className="text-xs text-surface-400 font-medium">{document.owner_name}'s document</span>
          <Badge variant={permVariant[document.permission]}>{permLabel[document.permission]}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {document.permission === 'owner' && (
            <Button variant="secondary" size="sm" icon={
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            } onClick={() => setShareOpen(true)}>Share</Button>
          )}
          <Dropdown trigger={
            <button className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
            </button>
          }>
            {document.permission === 'owner' && (
              <>
                <DropdownItem onClick={() => setShareOpen(true)} icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}>Share settings</DropdownItem>
                <DropdownSeparator />
              </>
            )}
            <DropdownItem onClick={handleDelete} danger loading={deleting} icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}>Delete</DropdownItem>
          </Dropdown>
        </div>
      </div>
      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} documentId={document.id} />
    </>
  );
};