import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    tick,
    focusEnded,
    breakEnded,
    paused,
    resumed,
    sessionStopped,
} from "../../slices/timerSlice";
import { endSession } from "../../services/Operations/sessionAPI";
import TimerRing from "./TimerRing";
import TimerControls from "./TimerControls";
import SpotifyPanel from "../spotify/SpotifyPanel";

export default function SessionActive() {
    const dispatch = useDispatch();
    const {
        mode,
        remainingSeconds,
        focusDuration,
        breakDuration,
        sessionId,
        subjectName,
        elapsedFocusSeconds,
    } = useSelector((state) => state.timer);

    const intervalRef = useRef(null);
    const [stopping, setStopping] = useState(false);
    const [confirmStop, setConfirmStop] = useState(false);

    // Determine total for the ring based on current interval type
    const total = (mode === "break" || mode === "paused_break") ? breakDuration : focusDuration;

    // ── Tick interval ─────────────────────────────────────────────────────
    useEffect(() => {
        const running = mode === "focus" || mode === "break";

        if (running) {
            intervalRef.current = setInterval(() => {
                dispatch(tick());
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }

        return () => clearInterval(intervalRef.current);
    }, [mode, dispatch]);

    // ── Natural interval end ───────────────────────────────────────────────
    useEffect(() => {
        if (remainingSeconds === 0) {
            if (mode === "focus") {
                dispatch(focusEnded());
            } else if (mode === "break") {
                dispatch(breakEnded());
            }
        }
    }, [remainingSeconds, mode, dispatch]);

    // ── Handlers ──────────────────────────────────────────────────────────
    const handlePlayPause = () => {
        if (mode === "focus" || mode === "break") {
            dispatch(paused());
        } else {
            dispatch(resumed());
        }
    };

    const handleStop = () => {
        setConfirmStop(true);
    };

    const handleConfirmStop = async () => {
        setStopping(true);
        try {
            await endSession({
                sessionId,
                actualDuration: elapsedFocusSeconds,
            });
        } catch (err) {
            console.error("Failed to record session:", err);
            // Still reset — don't trap user in session on API failure
        } finally {
            dispatch(sessionStopped());
            setStopping(false);
            setConfirmStop(false);
        }
    };

    const handleCancelStop = () => setConfirmStop(false);

    // Format elapsed for display in the confirm dialog
    const elapsedMin = Math.floor(elapsedFocusSeconds / 60);
    const elapsedSec = elapsedFocusSeconds % 60;
    const elapsedLabel = elapsedMin > 0
        ? `${elapsedMin}m ${elapsedSec}s`
        : `${elapsedSec}s`;

    return (
        // Dark blurred overlay — fills the center panel only (relative to parent)
        <div className="absolute inset-0 z-30 flex backdrop-blur-sm bg-black/60 rounded-2xl overflow-hidden">

            {/* ── Center: timer ─────────────────────────────── */}
            <div className="flex-1 flex flex-col items-center justify-center gap-0">
                {/* Subject label */}
                <p className="font-mono text-xs text-white/30 uppercase tracking-widest mb-6">
                    {subjectName}
                </p>

                <TimerRing
                    remaining={remainingSeconds}
                    total={total}
                    mode={mode}
                />

                <TimerControls
                    mode={mode}
                    onPlayPause={handlePlayPause}
                    onStop={handleStop}
                />

                {/* Elapsed focus time indicator */}
                <p className="font-mono text-xs text-white/20 mt-6 tracking-wide">
                    {elapsedMin}:{elapsedSec.toString().padStart(2, "0")} focused
                </p>
            </div>

            {/* ── Right: Spotify panel ──────────────────────── */}
            <div className="w-64 border-l border-white/5 p-5 flex flex-col justify-end">
                <SpotifyPanel />
            </div>

            {/* ── Confirm stop dialog ───────────────────────── */}
            {confirmStop && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-2xl">
                    <div className="bg-[#141417] border border-white/10 rounded-2xl p-7 w-80 shadow-2xl">
                        <h3 className="text-white font-mono text-base mb-2">end session?</h3>
                        <p className="text-white/40 font-mono text-sm mb-6">
                            {elapsedFocusSeconds > 0
                                ? `This will log ${elapsedLabel} of focus time.`
                                : "No focus time recorded yet."}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelStop}
                                className="flex-1 py-2.5 border border-white/10 text-white/50 hover:text-white/80 font-mono text-sm rounded-lg transition-colors"
                            >
                                keep going
                            </button>
                            <button
                                onClick={handleConfirmStop}
                                disabled={stopping}
                                className="flex-1 py-2.5 bg-red-500/80 hover:bg-red-500 disabled:opacity-50 text-white font-mono text-sm rounded-lg transition-colors"
                            >
                                {stopping ? "saving..." : "end & save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
