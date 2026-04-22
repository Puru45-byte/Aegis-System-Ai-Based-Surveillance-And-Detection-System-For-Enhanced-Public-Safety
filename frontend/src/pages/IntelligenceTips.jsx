import React, { useState, useEffect } from 'react';
import { getTips, markTipReviewed, deleteTip } from '../api/tipsApi';
import { AlertTriangle, User, MapPin, Phone, Mail, MessageSquare, Shield, Clock, CheckCircle, Eye, Search, Filter, Trash2 } from 'lucide-react';

const IntelligenceTips = () => {
    const [tips, setTips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTip, setSelectedTip] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [tipToDelete, setTipToDelete] = useState(null);

    useEffect(() => {
        loadTips();
    }, []);

    const loadTips = async () => {
        setLoading(true);
        try {
            const response = await getTips();
            const data = response.data;
            setTips(data);
        } catch (error) {
            console.error('Error loading tips:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkReviewed = async (tipId) => {
        try {
            await markTipReviewed(tipId);
            loadTips(); // Reload tips
        } catch (error) {
            console.error('Error marking tip as reviewed:', error);
        }
    };

    const handleDeleteTip = async (tipId) => {
        try {
            await deleteTip(tipId);
            loadTips(); // Reload tips
            setShowDeleteModal(false);
            setTipToDelete(null);
        } catch (error) {
            console.error('Error deleting tip:', error);
        }
    };

    const confirmDelete = (tip) => {
        setTipToDelete(tip);
        setShowDeleteModal(true);
    };

    const getTipTypeIcon = (type) => {
        const icons = {
            criminal: '🔴',
            missing: '🟡',
            terrorist: '🟠',
            suspicious: '🔵',
            other: '⚪'
        };
        return icons[type] || '⚪';
    };

    const getTipTypeColor = (type) => {
        const colors = {
            criminal: 'red',
            missing: 'amber',
            terrorist: 'orange',
            suspicious: 'blue',
            other: 'gray'
        };
        return colors[type] || 'gray';
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            reviewed: 'bg-green-500/20 text-green-400 border-green-500/30',
            resolved: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold border capitalize ${styles[status] || styles.pending}`}>
                {status}
            </span>
        );
    };

    const filteredTips = tips.filter(tip => {
        const matchesSearch = !searchTerm || 
            tip.subject_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tip.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tip.location?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = filterStatus === 'all' || tip.status === filterStatus;
        const matchesType = filterType === 'all' || tip.tip_type === filterType;
        
        return matchesSearch && matchesStatus && matchesType;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-textMain">Intelligence Tips</h1>
                <p className="text-textMuted text-sm mt-1">
                    Review and manage community-submitted intelligence tips
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textMuted" />
                        <input
                            type="text"
                            placeholder="Search tips..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-surface border border-borderContent focus:border-primary rounded-xl py-2.5 pl-10 pr-4 text-textMain outline-none text-sm"
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-surface border border-borderContent rounded-xl py-2.5 px-4 text-textMain outline-none text-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="resolved">Resolved</option>
                    </select>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="bg-surface border border-borderContent rounded-xl py-2.5 px-4 text-textMain outline-none text-sm"
                    >
                        <option value="all">All Types</option>
                        <option value="criminal">Criminal</option>
                        <option value="missing">Missing Person</option>
                        <option value="terrorist">Terrorist</option>
                        <option value="suspicious">Suspicious</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>

            {/* Tips Grid */}
            {filteredTips.length === 0 ? (
                <div className="text-center py-24 border border-dashed border-borderContent rounded-2xl">
                    <AlertTriangle className="w-12 h-12 mx-auto text-textMuted mb-3 opacity-40" />
                    <p className="text-textMuted">No tips found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTips.map(tip => (
                        <div key={tip.id} className="bg-surface border border-borderContent rounded-2xl overflow-hidden hover:border-primary/30 transition-all">
                            {/* Header */}
                            <div className="p-4 border-b border-borderContent">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{getTipTypeIcon(tip.tip_type)}</span>
                                        <span className="text-sm font-medium text-textMain capitalize">{tip.tip_type}</span>
                                    </div>
                                    {getStatusBadge(tip.status)}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-textMuted">
                                    <Clock className="w-3 h-3" />
                                    {tip.created_at ? new Date(tip.created_at).toLocaleDateString() : 'Unknown date'}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-3">
                                {tip.subject_name && (
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-primary/60" />
                                        <span className="text-sm font-medium text-textMain">{tip.subject_name}</span>
                                    </div>
                                )}

                                {tip.location && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-primary/60" />
                                        <span className="text-sm text-textMuted">{tip.location}</span>
                                    </div>
                                )}

                                <div className="flex items-start gap-2">
                                    <MessageSquare className="w-4 h-4 text-primary/60 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-textMuted line-clamp-3">{tip.description}</p>
                                </div>

                                {/* Contact Info */}
                                {!tip.is_anonymous && (
                                    <div className="space-y-1 pt-2 border-t border-borderContent">
                                        {tip.contact_name && (
                                            <div className="flex items-center gap-2 text-xs text-textMuted">
                                                <User className="w-3 h-3" />
                                                {tip.contact_name}
                                            </div>
                                        )}
                                        {tip.contact_phone && (
                                            <div className="flex items-center gap-2 text-xs text-textMuted">
                                                <Phone className="w-3 h-3" />
                                                {tip.contact_phone}
                                            </div>
                                        )}
                                        {tip.contact_email && (
                                            <div className="flex items-center gap-2 text-xs text-textMuted">
                                                <Mail className="w-3 h-3" />
                                                {tip.contact_email}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {tip.is_anonymous && (
                                    <div className="flex items-center gap-2 pt-2 border-t border-borderContent">
                                        <Shield className="w-3 h-3 text-green-400" />
                                        <span className="text-xs text-green-400">Anonymous submission</span>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="p-4 border-t border-borderContent flex gap-2">
                                <button
                                    onClick={() => setSelectedTip(tip)}
                                    className="flex-1 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    View Details
                                </button>
                                {tip.status === 'pending' && (
                                    <button
                                        onClick={() => handleMarkReviewed(tip.id)}
                                        className="flex-1 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 font-medium text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        Mark Reviewed
                                    </button>
                                )}
                                <button
                                    onClick={() => confirmDelete(tip)}
                                    className="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                                    title="Delete Tip"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {selectedTip && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface border border-borderContent rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-borderContent">
                            <h2 className="text-xl font-bold text-textMain">Tip Details</h2>
                            <button
                                onClick={() => setSelectedTip(null)}
                                className="p-2 rounded-lg hover:bg-surfaceHover text-textMuted"
                            >
                                <AlertTriangle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Header Info */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{getTipTypeIcon(selectedTip.tip_type)}</span>
                                    <div>
                                        <h3 className="font-semibold text-textMain capitalize">{selectedTip.tip_type}</h3>
                                        <p className="text-sm text-textMuted">
                                            {selectedTip.created_at ? new Date(selectedTip.created_at).toLocaleString() : 'Unknown date'}
                                        </p>
                                    </div>
                                </div>
                                {getStatusBadge(selectedTip.status)}
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedTip.subject_name && (
                                    <div>
                                        <label className="text-xs font-medium text-textMuted">Subject Name</label>
                                        <p className="text-sm text-textMain mt-1">{selectedTip.subject_name}</p>
                                    </div>
                                )}
                                {selectedTip.location && (
                                    <div>
                                        <label className="text-xs font-medium text-textMuted">Location</label>
                                        <p className="text-sm text-textMain mt-1">{selectedTip.location}</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-medium text-textMuted">Description</label>
                                <p className="text-sm text-textMain mt-1 leading-relaxed">{selectedTip.description}</p>
                            </div>

                            {/* Contact Information */}
                            <div>
                                <h4 className="text-sm font-medium text-textMuted mb-3">Contact Information</h4>
                                {selectedTip.is_anonymous ? (
                                    <div className="flex items-center gap-2 text-green-400">
                                        <Shield className="w-4 h-4" />
                                        <span className="text-sm">Anonymous submission</span>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedTip.contact_name && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <User className="w-4 h-4 text-primary/60" />
                                                <span>{selectedTip.contact_name}</span>
                                            </div>
                                        )}
                                        {selectedTip.contact_phone && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Phone className="w-4 h-4 text-primary/60" />
                                                <span>{selectedTip.contact_phone}</span>
                                            </div>
                                        )}
                                        {selectedTip.contact_email && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="w-4 h-4 text-primary/60" />
                                                <span>{selectedTip.contact_email}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-borderContent">
                                <button
                                    onClick={() => setSelectedTip(null)}
                                    className="flex-1 py-2.5 border border-borderContent rounded-xl text-sm text-textMuted hover:bg-surfaceHover transition-all"
                                >
                                    Close
                                </button>
                                {selectedTip.status === 'pending' && (
                                    <button
                                        onClick={() => {
                                            handleMarkReviewed(selectedTip.id);
                                            setSelectedTip(null);
                                        }}
                                        className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Mark as Reviewed
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        confirmDelete(selectedTip);
                                        setSelectedTip(null);
                                    }}
                                    className="py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-medium text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && tipToDelete && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface border border-borderContent rounded-2xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                                <Trash2 className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-textMain">Delete Tip</h3>
                                <p className="text-sm text-textMuted">This action cannot be undone</p>
                            </div>
                        </div>
                        
                        <p className="text-textMain mb-6">
                            Are you sure you want to delete this {tipToDelete.tip_type} tip from {tipToDelete.created_at ? new Date(tipToDelete.created_at).toLocaleDateString() : 'unknown date'}?
                        </p>
                        
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setTipToDelete(null);
                                }}
                                className="px-4 py-2 border border-borderContent rounded-xl text-sm text-textMuted hover:bg-surfaceHover transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteTip(tipToDelete.id)}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium text-sm rounded-xl transition-all flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Tip
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IntelligenceTips;
