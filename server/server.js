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
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
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

// In production, serve static frontend assets
const clientDistPath = path.join(__dirname, '../client/dist');
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

// Start listening if not imported by test suite
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 AI Expense Analyzer API running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    console.log(`===============================================`);
  });
}

export default app;
