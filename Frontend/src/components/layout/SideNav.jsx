import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

// Icons as inline SVGs to avoid any icon library dependency
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

const ProfileIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const NAV_ITEMS = [
    { to: "/dashboard", icon: <TimerIcon />, label: "Timer" },
    { to: "/analytics", icon: <AnalyticsIcon />, label: "Analytics" },
];

export default function SideNav() {
    const location = useLocation();

    return (
        <aside className="fixed left-0 top-0 h-full w-16 bg-[#0d0d0f] border-r border-white/5 flex flex-col items-center py-6 z-40">
            {/* Logo mark */}
            <Link
                to="/dashboard"
                className="mb-8 text-white font-mono text-xs tracking-widest opacity-80 hover:opacity-100 transition-opacity select-none"
                style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
            >
                sh·nm·i
            </Link>

            {/* Nav links */}
            <nav className="flex flex-col gap-2 flex-1">
                {NAV_ITEMS.map(({ to, icon, label }) => {
                    const active = location.pathname === to;
                    return (
                        <Link
                            key={to}
                            to={to}
                            title={label}
                            className={`
                                w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-150
                                ${active
                                    ? "bg-white/10 text-white"
                                    : "text-white/30 hover:text-white/70 hover:bg-white/5"
                                }
                            `}
                        >
                            {icon}
                        </Link>
                    );
                })}
            </nav>

            {/* Profile at bottom */}
            <Link
                to="/profile"
                title="Profile"
                className="w-10 h-10 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-all duration-150"
            >
                <ProfileIcon />
            </Link>
        </aside>
    );
}
