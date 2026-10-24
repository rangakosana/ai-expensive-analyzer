import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import insightRoutes from './routes/insight.routes.js';
import healthRoutes from './routes/health.routes.js';
import budgetRoutes from './routes/budget.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { getJwtSecret } from './middleware/auth.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

// Verify critical environment variables fail safely at startup in production
export const verifyEnvironment = () => {
  if (process.env.NODE_ENV === 'production') {
    getJwtSecret();
  }
};
verifyEnvironment();

const app = express();
const PORT = process.env.PORT || 5001;

// Trust Vercel and reverse proxy headers for secure cookies and protocol inspection
app.set('trust proxy', 1);

// CORS Security Configuration
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5001',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5001',
  'https://ai-expensive-analyzer.vercel.app',
];

export const getAllowedOrigins = () => {
  const origins = new Set(defaultAllowedOrigins);
  if (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*') {
    process.env.CORS_ORIGIN.split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((origin) => {
        if (origin !== '*') {
          origins.add(origin);
        }
      });
  }
  return origins;
};

export const corsOriginValidator = (origin, callback) => {
  // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
  if (!origin) return callback(null, true);

  const allowed = getAllowedOrigins();
  if (allowed.has(origin)) {
    return callback(null, origin);
  }

  // Reject unapproved origins:
  // - Never reflect arbitrary origins when credentials are enabled or when CORS_ORIGIN is '*'
  // - Blanket wildcard .endsWith('.vercel.app') is strictly forbidden
  return callback(null, false);
};

app.use(cors({
  origin: corsOriginValidator,
  credentials: true,
}));

// Native Cookie Parser Middleware with URI-decoding resilience and quote stripping
app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const pairs = cookieHeader.split(';');
    for (const pair of pairs) {
      const idx = pair.indexOf('=');
      if (idx !== -1) {
        const key = pair.slice(0, idx).trim();
        const rawVal = pair.slice(idx + 1).trim().replace(/^"|"$/g, '');
        try {
          req.cookies[key] = decodeURIComponent(rawVal);
        } catch {
          req.cookies[key] = rawVal;
        }
      }
    }
  }
  next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/admin', adminRoutes);

// In production, serve static frontend assets
const clientDistPath = path.join(__dirname, '../client/dist');
const clientPublicPath = path.join(__dirname, '../client/public');
app.use(express.static(clientPublicPath));
app.use(express.static(clientDistPath));

// API 404 handler for unrecognized /api routes
app.all('/api/*', notFoundHandler);

// Fallback to client index.html for SPA routing
app.get('*', (req, res) => {
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Frontend bundle not found. If in development, run the client dev server or execute `npm run build`.',
      });
    }
  });
});

// Centralized error handler
app.use(errorHandler);

// Start listening if not imported by test suite or running on Vercel
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 AI Expense Analyzer API running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    console.log(`===============================================`);
  });
}

export default app;
