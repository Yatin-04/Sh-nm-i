const PlayIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
);

const PauseIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
);

const StopIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
);

export default function TimerControls({ mode, onPlayPause, onStop }) {
    const isRunning = mode === "focus" || mode === "break";

    return (
        <div className="flex items-center gap-6 mt-10">
            <button
                onClick={onPlayPause}
                title={isRunning ? "Pause" : "Resume"}
                className="w-14 h-14 rounded-full flex items-center justify-center bg-[#22c55e] text-white transition-all duration-150 active:scale-95 cursor-pointer hover:brightness-115"
                style={{ boxShadow: "0 4px 12px rgba(34, 197, 94, 0.4)" }}
                onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.15)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(34, 197, 94, 0.5)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = ""; e.currentTarget.style.boxShadow = "0 4px 12px rgba(34, 197, 94, 0.4)"; }}
            >
                {isRunning ? <PauseIcon /> : <PlayIcon />}
            </button>

            <button
                onClick={onStop}
                title="Stop and record session"
                className="w-14 h-14 rounded-full flex items-center justify-center bg-[#ef4444] text-white transition-all duration-150 active:scale-95 cursor-pointer"
                style={{ boxShadow: "0 4px 12px rgba(239, 68, 68, 0.4)" }}
                onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.15)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(239, 68, 68, 0.5)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.filter = ""; e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.4)"; }}
            >
                <StopIcon />
            </button>
        </div>
    );
}
