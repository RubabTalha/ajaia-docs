import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { initDatabase } from '../server/database.js';
import documentRoutes from '../server/routes/documents.js';
import sharingRoutes from '../server/routes/sharing.js';
import { createDocument, getUserById } from '../server/database.js';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/documents', documentRoutes);
app.use('/api/sharing', sharingRoutes);

const ALICE_ID = 'test-alice-' + Date.now();
const BOB_ID = 'test-bob-' + Date.now();

describe('Document API', () => {
  let testDocId: string;

  beforeAll(async () => {
    await initDatabase();

    const db = (await import('../server/database.js')).getDbInternal as any;
    if (db) {
      db.run('INSERT OR IGNORE INTO users (id, email, name, avatar_color) VALUES (?, ?, ?, ?)', [ALICE_ID, 'alice-test@example.com', 'Alice Test', '#0c93e9']);
      db.run('INSERT OR IGNORE INTO users (id, email, name, avatar_color) VALUES (?, ?, ?, ?)', [BOB_ID, 'bob-test@example.com', 'Bob Test', '#7c3aed']);
    }

    const doc = createDocument('Test Document', '<p>Hello World</p>', ALICE_ID);
    testDocId = doc.id;
  });

  afterAll(async () => {
    const db = (await import('../server/database.js')).getDbInternal as any;
    if (db) {
      db.run('DELETE FROM document_shares WHERE document_id IN (SELECT id FROM documents WHERE owner_id IN (?, ?))', [ALICE_ID, BOB_ID]);
      db.run('DELETE FROM documents WHERE owner_id IN (?, ?)', [ALICE_ID, BOB_ID]);
      db.run('DELETE FROM users WHERE id IN (?, ?)', [ALICE_ID, BOB_ID]);
    }
  });

  it('should reject requests without user ID', async () => {
    const res = await request(app).get('/api/documents');
    expect(res.status).toBe(401);
  });

  it('should create a new document', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('X-User-Id', ALICE_ID)
      .send({ title: 'New Doc', content: '<p>Test</p>' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('New Doc');
    expect(res.body.id).toBeDefined();
  });

  it('should list documents', async () => {
    const res = await request(app)
      .get('/api/documents')
      .set('X-User-Id', ALICE_ID);

    expect(res.status).toBe(200);
    expect(res.body.owned.length).toBeGreaterThan(0);
  });

  it('should get a document by ID', async () => {
    const res = await request(app)
      .get(`/api/documents/${testDocId}`)
      .set('X-User-Id', ALICE_ID);

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Test Document');
    expect(res.body.permission).toBe('owner');
  });

  it('should deny access to non-owner without share', async () => {
    const res = await request(app)
      .get(`/api/documents/${testDocId}`)
      .set('X-User-Id', BOB_ID);

    expect(res.status).toBe(404);
  });

  it('should share a document', async () => {
    const res = await request(app)
      .post(`/api/sharing/${testDocId}`)
      .set('X-User-Id', ALICE_ID)
      .send({ userId: BOB_ID, permission: 'edit' });

    expect(res.status).toBe(201);
    expect(res.body.permission).toBe('edit');
  });

  it('should allow shared user to access document', async () => {
    const res = await request(app)
      .get(`/api/documents/${testDocId}`)
      .set('X-User-Id', BOB_ID);

    expect(res.status).toBe(200);
    expect(res.body.permission).toBe('edit');
  });

  it('should block view-only user from editing', async () => {
    const db = (await import('../server/database.js')).getDbInternal as any;
    if (db) {
      db.run('UPDATE document_shares SET permission = ? WHERE document_id = ? AND shared_with_id = ?', ['view', testDocId, BOB_ID]);
    }

    const res = await request(app)
      .patch(`/api/documents/${testDocId}`)
      .set('X-User-Id', BOB_ID)
      .send({ content: '<p>Hacked</p>' });

    expect(res.status).toBe(403);
  });

  it('should deny access after share removed', async () => {
    const sharesRes = await request(app)
      .get(`/api/sharing/${testDocId}`)
      .set('X-User-Id', ALICE_ID);

    const shareId = sharesRes.body[0].id;

    await request(app)
      .delete(`/api/sharing/${testDocId}/${shareId}`)
      .set('X-User-Id', ALICE_ID);

    const res = await request(app)
      .get(`/api/documents/${testDocId}`)
      .set('X-User-Id', BOB_ID);

    expect(res.status).toBe(404);
  });

  it('should delete a document', async () => {
    const createRes = await request(app)
      .post('/api/documents')
      .set('X-User-Id', ALICE_ID)
      .send({ title: 'To Delete' });

    const deleteRes = await request(app)
      .delete(`/api/documents/${createRes.body.id}`)
      .set('X-User-Id', ALICE_ID);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
  });
});