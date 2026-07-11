import express from 'express';
import { createSubject, getUserSubjects } from '../controllers/Subject.js';
import { uploadDocument, chatWithAgent, getUserDocuments, deleteDocument } from '../controllers/Document.js';
import { auth } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

// Apply auth middleware to all subject routes
router.use(auth);

router.post('/', createSubject);
router.get('/', getUserSubjects);

// Document management routes
router.get('/documents', getUserDocuments);        // All user docs grouped by subject
router.delete('/documents/:docId', deleteDocument); // Delete a single document

// Document / RAG routes (per subject)
router.post('/:id/documents', upload.single('file'), uploadDocument);
router.post('/:id/chat', chatWithAgent);

export { router as subjectRouter };