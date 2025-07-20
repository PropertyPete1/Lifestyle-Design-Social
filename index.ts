import express from 'express';
import dotenv from 'dotenv';
import retryRoutes from './routes/retry';
import { errorLogger } from './middleware/errorLogger';
import './lib/cron'; // Initializes CRON jobs

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api/retry', retryRoutes);
app.use(errorLogger);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 