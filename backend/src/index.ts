// 🛠️ Instructions:
// Replace your backend entry point with this file.
// This ensures the backend loads `.env.local`, initializes routes, and starts on PORT 5001.

import express from 'express';
import dotenv from 'dotenv';
import cartoonRoutes from './routes/cartoonRoutes'; // ✅ Adjust this path if needed

// ✅ Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());

// ✅ Connect cartoon routes
app.use('/api/cartoon', cartoonRoutes);

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
}); 