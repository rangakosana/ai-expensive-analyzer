import { Router } from 'express';
import { getBudget, saveBudget } from '../controllers/budget.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// All budget endpoints require authentication
router.use(authenticateToken);

router.get('/', getBudget);
router.post('/', saveBudget);
router.put('/', saveBudget);

export default router;
