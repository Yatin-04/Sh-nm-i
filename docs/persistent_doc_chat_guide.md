# Persistent Chat History per Document — Design & Implementation Guide

## Overview

Currently, the **AI Study Buddy chat** inside `DocumentPreviewModal` is **ephemeral** — every time the modal closes or refreshes, the conversation state is reset. 

This document details **how to store and retrieve chat history per document** across three different architecture approaches, complete with schema design, API structure, and frontend code changes.

---

## Technical Options Summary

| Approach | Storage Location | Cross-Device Sync | Implementation Effort | Best Used For |
|---|---|---|---|---|
| **Strategy 1: `localStorage`** | Client Browser | No | ~15 mins (Frontend only) | Instant MVP / Single-device use |
| **Strategy 2: PostgreSQL Table** *(Recommended)* | Database | Yes | ~45 mins (Full Stack) | Production-ready multi-device app |
| **Strategy 3: Redis Cache + DB** | Memory + DB | Yes | ~1.5 hours | High-throughput / Real-time chat |

---

## Strategy 1: Client-Side `localStorage` (Fastest MVP)

If you only need chat persistence on the user's current device without making server schema changes, store messages in `localStorage` keyed by `documentId`.

### Implementation Steps

In [`DocumentPreviewModal.jsx`](file:///d:/megaProject/Sh-nm-i/Frontend/src/components/subjects/DocumentPreviewModal.jsx), update the `AIChatPane` state:

```javascript
function AIChatPane({ doc, subjectId, theme }) {
    const STORAGE_KEY = `doc_chat_${doc.id}`;

    // Load persisted chat from localStorage or fallback to welcome message
    const [messages, setMessages] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [welcomeMsg];
        } catch {
            return [welcomeMsg];
        }
    });

    // Automatically sync messages to localStorage on state change
    useEffect(() => {
        try {
            // Keep last 50 messages to stay within quota limits
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)));
        } catch (e) {
            console.error("Failed to save chat to localStorage", e);
        }
    }, [messages, STORAGE_KEY]);

    // Optional: Clear chat handler
    const handleClearChat = () => {
        localStorage.removeItem(STORAGE_KEY);
        setMessages([welcomeMsg]);
    };
    
    // ... rest of component
}
```

---

## Strategy 2: PostgreSQL Persistence (Recommended Production Solution)

To allow users to access their past document conversations from any device or browser, create a dedicated table in PostgreSQL.

### 1. Database Schema

Add the `document_chats` table definition inside [`Server/src/models/document.js`](file:///d:/megaProject/Sh-nm-i/Server/src/models/document.js):

```sql
CREATE TABLE IF NOT EXISTS document_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'ai')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast per-document user chat lookups
CREATE INDEX IF NOT EXISTS idx_doc_chats_document_user 
ON document_chats (document_id, user_id, created_at ASC);
```

---

### 2. Backend Routes & Controllers

Add endpoints to retrieve and clear chat history, and modify `chatWithAgent` to auto-save history.

#### **A. Routes** ([`Server/src/routes/Subject.js`](file:///d:/megaProject/Sh-nm-i/Server/src/routes/Subject.js))
```javascript
router.get('/documents/:docId/chat', getDocumentChat);
router.delete('/documents/:docId/chat', clearDocumentChat);
```

#### **B. Controller** ([`Server/src/controllers/Document.js`](file:///d:/megaProject/Sh-nm-i/Server/src/controllers/Document.js))
```javascript
// 1. Auto-save messages in chatWithAgent
export const chatWithAgent = async (req, res) => {
    // ... existing agent call logic ...
    const responseText = await runStudyBuddyAgent(subjectId, message, history || [], documentId || null);

    // Save both user question and AI reply if documentId is specified
    if (documentId && req.user?.id) {
        await query(
            `INSERT INTO document_chats (document_id, user_id, role, content) 
             VALUES ($1, $2, 'user', $3), ($1, $2, 'ai', $4)`,
            [documentId, req.user.id, message, responseText]
        );
    }

    res.status(200).json({ reply: responseText });
};

// 2. Fetch Chat History
export const getDocumentChat = async (req, res) => {
    try {
        const { docId } = req.params;
        const userId = req.user.id;
        const { rows } = await query(
            `SELECT id, role, content as text, created_at 
             FROM document_chats 
             WHERE document_id = $1 AND user_id = $2 
             ORDER BY created_at ASC LIMIT 100`,
            [docId, userId]
        );
        res.status(200).json({ messages: rows });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch document chat history" });
    }
};

// 3. Clear Chat History
export const clearDocumentChat = async (req, res) => {
    try {
        const { docId } = req.params;
        const userId = req.user.id;
        await query(
            `DELETE FROM document_chats WHERE document_id = $1 AND user_id = $2`,
            [docId, userId]
        );
        res.status(200).json({ message: "Chat history cleared" });
    } catch (err) {
        res.status(500).json({ error: "Failed to clear chat history" });
    }
};
```

---

### 3. Frontend Operations & Modal Updates

#### **A. API Helper** ([`Frontend/src/services/Operations/documentAPI.js`](file:///d:/megaProject/Sh-nm-i/Frontend/src/services/Operations/documentAPI.js))
```javascript
export async function getDocumentChat(docId) {
    const url = documentEndpoints.GET_DOCUMENT_CHAT_API.replace(":doc_id", docId);
    return await apiConnector("GET", url);
}

export async function clearDocumentChat(docId) {
    const url = documentEndpoints.CLEAR_DOCUMENT_CHAT_API.replace(":doc_id", docId);
    return await apiConnector("DELETE", url);
}
```

#### **B. Modal Chat Component** ([`Frontend/src/components/subjects/DocumentPreviewModal.jsx`](file:///d:/megaProject/Sh-nm-i/Frontend/src/components/subjects/DocumentPreviewModal.jsx))
```javascript
useEffect(() => {
    let isMounted = true;
    async function loadHistory() {
        try {
            const data = await getDocumentChat(doc.id);
            if (isMounted && data?.messages?.length > 0) {
                setMessages(data.messages);
            }
        } catch (err) {
            console.error("Could not load chat history", err);
        }
    }
    loadHistory();
    return () => { isMounted = false; };
}, [doc.id]);
```

---

## Strategy 3: Token Management Considerations

When persisting chat history:
> [!IMPORTANT]
> Do **not** send the entire stored history to the LLM agent on every request, as this would quickly exceed token limits and increase API cost.
>
> **Best Practice**: Only pass the **last 4-6 messages** to `runStudyBuddyAgent` as conversational context, while displaying the complete chat history in the UI for the user.

---

## Next Steps

If you would like me to implement Strategy 1 or Strategy 2 directly into the codebase, let me know!
