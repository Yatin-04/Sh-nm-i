// MiniPlayer.jsx
// Compact Spotify embed that docks at the bottom during active session.
// Props:
//   activeTheme - the theme selected during idle state
//   visible     - whether the mini player should be shown (session active)

export default function MiniPlayer({ activeTheme, visible }) {
    return (
        <div
            className={`fixed bottom-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4 pb-4 transition-transform duration-500 ${
                visible ? "translate-y-0" : "translate-y-full"
            }`}
        >
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/20 border border-white/10">
                <iframe
                    key={activeTheme.playlistId}
                    src={`https://open.spotify.com/embed/playlist/${activeTheme.playlistId}?utm_source=generator&theme=0`}
                    width="100%"
                    height="80"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    style={{ border: "none", borderRadius: "16px", display: "block" }}
                    title={`${activeTheme.label} - mini player`}
                />
            </div>
        </div>
    );
}
