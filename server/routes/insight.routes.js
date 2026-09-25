import { Router } from 'express';
import {
  getInsights,
  getInsightByMonth,
  generateInsight,
  chatWithAdvisor,
} from '../controllers/insight.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// All insight routes require authentication
router.use(authenticateToken);

router.get('/', getInsights);
router.get('/:month', getInsightByMonth);
router.post('/generate', generateInsight);
router.post('/chat', chatWithAdvisor);

export default router;
