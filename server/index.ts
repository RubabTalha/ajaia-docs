import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { PORT, UPLOAD_DIR } from './config.js';
import { initDatabase } from './database.js';
import documentRoutes from './routes/documents.js';
import uploadRoutes from './routes/uploads.js';
import sharingRoutes from './routes/sharing.js';

const app = express();

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(UPLOAD_DIR));

// API routes
app.use('/api/documents', documentRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/sharing', sharingRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Ajaia Docs server running on http://localhost:${PORT}`);
  });
}

start();