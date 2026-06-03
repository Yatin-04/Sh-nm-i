import { Link } from "react-router-dom";
import "./css/Home.css";

const FEATURES = [
    {
        tag: "01 / focus",
        title: "Pomodoro Timer",
        desc: "Session-based deep work. Lock in, block out, get it done.",
    },
    {
        tag: "02 / track",
        title: "Subject Analytics",
        desc: "See exactly where your hours go — by subject, by day, by week.",
    },
    {
        tag: "03 / commit",
        title: "Accountability",
        desc: "Share your progress. Stay honest. Show up consistently.",
    },
];

export default function Home() {
    return (
        <main className="home">
            {/* Hero */}
            <section className="hero">
                <div className="hero-eyebrow">
                    <span className="mono-tag">focus / track / commit</span>
                </div>

                <h1 className="hero-title">
                    Your time,<br />
                    <span className="hero-accent">accounted for.</span>
                </h1>

                <p className="hero-sub">
                    A pomodoro timer that doesn't let you lie to yourself.
                    Track subjects, measure output, and stay accountable —
                    every session, every day.
                </p>

                <div className="hero-actions">
                    <Link to="/register" className="btn-primary">
                        start tracking
                    </Link>
                    <Link to="/login" className="btn-ghost">
                        sign in →
                    </Link>
                </div>

                {/* Decorative timer ring */}
                <div className="hero-ring" aria-hidden="true">
                    <svg viewBox="0 0 200 200" className="ring-svg">
                        <circle cx="100" cy="100" r="88" className="ring-track" />
                        <circle cx="100" cy="100" r="88" className="ring-progress" />
                    </svg>
                    <div className="ring-label">
                        <span className="ring-time">25:00</span>
                        <span className="ring-status">ready</span>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="features">
                {FEATURES.map((f) => (
                    <div className="feature-card" key={f.tag}>
                        <span className="feature-tag">{f.tag}</span>
                        <h3 className="feature-title">{f.title}</h3>
                        <p className="feature-desc">{f.desc}</p>
                    </div>
                ))}
            </section>

            {/* CTA strip */}
            <section className="cta-strip">
                <p className="cta-text">Ready to stop guessing where your time goes?</p>
                <Link to="/register" className="btn-primary">
                    create free account
                </Link>
            </section>
        </main>
    );
}