import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { colorThemes } from "../../utils/colorTheme"; // Import your themes array here
import { setTheme } from "../../slices/themeSlice"; // Import the action to set the theme

// --- Navigation Icons ---
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

// --- Dropdown Menu Icons ---
const SettingsIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

const ThemeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.992 6.012 17.5 2 12 2z" />
    </svg>
);

const LearnIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

const LogoutIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

const DocumentsIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
);

const ChevronRight = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

const ChevronLeft = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const CheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const NAV_ITEMS = [
    { to: "/dashboard", icon: <TimerIcon />, label: "Timer" },
    { to: "/analytics", icon: <AnalyticsIcon />, label: "Analytics" },
];

export default function SideNav({ user, onLogout, darkMode = false, theme }) {
    const dispatch = useDispatch();
    const activeThemeId = useSelector((state) => state.theme.theme_id);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuView, setMenuView] = useState("main"); // "main" | "theme"
    const location = useLocation();

    const userEmail = user?.email || "guest@shnmi.app";
    const initial = user?.name ? user.name.charAt(0).toUpperCase() : "G";

    // Reset menu view back to 'main' shortly after closing the menu
    useEffect(() => {
        if (!isMenuOpen) {
            const timeout = setTimeout(() => setMenuView("main"), 250);
            return () => clearTimeout(timeout);
        }
    }, [isMenuOpen]);

    // Inject styles for hover and active states when NOT in dark mode
    const dynamicStyles = !darkMode && theme ? `
        .sidenav-item { color: ${theme.sidenav_text_muted}; }
        .sidenav-item:hover { color: ${theme.sidenav_text}; background-color: ${theme.sidenav_active_bg}; }
        .sidenav-item.active { color: ${theme.sidenav_text}; background-color: ${theme.sidenav_active_bg}; }
        
        .sidenav-avatar { background-color: ${theme.sidenav_active_bg}; color: ${theme.sidenav_text}; }
        .sidenav-brand { color: ${theme.sidenav_text}; }
        
        .menu-bg { background-color: ${theme.surface_raised}; border-color: ${theme.border}; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
        .menu-item { color: ${theme.text_primary}; }
        .menu-item:hover { background-color: ${theme.panel_pill_hover_bg}; }
        .menu-text-muted { color: ${theme.text_muted}; }
        .menu-divider { border-bottom-color: ${theme.border_subtle}; }
    ` : '';

    const containerStyle = darkMode ? {} : {
        backgroundColor: theme?.sidenav_bg,
        borderColor: theme?.sidenav_border,
    };

    return (
        <>
            <aside 
                className={`fixed left-0 top-0 h-full w-16 backdrop-blur-xl border-r flex flex-col items-center py-5 z-40 transition-colors duration-700 ease-in-out ${
                    darkMode ? 'bg-[#151515] border-white/5' : ''
                }`}
                style={containerStyle}
            >
                {theme && !darkMode && <style>{dynamicStyles}</style>}
                
                <Link
                    to="/dashboard"
                    className={`mb-8 text-xs tracking-widest font-semibold select-none cursor-pointer transition-colors duration-500 ${
                        darkMode ? 'text-[#D1D5DB]' : 'sidenav-brand'
                    }`}
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
                                    w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer
                                    ${darkMode 
                                        ? (active 
                                            ? 'bg-white/10 text-white' 
                                            : 'text-[#9AA0A6] hover:text-white hover:bg-white/5')
                                        : `sidenav-item ${active ? 'active' : ''}`
                                    }
                                `}
                            >
                                {icon}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex flex-col items-center">
                    <button
                        title="Account settings"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold select-none transition-colors duration-300 cursor-pointer hover:opacity-80 ${
                            darkMode ? 'bg-[#333] text-[#E8EAED]' : 'sidenav-avatar'
                        }`}
                    >
                        {initial}
                    </button>
                </div>
            </aside>

            {/* Invisible Overlay to handle closing when clicking outside */}
            {isMenuOpen && (
                <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {/* Dropdown Menu Modal */}
            <div 
                className={`fixed bottom-5 left-20 w-[300px] rounded-xl py-2 z-50 transition-all duration-200 origin-bottom-left overflow-hidden ${
                    isMenuOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
                } ${darkMode ? 'bg-[#282828] border border-[#3C4043] shadow-2xl shadow-black/50' : 'menu-bg border'}`}
            >
                {menuView === "main" ? (
                    <div className="flex flex-col w-full animate-in fade-in slide-in-from-left-4 duration-200">
                        {/* Email Header */}
                        <div className={`px-5 py-2 text-sm font-medium ${darkMode ? 'text-[#9AA0A6]' : 'menu-text-muted'}`}>
                            {userEmail}
                        </div>

                        {/* Section 1 */}
                        <button 
                            onClick={() => setMenuView("theme")}
                            className={`w-full flex items-center px-5 py-2.5 text-sm cursor-pointer transition-colors ${darkMode ? 'text-[#E8EAED] hover:bg-[#3C4043]' : 'menu-item'}`}
                        >
                            <span className="mr-4"><ThemeIcon /></span>
                            <span className="flex-1 text-left">Change theme</span>
                            <span className={darkMode ? 'text-[#9AA0A6]' : 'menu-text-muted'}><ChevronRight /></span>
                        </button>

                        <Link to='/' className={`w-full flex items-center px-5 py-2.5 text-sm cursor-pointer transition-colors ${darkMode ? 'text-[#E8EAED] hover:bg-[#3C4043]' : 'menu-item'}`}>
                            <span className="mr-4"><LearnIcon /></span>
                            <span className="flex-1 text-left">Learn more</span>
                            <span className={darkMode ? 'text-[#9AA0A6]' : 'menu-text-muted'}><ChevronRight /></span>
                        </Link>

                        <Link 
                            to='/my-documents' 
                            onClick={() => setIsMenuOpen(false)}
                            className={`w-full flex items-center px-5 py-2.5 text-sm cursor-pointer transition-colors ${darkMode ? 'text-[#E8EAED] hover:bg-[#3C4043]' : 'menu-item'}`}
                        >
                            <span className="mr-4"><DocumentsIcon /></span>
                            <span className="flex-1 text-left">My documents</span>
                            <span className={darkMode ? 'text-[#9AA0A6]' : 'menu-text-muted'}><ChevronRight /></span>
                        </Link>

                        <div className={`mx-5 my-1.5 border-b ${darkMode ? 'border-[#3C4043]' : 'menu-divider'}`} />

                        {/* Section 2 */}
                        <button 
                            onClick={() => {
                                setIsMenuOpen(false);
                                onLogout();
                            }}
                            className={`w-full flex items-center px-5 py-2.5 text-sm cursor-pointer transition-colors ${darkMode ? 'text-[#E8EAED] hover:bg-[#3C4043]' : 'menu-item'}`}
                        >
                            <span className="mr-4"><LogoutIcon /></span>
                            <span className="flex-1 text-left">Log out</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col w-full animate-in fade-in slide-in-from-right-4 duration-200">
                        {/* Submenu Header */}
                        <div className={`flex items-center px-3 py-2 ${darkMode ? 'text-[#E8EAED]' : 'menu-item'}`}>
                            <button 
                                onClick={() => setMenuView("main")}
                                className="p-2 mr-1 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                            >
                                <ChevronLeft />
                            </button>
                            <span className="font-medium text-sm">Select Theme</span>
                        </div>
                        <div className={`mx-5 mb-2 border-b ${darkMode ? 'border-[#3C4043]' : 'menu-divider'}`} />

                        {/* Theme Options */}
                        <div className="flex flex-col py-1">
                            {colorThemes.map((t) => (
                                <button
                                    key={t.color_grp}
                                    onClick={() => dispatch(setTheme(t.color_grp))}
                                    className={`w-full flex items-center px-5 py-2.5 text-sm cursor-pointer transition-colors ${
                                        darkMode ? 'text-[#E8EAED] hover:bg-[#3C4043]' : 'menu-item'
                                    } ${activeThemeId === t.color_grp ? (darkMode ? 'bg-[#3C4043]/60' : 'bg-black/5') : ''}`}
                                    style={!darkMode && activeThemeId === t.color_grp && theme ? { backgroundColor: theme.panel_pill_bg } : {}}
                                >
                                    {/* Color Swatch Preview */}
                                    <div 
                                        className="w-5 h-5 rounded-full mr-4 border flex items-center justify-center shrink-0"
                                        style={{ backgroundColor: t.page_bg, borderColor: t.border }}
                                    >
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.accent }} />
                                    </div>

                                    {/* Theme Info */}
                                    <div className="flex-1 text-left flex flex-col pr-4">
                                        <span className="font-medium">{t.name}</span>
                                        <span className={`text-[11px] truncate ${darkMode ? 'text-[#9AA0A6]' : 'menu-text-muted'}`}>
                                            {t.description.split('.')[0]}
                                        </span>
                                    </div>

                                    {/* Active Checkmark */}
                                    {activeThemeId === t.color_grp && (
                                        <span style={!darkMode && theme ? { color: theme.text_primary } : { color: '#E8EAED' }}>
                                            <CheckIcon />
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}