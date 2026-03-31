import { Router, Request, Response } from 'express';
import {
  shareDocument,
  getDocumentShares,
  removeShare,
  canAccessDocument,
  getDocumentById,
  getUserById,
  getUserByEmail,
  getAllUsers,
} from '../database.js';

const router = Router();

// Get shares for a document
router.get('/:documentId', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const { documentId } = req.params;

  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }

  const access = canAccessDocument(documentId, userId);
  if (!access.canAccess) {
    return res.status(404).json({ error: 'Document not found or access denied' });
  }

  const shares = getDocumentShares(documentId);
  res.json(shares.map(s => ({
    id: s.id,
    user_id: s.user_id,
    user_email: s.user_email,
    user_name: s.user_name,
    user_avatar_color: s.user_avatar_color,
    permission: s.permission,
    created_at: s.created_at,
  })));
});

// Share a document
router.post('/:documentId', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const { documentId } = req.params;
  const { userEmail, userId: targetUserId, permission } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }

  // Only owner can share
  const doc = getDocumentById(documentId);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  if (doc.owner_id !== userId) {
    return res.status(403).json({ error: 'Only the owner can share a document' });
  }

  // Find target user
  let targetUser;
  if (targetUserId) {
    targetUser = getUserById(targetUserId);
  } else if (userEmail) {
    targetUser = getUserByEmail(userEmail);
  }

  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (targetUser.id === userId) {
    return res.status(400).json({ error: 'Cannot share with yourself' });
  }

  if (targetUser.id === doc.owner_id) {
    return res.status(400).json({ error: 'Cannot share with the owner' });
  }

  const share = shareDocument(
    documentId,
    targetUser.id,
    userId,
    permission || 'edit'
  );

  if (!share) {
    return res.status(409).json({ error: 'Document already shared with this user' });
  }

  res.status(201).json({
    id: share.id,
    user_id: targetUser.id,
    user_email: targetUser.email,
    user_name: targetUser.name,
    user_avatar_color: targetUser.avatar_color,
    permission: share.permission,
  });
});

// Remove a share
router.delete('/:documentId/:shareId', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const { documentId, shareId } = req.params;

  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }

  const doc = getDocumentById(documentId);
  if (!doc || doc.owner_id !== userId) {
    return res.status(403).json({ error: 'Only the owner can remove shares' });
  }

  const removed = removeShare(shareId);
  res.json({ success: removed });
});

// Get all users (for sharing UI)
router.get('/users/list', (_req: Request, res: Response) => {
  const users = getAllUsers();
  res.json(users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    avatar_color: u.avatar_color,
  })));
});

export default router;