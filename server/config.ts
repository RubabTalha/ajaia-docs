import path from 'path';

export const PORT = parseInt(process.env.PORT || '3001', 10);
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');