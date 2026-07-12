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

        // Store token — user is logged in immediately after signup
        if (data.token) {
            localStorage.setItem('token', data.token);
        }

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

        // Store token for subsequent requests
        if (data.token) {
            localStorage.setItem('token', data.token);
        }
    
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
        // console.log("CHECK AUTH API CALL");
        const data = await apiConnector("GET", ME_API);

        // console.log("CHECK AUTH API RESPONSE:", data);
        // data = { name, email }
        return data;
    } catch(error) {
        console.error("CHECK AUTH ERROR:", error);
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
        // Ignore logout errors — clear token regardless
    } finally {
        localStorage.removeItem('token');
    }
}