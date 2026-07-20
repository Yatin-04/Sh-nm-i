import { query } from '../config/db.js';
import { runStudyBuddyAgent } from '../services/agentService.js';
import { processDocument } from '../services/documentService.js';
export const uploadDocument = async (req, res) => {
    try {
        const { id: subjectId } = req.params;
        const userId = req.user.id;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // multer.memoryStorage gives us file.buffer instead of file.path
        if (!file.buffer) {
            return res.status(400).json({ error: 'File buffer is missing' });
        }

        console.log('Uploaded file info:', { 
            originalname: file.originalname, 
            mimetype: file.mimetype,
            size: file.size
        });

        // 1. Insert into database with status 'processing'
        const insertDocSql = `
            INSERT INTO documents (user_id, subject_id, title, file_url, file_type, status)
            VALUES ($1, $2, $3, $4, $5, 'processing')
            RETURNING id
        `;
        // Temporarily store empty file_url, we will update it after uploading to Cloudinary in background
        const result = await query(insertDocSql, [
            userId, 
            subjectId, 
            file.originalname, 
            '', 
            file.mimetype
        ]);
        
        const documentId = result.rows[0].id;

        // 2. Respond immediately
        res.status(202).json({ 
            message: 'Document uploaded and processing started in background', 
            documentId 
        });

        // 3. Fire-and-forget processing
        processDocument(documentId, file.buffer, file.mimetype, file.originalname).catch(err => {
            console.error(`Background processing failed for doc ${documentId}:`, err);
        });

    } catch (error) {
        console.error("Upload Error:", error);
        
        // Handle multer file size errors
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ error: 'File too large. Maximum size is 10MB.' });
        }
        
        res.status(500).json({ error: error.message || 'Failed to upload document' });
    }
};

export const chatWithAgent = async (req, res) => {
    try {
        const { id: subjectId } = req.params;
        const { message, history, documentId } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Pass chat history and optional documentId for conversational context
        const responseText = await runStudyBuddyAgent(subjectId, message, history || [], documentId || null);

        // Auto-persist Q&A into document_chats if this is a per-document chat
        if (documentId && req.user?.id) {
            try {
                await query(
                    `INSERT INTO document_chats (document_id, user_id, role, content) 
                     VALUES ($1, $2, 'user', $3), ($1, $2, 'ai', $4)`,
                    [documentId, req.user.id, message, responseText]
                );
            } catch (dbErr) {
                console.error("Failed to persist document chat message:", dbErr?.message || dbErr);
            }
        }

        res.status(200).json({ reply: responseText });

    } catch (error) {
        console.error("Chat Error:", error?.message || error);
        
        if (error?.message?.includes('429') || error?.status === 429) {
            return res.status(200).json({ 
                reply: '⚠️ I\'m temporarily rate-limited. Please wait about 30 seconds and try again.' 
            });
        }
        
        // Return a helpful message instead of a 500
        res.status(200).json({ 
            reply: '⚠️ I had trouble searching your notes (they may still be processing). Try asking again in a moment, or rephrase your question.' 
        });
    }
};

// Fetch persistent chat history for a specific document
export const getDocumentChat = async (req, res) => {
    try {
        const { docId } = req.params;
        const userId = req.user.id;

        const { rows } = await query(
            `SELECT id, role, content, created_at 
             FROM document_chats 
             WHERE document_id = $1 AND user_id = $2 
             ORDER BY created_at ASC 
             LIMIT 100`,
            [docId, userId]
        );

        res.status(200).json({ messages: rows });
    } catch (error) {
        console.error("Get Document Chat Error:", error);
        res.status(500).json({ error: "Failed to fetch document chat history" });
    }
};

// Clear chat history for a specific document
export const clearDocumentChat = async (req, res) => {
    try {
        const { docId } = req.params;
        const userId = req.user.id;

        await query(
            `DELETE FROM document_chats WHERE document_id = $1 AND user_id = $2`,
            [docId, userId]
        );

        res.status(200).json({ message: "Chat history cleared successfully" });
    } catch (error) {
        console.error("Clear Document Chat Error:", error);
        res.status(500).json({ error: "Failed to clear document chat history" });
    }
};

// Get all documents for the authenticated user, grouped by subject
export const getUserDocuments = async (req, res) => {
    try {
        const userId = req.user.id;

        const sql = `
            SELECT 
                d.id,
                d.title,
                d.file_url,
                d.file_type,
                d.status,
                d.created_at,
                d.subject_id,
                s.subject_name
            FROM documents d
            JOIN subjects s ON d.subject_id = s.subject_id
            WHERE d.user_id = $1
            ORDER BY s.subject_name ASC, d.created_at DESC
        `;

        const result = await query(sql, [userId]);

        // Group documents by subject
        const grouped = {};
        for (const doc of result.rows) {
            const key = doc.subject_id;
            if (!grouped[key]) {
                grouped[key] = {
                    subject_id: doc.subject_id,
                    subject_name: doc.subject_name,
                    documents: [],
                };
            }
            grouped[key].documents.push({
                id: doc.id,
                title: doc.title,
                file_url: doc.file_url,
                file_type: doc.file_type,
                status: doc.status,
                created_at: doc.created_at,
            });
        }

        res.status(200).json({ subjects: Object.values(grouped) });

    } catch (error) {
        console.error("Get Documents Error:", error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
};

// Delete a single document
export const deleteDocument = async (req, res) => {
    try {
        const userId = req.user.id;
        const { docId } = req.params;

        const result = await query(
            `DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING id`,
            [docId, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.status(200).json({ message: 'Document deleted' });

    } catch (error) {
        console.error("Delete Document Error:", error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
};
