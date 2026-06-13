import { createSlice } from "@reduxjs/toolkit";

// mode: "idle" | "focus" | "break" | "paused_focus" | "paused_break"
const initialState = {
    mode: "idle",

    // Config (user-customizable)
    focusDuration: 25 * 60,   // seconds
    breakDuration: 5 * 60,    // seconds

    // Countdown
    remainingSeconds: 25 * 60,

    // Active session tracking
    sessionId: null,
    subjectId: null,
    subjectName: null,

    // Accumulated focus time sent to backend on stop
    elapsedFocusSeconds: 0,

    // Internal: timestamp when current interval started (ms), null if paused/idle
    intervalStartedAt: null,
};

const timerSlice = createSlice({
    name: "timer",
    initialState,
    reducers: {
        // Called when user configures and clicks "Start Session"
        sessionStarted(state, action) {
            const { sessionId, subjectId, subjectName, focusDuration, breakDuration } = action.payload;
            state.sessionId = sessionId;
            state.subjectId = subjectId;
            state.subjectName = subjectName;
            state.focusDuration = focusDuration;
            state.breakDuration = breakDuration;
            state.remainingSeconds = focusDuration;
            state.elapsedFocusSeconds = 0;
            state.mode = "focus";
            state.intervalStartedAt = Date.now();
        },

        // Tick every second — called by the interval in SessionActive
        tick(state) {
            if (state.mode === "focus") {
                state.elapsedFocusSeconds += 1;
            }

            if (state.remainingSeconds > 0) {
                state.remainingSeconds -= 1;
            }
        },

        // Focus interval ended naturally → switch to break
        focusEnded(state) {
            state.mode = "break";
            state.remainingSeconds = state.breakDuration;
            state.intervalStartedAt = Date.now();
        },

        // Break interval ended naturally → switch back to focus
        breakEnded(state) {
            state.mode = "focus";
            state.remainingSeconds = state.focusDuration;
            state.intervalStartedAt = Date.now();
        },

        // Play/Pause toggle
        paused(state) {
            if (state.mode === "focus") {
                state.mode = "paused_focus";
                state.intervalStartedAt = null;
            } else if (state.mode === "break") {
                state.mode = "paused_break";
                state.intervalStartedAt = null;
            }
        },

        resumed(state) {
            if (state.mode === "paused_focus") {
                state.mode = "focus";
                state.intervalStartedAt = Date.now();
            } else if (state.mode === "paused_break") {
                state.mode = "break";
                state.intervalStartedAt = Date.now();
            }
        },

        // Stop — resets everything; elapsedFocusSeconds is read BEFORE this dispatch
        sessionStopped(state) {
            return { ...initialState };
        },

        // Update config from the customize modal (only while idle)
        configUpdated(state, action) {
            const { focusDuration, breakDuration } = action.payload;
            state.focusDuration = focusDuration;
            state.breakDuration = breakDuration;
            state.remainingSeconds = focusDuration;
        },
    },
});

export const {
    sessionStarted,
    tick,
    focusEnded,
    breakEnded,
    paused,
    resumed,
    sessionStopped,
    configUpdated,
} = timerSlice.actions;

export default timerSlice.reducer;
