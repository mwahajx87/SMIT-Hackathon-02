// Use dynamic imports so module-load errors are caught and surfaced as JSON
// instead of causing FUNCTION_INVOCATION_FAILED silently.

let appInstance = null;
let mongoose = null;
let connectDB = null;
let initError = null;

async function init() {
  if (initError) throw initError;
  if (appInstance && mongoose) return;

  try {
    const mongooseMod = await import('mongoose');
    mongoose = mongooseMod.default;

    const dbMod = await import('../src/config/db.js');
    connectDB = dbMod.connectDB;

    const appMod = await import('../src/app.js');
    appInstance = appMod.default || appMod.createApp();
  } catch (err) {
    initError = err;
    throw err;
  }
}

export default async function handler(req, res) {
  // Allow CORS on all responses including error ones
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Initialize app (dynamic import, catches module-load errors)
  try {
    await init();
  } catch (err) {
    console.error('[Vercel] Module init failed:', err);
    return res.status(500).json({
      error: {
        code: 'MODULE_INIT_FAILED',
        message: err.message,
        stack: err.stack
      }
    });
  }

  // Connect to DB (reuse connection across warm invocations)
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
  } catch (err) {
    console.error('[Vercel] DB connection failed:', err);
    return res.status(500).json({
      error: {
        code: 'DB_CONNECTION_FAILED',
        message: err.message,
        stack: err.stack
      }
    });
  }

  // Normalize URL rewritten by Vercel
  if (req.url && req.url.startsWith('/api/index.js')) {
    req.url = req.url.replace('/api/index.js', '') || '/';
  }

  return appInstance(req, res);
}
