import express from 'express';
import {
  getDocuments,
  createDocument,
  getDocumentById,
  updateDocument,
  deleteDocument,
  shareDocument,
  getVersionHistory,
  rollbackVersion,
} from '../controllers/documentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getDocuments)
  .post(protect, createDocument);

router.post('/share', protect, shareDocument);

router.route('/:id')
  .get(protect, getDocumentById)
  .put(protect, updateDocument)
  .delete(protect, deleteDocument);

router.get('/:id/history', protect, getVersionHistory);
router.post('/:id/rollback', protect, rollbackVersion);

export default router;
