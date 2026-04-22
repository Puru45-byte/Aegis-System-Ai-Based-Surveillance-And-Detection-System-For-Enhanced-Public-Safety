import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Activity, AlertOctagon, TrendingUp, Search, Video, UserPlus, Clock, X, Check, Loader2 } from 'lucide-react';
import { fetchDashboardStats } from '../store/dashboardSlice';
import axiosClient from '../api/axiosClient';

const StatCard = ({ title, value, label, icon: Icon, colorClass, loading }) => (
    <div className="bg-surface border border-borderContent p-5 rounded-2xl relative overflow-hidden group hover:border-[#3f3f46] transition-all">
        <div className={`absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all duration-500`}>
            <Icon className={`w-24 h-24 ${colorClass}`} />
        </div>
        <div className="relative z-10 flex items-start justify-between">
            <div>
                <h3 className="text-2xl font-bold text-textMain">{value ?? 0}</h3>
                <p className="text-sm text-textMuted">{label}</p>
            </div>
            {loading && (
                <div className="absolute inset-0 bg-surface/80 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-textMuted border-t-transparent animate-spin rounded-full" />
                </div>
            )}
        </div>
    </div>
);

const Dashboard = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const { stats, status } = useSelector(state => state.dashboard);
    const [pendingMissingPersons, setPendingMissingPersons] = useState([]);
    const [loadingMissingPersons, setLoadingMissingPersons] = useState(false);

    useEffect(() => {
        dispatch(fetchDashboardStats());
        // Only fetch missing persons if user is admin
        if (user?.role === 'admin') {
            fetchPendingMissingPersons();
        }
    }, [dispatch, user?.role]);

    const fetchPendingMissingPersons = async () => {
        if (user?.role !== 'admin') return;
        
        setLoadingMissingPersons(true);
        try {
            const response = await axiosClient.get('/dashboard/pending-missing-persons');
            setPendingMissingPersons(response.data);
        } catch (error) {
            console.error('Failed to fetch pending missing persons:', error);
        } finally {
            setLoadingMissingPersons(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await axiosClient.post(`/missing-persons/${id}/approve`);
            // Refresh both stats and pending persons
            dispatch(fetchDashboardStats());
            fetchPendingMissingPersons();
        } catch (error) {
            console.error('Failed to approve request:', error);
        }
    };

    const handleReject = async (id) => {
        try {
            await axiosClient.post(`/missing-persons/${id}/reject`);
            // Refresh both stats and pending persons
            dispatch(fetchDashboardStats());
            fetchPendingMissingPersons();
        } catch (error) {
            console.error('Failed to reject request:', error);
        }
    };

    const loading = status === 'loading' || status === 'idle';

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-end justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-textMain tracking-tight">Overview Command</h1>
                    <p className="text-textMuted mt-1 text-sm">Real-time surveillance matrix and alert telemetry.</p>
                </div>

                <div className="flex gap-4">
                    <StatCard
                        title="Active Cameras"
                        value={stats?.active_cameras ?? 0}
                        label="Online now"
                        icon={Video}
                        colorClass="text-green-500"
                        loading={loading}
                    />
                    <StatCard
                        title="Today's Detections"
                        value={stats?.today_detections ?? 0}
                        label="Events recorded"
                        icon={Activity}
                        colorClass="text-blue-500"
                        loading={loading}
                    />
                    <StatCard
                        title="Critical Alerts"
                        value={stats?.critical_alerts ?? 0}
                        label="Action Required"
                        icon={AlertOctagon}
                        colorClass="text-red-500"
                        loading={loading}
                    />
                </div>
            </div>

            {/* Alert Activity - full width */}
            {user?.role === 'admin' ? (
                <div className="mt-6">
                    <h2 className="font-semibold text-textMain mb-4 flex items-center">
                        <UserPlus className="w-4 h-4 mr-2 text-textMuted" />
                        Pending Missing Person Requests
                    </h2>

                    <div className="space-y-3">
                        {loadingMissingPersons ? (
                            <div className="bg-surface border border-borderContent p-8 rounded-xl text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-textMuted mx-auto mb-2" />
                                <p className="text-textMuted">Loading pending requests...</p>
                            </div>
                        ) : pendingMissingPersons.length === 0 ? (
                            <div className="bg-surface border border-borderContent p-8 rounded-xl text-center">
                                <UserPlus className="w-8 h-8 text-textMuted mx-auto mb-2" />
                                <p className="text-textMuted">No pending missing person requests</p>
                            </div>
                        ) : (
                            pendingMissingPersons.map(person => (
                                <div key={person.id} className="bg-surface border border-borderContent p-4 rounded-xl">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center mb-2">
                                                <h4 className="text-sm font-semibold text-textMain">{person.missing_person_name}</h4>
                                                {person.photo_path && (
                                                    <img 
                                                        src={`http://localhost:8000/api/v1/missing-persons/${person.id}/photo`}
                                                        alt={person.missing_person_name}
                                                        className="w-8 h-8 rounded-full ml-2 object-cover"
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                )}
                                            </div>
                                            <div className="text-xs text-textMuted space-y-1">
                                                <div className="flex items-center">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    <span>Last seen: {person.last_seen_location}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <span>Date: {person.last_seen_date}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <span>Contact: {person.contact_phone}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <span>Submitted: {person.created_at}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => handleApprove(person.id)}
                                                className="px-3 py-1 bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-all flex items-center"
                                            >
                                                <Check className="w-3 h-3 mr-1" />
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(person.id)}
                                                className="px-3 py-1 bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-all flex items-center"
                                            >
                                                <X className="w-3 h-3 mr-1" />
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                <div className="mt-6">
                    <h2 className="font-semibold text-textMain mb-4 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2 text-textMuted" />
                        Alert Activity
                    </h2>

                    <div className="space-y-3">
                        {[
                            { id: 1, type: 'critical', desc: 'Watchlist ID-8X4 Matched', location: 'Terminal 4, Gate B', time: '2m ago' },
                            { id: 2, type: 'warning', desc: 'Low Confidence Match (65%)', location: 'Main Entrance Lobby', time: '14m ago' },
                            { id: 3, type: 'info', desc: 'System Reboot Initiated', location: 'Server Node Alpha', time: '1hr ago' },
                        ].map(alert => (
                            <div key={alert.id} className="bg-surface border border-borderContent p-4 rounded-xl flex">
                                <div className={`w-1 h-12 rounded-full mr-4 ${alert.type === 'critical' ? 'bg-red-500' : alert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-textMain">{alert.desc}</h4>
                                    <div className="flex justify-between mt-1 text-xs text-textMuted">
                                        <span>{alert.location}</span>
                                        <span>{alert.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button className="w-full py-3 bg-surfaceHover border border-borderContent rounded-xl text-sm font-medium text-textMain hover:bg-[#27272a] transition-all">
                            View Complete Log
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
