import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useSelector } from 'react-redux';
import { Mail, MapPin, Clock, CheckCircle, XCircle, Calendar, RefreshCw, AlertTriangle, Trash2 } from 'lucide-react';

const SendMailsPage = () => {
    const [alertLogs, setAlertLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const { user } = useSelector((state) => state.auth);

    const deleteAlertLog = async (logId) => {
        if (!window.confirm('Are you sure you want to delete this alert log? This action cannot be undone.')) {
            return;
        }

        setDeletingId(logId);
        try {
            console.log(`🗑️ Deleting alert log ${logId}...`);
            await axiosClient.delete(`/alert-logs/${logId}`);
            console.log('✅ Alert log deleted successfully');
            
            // Remove from local state
            setAlertLogs(prevLogs => prevLogs.filter(log => log.id !== logId));
        } catch (err) {
            console.error('❌ Error deleting alert log:', err);
            
            // Handle 401 Unauthorized specifically
            if (err.response?.status === 401) {
                setError('Session expired. Please login again.');
                // Clear token and redirect to login
                localStorage.removeItem('token');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                setError('Failed to delete alert log');
            }
        } finally {
            setDeletingId(null);
        }
    };

    const fetchAlertLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('🔍 Fetching alert logs...');
            const { data } = await axiosClient.get('/alert-logs');
            console.log('✅ Received alert logs:', data);
            setAlertLogs(data.logs || data); // Handle both response formats
        } catch (err) {
            console.error('❌ Error fetching alert logs:', err);
            
            // Handle 401 Unauthorized specifically
            if (err.response?.status === 401) {
                setError('Session expired. Please login again.');
                // Clear token and redirect to login
                localStorage.removeItem('token');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                setError('Failed to fetch alert logs');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchAlertLogs();
        }
    }, [user]);

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading alert logs...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                        onClick={fetchAlertLogs}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Mail className="w-8 h-8 text-blue-500" />
                            <h1 className="text-3xl font-bold">Send Mails</h1>
                        </div>
                        <button
                            onClick={fetchAlertLogs}
                            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>Refresh</span>
                        </button>
                    </div>
                    <p className="text-gray-400 mt-2">View automatic alert emails sent to police stations</p>
                </div>

                {/* Alert Logs List */}
                {alertLogs.length === 0 ? (
                    <div className="bg-gray-800 rounded-xl p-8 text-center">
                        <Mail className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-400 mb-2">No Alert Logs Found</h3>
                        <p className="text-gray-500">No alert emails have been sent yet. Alert logs will appear here when suspicious activity is detected.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {alertLogs.map((log) => (
                            <div
                                key={log.id}
                                className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-all duration-200 hover:shadow-lg border border-gray-700"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-full ${
                                            log.status === 'sent' 
                                                ? 'bg-green-900 text-green-400' 
                                                : 'bg-red-900 text-red-400'
                                        }`}>
                                            {log.status === 'sent' ? (
                                                <CheckCircle className="w-5 h-5" />
                                            ) : (
                                                <XCircle className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">
                                                At {formatTime(log.sent_at)}, mail {log.status === 'sent' ? 'sent to' : 'failed to send to'} {log.police_station_name}
                                            </h3>
                                            <p className="text-gray-400 text-sm">
                                                {formatDate(log.sent_at)}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Delete Button */}
                                    <button
                                        onClick={() => deleteAlertLog(log.id)}
                                        disabled={deletingId === log.id}
                                        className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 px-3 py-2 rounded-lg transition-colors"
                                        title="Delete alert log"
                                    >
                                        {deletingId === log.id ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>

                                {/* Status Badge */}
                                <div className="flex justify-end mb-4">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        log.status === 'sent'
                                            ? 'bg-green-900 text-green-300'
                                            : 'bg-red-900 text-red-300'
                                    }`}>
                                        {log.status.toUpperCase()}
                                    </span>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2 text-gray-400">
                                            <MapPin className="w-4 h-4" />
                                            <span>Camera Location:</span>
                                        </div>
                                        <p className="text-white ml-6">
                                            {log.latitude && log.longitude 
                                                ? `${log.latitude.toFixed(6)}, ${log.longitude.toFixed(6)}`
                                                : 'Location not available'
                                            }
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2 text-gray-400">
                                            <Mail className="w-4 h-4" />
                                            <span>Email:</span>
                                        </div>
                                        <p className="text-white ml-6">{log.email}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2 text-gray-400">
                                            <Calendar className="w-4 h-4" />
                                            <span>Camera ID:</span>
                                        </div>
                                        <p className="text-white ml-6">#{log.camera_id || 'N/A'}</p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2 text-gray-400">
                                            <Clock className="w-4 h-4" />
                                            <span>Alert Time:</span>
                                        </div>
                                        <p className="text-white ml-6">{formatTime(log.sent_at)}</p>
                                    </div>
                                </div>

                                {/* Case Details */}
                                {log.case_details && (
                                    <div className="mt-4 pt-4 border-t border-gray-700">
                                        <h4 className="font-medium text-gray-300 mb-2">Case Details:</h4>
                                        <div className="bg-gray-900 rounded-lg p-3 text-sm text-gray-300 whitespace-pre-line">
                                            {log.case_details}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SendMailsPage;
