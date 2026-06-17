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

    const progress = total > 0 ? remaining / total : 1;
    const dashOffset = CIRCUMFERENCE * (1 - progress);

    const isBreak = mode === "break" || mode === "paused_break";
    const isIdle = mode === "idle";
    const isPaused = mode === "paused_focus" || mode === "paused_break";
    const isActive = !isIdle;

    // Track: idle = rgba(45,27,78,0.2), active = subtle white
    const trackColor = isActive ? "#ffffff0d" : "rgba(45, 27, 78, 0.2)";

    // Progress arc: idle = solid #2D1B4E, active = red/blue
    const ringColor = isIdle
        ? "#2D1B4E"
        : isBreak
        ? "#60a5fa"
        : "#ef4444";

    const modeLabel = isIdle
        ? "Ready"
        : isPaused
        ? "Paused"
        : isBreak
        ? "Break"
        : "Focus";

    // Inner circle adapts to context
    const innerBg = isActive ? "bg-[#0d0d0f]" : "bg-white/20 backdrop-blur-xl";
    const textColor = isActive ? "text-white" : "text-[#2D1B4E]";
    const subColor = isActive ? "text-[#9CA3AF]" : "text-[#4A3B69]";
    const borderStyle = isActive ? "" : "border border-[#2D1B4E]/15";
    const shadowStyle = "shadow-2xl";

    return (
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
                    stroke={trackColor}
                    strokeWidth={STROKE}
                />
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

            <div
                className={`relative z-10 rounded-full ${innerBg} ${borderStyle} ${shadowStyle} flex flex-col items-center justify-center`}
                style={{ width: SIZE - STROKE * 2 - 16, height: SIZE - STROKE * 2 - 16 }}
            >
                <span
                    className={`${textColor} leading-none select-none`}
                    style={{ fontSize: "52px", fontWeight: 500, letterSpacing: "-2px" }}
                >
                    {formatTime(remaining)}
                </span>
                <span
                    className={`${subColor} text-xs tracking-[0.2em] uppercase mt-2 select-none`}
                >
                    {modeLabel}
                </span>
            </div>
        </div>
    );
}
