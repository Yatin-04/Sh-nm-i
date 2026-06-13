import { apiConnector } from "../apiConnector";
import { sessionEndpoints } from "../api";

// ─────────────────────────────────────────────
//  START SESSION
//  POST /sessions/
//  Body: { subject_id, session_type, date, planned_duration }
//  Returns: { message, session: { session_id, ... } }
// ─────────────────────────────────────────────
export async function startSession({ subjectId, sessionType, plannedDuration }) {
    try {
        const today = new Date().toISOString().split("T")[0]; // 'YYYY-MM-DD'

        const data = await apiConnector("POST", sessionEndpoints.START_USER_SESSION_API, {
            subject_id: subjectId,
            session_type: sessionType,   // "focus"
            date: today,
            planned_duration: plannedDuration,
        });

        console.log("START SESSION RESPONSE:", data);
        return data; // { message, session: { session_id, ... } }
    } catch (error) {
        console.error("START SESSION ERROR:", error);
        throw error;
    }
}

// ─────────────────────────────────────────────
//  END SESSION
//  PUT /sessions/:session_id/complete
//  Body: { actual_duration }  ← total focus seconds (pauses excluded)
//  Returns: { message, session: { ... } }
// ─────────────────────────────────────────────
export async function endSession({ sessionId, actualDuration }) {
    try {
        const url = sessionEndpoints.END_USER_SESSION_API.replace(":session_id", sessionId);

        const data = await apiConnector("PUT", url, {
            actual_duration: actualDuration,
        });

        console.log("END SESSION RESPONSE:", data);
        return data;
    } catch (error) {
        console.error("END SESSION ERROR:", error);
        throw error;
    }
}
