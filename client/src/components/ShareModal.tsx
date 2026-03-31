import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { sharingApi, ShareUser, UserOption } from '../lib/api';
import { useToast } from './ui/Toast';

interface ShareModalProps { isOpen: boolean; onClose: () => void; documentId: string; }

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, documentId }) => {
  const [shares, setShares] = useState<ShareUser[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [permission, setPermission] = useState<'edit' | 'view'>('edit');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const load = async () => {
    try {
      const [s, u] = await Promise.all([sharingApi.getShares(documentId), sharingApi.getUsers()]);
      setShares(s); setUsers(u); setSelectedUserId(''); setPermission('edit');
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  useEffect(() => { if (isOpen) load(); }, [isOpen, documentId]);

  const handleShare = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      await sharingApi.share(documentId, { userId: selectedUserId, permission });
      showToast('Document shared', 'success');
      load();
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleRemove = async (shareId: string) => {
    try {
      await sharingApi.removeShare(documentId, shareId);
      showToast('Access removed', 'success');
      load();
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const available = users.filter(u => !shares.some(s => s.user_id === u.id));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Document" size="md">
      <div className="space-y-4">
        <div className="flex gap-2">
          <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="flex-1 rounded-lg border border-surface-200 bg-white text-sm px-3 py-2 focus-ring text-surface-700">
            <option value="">Select user...</option>
            {available.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </select>
          <select value={permission} onChange={(e) => setPermission(e.target.value as 'edit' | 'view')} className="rounded-lg border border-surface-200 bg-white text-sm px-3 py-2 focus-ring text-surface-700">
            <option value="edit">Can edit</option>
            <option value="view">Can view</option>
          </select>
          <Button onClick={handleShare} disabled={!selectedUserId} loading={loading}>Share</Button>
        </div>

        {shares.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-surface-500 uppercase tracking-wider">People with access</h4>
            {shares.map(share => (
              <div key={share.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-surface-50 border border-surface-100">
                <div className="flex items-center gap-3">
                  <Avatar name={share.user_name} color={share.user_avatar_color} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-surface-800">{share.user_name}</p>
                    <p className="text-[11px] text-surface-400">{share.user_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={share.permission === 'edit' ? 'success' : 'default'}>{share.permission === 'edit' ? 'Can edit' : 'Can view'}</Badge>
                  <button onClick={() => handleRemove(share.id)} className="p-1 text-surface-300 hover:text-red-500 transition-colors" title="Remove">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <p className="text-sm text-surface-400">No one else has access yet</p>
          </div>
        )}
      </div>
    </Modal>
  );
};