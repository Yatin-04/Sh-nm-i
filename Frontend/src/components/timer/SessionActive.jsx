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

// ── Alarm (continuous looping soft bells via Web Audio) ────────────────────

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
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
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

// Singleton alarm instance outside component to avoid ref-in-render issues
const alarm = new AlarmPlayer();

// ── Component ─────────────────────────────────────────────────────────────

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

    const workerRef = useRef(null);
    const [stopping, setStopping] = useState(false);
    const [confirmStop, setConfirmStop] = useState(false);
    const [alarmActive, setAlarmActive] = useState(false);
    // Track previous remaining to detect the 1→0 transition
    const [prevRemaining, setPrevRemaining] = useState(remainingSeconds);

    const total = (mode === "break" || mode === "paused_break") ? breakDuration : focusDuration;

    const dismissAlarm = () => {
        alarm.stop();
        setAlarmActive(false);
    };

    // Request notification permission on mount
    useEffect(() => {
        requestNotificationPermission();
        return () => alarm.stop();
    }, []);

    // ── Web Worker lifecycle ──────────────────────────────────────────────
    useEffect(() => {
        workerRef.current = new Worker("/timer-worker.js");
        workerRef.current.onmessage = () => {
            dispatch(tick());
        };
        const w = workerRef.current;
        return () => w.terminate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Start/stop worker based on mode ───────────────────────────────────
    useEffect(() => {
        const running = mode === "focus" || mode === "break";
        if (running && workerRef.current) {
            workerRef.current.postMessage("start");
        } else if (workerRef.current) {
            workerRef.current.postMessage("stop");
        }
    }, [mode]);

    // ── Detect timer completion (1→0 edge) ────────────────────────────────
    // This effect reacts to the Web Worker's external tick events — intentional setState.
    useEffect(() => {
        if (remainingSeconds === 0 && prevRemaining > 0 && (mode === "focus" || mode === "break")) {
            alarm.start();
            setAlarmActive(true); // eslint-disable-line react-hooks/set-state-in-effect

            const isBreakNext = mode === "focus";
            const title = isBreakNext ? "Focus Session Complete" : "Break Over";
            const body = isBreakNext
                ? `Time for a ${Math.floor(breakDuration / 60)}-minute break.`
                : "Ready for another focus round?";

            showNotification(title, body, dismissAlarm);

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
        } else {
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
            await endSession({
                sessionId,
                actualDuration: elapsedFocusSeconds,
            });
        } catch (err) {
            console.error("Failed to record session:", err);
        } finally {
            dispatch(sessionStopped());
            setStopping(false);
            setConfirmStop(false);
        }
    };

    const handleCancelStop = () => setConfirmStop(false);

    const elapsedMin = Math.floor(elapsedFocusSeconds / 60);
    const elapsedSec = elapsedFocusSeconds % 60;
    const elapsedLabel = elapsedMin > 0
        ? `${elapsedMin}m ${elapsedSec}s`
        : `${elapsedSec}s`;

    return (
        <div className="flex-1 flex flex-col items-center justify-center relative cursor-default">
            {/* Subject badge */}
            <div className="mb-6 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full">
                <span className="text-xs text-white tracking-wide">
                    📘 {subjectName}
                </span>
            </div>

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

            {/* Elapsed focus time */}
            <p className="text-xs text-[#9CA3AF] mt-6 tracking-wide">
                {elapsedMin}:{elapsedSec.toString().padStart(2, "0")} focused
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
                            {elapsedFocusSeconds > 0
                                ? `This will log ${elapsedLabel} of focus time.`
                                : "No focus time recorded yet."}
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
