import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    tick,
    focusEnded,
    breakEnded,
    paused,
    resumed,
    phaseStarted,
    sessionStopped,
} from "../../slices/timerSlice";
import { startSession, endSession } from "../../services/Operations/sessionAPI";
import TimerRing from "./TimerRing";
import TimerControls from "./TimerControls";

// ── Notification helpers ──────────────────────────────────────────────────

function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
}

function showNotification(title, body, onDismiss) {
    if ("Notification" in window && Notification.permission === "granted") {
        const n = new Notification(title, {
            body,
            icon: "/favicon.svg",
            requireInteraction: true,
            silent: true,
        });
        n.onclick = () => {
            onDismiss();
            n.close();
            window.focus();
        };
    }
}

// ── Alarm ─────────────────────────────────────────────────────────────────

class AlarmPlayer {
    constructor() {
        this.ctx = null;
        this.playing = false;
        this.timeoutIds = [];
    }
    start() {
        if (this.playing) return;
        this.playing = true;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this._scheduleLoop();
    }
    _scheduleLoop() {
        if (!this.playing) return;
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, i) => {
            const id = setTimeout(() => {
                if (!this.playing) return;
                this._playTone(freq, 0.3);
            }, i * 300);
            this.timeoutIds.push(id);
        });
        const loopId = setTimeout(() => {
            if (this.playing) this._scheduleLoop();
        }, 1800);
        this.timeoutIds.push(loopId);
    }
    _playTone(freq, duration) {
        if (!this.ctx || !this.playing) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }
    stop() {
        this.playing = false;
        this.timeoutIds.forEach(clearTimeout);
        this.timeoutIds = [];
        if (this.ctx) {
            this.ctx.close().catch(() => {});
            this.ctx = null;
        }
    }
}

const alarm = new AlarmPlayer();

// ── Component ─────────────────────────────────────────────────────────────

export default function SessionActive({ theme }) {
    const dispatch = useDispatch();
    const {
        mode,
        remainingSeconds,
        focusDuration,
        breakDuration,
        sessionId,
        subjectId,
        subjectName,
        elapsedPhaseSeconds,
        totalFocusSeconds,
    } = useSelector((state) => state.timer);

    const workerRef = useRef(null);
    const [stopping, setStopping] = useState(false);
    const [confirmStop, setConfirmStop] = useState(false);
    const [alarmActive, setAlarmActive] = useState(false);
    const [prevRemaining, setPrevRemaining] = useState(remainingSeconds);

    // Keep refs to current values so async/effect callbacks never read stale state
    const sessionIdRef = useRef(sessionId);
    const elapsedRef = useRef(elapsedPhaseSeconds);
    const modeRef = useRef(mode);
    const subjectIdRef = useRef(subjectId);

    useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
    useEffect(() => { elapsedRef.current = elapsedPhaseSeconds; }, [elapsedPhaseSeconds]);
    useEffect(() => { modeRef.current = mode; }, [mode]);
    useEffect(() => { subjectIdRef.current = subjectId; }, [subjectId]);

    const total = (mode === "break" || mode === "paused_break") ? breakDuration : focusDuration;

    const dismissAlarm = () => {
        alarm.stop();
        setAlarmActive(false);
    };

    // ── Complete the current phase on the backend ─────────────────────────
    const completeCurrentPhase = async (sid, elapsed) => {
        if (!sid || elapsed === 0) return;
        try {
            await endSession({ sessionId: sid, actualDuration: elapsed });
        } catch (err) {
            console.error("Failed to complete phase session:", err);
        }
    };

    // ── Start a new phase session on the backend ──────────────────────────
    const startNewPhase = async (sessionType, plannedDuration) => {
        try {
            const response = await startSession({
                subjectId: subjectIdRef.current,
                sessionType,
                plannedDuration,
            });
            dispatch(phaseStarted({ sessionId: response.session.session_id }));
        } catch (err) {
            console.error("Failed to start new phase:", err);
        }
    };

    useEffect(() => {
        requestNotificationPermission();
        return () => alarm.stop();
    }, []);

    // ── Web Worker ────────────────────────────────────────────────────────
    useEffect(() => {
        workerRef.current = new Worker("/timer-worker.js");
        workerRef.current.onmessage = () => {
            dispatch(tick());
        };
        const w = workerRef.current;
        return () => w.terminate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const running = mode === "focus" || mode === "break";
        if (running && workerRef.current) {
            workerRef.current.postMessage("start");
        } else if (workerRef.current) {
            workerRef.current.postMessage("stop");
        }
    }, [mode]);

    // ── Detect timer completion → complete phase, trigger alarm ────────────
    useEffect(() => {
        if (remainingSeconds === 0 && prevRemaining > 0 && (mode === "focus" || mode === "break")) {
            // Capture values NOW before dispatch changes them
            const currentSessionId = sessionIdRef.current;
            const currentElapsed = elapsedRef.current;
            const currentMode = modeRef.current;

            // Complete the current phase on the backend with exact elapsed time
            completeCurrentPhase(currentSessionId, currentElapsed);

            // Trigger alarm
            alarm.start();
            setAlarmActive(true); // eslint-disable-line react-hooks/set-state-in-effect

            const isBreakNext = currentMode === "focus";
            const title = isBreakNext ? "Focus Session Complete" : "Break Over";
            const body = isBreakNext
                ? `Time for a ${Math.floor(breakDuration / 60)}-minute break.`
                : "Ready for another focus round?";

            showNotification(title, body, dismissAlarm);

            // Transition to next phase (paused, awaiting user)
            if (isBreakNext) {
                dispatch(focusEnded());
            } else {
                dispatch(breakEnded());
            }
        }
        setPrevRemaining(remainingSeconds);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [remainingSeconds]);

    // ── Handlers ──────────────────────────────────────────────────────────
    const handlePlayPause = () => {
        if (alarmActive) {
            dismissAlarm();
        }

        if (mode === "focus" || mode === "break") {
            dispatch(paused());
        } else if (mode === "paused_focus" || mode === "paused_break") {
            // If sessionId is null, we need to create a new backend session for this phase
            // (sessionId is nulled by focusEnded/breakEnded when a phase completes)
            if (!sessionId) {
                const sessionType = mode === "paused_focus" ? "focus" : "break";
                const plannedDuration = mode === "paused_focus" ? focusDuration : breakDuration;
                startNewPhase(sessionType, plannedDuration);
            }
            dispatch(resumed());
        }
    };

    const handleStop = () => {
        if (alarmActive) dismissAlarm();
        setConfirmStop(true);
    };

    const handleConfirmStop = async () => {
        setStopping(true);
        try {
            // Complete the current phase with exact elapsed time
            const currentSessionId = sessionIdRef.current;
            const currentElapsed = elapsedRef.current;
            if (currentSessionId && currentElapsed > 0) {
                await endSession({
                    sessionId: currentSessionId,
                    actualDuration: currentElapsed,
                });
            }
        } catch (err) {
            console.error("Failed to record session:", err);
        } finally {
            dispatch(sessionStopped());
            setStopping(false);
            setConfirmStop(false);
        }
    };

    const handleCancelStop = () => setConfirmStop(false);

    const totalFocusMin = Math.floor(totalFocusSeconds / 60);
    const totalFocusSec = totalFocusSeconds % 60;
    const phaseLabel = elapsedPhaseSeconds > 0
        ? `${Math.floor(elapsedPhaseSeconds / 60)}m ${elapsedPhaseSeconds % 60}s`
        : "0s";

    return (
        <div className="flex-1 flex flex-col items-center justify-center relative cursor-default">
            {/* Subject badge - Subtly tinted with the theme's accent color */}
            <div 
                className="mb-6 px-4 py-1.5 rounded-full border transition-colors duration-500"
                style={{ 
                    backgroundColor: theme?.accent ? `${theme.accent}1A` : 'rgba(255,255,255,0.1)',
                    borderColor: theme?.accent ? `${theme.accent}4D` : 'rgba(255,255,255,0.2)'
                }}
            >
                <span 
                    className="text-xs tracking-wide transition-colors duration-500"
                    style={{ color: theme?.accent || 'white' }}
                >
                    📘 {subjectName}
                </span>
            </div>

            <TimerRing
                remaining={remainingSeconds}
                total={total}
                mode={mode}
                theme={theme}
            />

            <TimerControls
                mode={mode}
                onPlayPause={handlePlayPause}
                onStop={handleStop}
                theme={theme}
            />

            {/* Elapsed focus time (total across all focus phases) */}
            <p className="text-xs text-[#9CA3AF] mt-6 tracking-wide">
                {totalFocusMin}:{totalFocusSec.toString().padStart(2, "0")} focused
            </p>

            {/* Alarm dismiss overlay */}
            {alarmActive && (
                <div className="absolute inset-0 z-40 flex items-center justify-center">
                    <button
                        onClick={dismissAlarm}
                        className="px-8 py-3 bg-white/15 backdrop-blur-sm border border-white/20 text-white text-sm rounded-full animate-pulse cursor-pointer hover:bg-white/25 transition-colors"
                    >
                        Dismiss Alarm
                    </button>
                </div>
            )}

            {/* Confirm stop dialog */}
            {confirmStop && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#141417] border border-white/10 rounded-2xl p-7 w-80 shadow-2xl">
                        <h3 className="text-white font-semibold text-base mb-2">End Session?</h3>
                        <p className="text-[#9CA3AF] text-sm mb-6">
                            {elapsedPhaseSeconds > 0
                                ? `This will log ${phaseLabel} for this phase.`
                                : "No time recorded for this phase."}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelStop}
                                className="flex-1 py-2.5 border border-white/10 text-[#9CA3AF] hover:text-white text-sm rounded-lg transition-colors cursor-pointer"
                            >
                                Keep Going
                            </button>
                            <button
                                onClick={handleConfirmStop}
                                disabled={stopping}
                                className="flex-1 py-2.5 bg-red-500/80 hover:bg-red-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors cursor-pointer"
                            >
                                {stopping ? "Saving..." : "End & Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}