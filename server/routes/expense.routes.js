import { Router } from 'express';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getSummary,
  scanReceipt,
} from '../controllers/expense.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// All expense routes require authentication
router.use(authenticateToken);

router.get('/', getExpenses);
router.get('/summary', getSummary);
router.post('/scan-receipt', scanReceipt);
router.get('/:id', getExpenseById);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
