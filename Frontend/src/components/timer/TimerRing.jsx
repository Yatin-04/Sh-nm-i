// TimerRing.jsx
// Props:
//   remaining   - seconds remaining
//   total       - total seconds for current interval
//   mode        - "focus" | "break" | "paused_focus" | "paused_break" | "idle"
//   theme       - current theme object from Redux

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

export default function TimerRing({ remaining, total, mode, theme }) {
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

    // Track: idle uses theme, active uses subtle white
    const trackColor = isActive ? "#ffffff0d" : theme?.ring_fill || "rgba(0,0,0,0.1)";

    // Progress arc: idle uses theme, active uses red/blue
    const ringColor = isIdle
        ? (theme?.ring_stroke || "#000")
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

    // Inner circle adapts to context and theme
    const innerBgStyle = isIdle && theme 
        ? { backgroundColor: theme.surface_raised } 
        : { backgroundColor: isActive ? "#0d0d0f" : "rgba(255,255,255,0.2)" };

    const textColorStyle = isIdle && theme
        ? { color: theme.text_primary }
        : { color: isActive ? "#ffffff" : "#000000" };

    const subColorStyle = isIdle && theme
        ? { color: theme.text_secondary }
        : { color: isActive ? "#9CA3AF" : "#4b5563" };

    const borderStyle = isIdle && theme
        ? `1px solid ${theme.border}`
        : (isActive ? "none" : "1px solid rgba(0,0,0,0.15)");

    const shadowClass = isActive ? "shadow-2xl" : "shadow-xl";

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
                    style={{ transition: "stroke 0.4s ease" }}
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
                        transition: isIdle ? "stroke 0.4s ease" : "stroke-dashoffset 0.9s linear, stroke 0.4s ease",
                    }}
                />
            </svg>

            <div
                className={`relative z-10 rounded-full flex flex-col items-center justify-center ${shadowClass}`}
                style={{ 
                    width: SIZE - STROKE * 2 - 16, 
                    height: SIZE - STROKE * 2 - 16,
                    ...innerBgStyle,
                    border: borderStyle,
                    transition: "background-color 0.4s ease, border-color 0.4s ease"
                }}
            >
                <span
                    className="leading-none select-none transition-colors duration-400"
                    style={{ 
                        fontSize: "52px", 
                        fontWeight: 500, 
                        letterSpacing: "-2px",
                        ...textColorStyle
                    }}
                >
                    {formatTime(remaining)}
                </span>
                <span
                    className="text-xs tracking-[0.2em] uppercase mt-2 select-none transition-colors duration-400"
                    style={subColorStyle}
                >
                    {modeLabel}
                </span>
            </div>
        </div>
    );
}