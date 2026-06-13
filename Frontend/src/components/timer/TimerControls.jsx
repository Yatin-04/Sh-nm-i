// TimerControls.jsx
// Props:
//   mode        - current timer mode
//   onPlayPause - toggle pause/resume
//   onStop      - stop and record session

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
    const isPaused = mode === "paused_focus" || mode === "paused_break";

    return (
        <div className="flex items-center gap-6 mt-10">
            {/* Play / Pause */}
            <button
                onClick={onPlayPause}
                title={isRunning ? "Pause" : "Resume"}
                className={`
                    w-14 h-14 rounded-full flex items-center justify-center
                    transition-all duration-150 shadow-lg active:scale-95
                    ${isRunning
                        ? "bg-[#22c55e] hover:bg-[#16a34a] text-white"
                        : "bg-[#22c55e]/80 hover:bg-[#22c55e] text-white"
                    }
                `}
            >
                {isRunning ? <PauseIcon /> : <PlayIcon />}
            </button>

            {/* Stop / Record */}
            <button
                onClick={onStop}
                title="Stop and record session"
                className="w-14 h-14 rounded-full flex items-center justify-center bg-[#ef4444] hover:bg-[#dc2626] text-white transition-all duration-150 shadow-lg active:scale-95"
            >
                <StopIcon />
            </button>
        </div>
    );
}
