import { useState } from "react";

// Spotify playlist IDs for each mood theme
// These are public Spotify playlists — URIs can be swapped for your own
const THEMES = [
    {
        id: "focus",
        label: "deep focus",
        tag: "01",
        desc: "Minimal. No lyrics. Zero distractions.",
        playlistId: "37i9dQZF1DWZeKCadgRdKQ", // Spotify "Deep Focus"
        accent: "#a855f7",
    },
    {
        id: "lofi",
        label: "lofi",
        tag: "02",
        desc: "Warm beats. Let your brain breathe.",
        playlistId: "0vvXsWCC9xrXsKd4eIoqyq", // Spotify "Lofi Girl"
        accent: "#f59e0b",
    },
    {
        id: "alpha",
        label: "alpha beats",
        tag: "03",
        desc: "Binaural tones. Frequency-tuned attention.",
        playlistId: "37i9dQZF1DWUZ5bk6qqDSy", // Spotify "Brain Food"
        accent: "#22d3ee",
    },
    {
        id: "classical",
        label: "classical",
        tag: "04",
        desc: "Timeless structure. Ordered thinking.",
        playlistId: "37i9dQZF1DWV0gynK7G6pD", // Spotify "Classical Focus"
        accent: "#f472b6",
    },
];

export default function SpotifyPanel() {
    const [activeTheme, setActiveTheme] = useState(THEMES[0]);

    return (
        <div className="flex flex-col h-full">
            {/* Section label */}
            <p className="font-mono text-xs text-white/30 uppercase tracking-widest mb-4">
                music / theme
            </p>

            {/* Theme selector list */}
            <div className="flex flex-col gap-1 mb-5">
                {THEMES.map((theme) => {
                    const active = activeTheme.id === theme.id;
                    return (
                        <button
                            key={theme.id}
                            onClick={() => setActiveTheme(theme)}
                            className={`
                                w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150
                                ${active
                                    ? "bg-white/8 border border-white/10"
                                    : "hover:bg-white/4 border border-transparent"
                                }
                            `}
                        >
                            <div className="flex items-baseline gap-2">
                                <span className="font-mono text-[10px] text-white/25">{theme.tag}</span>
                                <span
                                    className="font-mono text-sm"
                                    style={{ color: active ? theme.accent : "rgba(255,255,255,0.55)" }}
                                >
                                    {theme.label}
                                </span>
                            </div>
                            {active && (
                                <p className="font-mono text-[10px] text-white/30 mt-0.5 pl-5">
                                    {theme.desc}
                                </p>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Spotify embed */}
            <div className="rounded-xl overflow-hidden flex-shrink-0" style={{ minHeight: 80 }}>
                <iframe
                    key={activeTheme.playlistId} // force remount on theme change
                    src={`https://open.spotify.com/embed/playlist/${activeTheme.playlistId}?utm_source=generator&theme=0`}
                    width="100%"
                    height="152"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    style={{ border: "none", borderRadius: "12px", display: "block" }}
                    title={`${activeTheme.label} playlist`}
                />
            </div>

            <p className="font-mono text-[10px] text-white/15 mt-3 text-center">
                requires spotify account to play
            </p>
        </div>
    );
}
