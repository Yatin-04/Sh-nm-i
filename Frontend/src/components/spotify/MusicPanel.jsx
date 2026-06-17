import { THEMES } from "./themes";

export default function MusicPanel({ activeTheme, onThemeChange }) {
    return (
        <div className="flex flex-col h-full">
            <p className="text-xs text-[#2D1B4E] uppercase tracking-widest mb-3 font-medium">
                Music / Theme
            </p>

            <div className="flex flex-col gap-1 mb-4">
                {THEMES.map((theme) => {
                    const active = activeTheme.id === theme.id;
                    return (
                        <button
                            key={theme.id}
                            onClick={() => onThemeChange(theme)}
                            className={`
                                w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer
                                ${active
                                    ? "bg-black/10 border border-[#2D1B4E]/20"
                                    : "hover:bg-black/5 border border-transparent"
                                }
                            `}
                        >
                            <div className="flex items-baseline gap-2">
                                <span className="text-[10px] text-[#4A3B69]/50">{theme.tag}</span>
                                <span
                                    className="text-sm font-medium"
                                    style={{ color: active ? theme.accent : "#2D1B4E" }}
                                >
                                    {theme.label}
                                </span>
                            </div>
                            {active && (
                                <p className="text-[10px] text-[#4A3B69] mt-0.5 pl-5">
                                    {theme.desc}
                                </p>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="rounded-xl overflow-hidden flex-shrink-0">
                <iframe
                    key={activeTheme.playlistId}
                    src={`https://open.spotify.com/embed/playlist/${activeTheme.playlistId}?utm_source=generator&theme=0`}
                    width="100%"
                    height="152"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    style={{ border: "none", borderRadius: "12px", display: "block" }}
                    title={`${activeTheme.label} playlist`}
                />
            </div>

            <p className="text-[10px] text-[#4A3B69]/60 mt-3 text-center">
                Requires Spotify account to play
            </p>
        </div>
    );
}
