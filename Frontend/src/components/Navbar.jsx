import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

export default function Navbar() {
    const location = useLocation();
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

    const isActive = (path) => location.pathname === path;

    const getNavLinkClass = (path) => {
        const active = isActive(path);
        return `text-[0.8rem] tracking-[0.05em] transition-colors duration-200 relative cursor-pointer after:absolute after:bottom-[-4px] after:left-0 after:h-[1px] after:bg-[#1a1a1a] after:transition-[width] after:duration-200 ${
            active
                ? "text-[#1a1a1a] after:w-full"
                : "text-[#1a1a1a]/60 after:w-0 hover:text-[#1a1a1a] hover:after:w-full"
        }`;
    };

    return (
        <nav className="flex items-center justify-between px-5 md:px-10 h-[60px] bg-white border-b border-[#EAEAEA] sticky top-0 z-[100]">
            <Link to="/" className="text-[1.1rem] font-semibold tracking-[0.04em] text-[#1a1a1a] hover:text-black transition-colors duration-200">
                sh<span className="text-[#1a1a1a] opacity-40">·</span>nm<span className="text-[#1a1a1a] opacity-40">·</span>i
            </Link>

            <div className="flex items-center gap-6">
                {!isAuthenticated ? (
                    <>
                        <Link
                            to="/login"
                            className={getNavLinkClass("/login")}
                        >
                            login
                        </Link>
                        <Link
                            to="/register"
                            className="text-[0.8rem] tracking-[0.05em] py-[0.45rem] px-4 bg-[#1a1a1a] text-white rounded-[6px] font-semibold transition-all duration-200 cursor-pointer hover:-translate-y-[1px] hover:opacity-90"
                        >
                            get started
                        </Link>
                    </>
                ) : (
                    <Link
                        to="/dashboard"
                        className={getNavLinkClass("/dashboard")}
                    >
                        dashboard
                    </Link>
                )}
            </div>
        </nav>
    );
}