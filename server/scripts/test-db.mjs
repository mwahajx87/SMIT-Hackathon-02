import { connectDB, disconnectDB } from '../src/config/db.js';

async function test() {
  try {
    console.log('Connecting to MongoDB...');
    const conn = await connectDB();
    console.log('SUCCESS: Connected to host:', conn.connection.host);
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('FAILURE:', err.message);
    process.exit(1);
  }
}

test();
