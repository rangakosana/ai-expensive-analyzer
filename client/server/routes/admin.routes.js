import { Router } from 'express';
import {
  getPlatformStats,
  getAllUsers,
  getUserExpenses,
  updateUserRole,
  resetUserPassword,
  deleteUser,
} from '../controllers/admin.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// All admin endpoints require authentication AND admin role
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/stats', getPlatformStats);
router.get('/users', getAllUsers);
router.get('/users/:userId/expenses', getUserExpenses);
router.patch('/users/:userId/role', updateUserRole);
router.post('/users/:userId/reset-password', resetUserPassword);
router.delete('/users/:userId', deleteUser);

export default router;
