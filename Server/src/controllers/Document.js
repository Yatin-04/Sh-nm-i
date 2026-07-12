import { query } from '../config/db.js';
import { runStudyBuddyAgent } from '../services/agentService.js';
import { documentQueue } from '../workers/documentWorker.js';

export const uploadDocument = async (req, res) => {
    try {
        const { id: subjectId } = req.params;
        const userId = req.user.id;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // multer-storage-cloudinary provides the URL in file.path (secure_url)
        const fileUrl = file.path;
        console.log('Uploaded file info:', { 
            originalname: file.originalname, 
            path: file.path, 
            mimetype: file.mimetype,
            size: file.size
        });

        // 1. Insert into database
        const insertDocSql = `
            INSERT INTO documents (user_id, subject_id, title, file_url, file_type, status)
            VALUES ($1, $2, $3, $4, $5, 'processing')
            RETURNING id
        `;
        const result = await query(insertDocSql, [
            userId, 
            subjectId, 
            file.originalname, 
            fileUrl,
            file.mimetype
        ]);
        
        const documentId = result.rows[0].id;

        // 2. Enqueue document for background processing (BullMQ)
        await documentQueue.add('process-pdf', {
            documentId,
            fileUrl: fileUrl,
            fileType: file.mimetype
        });

        res.status(202).json({ 
            message: 'Document uploaded and processing started in background', 
            documentId 
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
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Pass chat history for conversational context
        const responseText = await runStudyBuddyAgent(subjectId, message, history || []);

        res.status(200).json({ reply: responseText });

    } catch (error) {
        console.error("Chat Error:", error);
        
        if (error.status === 429) {
            return res.status(429).json({ 
                error: 'AI quota exceeded. Please wait a minute and try again.',
                reply: '⚠️ I\'m temporarily rate-limited by the AI provider. Please wait about 30 seconds and try again.' 
            });
        }
        
        res.status(500).json({ error: 'Failed to process chat' });
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
