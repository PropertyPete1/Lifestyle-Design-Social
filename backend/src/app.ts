import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToMongo } from './lib/mongo';
import cartoonRoutes from './routes/cartoons';
import analyticsRoutes from './routes/analytics';
import videoRoutes from './routes/videos';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use('/cartoons', cartoonRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/videos', videoRoutes);

const PORT = process.env['PORT'] || 5001;

connectToMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
}); 