import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';

async function bootstrap() {
  await connectDB();
  const app = createApp();
  
  app.listen(env.PORT, () => {
    console.log(`HCM Lite Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
