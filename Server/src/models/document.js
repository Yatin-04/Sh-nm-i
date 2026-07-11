import { query } from '../config/db.js';

export const createDocumentTables = async () => {
    // 1. Ensure the vector extension exists
    await query(`CREATE EXTENSION IF NOT EXISTS vector;`);

    // 2. Create documents table
    const createDocumentsTableQuery = `
    CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        subject_id UUID REFERENCES subjects(subject_id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'processing',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `;
    await query(createDocumentsTableQuery);

    // 3. Create document_chunks table (with page tracking)
    const createChunksTableQuery = `
    CREATE TABLE IF NOT EXISTS document_chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        page_start INTEGER,
        page_end INTEGER,
        chunk_index INTEGER,
        embedding vector(768)
    );
    `;
    await query(createChunksTableQuery);

    // Add columns if they don't exist (for existing DBs)
    await query(`ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS page_start INTEGER;`);
    await query(`ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS page_end INTEGER;`);
    await query(`ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS chunk_index INTEGER;`);

    // 4. Create an HNSW index for fast similarity search
    const createIndexQuery = `
    CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx 
    ON document_chunks 
    USING hnsw (embedding vector_cosine_ops);
    `;
    await query(createIndexQuery);

    console.log('Document tables and vector indexes ensured.');
};
