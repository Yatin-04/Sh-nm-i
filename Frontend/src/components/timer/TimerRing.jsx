// TimerRing.jsx
// Props:
//   remaining   - seconds remaining
//   total       - total seconds for current interval
//   mode        - "focus" | "break" | "paused_focus" | "paused_break" | "idle"

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

export default function TimerRing({ remaining, total, mode }) {
    const SIZE = 280;
    const STROKE = 6;
    const RADIUS = (SIZE - STROKE * 2) / 2;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

    // Progress: fraction of interval elapsed (0 → full ring, 1 → empty ring)
    const progress = total > 0 ? remaining / total : 1;
    const dashOffset = CIRCUMFERENCE * (1 - progress);

    // Color per mode
    const isBreak = mode === "break" || mode === "paused_break";
    const isIdle = mode === "idle";
    const isPaused = mode === "paused_focus" || mode === "paused_break";

    const ringColor = isIdle
        ? "#ffffff22"
        : isBreak
        ? "#60a5fa"   // blue for break
        : "#ef4444";  // red for focus

    const modeLabel = isIdle
        ? "ready"
        : isPaused
        ? "paused"
        : isBreak
        ? "break"
        : "focus";

    return (
        <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
            {/* SVG ring */}
            <svg
                width={SIZE}
                height={SIZE}
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                style={{ transform: "rotate(-90deg)", position: "absolute" }}
            >
                {/* Track */}
                <circle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    fill="none"
                    stroke="#ffffff0d"
                    strokeWidth={STROKE}
                />
                {/* Progress arc */}
                <circle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth={STROKE}
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    style={{
                        transition: isIdle ? "none" : "stroke-dashoffset 0.9s linear, stroke 0.4s ease",
                    }}
                />
            </svg>

            {/* Inner white circle */}
            <div
                className="relative z-10 rounded-full bg-white flex flex-col items-center justify-center shadow-2xl"
                style={{ width: SIZE - STROKE * 2 - 16, height: SIZE - STROKE * 2 - 16 }}
            >
                <span
                    className="text-black font-mono leading-none select-none"
                    style={{ fontSize: "52px", fontWeight: 500, letterSpacing: "-2px" }}
                >
                    {formatTime(remaining)}
                </span>
                <span
                    className="text-black/30 font-mono text-xs tracking-[0.2em] uppercase mt-2 select-none"
                >
                    {modeLabel}
                </span>
            </div>
        </div>
    );
}
