import { Router, Request, Response } from 'express';
import {
  createDocument,
  getDocumentById,
  updateDocument,
  deleteDocument,
  getOwnedDocuments,
  getSharedDocuments,
  canAccessDocument,
  getUserById,
} from '../database.js';

const router = Router();

// List all documents for a user (owned + shared)
router.get('/', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }

  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const owned = getOwnedDocuments(userId);
  const shared = getSharedDocuments(userId);

  res.json({
    owned: owned.map(doc => ({
      id: doc.id,
      title: doc.title,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      type: 'owned' as const,
    })),
    shared: shared.map(doc => ({
      id: doc.id,
      title: doc.title,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      type: 'shared' as const,
      shared_by: doc.shared_by_name,
      permission: doc.permission,
    })),
  });
});

// Get a single document
router.get('/:id', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }

  const access = canAccessDocument(id, userId);
  if (!access.canAccess) {
    return res.status(404).json({ error: 'Document not found or access denied' });
  }

  const doc = getDocumentById(id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const owner = getUserById(doc.owner_id);

  res.json({
    ...doc,
    permission: access.permission,
    owner_name: owner?.name,
    owner_email: owner?.email,
  });
});

// Create a new document
router.post('/', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const { title, content } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }

  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const doc = createDocument(
    title?.trim() || 'Untitled Document',
    content || '',
    userId
  );

  res.status(201).json({
    id: doc.id,
    title: doc.title,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
    type: 'owned' as const,
  });
});

// Update a document
router.patch('/:id', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const { id } = req.params;
  const { title, content } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }

  const access = canAccessDocument(id, userId);
  if (!access.canAccess) {
    return res.status(404).json({ error: 'Document not found or access denied' });
  }

  if (access.permission === 'view') {
    return res.status(403).json({ error: 'View-only access' });
  }

  const doc = getDocumentById(id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const updated = updateDocument(
    id,
    title !== undefined ? title.trim() : doc.title,
    content !== undefined ? content : doc.content
  );

  res.json({
    id: updated!.id,
    title: updated!.title,
    updated_at: updated!.updated_at,
  });
});

// Delete a document
router.delete('/:id', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }

  const doc = getDocumentById(id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  if (doc.owner_id !== userId) {
    return res.status(403).json({ error: 'Only the owner can delete a document' });
  }

  const deleted = deleteDocument(id);
  if (!deleted) {
    return res.status(500).json({ error: 'Failed to delete document' });
  }

  res.json({ success: true });
});

export default router;