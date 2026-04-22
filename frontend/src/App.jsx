import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile } from './store/authSlice';

// Core Pages
import Login from './pages/Login';
import Registration from './pages/Registration';
import Dashboard from './pages/Dashboard';
import CaseManagement from './pages/Watchlist';
import LiveMonitor from './pages/LiveMonitor';
import SurveillanceLog from './pages/SurveillanceLog';
import ViewTips from './pages/Analytics';
import ScanAndMatch from './pages/ScanAndMatch';
import TipSubmission from './pages/TipSubmission';
import IntelligenceTips from './pages/IntelligenceTips';
import MissingPersonReport from './pages/MissingPersonReport';
import SubmitMissingPerson from './pages/SubmitMissingPerson';
import PoliceStationsPage from './pages/PoliceStationsPage';
import SendMailsPage from './pages/SendMailsPage';

// Layout Comp
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const { user, token, status } = useSelector((state) => state.auth);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Pending profile load
    if (status === 'loading') {
        return <div className="h-screen flex items-center justify-center bg-background text-primary">Loading Aegis Secure System...</div>;
    }

    // Only hard-redirect if profile fetch explicitly failed (not just pending)
    if (!user && status === 'failed') {
        return <Navigate to="/login" replace />;
    }

    // Still loading profile (idle or loading after login) — show spinner
    if (!user) {
        return <div className="h-screen flex items-center justify-center bg-background text-primary">Loading Aegis Secure System...</div>;
    }

    if (requireAdmin && user?.role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-col flex-1 w-full relative bg-background p-6">
                <Navbar />
                <main className="h-full overflow-y-auto w-full relative bg-background p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

const App = () => {
    const dispatch = useDispatch();
    const { token, status } = useSelector((state) => state.auth);

    useEffect(() => {
        if (token && status === 'idle') {
            dispatch(fetchProfile());
        }
    }, [token, status, dispatch]);

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Registration />} />

                {/* Protected Dashboard Routes */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/scan" element={<ProtectedRoute><ScanAndMatch /></ProtectedRoute>} />
                <Route path="/monitor" element={<ProtectedRoute requireAdmin><LiveMonitor /></ProtectedRoute>} />
                <Route path="/watchlist" element={<ProtectedRoute requireAdmin><CaseManagement /></ProtectedRoute>} />
                <Route path="/alerts" element={<ProtectedRoute><SurveillanceLog /></ProtectedRoute>} />
                <Route path="/biometrics" element={<ProtectedRoute requireAdmin><ViewTips /></ProtectedRoute>} />
                <Route path="/intelligence" element={<ProtectedRoute requireAdmin><IntelligenceTips /></ProtectedRoute>} />
                <Route path="/submit-tip" element={<ProtectedRoute><TipSubmission /></ProtectedRoute>} />
                <Route path="/missing-person" element={<ProtectedRoute><MissingPersonReport /></ProtectedRoute>} />
                <Route path="/submit-missing-person" element={<ProtectedRoute><SubmitMissingPerson /></ProtectedRoute>} />
                <Route path="/police-stations" element={<ProtectedRoute requireAdmin><PoliceStationsPage /></ProtectedRoute>} />
                <Route path="/send-mails" element={<ProtectedRoute><SendMailsPage /></ProtectedRoute>} />

                {/* Fallback */}
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
        </Router>
    );
};

export default App;
