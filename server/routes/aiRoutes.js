import express from 'express';
import { chatWithDocument, summarizeDocument } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/chat', protect, chatWithDocument);
router.post('/summarize', protect, summarizeDocument);

export default router;
