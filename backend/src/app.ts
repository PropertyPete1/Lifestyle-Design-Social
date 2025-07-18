import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToMongo } from './config/mongo';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { initSchedulers } from '../../lib/init/scheduler';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api', routes);
app.use(errorHandler);

connectToMongo().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  
  // Initialize scheduled jobs
  initSchedulers();
});
