import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sessionStarted, configUpdated } from "../slices/timerSlice";
import { startSession } from "../services/Operations/sessionAPI";
import SideNav from "../components/layout/SideNav";
import TimerRing from "../components/timer/TimerRing";
import TimerConfig from "../components/timer/TimerConfig";
import SessionActive from "../components/timer/SessionActive";
import SpotifyPanel from "../components/spotify/SpotifyPanel";

const SettingsIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

export default function Dashboard() {
    const dispatch = useDispatch();
    const { mode, focusDuration, breakDuration, remainingSeconds } = useSelector(
        (state) => state.timer
    );

    const [showConfig, setShowConfig] = useState(false);
    const [launching, setLaunching] = useState(false);
    const [launchError, setLaunchError] = useState(null);

    const isIdle = mode === "idle";

    // Called from TimerConfig when user confirms settings and hits "start session"
    const handleLaunch = async ({ focusDuration: fd, breakDuration: bd, subjectId, subjectName }) => {
        setShowConfig(false);
        setLaunching(true);
        setLaunchError(null);

        // Update config in store immediately for ring preview
        dispatch(configUpdated({ focusDuration: fd, breakDuration: bd }));

        try {
            const response = await startSession({
                subjectId,
                sessionType: "focus",
                plannedDuration: fd,
            });

            dispatch(
                sessionStarted({
                    sessionId: response.session.session_id,
                    subjectId,
                    subjectName,
                    focusDuration: fd,
                    breakDuration: bd,
                })
            );
        } catch (err) {
            setLaunchError(
                err?.data?.error || "Couldn't start session. Check your connection."
            );
        } finally {
            setLaunching(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0d0d0f] flex">
            {/* ── Left: Side navigation ────────────────────── */}
            <SideNav />

            {/* ── Main content (offset for sidebar) ────────── */}
            <div className="flex-1 ml-16 flex">

                {/* ── Center: Timer area ──────────────────────── */}
                <main className="flex-1 flex flex-col items-center justify-center relative">

                    {/* Active session overlays the center panel */}
                    {!isIdle && <SessionActive />}

                    {/* Idle state */}
                    {isIdle && (
                        <div className="flex flex-col items-center gap-6">

                            {/* Customize link */}
                            <button
                                onClick={() => setShowConfig(true)}
                                className="flex items-center gap-1.5 font-mono text-xs text-white/25 hover:text-white/50 transition-colors tracking-widest uppercase"
                            >
                                <SettingsIcon />
                                {Math.floor(focusDuration / 60)}m focus · {Math.floor(breakDuration / 60)}m break
                            </button>

                            {/* Idle ring — static preview */}
                            <TimerRing
                                remaining={focusDuration}
                                total={focusDuration}
                                mode="idle"
                            />

                            {/* Start session button */}
                            <button
                                onClick={() => setShowConfig(true)}
                                disabled={launching}
                                className="
                                    mt-4 px-10 py-3.5 bg-white text-black font-mono text-sm tracking-wide
                                    rounded-full hover:bg-white/90 active:scale-95 transition-all duration-150
                                    disabled:opacity-50 shadow-lg shadow-white/5
                                "
                            >
                                {launching ? "starting..." : "start session"}
                            </button>

                            {launchError && (
                                <p className="font-mono text-xs text-red-400 mt-2">{launchError}</p>
                            )}
                        </div>
                    )}
                </main>

                {/* ── Right: Music panel (visible only when idle) ── */}
                {isIdle && (
                    <aside className="w-72 border-l border-white/5 p-6 flex flex-col justify-end">
                        <SpotifyPanel />
                    </aside>
                )}
            </div>

            {/* ── Config modal ──────────────────────────────── */}
            {showConfig && (
                <TimerConfig
                    focusDuration={focusDuration}
                    breakDuration={breakDuration}
                    onSave={handleLaunch}
                    onClose={() => setShowConfig(false)}
                />
            )}
        </div>
    );
}
