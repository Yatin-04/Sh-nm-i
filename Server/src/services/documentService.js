import { query } from '../config/db.js';
import { PDFParse } from 'pdf-parse';
import { generateEmbedding, generateEmbeddingBatch } from './llmProvider.js';

// ─── Chunking with page awareness ──────────────────────────────────────────

/**
 * Splits page-annotated text into overlapping chunks, tracking which pages each chunk spans.
 * @param {Array<{page: number, text: string}>} pages - Array of {page, text} from PDF extraction
 * @param {number} maxWords - Max words per chunk
 * @param {number} overlapWords - Overlap between chunks
 * @returns {Array<{content: string, pageStart: number, pageEnd: number}>}
 */
export const chunkPages = (pages, maxWords = 500, overlapWords = 100) => {
    const chunks = [];
    
    // Flatten pages into word-level tokens with page references
    const tokens = []; // { word, page }
    for (const { page, text } of pages) {
        const words = text.split(/\s+/).filter(w => w.trim());
        for (const word of words) {
            tokens.push({ word, page });
        }
    }

    let i = 0;
    while (i < tokens.length) {
        const slice = tokens.slice(i, i + maxWords);
        if (slice.length === 0) break;

        const content = slice.map(t => t.word).join(' ');
        const pageStart = slice[0].page;
        const pageEnd = slice[slice.length - 1].page;

        chunks.push({ content, pageStart, pageEnd });
        i += (maxWords - overlapWords);
    }

    return chunks;
};

// ─── Embeddings (delegated to llmProvider) ──────────────────────────────────

export const generateEmbeddings = async (text) => {
    return await generateEmbedding(text);
};

// ─── Document Processing ────────────────────────────────────────────────────

export const processDocument = async (documentId, fileData, fileType) => {
    try {
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

        // Batch embed for speed (process in batches of 10)
        const BATCH_SIZE = 10;
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
};

// ─── Vector Search (returns content + source references) ────────────────────

export const searchLocalNotes = async (queryText, subjectId, limit = 5) => {
    const queryEmbedding = await generateEmbeddings(queryText);
    const embeddingString = `[${queryEmbedding.join(',')}]`;
    
    const sql = `
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
    
    const result = await query(sql, [embeddingString, subjectId, limit]);
    return result.rows;
};
