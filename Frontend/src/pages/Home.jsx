import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import DemoTimer from "../components/timer/DemoTimer";
import { useSelector } from "react-redux";

import { FiClock, FiBarChart2, FiCpu, FiCalendar, FiBookOpen, FiCheckSquare } from "react-icons/fi";

// Feature icons as inline SVGs
const ClockIcon = () => <FiClock size={26} className="stroke-[1.5]" />;
const ChartIcon = () => <FiBarChart2 size={26} className="stroke-[1.5]" />;
const BotIcon = () => <FiCpu size={26} className="stroke-[1.5]" />;
const CalendarIcon = () => <FiCalendar size={26} className="stroke-[1.5]" />;

const FEATURES = [
    {
        tag: "01",
        title: "AI Study Buddy & Document Preview",
        desc: "Upload PDFs and notes. Split-screen reader with an embedded AI that queries your exact document chunks and searches the web seamlessly.",
        icon: <BotIcon />,
    },
    {
        tag: "02",
        title: "8-Day Heatmap Todo Manager",
        desc: "Visualize your recent 7-day productivity heatmap alongside upcoming day planning. Dedicated action permissions for today and tomorrow.",
        icon: <CalendarIcon />,
    },
    {
        tag: "03",
        title: "Subject-Based Pomodoro Timer",
        desc: "Lock in deep work sessions tied to your subjects. Keep focus strict and eliminate study session guesswork.",
        icon: <ClockIcon />,
    },
    {
        tag: "04",
        title: "Deep Analytics & Timelines",
        desc: "Track daily timelines, current streaks, and subject distribution charts to understand exactly where your hours go.",
        icon: <ChartIcon />,
    },
];

export default function Home() {
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* ── Hero Section (Two-column) ────────────────────── */}
            <section className="max-w-6xl mx-auto px-6 py-16 lg:py-20 flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
                {/* Left column: copy + CTAs */}
                <div className="flex-1 max-w-xl">
                    <p className="text-xs uppercase tracking-[0.15em] text-[#1a1a1a]/40 mb-4 font-medium">
                        focus / notes / AI / analytics
                    </p>

                    <h1 className="text-5xl lg:text-6xl font-extrabold text-[#1a1a1a] leading-[1.05] tracking-tight mb-6">
                        Study smarter,<br />
                        <span className="text-[#1a1a1a]">accounted for.</span>
                    </h1>

                    <p className="text-base text-[#1a1a1a]/55 leading-relaxed mb-8 max-w-md">
                        An all-in-one study platform combining subject-based Pomodoro timers, an AI Study Buddy that queries your documents, and an 8-day heatmap todo manager.
                    </p>

                    <div className="flex items-center gap-6">
                        {isAuthenticated ? (
                            <Link
                                to="/dashboard"
                                className="px-6 py-3 bg-[#1a1a1a] text-white text-sm font-medium rounded-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shadow-sm"
                            >
                                Go to Dashboard →
                            </Link>
                        ) : (
                            <div className="flex items-center gap-6">
                                <Link
                                    to="/register"
                                    className="px-6 py-3 bg-[#1a1a1a] text-white text-sm font-medium rounded-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shadow-sm"
                                >
                                    Get Started Free
                                </Link>
                                <Link
                                    to="/login"
                                    className="text-sm font-semibold text-[#1a1a1a]/70 hover:text-[#1a1a1a] transition-colors cursor-pointer border-b border-transparent hover:border-[#1a1a1a]/30"
                                >
                                    Sign In →
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right column: live demo timer */}
                <div className="flex-shrink-0">
                    <DemoTimer />
                </div>
            </section>

            {/* ── Feature Highlights Grid ─────────────────────────── */}
            <section className="max-w-6xl mx-auto px-6 pb-20">
                <div className="mb-10 text-center lg:text-left">
                    <h2 className="text-2xl font-bold text-[#1a1a1a]">Everything you need to master your subjects</h2>
                    <p className="text-sm text-[#1a1a1a]/50 mt-1">Built for structured learning, deep focus, and continuous accountability.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {FEATURES.map((f) => (
                        <div
                            key={f.tag}
                            className="bg-[#F9F9F9] border border-[#EAEAEA] rounded-xl p-7 flex flex-col gap-3 hover:border-[#1a1a1a]/20 transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <div className="text-[#1a1a1a]/80 p-2.5 bg-white rounded-lg border border-[#EAEAEA] shadow-xs">
                                    {f.icon}
                                </div>
                                <span className="text-[11px] font-mono tracking-widest text-[#1a1a1a]/35">
                                    {f.tag}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-[#1a1a1a] mt-2">
                                {f.title}
                            </h3>

                            <p className="text-sm text-[#1a1a1a]/60 leading-relaxed">
                                {f.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Spotlight Section: AI & Heatmap ───────────────── */}
            <section className="max-w-6xl mx-auto px-6 pb-20">
                <div className="bg-[#1a1a1a] text-white rounded-2xl p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
                    <div className="max-w-xl">
                        <span className="text-[11px] font-mono uppercase tracking-widest text-white/50">NEW FEATURE</span>
                        <h2 className="text-3xl font-extrabold mt-2 mb-4 leading-tight">
                            Meet your AI Study Buddy & 8-Day Heatmap
                        </h2>
                        <p className="text-sm text-white/70 leading-relaxed">
                            Preview documents side-by-side with an intelligent agent that reads your exact file content, retains document chat history, and searches the web when needed. Keep your daily tasks organized with an 8-day heatmap navigator.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full lg:w-auto">
                        <Link
                            to={isAuthenticated ? "/dashboard" : "/register"}
                            className="px-6 py-3.5 bg-white text-[#1a1a1a] text-sm font-semibold rounded-xl text-center hover:bg-gray-100 transition cursor-pointer shadow-sm"
                        >
                            Try It Out Now
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Bottom CTA ───────────────────────────────────── */}
            <section className="max-w-6xl mx-auto px-6 pb-20">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-[#EAEAEA] pt-10">
                    <p className="text-sm text-[#1a1a1a]/50">
                        Ready to level up your study sessions and stay accountable?
                    </p>
                    <Link
                        to={isAuthenticated ? "/dashboard" : "/register"}
                        className="px-6 py-3 bg-[#1a1a1a] text-white text-sm font-medium rounded-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shadow-sm"
                    >
                        {isAuthenticated ? "Go to Dashboard" : "Create Free Account"}
                    </Link>
                </div>
            </section>
        </div>
    );
}
