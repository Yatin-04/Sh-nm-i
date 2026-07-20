import { documentEndpoints } from "../api";
import { apiConnector } from "../apiConnector";

// ─────────────────────────────────────────────
//  UPLOAD DOCUMENT (PDF/TXT/Image)
//  POST /subjects/:subject_id/documents
//  Body: FormData with 'file' field
//  Returns: { message, documentId }
// ─────────────────────────────────────────────
export async function uploadDocument(subjectId, file) {
    const url = documentEndpoints.UPLOAD_DOCUMENT_API.replace(":subject_id", subjectId);

    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem('token');
    const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
            ...(token && { "Authorization": `Bearer ${token}` }),
        },
        body: formData, // No Content-Type header — browser sets multipart boundary
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
        throw { status: response.status, statusText: response.statusText, data };
    }

    return data;
}

// ─────────────────────────────────────────────
//  CHAT WITH AI STUDY BUDDY
//  POST /subjects/:subject_id/chat
//  Body: { message }
//  Returns: { reply: "..." }
// ─────────────────────────────────────────────
export async function chatWithStudyBuddy(subjectId, message, history = [], documentId = null) {
    const url = documentEndpoints.CHAT_WITH_AGENT_API.replace(":subject_id", subjectId);

    const token = localStorage.getItem('token');
    const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { 
            "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` }),
        },
        body: JSON.stringify({ message, history, ...(documentId && { documentId }) }),
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
        throw { status: response.status, statusText: response.statusText, data };
    }

    return data;
}

// ─────────────────────────────────────────────
//  GET ALL USER DOCUMENTS (grouped by subject)
//  GET /subjects/documents
//  Returns: { subjects: [{ subject_id, subject_name, documents: [...] }] }
// ─────────────────────────────────────────────
export async function getUserDocuments() {
    try {
        const data = await apiConnector("GET", documentEndpoints.GET_USER_DOCUMENTS_API);
        return data.subjects;
    } catch (error) {
        console.error("GET DOCUMENTS ERROR:", error);
        throw error;
    }
}

// ─────────────────────────────────────────────
//  DELETE A DOCUMENT
//  DELETE /subjects/documents/:doc_id
//  Returns: { message }
// ─────────────────────────────────────────────
export async function deleteDocumentById(docId) {
    const url = documentEndpoints.DELETE_DOCUMENT_API.replace(":doc_id", docId);
    try {
        const data = await apiConnector("DELETE", url);
        return data;
    } catch (error) {
        console.error("DELETE DOCUMENT ERROR:", error);
        throw error;
    }
}

// ─────────────────────────────────────────────
//  GENERATE FLASHCARDS
//  GET /subjects/:subject_id/flashcards
//  Returns: { flashcards: [...] }
// ─────────────────────────────────────────────
export async function generateFlashcards(subjectId, documentId = null) {
    let url = documentEndpoints.GENERATE_FLASHCARDS_API.replace(":subject_id", subjectId);
    if (documentId) url += `?documentId=${documentId}`;
    try {
        const data = await apiConnector("GET", url);
        return data.flashcards;
    } catch (error) {
        console.error("GENERATE FLASHCARDS ERROR:", error);
        throw error;
    }
}

// ─────────────────────────────────────────────
//  FETCH DOCUMENT CHAT HISTORY
//  GET /subjects/documents/:doc_id/chat
// ─────────────────────────────────────────────
export async function getDocumentChat(docId) {
    const url = documentEndpoints.GET_DOCUMENT_CHAT_API.replace(":doc_id", docId);
    try {
        const data = await apiConnector("GET", url);
        return data.messages || [];
    } catch (error) {
        console.error("GET DOCUMENT CHAT ERROR:", error);
        return [];
    }
}

// ─────────────────────────────────────────────
//  CLEAR DOCUMENT CHAT HISTORY
//  DELETE /subjects/documents/:doc_id/chat
// ─────────────────────────────────────────────
export async function clearDocumentChat(docId) {
    const url = documentEndpoints.CLEAR_DOCUMENT_CHAT_API.replace(":doc_id", docId);
    try {
        const data = await apiConnector("DELETE", url);
        return data;
    } catch (error) {
        console.error("CLEAR DOCUMENT CHAT ERROR:", error);
        throw error;
    }
}
