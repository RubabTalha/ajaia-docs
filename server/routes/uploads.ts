import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { marked } from 'marked';
import {
  canAccessDocument,
  getDocumentById,
  updateDocument,
  addAttachment,
  getAttachments,
  deleteAttachment,
} from '../database.js';
import { UPLOAD_DIR } from '../config.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  const allowedExtensions = ['.txt', '.md', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${ext}. Supported: .txt, .md, .png, .jpg, .gif, .webp, .pdf`));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post('/:documentId', upload.single('file'), async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const { documentId } = req.params;
  const importContent = req.body.import === 'true';

  if (!userId) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(401).json({ error: 'User ID required' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const access = canAccessDocument(documentId, userId);
  if (!access.canAccess || access.permission === 'view') {
    fs.unlinkSync(req.file.path);
    return res.status(403).json({ error: 'Access denied' });
  }

  const doc = getDocumentById(documentId);
  if (!doc) {
    fs.unlinkSync(req.file.path);
    return res.status(404).json({ error: 'Document not found' });
  }

  const attachment = addAttachment(
    documentId,
    req.file.filename,
    req.file.originalname,
    req.file.mimetype,
    req.file.size
  );

  let importedContent: string | null = null;
  const ext = path.extname(req.file.originalname).toLowerCase();

  if (importContent && (ext === '.txt' || ext === '.md')) {
    try {
      const fileContent = fs.readFileSync(req.file.path, 'utf-8');

      if (ext === '.md') {
        importedContent = await marked(fileContent);
      } else {
        importedContent = fileContent
          .split('\n')
          .map(line => line.trim() ? `<p>${line}</p>` : '')
          .join('');
      }

      const currentContent = doc.content || '';
      const separator = currentContent ? '<hr>' : '';
      const newContent = currentContent + separator + importedContent;

      updateDocument(documentId, doc.title, newContent);
    } catch (e) {
      console.error('Failed to import file content:', e);
    }
  }

  res.json({
    attachment: {
      id: attachment.id,
      original_name: attachment.original_name,
      mime_type: attachment.mime_type,
      size: attachment.size,
      uploaded_at: attachment.uploaded_at,
    },
    imported: importedContent !== null,
  });
});

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

  const attachments = getAttachments(documentId);
  res.json(attachments.map(a => ({
    id: a.id,
    original_name: a.original_name,
    filename: a.filename,
    mime_type: a.mime_type,
    size: a.size,
    uploaded_at: a.uploaded_at,
    url: `/uploads/${a.filename}`,
  })));
});

router.delete('/:documentId/:attachmentId', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const { documentId, attachmentId } = req.params;

  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }

  const access = canAccessDocument(documentId, userId);
  if (!access.canAccess || access.permission === 'view') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const attachments = getAttachments(documentId);
  const attachment = attachments.find(a => a.id === attachmentId);

  if (attachment) {
    const filePath = path.join(UPLOAD_DIR, attachment.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  const deleted = deleteAttachment(attachmentId);
  res.json({ success: deleted });
});

export default router;