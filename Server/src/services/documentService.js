import { query } from '../config/db.js';
import { PDFParse } from 'pdf-parse';
import { generateEmbedding, generateEmbeddingBatch } from './llmProvider.js';
import { v2 as cloudinary } from 'cloudinary';
import PQueue from 'p-queue';

const processQueue = new PQueue({ concurrency: 2 });

// ─── Chunking with page awareness ──────────────────────────────────────────

/**
 * Splits page-annotated text into overlapping chunks, tracking which pages each chunk spans.
 * @param {Array<{page: number, text: string}>} pages - Array of {page, text} from PDF extraction
 * @param {number} maxWords - Max words per chunk
 * @param {number} overlapWords - Overlap between chunks
 * @returns {Array<{content: string, pageStart: number, pageEnd: number}>}
 */
export const chunkPages = (pages, maxWords = 300, overlapSentences = 2) => {
    const chunks = [];
    const allSentences = [];
    
    // Flatten pages into sentences with page references
    for (const { page, text } of pages) {
        // Split text by sentence boundaries (., !, ?)
        const sentences = text.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) || [];
        for (let s of sentences) {
            const trimmed = s.trim();
            if (trimmed) {
                allSentences.push({ text: trimmed, page });
            }
        }
    }

    let i = 0;
    while (i < allSentences.length) {
        let chunkContent = [];
        let wordCount = 0;
        let pageStart = allSentences[i].page;
        let pageEnd = pageStart;
        
        let j = i;
        while (j < allSentences.length) {
            const sentence = allSentences[j];
            const sentenceWordCount = sentence.text.split(/\s+/).length;
            
            if (wordCount + sentenceWordCount > maxWords && wordCount > 0) {
                break; // Chunk is full
            }
            
            chunkContent.push(sentence.text);
            wordCount += sentenceWordCount;
            pageEnd = sentence.page;
            j++;
        }
        
        chunks.push({
            content: chunkContent.join(' '),
            pageStart,
            pageEnd
        });
        
        if (j >= allSentences.length) break;
        
        // Advance i, overlapping by overlapSentences
        i = Math.max(i + 1, j - overlapSentences);
    }

    return chunks;
};

// ─── Embeddings (delegated to llmProvider) ──────────────────────────────────

export const generateEmbeddings = async (text) => {
    return await generateEmbedding(text);
};

// ─── Document Processing ────────────────────────────────────────────────────

export const processDocument = async (documentId, fileData, fileType, fileName) => {
    return processQueue.add(async () => {
        try {
            console.log(`[Queue] Starting processing for doc ${documentId}`);
            
            // 1. Upload to Cloudinary (for storage/display)
            let resourceType = (fileType === 'application/pdf' || fileType === 'text/plain') ? 'raw' : 'auto';
            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'study-buddy-assets', resource_type: resourceType },
                    (err, res) => { if (err) reject(err); else resolve(res); }
                );
                stream.end(fileData);
            });
            
            const fileUrl = uploadResult.secure_url;
            await query(`UPDATE documents SET file_url = $1 WHERE id = $2`, [fileUrl, documentId]);
            console.log(`[Queue] Uploaded ${fileName} to Cloudinary.`);

            let pages = []; // Array of { page: number, text: string }

        if (fileType === 'application/pdf') {
            const parser = new PDFParse({ data: fileData });
            const result = await parser.getText();
            
            // pdf-parse v2 returns pages array with { text, num }
            if (result.pages && result.pages.length > 0) {
                pages = result.pages.map(p => ({ page: p.num, text: p.text }));
            } else {
                // Fallback: treat entire text as page 1
                pages = [{ page: 1, text: result.text }];
            }
            await parser.destroy();
        } else if (fileType === 'text/plain') {
            pages = [{ page: 1, text: fileData.toString('utf8') }];
        } else if (fileType.startsWith('image/')) {
            pages = [{ page: 1, text: "Image content extraction not yet supported." }];
        }

        const totalText = pages.map(p => p.text).join(' ');
        if (!totalText.trim()) {
            throw new Error("No text content could be extracted.");
        }

        // Chunk with page awareness
        const chunks = chunkPages(pages);
        console.log(`Document split into ${chunks.length} chunks across ${pages.length} pages. Generating embeddings...`);

        // Batch embed 
        // Voyage AI free tier constraint: 3 RPM / 10K TPM without a payment method.
        // Adding a payment method removes this limit, while the 200M free tokens still apply.
        // If repeated retries are still happening, adding a payment method is the real fix.
        const BATCH_SIZE = 25;
        for (let batchStart = 0; batchStart < chunks.length; batchStart += BATCH_SIZE) {
            const batch = chunks.slice(batchStart, batchStart + BATCH_SIZE);
            const texts = batch.map(c => c.content);

            const embeddings = await generateEmbeddingBatch(texts);

            // Store each chunk with its embedding
            for (let j = 0; j < batch.length; j++) {
                const { content, pageStart, pageEnd } = batch[j];
                const embeddingString = `[${embeddings[j].join(',')}]`;
                const chunkIndex = batchStart + j;

                await query(
                    `INSERT INTO document_chunks (document_id, content, page_start, page_end, chunk_index, embedding)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [documentId, content, pageStart, pageEnd, chunkIndex, embeddingString]
                );
            }

            console.log(`  Embedded ${Math.min(batchStart + BATCH_SIZE, chunks.length)}/${chunks.length} chunks...`);
        }

        // Mark document as complete
        await query(`UPDATE documents SET status = 'completed' WHERE id = $1`, [documentId]);
        console.log(`Document ${documentId} processed successfully (${chunks.length} chunks).`);
    } catch (error) {
        console.error("Document processing failed:", error.message || error);
        console.error("Full error:", error);
        await query(`UPDATE documents SET status = 'failed' WHERE id = $1`, [documentId]);
    }
    }); // end queue.add
};

// ─── Vector Search (returns content + source references) ────────────────────

export const searchLocalNotes = async (queryText, subjectId, limit = 5, documentId = null) => {
    const queryEmbedding = await generateEmbeddings(queryText);
    const embeddingString = `[${queryEmbedding.join(',')}]`;
    
    let sql;
    let params;
    
    if (documentId) {
        sql = `
            SELECT 
                dc.content,
                dc.page_start,
                dc.page_end,
                dc.chunk_index,
                d.title as document_title,
                d.file_url,
                1 - (dc.embedding <=> $1) as similarity
            FROM document_chunks dc
            JOIN documents d ON dc.document_id = d.id
            WHERE dc.document_id = $2 AND d.status = 'completed'
            ORDER BY dc.embedding <=> $1
            LIMIT $3
        `;
        params = [embeddingString, documentId, limit];
    } else {
        sql = `
            SELECT 
                dc.content,
                dc.page_start,
                dc.page_end,
                dc.chunk_index,
                d.title as document_title,
                d.file_url,
                1 - (dc.embedding <=> $1) as similarity
            FROM document_chunks dc
            JOIN documents d ON dc.document_id = d.id
            WHERE d.subject_id = $2 AND d.status = 'completed'
            ORDER BY dc.embedding <=> $1
            LIMIT $3
        `;
        params = [embeddingString, subjectId, limit];
    }
    
    const result = await query(sql, params);
    return result.rows;
};
