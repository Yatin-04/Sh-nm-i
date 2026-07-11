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

    const response = await fetch(url, {
        method: "POST",
        credentials: "include",
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
export async function chatWithStudyBuddy(subjectId, message) {
    const url = documentEndpoints.CHAT_WITH_AGENT_API.replace(":subject_id", subjectId);

    const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
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
