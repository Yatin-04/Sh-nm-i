import { apiConnector } from "../apiConnector";
import { endpoints } from "../api";

const { SIGNUP_API, LOGIN_API } = endpoints;

// Tells the browser to send/receive cookies on cross-origin requests
const CRED_HEADERS = { credentials: "include" };

// ─────────────────────────────────────────────
//  SIGNUP
//  POST /auth/register → { message, user_id }
//  @param {object} formData  - { name, email, password }
// ─────────────────────────────────────────────
export async function signup(formData) {
    try {
        const data = await apiConnector("POST", SIGNUP_API, formData, CRED_HEADERS);

        console.log("SIGNUP API RESPONSE:", data);
        // data = { message: "Registration successful", user_id: "..." }

        return data;
    } catch (error) {
        // error = { status, statusText, data: { error: "..." } }
        console.error("SIGNUP ERROR:", error);
        throw error;
    }
}

// ─────────────────────────────────────────────
//  LOGIN
//  POST /auth/login → { message, user_id }
//  JWT is set as httpOnly cookie by the server automatically.
//  Nothing is stored on the frontend.
//  @param {string} email
//  @param {string} password
//  @param {function} navigate
// ─────────────────────────────────────────────
export async function login(email, password, navigate) {
    try {
        const data = await apiConnector("POST", LOGIN_API, { email, password }, CRED_HEADERS);

        console.log("LOGIN API RESPONSE:", data);
        // data = { message: "Login successful", user_id: "..." }

        navigate("/dashboard");
        return data; // user_id available here when you're ready to store it
    } catch (error) {
        // 401 → error.data.error = "Invalid credentials."
        console.error("LOGIN ERROR:", error);
        throw error;
    }
}

// ─────────────────────────────────────────────
//  LOGOUT
//  ⚠️  Requires a backend route: POST /auth/logout
//  that calls res.clearCookie("jwt") — add this to your
//  Server/controllers/Auth.js and Server/routes/User.js
//  when you're ready.
//  @param {function} navigate
// ─────────────────────────────────────────────
export async function logout(navigate) {
    try {
        // TODO: uncomment once POST /auth/logout exists on the backend
        // await apiConnector("POST", endpoints.LOGOUT_API, null, CRED_HEADERS);

        navigate("/");
    } catch (error) {
        console.error("LOGOUT ERROR:", error);
        throw error;
    }
}