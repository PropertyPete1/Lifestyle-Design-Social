// ✅ File path: backend/index.ts
// 🛠️ Instructions:
// • Paste this to ensure your backend loads `.env` correctly.
// • Fixes "MONGODB_URI is undefined" and starts your server.

import express from 'express';
import dotenv from 'dotenv';
import connectDB from './src/lib/mongo';
import routes from './src/routes';

dotenv.config({ path: '../.env' }); // ✅ Load environment variables from project root

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use('/api', routes);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
  });
}); 