import express from 'express';
import {
  getSystemAnalytics,
  getUsers,
  updateUserRole,
  deleteUser,
  getAllDocuments
} from '../controllers/adminController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/analytics', protect, isAdmin, getSystemAnalytics);
router.get('/users', protect, isAdmin, getUsers);
router.put('/users/:id/role', protect, isAdmin, updateUserRole);
router.delete('/users/:id', protect, isAdmin, deleteUser);
router.get('/documents', protect, isAdmin, getAllDocuments);

export default router;
