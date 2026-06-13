import { apiConnector } from "../apiConnector";
import { subjectEndpoints } from "../api";

// ─────────────────────────────────────────────
//  GET USER SUBJECTS
//  GET /subjects/
//  Returns: { subjects: [{ subject_id, subject_name, user_id, created_at }] }
// ─────────────────────────────────────────────
export async function getUserSubjects() {
    try {
        const data = await apiConnector("GET", subjectEndpoints.GET_USER_SUBJECTS_API);
        console.log("GET SUBJECTS RESPONSE:", data);
        return data.subjects; // array of subject objects
    } catch (error) {
        console.error("GET SUBJECTS ERROR:", error);
        throw error;
    }
}

// ─────────────────────────────────────────────
//  CREATE SUBJECT
//  POST /subjects/
//  Body: { subject_name }
//  Returns: { message, subject: { subject_id, subject_name, ... } }
// ─────────────────────────────────────────────
export async function createSubject(subjectName) {
    try {
        const data = await apiConnector("POST", subjectEndpoints.CREATE_SUBJECT_API, {
            subject_name: subjectName,
        });
        console.log("CREATE SUBJECT RESPONSE:", data);
        return data.subject;
    } catch (error) {
        console.error("CREATE SUBJECT ERROR:", error);
        throw error;
    }
}
