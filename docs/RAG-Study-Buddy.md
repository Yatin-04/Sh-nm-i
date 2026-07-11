# AI Study Buddy — RAG Architecture Guide

> This doc explains the Retrieval-Augmented Generation (RAG) feature added on top of your Pomodoro/Todo/Music app. It lets users upload PDFs/notes per subject and ask questions that get answered from those documents.

---

## High-Level Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│  FRONTEND (React)                                                    │
│                                                                      │
│  AIStudyBuddyDrawer.jsx                                              │
│    ├── Upload file → POST /subjects/:id/documents                    │
│    └── Ask question → POST /subjects/:id/chat                        │
└───────────────────────────┬──────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│  BACKEND (Express)                                                   │
│                                                                      │
│  routes/Subject.js                                                   │
│    ├── POST /:id/documents  →  Document.js controller (upload)       │
│    └── POST /:id/chat       →  Document.js controller (chat)         │
│                                                                      │
│  UPLOAD PATH:                                                        │
│    Multer + Cloudinary → Insert DB row → Enqueue BullMQ job          │
│                                              │                       │
│                                              ▼                       │
│    documentWorker.js (BullMQ Worker)                                 │
│      └── Downloads PDF from Cloudinary URL                           │
│          └── documentService.js:processDocument()                    │
│              ├── pdf-parse: extract text                              │
│              ├── chunkText(): split into ~1000-word chunks            │
│              ├── Gemini text-embedding-004: generate 768-dim vectors  │
│              └── INSERT into document_chunks (pgvector)               │
│                                                                      │
│  CHAT PATH:                                                          │
│    agentService.js:runStudyBuddyAgent()                              │
│      ├── Gemini 1.5 Flash with function-calling tools                │
│      ├── Tool 1: searchLocalNotes → vector similarity (pgvector)     │
│      └── Tool 2: searchWeb → Tavily API (fallback)                   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## File Map

| File | Role |
|------|------|
| `Frontend/src/components/AIStudyBuddyDrawer.jsx` | Chat UI (drawer), file upload button, sends messages |
| `Frontend/src/pages/MyDocuments.jsx` | Full-page document browser (files grouped by subject folder) |
| `Frontend/src/services/Operations/documentAPI.js` | API functions: `uploadDocument()`, `chatWithStudyBuddy()`, `getUserDocuments()`, `deleteDocumentById()` |
| `Frontend/src/services/api.js` | Endpoint URLs (added `documentEndpoints`) |
| `Frontend/src/components/layout/SideNav.jsx` | Profile dropdown — includes "My documents" link |
| `Server/src/routes/Subject.js` | Express routes for upload, chat, list, and delete |
| `Server/src/controllers/Document.js` | `uploadDocument` / `chatWithAgent` / `getUserDocuments` / `deleteDocument` handlers |
| `Server/src/middlewares/upload.js` | Multer + Cloudinary storage (PDF/TXT/images, 50MB limit) |
| `Server/src/workers/documentWorker.js` | BullMQ worker that processes uploaded files in background |
| `Server/src/services/documentService.js` | PDF parsing, chunking, embedding generation, vector storage, similarity search |
| `Server/src/services/agentService.js` | AI agent loop (Gemini function calling + tools) |
| `Server/src/models/document.js` | DB schema: `documents` table + `document_chunks` table (pgvector) |

---

## How Each Piece Works

### 1. Upload Flow (PDF → Vectors)

When a user attaches a PDF in the Study Buddy chat:

1. **Frontend** calls `POST /api/v1/subjects/:subject_id/documents` with a `FormData` body.
2. **Multer middleware** uploads the file to Cloudinary (raw resource type for PDFs).
3. **Controller** inserts a row in `documents` table (status = `'processing'`), then adds a job to the BullMQ queue.
4. **BullMQ Worker** picks up the job:
   - Downloads the PDF from the Cloudinary URL
   - `pdf-parse` extracts all text content
   - `chunkText()` splits into overlapping chunks (~1000 words, 200-word overlap)
   - For each chunk, calls Gemini `text-embedding-004` to get a 768-dimensional vector
   - Inserts chunk + embedding into `document_chunks`
   - Updates document status to `'completed'`

### 2. Chat Flow (Question → Answer)

When a user types a question:

1. **Frontend** calls `POST /api/v1/subjects/:subject_id/chat` with `{ message }`.
2. **Controller** delegates to `runStudyBuddyAgent(subjectId, message)`.
3. **Agent Service** starts a Gemini 1.5 Flash chat with two function-calling tools declared:
   - `searchLocalNotes` — searches the user's uploaded documents
   - `searchWeb` — falls back to Tavily web search
4. The model decides which tool to call (prefers local notes first).
5. If it calls `searchLocalNotes`:
   - Generates an embedding for the user's query
   - Runs a cosine similarity search against `document_chunks` (pgvector `<=>` operator)
   - Returns the top 5 most relevant chunks
6. If local notes don't have the answer, model calls `searchWeb` (Tavily API).
7. The tool response is fed back to the model, which generates a final natural-language answer.
8. Response is sent back to the frontend.

### 3. Vector Search (The "R" in RAG)

```sql
SELECT dc.content, 1 - (dc.embedding <=> $1) as similarity
FROM document_chunks dc
JOIN documents d ON dc.document_id = d.id
WHERE d.subject_id = $2 AND d.status = 'completed'
ORDER BY dc.embedding <=> $1
LIMIT 5
```

- `<=>` is pgvector's cosine distance operator
- HNSW index makes this fast even with thousands of chunks
- Only searches documents belonging to the current subject

### 4. My Documents Page (File Browser)

A dedicated page (`/my-documents`) accessible from the profile dropdown in the sidebar (next to "Change theme" and "Learn more"). It shows all uploaded files organized by subject folders.

**Access:** Profile avatar → "My documents"

**How it works:**
1. Calls `GET /api/v1/subjects/documents` which returns all user documents grouped by subject
2. Renders expandable/collapsible subject folders
3. Each document shows: filename, upload date, processing status badge, link to open the original file on Cloudinary, and a delete button
4. Deleting a document also cascades to remove its chunks/embeddings (via `ON DELETE CASCADE` in the DB schema)

**Backend endpoint:**
```
GET /api/v1/subjects/documents → getUserDocuments()
DELETE /api/v1/subjects/documents/:docId → deleteDocument()
```

---

## Infrastructure Requirements

| Service | Purpose | Config |
|---------|---------|--------|
| **PostgreSQL + pgvector** | Vector storage & similarity search | `DATABASE_URL` in `.env` |
| **Redis** | BullMQ job queue for async PDF processing | `REDIS_URL` in `.env` |
| **Cloudinary** | File storage (PDFs uploaded here) | `CLOUDINARY_URL` in `.env` |
| **Ollama** (local) | Embeddings (`nomic-embed-text`) + Chat (`qwen2.5:7b`) | `OLLAMA_URL` in `.env` (default: `http://localhost:11434`) |
| **Tavily API** (optional) | Web search fallback | `TAVILY_API_KEY` in `.env` |

### Setting Up Ollama (Required)

1. **Install Ollama**: Download from [ollama.com](https://ollama.com/download)
2. **Pull the models**:
   ```bash
   ollama pull nomic-embed-text
   ollama pull qwen2.5:7b
   ```
3. **Verify it's running**: `curl http://localhost:11434` should return "Ollama is running"
4. That's it — no API keys needed. Everything runs on your machine.

**Model choices:**
- `nomic-embed-text` — 768-dim embeddings, fast, matches our pgvector column
- `qwen2.5:7b` — excellent instruction-following, supports tool/function calls, runs well on 8GB+ RAM

You can swap models via `.env`:
```
OLLAMA_CHAT_MODEL=llama3.2
OLLAMA_EMBED_MODEL=nomic-embed-text
```

---

## Key Concepts Explained

### What is RAG?
**Retrieval-Augmented Generation** = instead of relying only on the AI model's training data, we first *retrieve* relevant context from the user's own documents, then *generate* an answer grounded in that context. This means the AI can answer questions about your specific notes/textbooks.

### What are Embeddings?
Embeddings are numerical representations (vectors) of text. Similar text produces similar vectors. By converting both your notes and your question into vectors, we can find which parts of your notes are most relevant to what you're asking.

### What is pgvector?
A PostgreSQL extension that lets you store vectors as a column type and perform fast similarity searches using specialized indexes (HNSW).

### What is BullMQ?
A Redis-based job queue. Processing a PDF (parsing, chunking, embedding) can take 10-30 seconds, so we do it in the background. The user gets an immediate "uploaded" response while processing happens asynchronously.

### What is Function Calling (Ollama)?
Instead of just generating text, the model can "call" predefined tools. We declare `searchLocalNotes` and `searchWeb` as available tools using Ollama's tool calling format. The model decides when to use them based on the user's question, making it an "agentic" system. This runs entirely on your machine — no cloud API required.

---

## How It Connects to Your Existing App

The Study Buddy is scoped by **subject** — the same subjects you use for Pomodoro sessions:

- Start a Pomodoro → Redux stores `subjectId` in `state.timer.subjectId`
- Open Study Buddy drawer → reads `subjectId` from Redux
- Upload notes → associated with that subject
- Ask questions → only searches documents for that subject
- View all documents → Profile menu → "My documents" page (`/my-documents`)

This means each subject has its own isolated knowledge base. Your Physics notes won't pollute your History answers. The My Documents page gives you a bird's-eye view of everything you've uploaded across all subjects.

---

## Troubleshooting

| Symptom | Likely Cause |
|---------|--------------|
| "No active subject" warning | No Pomodoro session running — start one first |
| Upload succeeds but questions return empty | Document still processing (check `documents.status`) or Redis/Worker not running |
| "Failed to search local notes" | pgvector extension not installed, or DB connection issue |
| Generic/vague answers | Chunks might be too large or embedding model mismatch — check chunk size |
| Worker crashes | Redis not running (`REDIS_URL` misconfigured) |
| "Ollama embed failed" or connection refused | Ollama isn't running — start it with `ollama serve` |
| Slow first response | Model loading into memory on first call — subsequent calls are fast |
