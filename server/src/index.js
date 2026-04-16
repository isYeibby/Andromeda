import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
import { apiRouter } from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'online', service: 'VIBE_SYNC_SERVER', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRouter);
app.use('/api', apiRouter);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[VIBE_SYNC ERROR]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    code: err.code || 'UNKNOWN',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n⚡ VIBE_SYNC SERVER online on port ${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/health\n`);
});
