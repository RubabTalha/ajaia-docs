import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'ajaia_docs.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db: SqlJsDatabase;

function saveToDisk() {
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

function run(sql: string, params: unknown[] = []) {
  db.run(sql, params);
  saveToDisk();
}

function getOne<T>(sql: string, params: unknown[] = []): T | undefined {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.getAsObject() as T;
      stmt.free();
      return row;
    }
    stmt.free();
    return undefined;
  } catch {
    return undefined;
  }
}

function getAll<T>(sql: string, params: unknown[] = []): T[] {
  const results: T[] = [];
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
    }
    stmt.free();
  } catch {
    // empty
  }
  return results;
}

// Fixed user IDs so client and server stay in sync
export const SEEDED_USER_IDS = {
  alex: 'user-alex-001',
  sarah: 'user-sarah-002',
  mike: 'user-mike-003',
};

export async function initDatabase() {
  const SQL = await initSqlJs({
    locateFile: (file: string) => {
      return path.join(path.dirname(require.resolve('sql.js')), file);
    },
  });

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_color TEXT NOT NULL DEFAULT '#0c93e9',
    created_at TEXT DEFAULT (datetime('now'))
  );`);

  db.run(`CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Untitled Document',
    content TEXT NOT NULL DEFAULT '',
    owner_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );`);

  db.run(`CREATE TABLE IF NOT EXISTS document_shares (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    shared_with_id TEXT NOT NULL,
    shared_by_id TEXT NOT NULL,
    permission TEXT NOT NULL DEFAULT 'edit',
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(document_id, shared_with_id)
  );`);

  db.run(`CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    uploaded_at TEXT DEFAULT (datetime('now'))
  );`);

  const userCount = getOne<{ count: number }>('SELECT COUNT(*) as count FROM users');
  if (userCount && userCount.count === 0) {
    const users = [
      { id: SEEDED_USER_IDS.alex, email: 'alex@ajaia.com', name: 'Alex Chen', color: '#0c93e9' },
      { id: SEEDED_USER_IDS.sarah, email: 'sarah@ajaia.com', name: 'Sarah Miller', color: '#7c3aed' },
      { id: SEEDED_USER_IDS.mike, email: 'mike@ajaia.com', name: 'Mike Johnson', color: '#059669' },
    ];
    for (const u of users) {
      db.run('INSERT INTO users (id, email, name, avatar_color) VALUES (?, ?, ?, ?)', [
        u.id, u.email, u.name, u.color,
      ]);
    }
  }

  saveToDisk();
  console.log('Database initialized');
}

// --- Users ---

export function getUserById(id: string) {
  return getOne<DbUser>('SELECT * FROM users WHERE id = ?', [id]);
}

export function getUserByEmail(email: string) {
  return getOne<DbUser>('SELECT * FROM users WHERE email = ?', [email]);
}

export function getAllUsers() {
  return getAll<DbUser>('SELECT * FROM users ORDER BY name');
}

// --- Documents ---

export function createDocument(title: string, content: string, ownerId: string): DbDocument {
  const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
  run('INSERT INTO documents (id, title, content, owner_id) VALUES (?, ?, ?, ?)', [id, title, content, ownerId]);
  return getDocumentById(id)!;
}

export function getDocumentById(id: string) {
  return getOne<DbDocument>('SELECT * FROM documents WHERE id = ?', [id]);
}

export function updateDocument(id: string, title: string, content: string) {
  run("UPDATE documents SET title = ?, content = ?, updated_at = datetime('now') WHERE id = ?", [title, content, id]);
  return getDocumentById(id);
}

export function deleteDocument(id: string): boolean {
  run('DELETE FROM documents WHERE id = ?', [id]);
  return true;
}

export function getOwnedDocuments(userId: string) {
  return getAll<DbUser>('SELECT * FROM documents WHERE owner_id = ? ORDER BY updated_at DESC', [userId]) as unknown as DbDocument[];
}

export function getSharedDocuments(userId: string) {
  return getAll<DbDocument & { shared_by_name: string; permission: string }>(
    `SELECT d.*, u.name as shared_by_name, ds.permission
     FROM documents d
     JOIN document_shares ds ON d.id = ds.document_id
     JOIN users u ON ds.shared_by_id = u.id
     WHERE ds.shared_with_id = ?
     ORDER BY d.updated_at DESC`,
    [userId]
  );
}

export function canAccessDocument(documentId: string, userId: string): { canAccess: boolean; permission: 'edit' | 'view' | 'owner' } {
  const doc = getDocumentById(documentId);
  if (!doc) return { canAccess: false, permission: 'view' };
  if (doc.owner_id === userId) return { canAccess: true, permission: 'owner' };
  const share = getOne<{ permission: string }>('SELECT permission FROM document_shares WHERE document_id = ? AND shared_with_id = ?', [documentId, userId]);
  if (!share) return { canAccess: false, permission: 'view' };
  return { canAccess: true, permission: share.permission as 'edit' | 'view' };
}

// --- Sharing ---

export function shareDocument(documentId: string, sharedWithId: string, sharedById: string, permission: 'edit' | 'view' = 'edit') {
  const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
  try {
    run('INSERT INTO document_shares (id, document_id, shared_with_id, shared_by_id, permission) VALUES (?, ?, ?, ?, ?)', [id, documentId, sharedWithId, sharedById, permission]);
    return getOne<DbDocumentShare>('SELECT * FROM document_shares WHERE id = ?', [id]);
  } catch (e: any) {
    if (String(e.message).includes('UNIQUE') || String(e.message).includes('constraint')) return undefined;
    throw e;
  }
}

export function getDocumentShares(documentId: string) {
  return getAll<DbDocumentShare & ShareUserInfo>(
    `SELECT ds.*, u.id as uid, u.email as user_email, u.name as user_name, u.avatar_color as user_avatar_color
     FROM document_shares ds
     JOIN users u ON ds.shared_with_id = u.id
     WHERE ds.document_id = ?`,
    [documentId]
  );
}

export function removeShare(shareId: string): boolean {
  run('DELETE FROM document_shares WHERE id = ?', [shareId]);
  return true;
}

// --- Attachments ---

export function addAttachment(documentId: string, filename: string, originalName: string, mimeType: string, size: number): DbAttachment {
  const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
  run('INSERT INTO attachments (id, document_id, filename, original_name, mime_type, size) VALUES (?, ?, ?, ?, ?, ?)', [id, documentId, filename, originalName, mimeType, size]);
  return { id, document_id: documentId, filename, original_name: originalName, mime_type: mimeType, size, uploaded_at: new Date().toISOString() };
}

export function getAttachments(documentId: string) {
  return getAll<DbAttachment>('SELECT * FROM attachments WHERE document_id = ? ORDER BY uploaded_at DESC', [documentId]);
}

export function deleteAttachment(attachmentId: string): boolean {
  run('DELETE FROM attachments WHERE id = ?', [attachmentId]);
  return true;
}

export function getDbInternal() {
  return db;
}

// --- Types ---

export interface DbUser { id: string; email: string; name: string; avatar_color: string; created_at: string; }
export interface DbDocument { id: string; title: string; content: string; owner_id: string; created_at: string; updated_at: string; }
export interface DbDocumentShare { id: string; document_id: string; shared_with_id: string; shared_by_id: string; permission: 'edit' | 'view'; created_at: string; }
interface ShareUserInfo { uid: string; user_email: string; user_name: string; user_avatar_color: string; }
export interface DbAttachment { id: string; document_id: string; filename: string; original_name: string; mime_type: string; size: number; uploaded_at: string; }