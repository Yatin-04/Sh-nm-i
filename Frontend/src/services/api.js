const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"

// AUTH ENDPOINTS
export const endpoints = {
    SIGNUP_API: BASE_URL + "/auth/register",
    LOGIN_API:  BASE_URL + "/auth/login",
    ME_API:     BASE_URL + "/auth/me",
    LOGOUT_API: BASE_URL + "/auth/logout"
}

// SUBJECT ENDPOINTS
export const subjectEndpoints = {
    GET_USER_SUBJECTS_API: BASE_URL + "/subjects/",
    CREATE_SUBJECT_API:    BASE_URL + "/subjects/",
    DELETE_SUBJECT_API:    BASE_URL + "/subjects/:id"
}

// TODOS ENDPOINTS
export const todoEndpoints = {
    GET_USER_TODOS_API:      BASE_URL + "/todos/",
    CREATE_USER_TODOS_API:   BASE_URL + "/todos/",
    COMPLETE_USER_TODOS_API: BASE_URL + "/todos/:todo_id/complete",
    DELETE_USER_TODOS_API:   BASE_URL + "/todos/:todo_id"
}

// SESSIONS ENDPOINTS
// Note: :session_id is a placeholder — sessionAPI.js replaces it before calling
export const sessionEndpoints = {
    GET_SUBJECT_SESSIONS_API: BASE_URL + "/sessions/subject/:subject_id",
    START_USER_SESSION_API:   BASE_URL + "/sessions/",
    END_USER_SESSION_API:     BASE_URL + "/sessions/:session_id/complete"
}

// ANALYTICS ENDPOINTS
export const analyticsEndpoints = {
    USER_ANALYTICS_API:      BASE_URL + "/analytics/dashboard",
    USER_TIMELINE_API:       BASE_URL + "/analytics/timeline",
    USER_CURRENT_STREAK_API: BASE_URL + "/analytics/current_streak"
}

// DOCUMENT / AI STUDY BUDDY ENDPOINTS
export const documentEndpoints = {
    UPLOAD_DOCUMENT_API: BASE_URL + "/subjects/:subject_id/documents",
    CHAT_WITH_AGENT_API: BASE_URL + "/subjects/:subject_id/chat",
    GET_USER_DOCUMENTS_API: BASE_URL + "/subjects/documents",
    DELETE_DOCUMENT_API: BASE_URL + "/subjects/documents/:doc_id",
    GENERATE_FLASHCARDS_API: BASE_URL + "/subjects/:subject_id/flashcards",
    GET_DOCUMENT_CHAT_API: BASE_URL + "/subjects/documents/:doc_id/chat",
    CLEAR_DOCUMENT_CHAT_API: BASE_URL + "/subjects/documents/:doc_id/chat"
}
