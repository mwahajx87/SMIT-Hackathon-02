import { createApp } from '../src/app.js';
import { connectDB } from '../src/config/db.js';

let isConnected = false;
let appInstance = null;

export default async function handler(req, res) {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (err) {
      console.error('Vercel Serverless DB Connection error:', err);
      return res.status(500).json({ error: { message: 'Database connection failed', details: err.message } });
    }
  }

  if (!appInstance) {
    appInstance = createApp();
  }

  return appInstance(req, res);
}
