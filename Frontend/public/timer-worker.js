// Timer Web Worker
// Sends a "tick" message every second while running.
// This ensures accurate timing even when the tab is backgrounded.

let intervalId = null;

self.onmessage = function (e) {
    if (e.data === "start") {
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(() => {
            self.postMessage("tick");
        }, 1000);
    } else if (e.data === "stop") {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }
};
