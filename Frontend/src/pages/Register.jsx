import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { signup } from "../services/Operations/authAPI";
import { setAuth } from "../slices/authSlice";
import { FiArrowLeft } from "react-icons/fi";

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
        <div className="flex-1 flex items-center justify-center py-12 px-6 min-h-[calc(100vh-60px)]">
            <div className="w-full max-w-[420px] bg-white border border-[#cbd5e1] rounded-2xl p-10">
                <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 text-xs text-[#6b7280] hover:text-[#111827] transition-colors mb-6 group cursor-pointer font-medium"
                >
                    <FiArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span>Back to Home</span>
                </Link>

                <div className="mb-8">
                    <span className="font-mono text-[0.7rem] text-[#6b7280] tracking-[0.08em] uppercase">create account</span>
                    <h1 className="text-[1.8rem] font-extrabold tracking-[-0.02em] text-[#111827] mt-1.5 mb-1">Start focusing.</h1>
                    <p className="text-[0.88rem] text-[#6b7280]">Track your time. Own your output.</p>
                </div>

                <form className="flex flex-col gap-[1.2rem] mb-6" onSubmit={handleSubmit} noValidate>
                    <div className="flex flex-col gap-1.5">
                        <label className="font-mono text-[0.7rem] text-[#6b7280] tracking-[0.08em] lowercase" htmlFor="name">name</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            className="bg-white border border-[#cbd5e1] rounded-lg py-[0.7rem] px-[0.9rem] font-mono text-[0.88rem] text-[#111827] outline-none transition-colors duration-200 placeholder-[#9ca3af] focus:border-[#111827]"
                            placeholder="your name"
                            value={formData.name}
                            onChange={handleChange}
                            autoComplete="name"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="font-mono text-[0.7rem] text-[#6b7280] tracking-[0.08em] lowercase" htmlFor="email">email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className="bg-white border border-[#cbd5e1] rounded-lg py-[0.7rem] px-[0.9rem] font-mono text-[0.88rem] text-[#111827] outline-none transition-colors duration-200 placeholder-[#9ca3af] focus:border-[#111827]"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="font-mono text-[0.7rem] text-[#6b7280] tracking-[0.08em] lowercase" htmlFor="password">password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="bg-white border border-[#cbd5e1] rounded-lg py-[0.7rem] px-[0.9rem] font-mono text-[0.88rem] text-[#111827] outline-none transition-colors duration-200 placeholder-[#9ca3af] focus:border-[#111827]"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            autoComplete="new-password"
                            required
                        />
                    </div>

                    {error && (
                        <div className="font-mono text-[0.78rem] text-[#e05c5c] bg-[#e05c5c]/10 border border-[#e05c5c]/20 rounded-lg py-2.5 px-3.5" role="alert">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full py-3 bg-[#111827] text-white font-mono text-[0.85rem] font-semibold tracking-[0.05em] rounded-lg transition-all duration-200 mt-1 hover:enabled:bg-[#1f2937] hover:enabled:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        disabled={loading}
                    >
                        {loading ? "creating account..." : "create account"}
                    </button>
                </form>

                <p className="text-center text-[0.83rem] text-[#6b7280]">
                    Already have an account?{" "}
                    <Link to="/login" className="text-[#111827] hover:text-[#1f2937] transition-colors duration-200">
                        sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}