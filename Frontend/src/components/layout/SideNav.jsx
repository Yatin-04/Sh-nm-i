import { Link, useLocation } from "react-router-dom";

const TimerIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const AnalyticsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
);

const LogoutIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

const NAV_ITEMS = [
    { to: "/dashboard", icon: <TimerIcon />, label: "Timer" },
    { to: "/analytics", icon: <AnalyticsIcon />, label: "Analytics" },
];

// Props:
//   userName  - user's name for the avatar
//   onLogout  - callback for logout action
//   darkMode  - true when session is active (dark bg)
export default function SideNav({ userName, onLogout, darkMode = false }) {
    const location = useLocation();
    const initial = userName ? userName.charAt(0).toUpperCase() : "?";

    // Colors adapt based on whether session is active (dark bg) or idle (gradient bg)
    const textPrimary = darkMode ? "text-[#D1D5DB]" : "text-[#2D1B4E]";
    const textMuted = darkMode ? "text-[#D1D5DB]/70" : "text-[#2D1B4E]/60";
    const activeBg = darkMode ? "bg-white/10" : "bg-[#2D1B4E]/15";
    const hoverBg = darkMode ? "hover:bg-white/10" : "hover:bg-[#2D1B4E]/10";
    const avatarBg = darkMode ? "bg-white/10 text-[#D1D5DB]" : "bg-[#2D1B4E]/15 text-[#2D1B4E]";

    return (
        <aside className="fixed left-0 top-0 h-full w-16 bg-white/10 backdrop-blur-xl border-r border-white/20 flex flex-col items-center py-5 z-50">
            <Link
                to="/dashboard"
                className={`mb-8 ${textPrimary} text-xs tracking-widest font-semibold select-none cursor-pointer`}
                style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
            >
                sh·nm·i
            </Link>

            <nav className="flex flex-col gap-2 flex-1">
                {NAV_ITEMS.map(({ to, icon, label }) => {
                    const active = location.pathname === to;
                    return (
                        <Link
                            key={to}
                            to={to}
                            title={label}
                            className={`
                                w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer
                                ${active
                                    ? `${activeBg} ${textPrimary}`
                                    : `${textMuted} hover:${textPrimary} ${hoverBg}`
                                }
                            `}
                        >
                            {icon}
                        </Link>
                    );
                })}
            </nav>

            <div className="flex flex-col items-center gap-3">
                <button
                    onClick={onLogout}
                    title="Logout"
                    className={`w-10 h-10 flex items-center justify-center rounded-xl ${textMuted} hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 cursor-pointer`}
                >
                    <LogoutIcon />
                </button>

                <div
                    title={userName}
                    className={`w-9 h-9 rounded-full ${avatarBg} flex items-center justify-center text-sm font-semibold select-none`}
                >
                    {initial}
                </div>
            </div>
        </aside>
    );
}
