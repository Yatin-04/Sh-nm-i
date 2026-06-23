import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setAuth, clearAuth } from "./slices/authSlice";
import { checkAuth } from "./services/Operations/authAPI";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedLayout from "./components/ProtectedLayout";

function App() {
    const dispatch = useDispatch();
    const loading = useSelector((state) => state.auth.loading);

    useEffect(() => {
        const verifySession = async () => {
            const user = await checkAuth();
            if (user) {
                dispatch(setAuth(user)); // { user_id, name, email }
            } else {
                dispatch(clearAuth());
            }
        };
        verifySession();
    }, [dispatch]);

    // Show nothing (or a spinner) while verifying the cookie
    if (loading) {
        return (
            <div className="app-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="app-container">
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes */}
                {/* <Route 
                    path="/dashboard" 
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } 
                />

                <Route
                    path="/analytics"
                    element={
                        <ProtectedRoute>
                            <Analytics />
                        </ProtectedRoute>
                    }
                /> */}

                <Route
                    element={
                        <ProtectedRoute>
                            <ProtectedLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/analytics" element={<Analytics />} />
                </Route>
                
            </Routes>
        </div>
    );
}

export default App;