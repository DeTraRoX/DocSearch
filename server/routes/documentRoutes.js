import express from 'express';
import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
  downloadDocument,
  toggleFavorite,
  updateMetadata,
  createFolder,
  getFolders,
  deleteFolder
} from '../controllers/documentController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// File actions
router.post('/upload', protect, upload.single('file'), uploadDocument);
router.get('/', protect, getDocuments);
router.get('/:id', protect, getDocumentById);
router.delete('/:id', protect, deleteDocument);
router.get('/:id/download', protect, downloadDocument);
router.put('/:id/favorite', protect, toggleFavorite);
router.put('/:id/metadata', protect, updateMetadata);

// Folder actions
router.post('/folders', protect, createFolder);
router.get('/folders/all', protect, getFolders);
router.delete('/folders/:id', protect, deleteFolder);

export default router;
