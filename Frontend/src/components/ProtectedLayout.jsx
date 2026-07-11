import { Outlet } from "react-router-dom";
import SideNav from "./layout/SideNav";
import { colorThemes } from '../utils/colorTheme';
import { AIStudyBuddyDrawer } from './AIStudyBuddyDrawer';

import { useSelector, useDispatch } from "react-redux";
import { logout } from '../services/Operations/authAPI';
import { clearAuth } from '../slices/authSlice';

export default function ProtectedLayout() {
    const user = useSelector((state) => state.auth.user);
    const themeId = useSelector((state) => state.theme.theme_id);
      
    // Resolve current theme
    const theme = colorThemes.find(t => t.color_grp === themeId) || colorThemes[0];
    const dispatch = useDispatch();

     const handleLogout = () => {
        // Clear auth state and redirect to login
        dispatch(clearAuth());
    };

    const isIdle = true;
    return (
        <>
            <SideNav user={user} onLogout={handleLogout} darkMode={!isIdle} theme={theme} />
            <Outlet />
            <AIStudyBuddyDrawer />
        </>
    );
}