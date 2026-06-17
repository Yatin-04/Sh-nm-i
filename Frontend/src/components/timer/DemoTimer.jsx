import { useState, useEffect, useRef } from "react";

// A self-contained mini pomodoro timer for the landing page hero.
// No auth required — purely local state.

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

const DEMO_DURATION = 25 * 60; // 25 minutes

export default function DemoTimer() {
    const [remaining, setRemaining] = useState(DEMO_DURATION);
    const [running, setRunning] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (running && remaining > 0) {
            intervalRef.current = setInterval(() => {
                setRemaining((r) => {
                    if (r <= 1) {
                        clearInterval(intervalRef.current);
                        setRunning(false);
                        return 0;
                    }
                    return r - 1;
                });
            }, 1000);
        }
        return () => clearInterval(intervalRef.current);
    }, [running, remaining]);

    const handleStartPause = () => {
        if (remaining === 0) {
            // Reset
            setRemaining(DEMO_DURATION);
            setRunning(false);
            return;
        }
        setRunning((r) => !r);
    };

    const handleReset = () => {
        clearInterval(intervalRef.current);
        setRemaining(DEMO_DURATION);
        setRunning(false);
    };

    const progress = remaining / DEMO_DURATION;
    const SIZE = 220;
    const STROKE = 5;
    const RADIUS = (SIZE - STROKE * 2) / 2;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
    const dashOffset = CIRCUMFERENCE * (1 - progress);

    const modeLabel = remaining === 0 ? "Done" : running ? "Focus" : "Ready";

    return (
        <div className="flex flex-col items-center gap-5">
            {/* Ring */}
            <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
                <svg
                    width={SIZE}
                    height={SIZE}
                    viewBox={`0 0 ${SIZE} ${SIZE}`}
                    style={{ transform: "rotate(-90deg)", position: "absolute" }}
                >
                    <circle
                        cx={SIZE / 2}
                        cy={SIZE / 2}
                        r={RADIUS}
                        fill="none"
                        stroke="rgba(0,0,0,0.06)"
                        strokeWidth={STROKE}
                    />
                    <circle
                        cx={SIZE / 2}
                        cy={SIZE / 2}
                        r={RADIUS}
                        fill="none"
                        stroke="#1a1a1a"
                        strokeWidth={STROKE}
                        strokeDasharray={CIRCUMFERENCE}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 0.9s linear" }}
                    />
                </svg>

                <div className="relative z-10 flex flex-col items-center justify-center">
                    <span className="text-4xl font-medium text-[#1a1a1a] select-none" style={{ letterSpacing: "-1px" }}>
                        {formatTime(remaining)}
                    </span>
                    <span className="text-xs text-[#1a1a1a]/40 uppercase tracking-[0.2em] mt-1 select-none">
                        {modeLabel}
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handleStartPause}
                    className="px-5 py-2 bg-[#1a1a1a] text-white text-sm rounded-full hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                >
                    {remaining === 0 ? "Reset" : running ? "Pause" : "Start"}
                </button>
                {(running || remaining < DEMO_DURATION) && remaining > 0 && (
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 text-[#1a1a1a]/50 text-sm hover:text-[#1a1a1a] transition-colors cursor-pointer"
                    >
                        Reset
                    </button>
                )}
            </div>

            <p className="text-[10px] text-[#1a1a1a]/30 text-center">
                Try it — no account needed
            </p>
        </div>
    );
}
