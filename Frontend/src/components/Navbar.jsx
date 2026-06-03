import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import "./css/Navbar.css";

export default function Navbar() {
    const location = useLocation();
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-logo">
                sh<span className="logo-accent">·</span>nm<span className="logo-accent">·</span>i
            </Link>

            <div className="navbar-links">
                {!isAuthenticated ? (
                    <>
                        <Link
                            to="/login"
                            className={`nav-link ${isActive("/login") ? "active" : ""}`}
                        >
                            login
                        </Link>
                        <Link to="/register" className="nav-cta">
                            get started
                        </Link>
                    </>
                ) : (
                    <Link
                        to="/dashboard"
                        className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}
                    >
                        dashboard
                    </Link>
                )}
            </div>
        </nav>
    );
}