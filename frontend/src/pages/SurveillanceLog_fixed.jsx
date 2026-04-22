import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useSelector } from 'react-redux';
import { Eye, Trash2, Calendar, MapPin, User, AlertTriangle, CheckCircle, XCircle, Clock, Filter, RefreshCw, UserPlus } from 'lucide-react';

const SurveillanceLog = () => {
    const [logs, setLogs] = useState([]);
    const [missingPersonReports, setMissingPersonReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedLog, setSelectedLog] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('all'); // all, high, medium, low
    const [deletingId, setDeletingId] = useState(null);
    const [activeTab, setActiveTab] = useState('surveillance'); // surveillance, missing-persons

    const { user } = useSelector((state) => state.auth);

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await axiosClient.get('/surveillance/surveillance-logs');
            setLogs(data);
        } catch (err) {
            setError('Failed to fetch surveillance logs');
            console.error('Error fetching logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMissingPersonReports = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await axiosClient.get('/missing-persons/pending');
            setMissingPersonReports(data);
        } catch (err) {
            setError('Failed to fetch missing person reports');
            console.error('Error fetching missing person reports:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'surveillance') {
            fetchLogs();
        } else {
            fetchMissingPersonReports();
        }
    }, [activeTab]);

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
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
                <Icon className="w-3 h-3" />
                {Math.round(score * 100)}%
            </span>
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const filteredLogs = logs.filter(log => {
        if (filter === 'all') return true;
        return log.confidence_level === filter;
    });

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
                    onClick={() => setActiveTab('surveillance')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        activeTab === 'surveillance'
                            ? 'bg-primary text-white'
                            : 'text-textMuted hover:text-textMain'
                    }`}
                >
                    <Eye className="w-4 h-4" />
                    Surveillance Logs
                </button>
                <button
                    onClick={() => setActiveTab('missing-persons')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        activeTab === 'missing-persons'
                            ? 'bg-primary text-white'
                            : 'text-textMuted hover:text-textMain'
                    }`}
                >
                    <UserPlus className="w-4 h-4" />
                    Missing Person Reports
                    {missingPersonReports.length > 0 && (
                        <span className="bg-danger text-white text-xs px-2 py-0.5 rounded-full">
                            {missingPersonReports.length}
                        </span>
                    )}
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

            {/* Content based on active tab */}
            {!loading && (
                <>
                    {activeTab === 'surveillance' ? (
                        <>
                            {filteredLogs.length === 0 ? (
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
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-borderContent">
                                                {filteredLogs.map((log) => (
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
                                                                        <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-danger"></div>
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
                    ) : (
                        <>
                            {missingPersonReports.length === 0 ? (
                                <div className="bg-surface border border-borderContent rounded-2xl p-12 text-center">
                                    <UserPlus className="w-12 h-12 text-textMuted mx-auto mb-4 opacity-30" />
                                    <h3 className="text-lg font-semibold text-textMain mb-2">No pending missing person reports</h3>
                                    <p className="text-textMuted text-sm">
                                        All missing person reports have been processed or no reports have been submitted yet.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {missingPersonReports.map((report) => (
                                        <div key={report.id} className="bg-surface border border-borderContent rounded-2xl p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    {report.photo_path && (
                                                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#18181b]">
                                                            <img 
                                                                src={`http://localhost:8000/api/v1/missing-persons/${report.id}/photo`}
                                                                alt={report.missing_person_name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    e.target.nextSibling.style.display = 'flex';
                                                                }}
                                                            />
                                                            <div className="w-full h-full items-center justify-center text-textMuted" style={{display: 'none'}}>
                                                                <UserPlus className="w-6 h-6" />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-textMain">{report.missing_person_name}</h3>
                                                        <div className="flex items-center gap-4 mt-1 text-sm text-textMuted">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-4 h-4" />
                                                                {formatDate(report.last_seen_date)}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="w-4 h-4" />
                                                                {report.last_seen_location}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleApproveReport(report.id)}
                                                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm transition-all"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectReport(report.id)}
                                                        className="flex items-center gap-2 bg-danger hover:bg-danger/90 text-white px-4 py-2 rounded-lg text-sm transition-all"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-textMuted">Age:</span>
                                                    <span className="ml-2 text-textMain">{report.age || 'Not specified'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-textMuted">Gender:</span>
                                                    <span className="ml-2 text-textMain">{report.gender || 'Not specified'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-textMuted">Contact:</span>
                                                    <span className="ml-2 text-textMain">{report.contact_phone}</span>
                                                </div>
                                                <div>
                                                    <span className="text-textMuted">Submitted:</span>
                                                    <span className="ml-2 text-textMain">{formatDate(report.created_at)}</span>
                                                </div>
                                            </div>
                                            
                                            {report.circumstances && (
                                                <div className="mt-4">
                                                    <span className="text-textMuted text-sm">Circumstances:</span>
                                                    <p className="text-textMain text-sm mt-1">{report.circumstances}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default SurveillanceLog;
