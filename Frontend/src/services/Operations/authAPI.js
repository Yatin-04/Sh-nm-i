import { apiConnector } from "../apiConnector";
import { endpoints } from "../api";

const { SIGNUP_API, LOGIN_API, ME_API, LOGOUT_API } = endpoints;

// ─────────────────────────────────────────────
//  SIGNUP
//  POST /auth/register → { message, user_id }
//  @param {object} formData  - { name, email, password }
// ─────────────────────────────────────────────
export async function signup(formData) {
    try {
        const data = await apiConnector("POST", SIGNUP_API, formData);

        console.log("SIGNUP API RESPONSE:", data);
        // data = { message: "Registration successful", user_id: "..." }

        return data;
    } catch (error) {
        console.error("SIGNUP ERROR:", error);
        throw error;
    }
}

// ─────────────────────────────────────────────
//  LOGIN
//  POST /auth/login → { message, user_id }
//  JWT is set as httpOnly cookie by the server automatically.
//  @param {string} email
//  @param {string} password
// ─────────────────────────────────────────────
export async function login(email, password) {
    try {
        const data = await apiConnector("POST", LOGIN_API, { email, password });

        console.log("LOGIN API RESPONSE:", data);
        // data = { message: "Login successful", user_id: "..." }

        return data;
    } catch (error) {
        console.error("LOGIN ERROR:", error);
        throw error;
    }
}

// ─────────────────────────────────────────────
//  CHECK AUTH (on page load)
//  GET /auth/me → { user_id, name, email }
//  Validates the httpOnly JWT cookie.
// ─────────────────────────────────────────────
export async function checkAuth() {
    try {
        const data = await apiConnector("GET", ME_API);
        // data = { user_id, name, email }
        return data;
    } catch {
        // 401 means not authenticated — this is expected when no cookie exists
        return null;
    }
}

// ─────────────────────────────────────────────
//  LOGOUT
//  POST /auth/logout — clears the JWT cookie on server
// ─────────────────────────────────────────────
export async function logout() {
    try {
        await apiConnector("POST", LOGOUT_API);
    } catch (error) {
        console.error("LOGOUT ERROR:", error);
        throw error;
    }
}