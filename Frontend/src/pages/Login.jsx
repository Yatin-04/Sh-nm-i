import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../services/Operations/authAPI";
import { setAuth } from "../slices/authSlice";
import "./css/AuthForm.css";

export default function Login() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({ email: "", password: "" });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const data = await login(formData.email, formData.password, navigate);
            // Dispatch setAuth before navigate (navigate is called inside login())
            // so we dispatch first using the returned data
            dispatch(setAuth({ user_id: data.user_id }));
        } catch (err) {
            setError(err?.data?.error || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <span className="mono-tag">sign in</span>
                    <h1 className="auth-title">Welcome back.</h1>
                    <p className="auth-sub">Pick up where you left off.</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    <div className="field">
                        <label className="field-label" htmlFor="email">email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className="field-input"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="field">
                        <label className="field-label" htmlFor="password">password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="field-input"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    {error && (
                        <div className="auth-error" role="alert">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={loading}
                    >
                        {loading ? "signing in..." : "sign in"}
                    </button>
                </form>

                <p className="auth-switch">
                    No account yet?{" "}
                    <Link to="/register" className="auth-link">
                        create one
                    </Link>
                </p>
            </div>
        </div>
    );
}