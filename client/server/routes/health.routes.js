import { Router } from 'express';
import { checkHealth } from '../config/db.js';

const router = Router();

router.get('/', async (req, res) => {
  const isDbConnected = await checkHealth();
  res.status(200).json({
    status: 'ok',
    database: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
