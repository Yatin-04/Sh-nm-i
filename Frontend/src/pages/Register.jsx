import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { signup } from "../services/Operations/authAPI";
import { setAuth } from "../slices/authSlice";
import "./css/AuthForm.css";

export default function Register() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({ name: "", email: "", password: "" });
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
            const data = await signup(formData);
            dispatch(setAuth({ user_id: data.user_id, name: formData.name, email: formData.email }));
            navigate("/dashboard");
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
                    <span className="mono-tag">create account</span>
                    <h1 className="auth-title">Start focusing.</h1>
                    <p className="auth-sub">Track your time. Own your output.</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    <div className="field">
                        <label className="field-label" htmlFor="name">name</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            className="field-input"
                            placeholder="your name"
                            value={formData.name}
                            onChange={handleChange}
                            autoComplete="name"
                            required
                        />
                    </div>

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
                            autoComplete="new-password"
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
                        {loading ? "creating account..." : "create account"}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account?{" "}
                    <Link to="/login" className="auth-link">
                        sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}