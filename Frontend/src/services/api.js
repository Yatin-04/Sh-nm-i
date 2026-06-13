const BASE_URL = "http://localhost:5000/api/v1"

// AUTH ENDPOINTS
export const endpoints = {
    SIGNUP_API: BASE_URL + "/auth/register",
    LOGIN_API:  BASE_URL + "/auth/login"
}

// SUBJECT ENDPOINTS
export const subjectEndpoints = {
    GET_USER_SUBJECTS_API: BASE_URL + "/subjects/",
    CREATE_SUBJECT_API:    BASE_URL + "/subjects/"
}

// TODOS ENDPOINTS
export const todoEndpoints = {
    GET_USER_TODOS_API:      BASE_URL + "/todos/",
    CREATE_USER_TODOS_API:   BASE_URL + "/todos/",
    COMPLETE_USER_TODOS_API: BASE_URL + "/todos/:todo_id/complete"
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
    USER_ANALYTICS_API: BASE_URL + "/analytics/dashboard"
}
