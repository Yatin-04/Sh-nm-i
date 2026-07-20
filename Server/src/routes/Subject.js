import express from 'express';
import { createSubject, getUserSubjects } from '../controllers/Subject.js';
import { uploadDocument, chatWithAgent, getUserDocuments, deleteDocument, getDocumentChat, clearDocumentChat } from '../controllers/Document.js';
import { generateFlashcards } from '../controllers/Flashcard.js';
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
router.get('/documents/:docId/chat', getDocumentChat);   // Fetch document chat history
router.delete('/documents/:docId/chat', clearDocumentChat); // Clear document chat history

// Document / RAG routes (per subject)
router.post('/:id/documents', upload.single('file'), uploadDocument);
router.post('/:id/chat', chatWithAgent);
router.get('/:id/flashcards', generateFlashcards);

export { router as subjectRouter };