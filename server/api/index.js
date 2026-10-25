import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { connectDB } from '../src/config/db.js';

let appInstance = null;

export default async function handler(req, res) {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
  } catch (err) {
    console.error('Vercel Serverless DB Connection error:', err);
    return res.status(500).json({
      error: {
        code: 'DB_CONNECTION_FAILED',
        message: `Database connection failed: ${err.message}`,
        details: err.stack
      }
    });
  }

  if (!appInstance) {
    appInstance = createApp();
  }

  // Normalize URL when rewritten by Vercel
  if (req.url.startsWith('/api/index.js')) {
    req.url = req.url.replace('/api/index.js', '') || '/';
  }

  return appInstance(req, res);
}
