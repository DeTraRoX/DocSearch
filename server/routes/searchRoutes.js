import express from 'express';
import { searchDocs, getSuggestions, getSearchHistory, clearSearchHistory } from '../controllers/searchController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, searchDocs);
router.get('/suggestions', protect, getSuggestions);
router.get('/history', protect, getSearchHistory);
router.delete('/history', protect, clearSearchHistory);

export default router;
