import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB(uri = env.MONGODB_URI) {
  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
