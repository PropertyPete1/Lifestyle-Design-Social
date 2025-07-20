import express from 'express';
import { errorLogger } from './middleware/errorLogger';
import apiRoutes from './routes/api/index';

const app = express();

app.use(express.json());
app.use('/api', apiRoutes);
app.use(errorLogger);

export default app; 