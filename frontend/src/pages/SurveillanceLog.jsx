import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useSelector } from 'react-redux';
import { Eye, Trash2, Calendar, MapPin, User, AlertTriangle, CheckCircle, XCircle, Clock, Filter, RefreshCw, UserPlus, MessageSquare } from 'lucide-react';

const SurveillanceLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedLog, setSelectedLog] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('all'); // all, high, medium, low
    const [deletingId, setDeletingId] = useState(null);

    const { user } = useSelector((state) => state.auth);

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('🔍 Fetching surveillance logs...');
            const { data } = await axiosClient.get('/surveillance/surveillance-logs');
            console.log('✅ Received data:', data);
            setLogs(data.logs || data); // Handle both response formats
            console.log('✅ Logs set:', data.logs || data);
        } catch (err) {
            console.error('❌ Error fetching logs:', err);
            
            // Handle 401 Unauthorized specifically
            if (err.response?.status === 401) {
                setError('Session expired. Please login again.');
                // Clear token and redirect to login
                localStorage.removeItem('token');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                setError('Failed to fetch surveillance logs');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchMissingPersonReports = async () => {
        // Function removed - missing person reports no longer needed
    };

    useEffect(() => {
        fetchLogs();
        
        // Auto-refresh logs every 3 seconds
        const interval = setInterval(() => {
            fetchLogs();
        }, 3000);
        
        return () => clearInterval(interval);
    }, [filter]);

    const handleDelete = async (logId) => {
        if (!confirm('Are you sure you want to delete this surveillance log entry?')) return;
        
        setDeletingId(logId);
        try {
            await axiosClient.delete(`/surveillance/surveillance-logs/${logId}`);
            setLogs(logs.filter(log => log.id !== logId));
        } catch (err) {
            setError('Failed to delete log entry');
            console.error('Error deleting log:', err);
        } finally {
            setDeletingId(null);
        }
    };

    const handleDeleteMissingPerson = async (reportId) => {
        if (!confirm('Are you sure you want to delete this missing person report? This action cannot be undone.')) return;
        
        setDeletingId(reportId);
        try {
            await axiosClient.delete(`/missing-persons/${reportId}`);
            setMissingPersonReports(missingPersonReports.filter(report => report.id !== reportId));
            console.log('✅ Missing person report deleted successfully');
        } catch (err) {
            setError('Failed to delete missing person report');
            console.error('Error deleting missing person report:', err);
        } finally {
            setDeletingId(null);
        }
    };

    const handleApproveReport = async (reportId) => {
        if (!confirm('Are you sure you want to approve this missing person report? This will create a new case.')) return;
        
        try {
            await axiosClient.put(`/missing-persons/${reportId}/approve`);
            setMissingPersonReports(missingPersonReports.filter(report => report.id !== reportId));
            alert('Missing person report approved and converted to case successfully!');
        } catch (err) {
            setError('Failed to approve report');
            console.error('Error approving report:', err);
        }
    };

    const handleRejectReport = async (reportId) => {
        const reason = prompt('Please provide a reason for rejection:');
        if (!reason) return;
        
        try {
            const formData = new FormData();
            formData.append('rejection_reason', reason);
            
            await axiosClient.put(`/missing-persons/${reportId}/reject`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMissingPersonReports(missingPersonReports.filter(report => report.id !== reportId));
            alert('Missing person report rejected successfully!');
        } catch (err) {
            setError('Failed to reject report');
            console.error('Error rejecting report:', err);
        }
    };

    const viewLogDetails = (log) => {
        setSelectedLog(log);
        setShowModal(true);
    };

    const getConfidenceBadge = (level, score) => {
        const config = {
            high: { color: 'bg-green-500/10 text-green-400 border-green-500/20', icon: CheckCircle },
            medium: { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: AlertTriangle },
            low: { color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle }
        };
        
        const { color, icon: Icon } = config[level] || config.low;
        
        return (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium ${color}`}>
                <Icon className="w-3 h-3" />
                {level.toUpperCase()} ({(score || 0).toFixed(2)})
            </div>
        );
    };

    const getMatchTypeBadge = (matchType) => {
        const config = {
            missing: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: User, label: '🔵 Missing' },
            criminal: { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: AlertTriangle, label: '🟡 Criminal' },
            terrorist: { color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle, label: '🔴 Terrorist' },
            unknown: { color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: User, label: '⚪ Unknown' }
        };
        
        const { color, icon: Icon, label } = config[matchType] || config.unknown;
        
        return (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium ${color}`}>
                <Icon className="w-3 h-3" />
                {label}
            </div>
        );
    };

    const filteredLogs = logs.filter(log => {
        if (filter === 'all') return true;
        return log.confidence_level === filter;
    });
    
    console.log('🔍 Total logs:', logs.length);
    console.log('🔍 Filtered logs:', filteredLogs.length);
    console.log('🔍 Current filter:', filter);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    // Allow access for all authenticated users
    if (user?.role !== 'admin') {
        return (
            <div className="max-w-7xl mx-auto">
                <div className="bg-surface border border-borderContent rounded-2xl p-8 text-center">
                    <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-textMain mb-2">Access Restricted</h2>
                    <p className="text-textMuted">This page is only accessible to administrators.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-textMain">Alert Activity</h1>
                    <p className="text-textMuted text-sm mt-1">
                        Monitor surveillance logs and missing person reports for approval
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Filter */}
                    <div className="flex items-center gap-2 bg-surface border border-borderContent rounded-lg px-3 py-2">
                        <Filter className="w-4 h-4 text-textMuted" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-transparent text-sm text-textMain outline-none"
                        >
                            <option value="all">All Levels</option>
                            <option value="high">High Confidence</option>
                            <option value="medium">Medium Confidence</option>
                            <option value="low">Low Confidence</option>
                        </select>
                    </div>
                    
                    {/* Refresh */}
                    <button
                        onClick={() => activeTab === 'surveillance' ? fetchLogs() : fetchMissingPersonReports()}
                        disabled={loading}
                        className="flex items-center gap-2 bg-surface border border-borderContent hover:bg-surfaceHover text-textMain px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 bg-surface border border-borderContent rounded-lg p-1">
                <button
                    onClick={() => fetchLogs()}
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all"
                >
                    <Eye className="w-4 h-4" />
                    Surveillance Logs
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-danger text-sm">
                    {error}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}

            {/* Content */}
            {!loading && (
                <>
                    {(!logs || logs.length === 0) ? (
                        <div className="bg-surface border border-borderContent rounded-2xl p-12 text-center">
                            <Eye className="w-12 h-12 text-textMuted mx-auto mb-4 opacity-30" />
                            <h3 className="text-lg font-semibold text-textMain mb-2">No surveillance logs found</h3>
                            <p className="text-textMuted text-sm">
                                {filter === 'all' 
                                    ? 'No face detection events have been logged yet.' 
                                    : `No logs with ${filter} confidence level found.`}
                            </p>
                        </div>
                    ) : (
                        <div className="bg-surface border border-borderContent rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[#18181b] border-b border-borderContent">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                                                Detected At
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                                                Person
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                                                Location
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                                                Confidence
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                                                Match Type
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-textMuted uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-borderContent">
                                        {logs && logs.length > 0 && logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-[#18181b] transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm text-textMain">
                                                        <Clock className="w-4 h-4 text-textMuted mr-2" />
                                                        {formatDate(log.detected_at)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="text-sm font-medium text-textMain">
                                                            {log.person_name || 'Unknown'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center text-sm text-textMuted">
                                                        <MapPin className="w-4 h-4 mr-2" />
                                                        {log.camera_location || 'Unknown'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getConfidenceBadge(log.confidence_level, log.confidence_score)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getMatchTypeBadge(log.match_type)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => viewLogDetails(log)}
                                                            className="text-primary hover:text-primary/80 transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(log.id)}
                                                            disabled={deletingId === log.id}
                                                            className="text-danger hover:text-danger/80 transition-colors disabled:opacity-50"
                                                            title="Delete Log"
                                                        >
                                                            {deletingId === log.id ? (
                                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Detail Modal */}
            {showModal && selectedLog && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-surface border border-borderContent rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-textMain">Surveillance Log Details</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 rounded-lg hover:bg-surfaceHover text-textMuted"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-textMuted text-sm">Detected At:</span>
                                    <p className="text-textMain">{formatDate(selectedLog.detected_at)}</p>
                                </div>
                                <div>
                                    <span className="text-textMuted text-sm">Person:</span>
                                    <p className="text-textMain">{selectedLog.person_name || 'Unknown'}</p>
                                </div>
                                <div>
                                    <span className="text-textMuted text-sm">Location:</span>
                                    <p className="text-textMain">{selectedLog.camera_location || 'Unknown'}</p>
                                </div>
                                <div>
                                    <span className="text-textMuted text-sm">Confidence:</span>
                                    <div className="mt-1">
                                        {getConfidenceBadge(selectedLog.confidence_level, selectedLog.confidence_score)}
                                    </div>
                                </div>
                            </div>
                            {selectedLog.image_path && (
                                <div>
                                    <span className="text-textMuted text-sm">Detection Image:</span>
                                    <div className="mt-2">
                                        <img 
                                            src={`http://localhost:8000/api/v1/cameras/detection-image/${selectedLog.id}`}
                                            alt="Detection"
                                            className="w-full max-w-md rounded-lg"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-2.5 border border-borderContent rounded-xl text-sm text-textMain hover:bg-surfaceHover transition-all"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    handleDelete(selectedLog.id);
                                    setShowModal(false);
                                }}
                                className="flex-1 py-2.5 bg-danger hover:bg-danger/90 text-white text-sm font-semibold rounded-xl transition-all"
                            >
                                Delete Log
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SurveillanceLog;
