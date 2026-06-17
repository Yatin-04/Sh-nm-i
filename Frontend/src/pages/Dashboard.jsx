import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { sessionStarted, configUpdated } from "../slices/timerSlice";
import { clearAuth } from "../slices/authSlice";
import { startSession } from "../services/Operations/sessionAPI";
import { logout } from "../services/Operations/authAPI";
import { THEMES } from "../components/spotify/themes";
import SideNav from "../components/layout/SideNav";
import TimerRing from "../components/timer/TimerRing";
import TimerConfig from "../components/timer/TimerConfig";
import SessionActive from "../components/timer/SessionActive";
import MusicPanel from "../components/spotify/MusicPanel";
import MiniPlayer from "../components/spotify/MiniPlayer";

const ChevronLeft = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

export default function Dashboard() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { mode, focusDuration, breakDuration } = useSelector((state) => state.timer);
    const user = useSelector((state) => state.auth.user);

    const [showConfig, setShowConfig] = useState(false);
    const [launching, setLaunching] = useState(false);
    const [launchError, setLaunchError] = useState(null);
    const [rightPanel, setRightPanel] = useState("collapsed");
    const [activeTheme, setActiveTheme] = useState(THEMES[0]);

    const isIdle = mode === "idle";

    const handleLaunch = async ({ focusDuration: fd, breakDuration: bd, subjectId, subjectName }) => {
        setShowConfig(false);
        setLaunching(true);
        setLaunchError(null);

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

    const handleLogout = async () => {
        try {
            await logout();
        } catch { /* ignore */ }
        dispatch(clearAuth());
        navigate("/");
    };

    return (
        <div
            className={`min-h-screen flex transition-all duration-1000 ease-in-out cursor-default ${
                isIdle
                    ? "bg-gradient-to-b from-[#9b8ec4] via-[#d4a0b0] to-[#f4a068]"
                    : "bg-[#0d0d0f]"
            }`}
        >
            <SideNav userName={user?.name} onLogout={handleLogout} darkMode={!isIdle} />

            <div className="flex-1 ml-16 flex">
                <main className="flex-1 flex flex-col items-center justify-center relative">

                    {/* Active Session (fades in) */}
                    <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-700 ease-in-out ${
                        isIdle ? "opacity-0 pointer-events-none" : "opacity-100"
                    }`}>
                        {!isIdle && <SessionActive />}
                    </div>

                    {/* Idle State (fades out) */}
                    <div className={`flex flex-col items-center gap-6 transition-all duration-700 ease-in-out ${
                        isIdle ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                    }`}>
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-[#2D1B4E] mb-2">
                                Ready to Focus{user ? `, ${user.name.split(" ")[0]}` : ""}?
                            </h1>
                            <p className="text-[#4A3B69] text-sm">
                                Configure your session and get in the zone.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowConfig(true)}
                            className="flex items-center gap-2 text-xs text-[#4A3B69] hover:text-[#2D1B4E] transition-colors tracking-wide cursor-pointer"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                            {Math.floor(focusDuration / 60)}m Focus · {Math.floor(breakDuration / 60)}m Break
                        </button>

                        <TimerRing
                            remaining={focusDuration}
                            total={focusDuration}
                            mode="idle"
                        />

                        <button
                            onClick={() => setShowConfig(true)}
                            disabled={launching}
                            className="px-10 py-3.5 bg-[#2D1B4E] text-white text-sm tracking-wide rounded-full hover:bg-[#3d2866] active:scale-95 transition-all duration-150 disabled:opacity-50 shadow-lg shadow-[#2D1B4E]/30 cursor-pointer"
                        >
                            {launching ? "Starting..." : "Start Session"}
                        </button>

                        {launchError && (
                            <p className="text-xs text-red-600">{launchError}</p>
                        )}
                    </div>
                </main>

                {/* Right Panel (slides away during session) */}
                <aside
                    className={`border-l border-[#2D1B4E]/10 flex flex-col transition-all duration-700 ease-in-out overflow-hidden ${
                        isIdle
                            ? rightPanel === "collapsed" ? "w-60 opacity-100" : "w-[360px] opacity-100"
                            : "w-0 opacity-0 border-l-transparent"
                    }`}
                >
                    {/* Collapsed: two pills */}
                    {rightPanel === "collapsed" && (
                        <div className="flex flex-col gap-3 p-5 justify-center h-full">
                            <button
                                onClick={() => setRightPanel("music")}
                                className="w-full text-left px-4 py-4 rounded-xl bg-black/15 backdrop-blur-sm border border-[#2D1B4E]/10 hover:border-[#2D1B4E]/25 hover:bg-black/20 transition-all duration-150 cursor-pointer"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-base">🎵</span>
                                    <span className="text-sm text-[#2D1B4E] font-medium">Music</span>
                                </div>
                                <p className="text-[11px] text-[#4A3B69] pl-6">
                                    {activeTheme.label} is calling…
                                </p>
                            </button>

                            <button
                                onClick={() => setRightPanel("todo")}
                                className="w-full text-left px-4 py-4 rounded-xl bg-black/15 backdrop-blur-sm border border-[#2D1B4E]/10 hover:border-[#2D1B4E]/25 hover:bg-black/20 transition-all duration-150 cursor-pointer"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-base">✓</span>
                                    <span className="text-sm text-[#2D1B4E] font-medium">Todo</span>
                                </div>
                                <p className="text-[11px] text-[#4A3B69] pl-6">
                                    Quiet for now
                                </p>
                            </button>
                        </div>
                    )}

                    {/* Expanded: Music */}
                    {rightPanel === "music" && (
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b border-[#2D1B4E]/10">
                                <button
                                    onClick={() => setRightPanel("collapsed")}
                                    className="flex items-center gap-1 text-xs text-[#4A3B69] hover:text-[#2D1B4E] transition-colors cursor-pointer"
                                >
                                    <ChevronLeft />
                                    Collapse
                                </button>
                            </div>

                            <div className="flex-1 p-5 overflow-y-auto">
                                <MusicPanel
                                    activeTheme={activeTheme}
                                    onThemeChange={setActiveTheme}
                                />
                            </div>

                            <button
                                onClick={() => setRightPanel("todo")}
                                className="border-t border-[#2D1B4E]/10 px-5 py-3 flex items-center gap-2 text-[#4A3B69] hover:text-[#2D1B4E] hover:bg-black/5 transition-all cursor-pointer"
                            >
                                <span className="text-sm">✓</span>
                                <span className="text-xs">Todo</span>
                            </button>
                        </div>
                    )}

                    {/* Expanded: Todo */}
                    {rightPanel === "todo" && (
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b border-[#2D1B4E]/10">
                                <button
                                    onClick={() => setRightPanel("collapsed")}
                                    className="flex items-center gap-1 text-xs text-[#4A3B69] hover:text-[#2D1B4E] transition-colors cursor-pointer"
                                >
                                    <ChevronLeft />
                                    Collapse
                                </button>
                            </div>

                            <div className="flex-1 p-5 flex flex-col items-center justify-center">
                                <div className="text-center">
                                    <p className="text-xs text-[#2D1B4E] uppercase tracking-widest mb-3 font-medium">
                                        Todo
                                    </p>
                                    <div className="w-48 h-32 rounded-xl bg-black/5 border border-dashed border-[#2D1B4E]/20 flex items-center justify-center">
                                        <p className="text-xs text-[#4A3B69]">Coming soon</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setRightPanel("music")}
                                className="border-t border-[#2D1B4E]/10 px-5 py-3 flex items-center gap-2 text-[#4A3B69] hover:text-[#2D1B4E] hover:bg-black/5 transition-all cursor-pointer"
                            >
                                <span className="text-sm">🎵</span>
                                <span className="text-xs">Music</span>
                            </button>
                        </div>
                    )}
                </aside>
            </div>

            <MiniPlayer activeTheme={activeTheme} visible={!isIdle} />

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
