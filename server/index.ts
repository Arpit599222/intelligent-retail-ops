import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { rateLimiter } from './middleware/rateLimiter.js';
import storesRouter from './routes/stores.js';
import authRouter from './routes/auth.js';
import inventoryRouter from './routes/inventory.js';
import transfersRouter from './routes/transfers.js';
import workforceRouter from './routes/workforce.js';
import logsRouter from './routes/logs.js';
import analyticsRouter from './routes/analytics.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || process.env.API_PORT || '8080', 10);

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/api', rateLimiter(15 * 60 * 1000, 150)); // Global API rate limit: 150 requests per 15 mins

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/stores', storesRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/transfers', transfersRouter);
app.use('/api/workforce', workforceRouter);
app.use('/api/logs', logsRouter);
app.use('/api/analytics', analyticsRouter);

// Serve static frontend files
const frontendPath = path.join(__dirname, '../dist');
app.use(express.static(frontendPath));

app.get('*', (_req, res, next) => {
  if (_req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API Error]', err.message);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Logistics OS API running on port ${PORT}`);
  console.log(`   Databricks host: ${process.env.DATABRICKS_SERVER_HOSTNAME}`);
  console.log(`   Catalog.Schema:  ${process.env.DATABRICKS_CATALOG}.${process.env.DATABRICKS_SCHEMA}`);
});
