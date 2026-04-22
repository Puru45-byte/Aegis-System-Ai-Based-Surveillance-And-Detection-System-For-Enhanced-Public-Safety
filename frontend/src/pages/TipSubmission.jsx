import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { submitTip } from '../api/tipsApi';
import { getCases } from '../api/watchlistApi';
import { AlertTriangle, User, MapPin, Phone, Mail, MessageSquare, Send, Shield, Clock, CheckCircle, Search, UserCheck } from 'lucide-react';
import { handleApiError } from '../utils/errorHandler';

const TipSubmission = () => {
    const [form, setForm] = useState({
        tip_type: 'criminal',
        subject_name: '',
        description: '',
        location: '',
        contact_name: '',
        contact_phone: '',
        contact_email: '',
        is_anonymous: false,
        suspect_id: null
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [suspects, setSuspects] = useState([]);
    const [loadingSuspects, setLoadingSuspects] = useState(false);
    const [suspectSearch, setSuspectSearch] = useState('');

    // Load suspects from database
    useEffect(() => {
        const loadSuspects = async () => {
            setLoadingSuspects(true);
            try {
                const { data } = await getCases();
                // Filter only active cases with suspect names
                const activeSuspects = data.filter(c => 
                    c.status === 'active' && c.suspect_name && c.suspect_name.trim()
                );
                setSuspects(activeSuspects);
            } catch (err) {
                console.error('Error loading suspects:', err);
            } finally {
                setLoadingSuspects(false);
            }
        };
        loadSuspects();
    }, []);

    // Filter suspects based on search
    const filteredSuspects = suspects.filter(suspect =>
        suspect.suspect_name.toLowerCase().includes(suspectSearch.toLowerCase()) ||
        suspect.title.toLowerCase().includes(suspectSearch.toLowerCase())
    );

    // Handle suspect selection
    const handleSuspectSelect = (suspect) => {
        setForm({
            ...form,
            suspect_id: suspect.id,
            subject_name: suspect.suspect_name,
            description: form.description || `I saw ${suspect.suspect_name} near [location]. ${suspect.description ? `Known for: ${suspect.description}` : ''}`
        });
        setSuspectSearch('');
    };

    // Clear suspect selection
    const clearSuspectSelection = () => {
        setForm({
            ...form,
            suspect_id: null,
            subject_name: '',
            description: form.description.replace(/^I saw [^.]+\.\s*/, '').replace(/Known for: [^.]+\.\s*/, '')
        });
    };

    const tipTypes = [
        { value: 'criminal', label: 'Criminal Activity', icon: '🔴', color: 'red' },
        { value: 'missing', label: 'Missing Person', icon: '🟡', color: 'amber' },
        { value: 'terrorist', label: 'Terrorist Activity', icon: '🟠', color: 'orange' },
        { value: 'suspicious', label: 'Suspicious Activity', icon: '🔵', color: 'blue' },
        { value: 'other', label: 'Other', icon: '⚪', color: 'gray' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Enhanced validation
        if (!form.description || !form.description.trim()) {
            setError('Please provide a description of the tip');
            return;
        }
        
        // Ensure required fields have values
        if (!form.tip_type) {
            setError('Please select a tip type');
            return;
        }
        
        if (typeof form.is_anonymous !== 'boolean') {
            setError('Invalid anonymous setting');
            return;
        }

        setSubmitting(true);
        setError('');
        
        try {
            // Always include required fields, even if they have default values
            const submitData = {
                tip_type: form.tip_type,
                description: form.description,
                is_anonymous: form.is_anonymous
            };
            
            // Optional fields - only include if they have values
            if (form.subject_name && form.subject_name.trim()) {
                submitData.subject_name = form.subject_name;
            }
            if (form.location && form.location.trim()) {
                submitData.location = form.location;
            }
            if (form.contact_name && form.contact_name.trim()) {
                submitData.contact_name = form.contact_name;
            }
            if (form.contact_phone && form.contact_phone.trim()) {
                submitData.contact_phone = form.contact_phone;
            }
            if (form.contact_email && form.contact_email.trim()) {
                submitData.contact_email = form.contact_email;
            }
            if (form.suspect_id && form.suspect_id > 0) {
                submitData.suspect_id = form.suspect_id;
            }
            
            console.log('🔍 DEBUG: Form state before submission:', JSON.stringify(form, null, 2));
            console.log('🔍 DEBUG: Submitting tip with cleaned data:', JSON.stringify(submitData, null, 2));
            console.log('🔍 DEBUG: Required fields check:');
            console.log('  - tip_type:', JSON.stringify(submitData.tip_type));
            console.log('  - description:', JSON.stringify(submitData.description));
            console.log('  - is_anonymous:', JSON.stringify(submitData.is_anonymous));
            console.log('  - description type:', typeof submitData.description);
            console.log('  - description length:', submitData.description?.length);
            console.log('  - description trimmed:', JSON.stringify(submitData.description?.trim()));
            console.log('🔍 DEBUG: SubmitData keys:', Object.keys(submitData));
            console.log('🔍 DEBUG: SubmitData values:', submitData);
            
            // Log the exact request that will be sent
            console.log('🔍 DEBUG: About to send request with payload:', JSON.stringify(submitData, null, 2));
            
            await submitTip(submitData);
            setSubmitted(true);
            // Reset form
            setForm({
                tip_type: 'criminal',
                subject_name: '',
                description: '',
                location: '',
                contact_name: '',
                contact_phone: '',
                contact_email: '',
                is_anonymous: false,
                suspect_id: null
            });
            setSuspectSearch('');
        } catch (error) {
            setError(handleApiError(error));
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-8 text-center">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-textMain mb-2">Tip Submitted Successfully</h2>
                    <p className="text-textMuted mb-6">
                        Thank you for your contribution to community safety. Your tip has been received and will be reviewed by our team.
                    </p>
                    <div className="bg-surface/50 rounded-xl p-4 text-left space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                            <Shield className="w-4 h-4 text-green-400" />
                            <span className="text-textMuted">Your identity is protected</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Clock className="w-4 h-4 text-blue-400" />
                            <span className="text-textMuted">Response time: 24-48 hours</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                            <span className="text-textMuted">In case of emergency, call 911 immediately</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setSubmitted(false)}
                        className="mt-6 px-6 py-2.5 bg-primary hover:bg-primaryHover text-white font-medium rounded-xl transition-all"
                    >
                        Submit Another Tip
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-textMain">Submit Anonymous Tip</h1>
                    <p className="text-textMuted text-sm mt-1">
                        Help keep our community safe by reporting suspicious activities, missing persons, or criminal behavior
                    </p>
                </div>
            </div>

            {/* Security Notice */}
            <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-textMain text-sm">Your Privacy is Protected</h3>
                        <p className="text-xs text-textMuted mt-1">
                            All tips are confidential. You can choose to remain anonymous. Your information will never be shared without your consent.
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tip Type Selection */}
                <div>
                    <label className="text-sm font-medium text-textMuted mb-3 block">Tip Type</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {tipTypes.map(type => (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => setForm({ ...form, tip_type: type.value })}
                                className={`p-3 rounded-xl border-2 transition-all text-left ${
                                    form.tip_type === type.value
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-borderContent hover:border-primary/50 text-textMuted'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{type.icon}</span>
                                    <span className="text-sm font-medium">{type.label}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Suspect Selection */}
                <div>
                    <label className="text-sm font-medium text-textMuted mb-3 block">Known Suspect (Optional)</label>
                    
                    {/* Selected Suspect Display */}
                    {form.suspect_id && (() => {
                        const selectedSuspect = suspects.find(s => s.id === form.suspect_id);
                        return selectedSuspect ? (
                            <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 mb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                                            <UserCheck className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-textMain">{selectedSuspect.suspect_name}</p>
                                            <p className="text-xs text-textMuted">{selectedSuspect.title}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={clearSuspectSelection}
                                        className="text-textMuted hover:text-red-400 transition-colors"
                                    >
                                        <AlertTriangle className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : null;
                    })()}

                    {/* Suspect Search */}
                    {!form.suspect_id && (
                        <div className="relative">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textMuted" />
                                <input
                                    type="text"
                                    placeholder="Search for known suspects..."
                                    value={suspectSearch}
                                    onChange={(e) => setSuspectSearch(e.target.value)}
                                    className="w-full bg-surface border border-borderContent focus:border-primary rounded-xl py-2.5 pl-10 pr-4 text-textMain outline-none text-sm"
                                />
                            </div>
                            
                            {/* Suspect Dropdown */}
                            {suspectSearch && (
                                <div className="absolute z-10 w-full mt-2 bg-surface border border-borderContent rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                    {loadingSuspects ? (
                                        <div className="p-4 text-center text-textMuted">
                                            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
                                        </div>
                                    ) : filteredSuspects.length > 0 ? (
                                        filteredSuspects.map(suspect => (
                                            <button
                                                key={suspect.id}
                                                type="button"
                                                onClick={() => handleSuspectSelect(suspect)}
                                                className="w-full p-3 text-left hover:bg-surfaceHover transition-colors border-b border-borderContent last:border-b-0"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {suspect.photo_path ? (
                                                        <img
                                                            src={`/api/v1/cases/${suspect.id}/photo`}
                                                            alt={suspect.suspect_name}
                                                            className="w-8 h-8 rounded-full object-cover"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div className={`w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center ${suspect.photo_path ? 'hidden' : 'flex'}`}>
                                                        <User className="w-4 h-4 text-primary/60" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-textMain truncate">{suspect.suspect_name}</p>
                                                        <p className="text-xs text-textMuted truncate">{suspect.title}</p>
                                                    </div>
                                                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                                                        suspect.threat_level === 'high' ? 'bg-red-500/20 text-red-400' :
                                                        suspect.threat_level === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                                        'bg-green-500/20 text-green-400'
                                                    }`}>
                                                        {suspect.threat_level}
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    ) : suspectSearch ? (
                                        <div className="p-4 text-center text-textMuted">
                                            <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                            <p className="text-sm">No suspects found</p>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    )}
                    
                    <p className="text-xs text-textMuted mt-2">
                        Select a known suspect from the database or enter details manually below
                    </p>
                </div>

                {/* Subject Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-textMuted mb-1 block">
                            Subject Name {form.suspect_id && '(Selected from database)'}
                        </label>
                        <input
                            type="text"
                            value={form.subject_name}
                            onChange={e => setForm({ ...form, subject_name: e.target.value })}
                            disabled={!!form.suspect_id}
                            className="w-full bg-surface border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder={form.suspect_id ? "Selected from database" : "Name of person involved"}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-textMuted mb-1 block">
                            Location
                        </label>
                        <input
                            type="text"
                            value={form.location}
                            onChange={e => setForm({ ...form, location: e.target.value })}
                            className="w-full bg-surface border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm"
                            placeholder="Where this occurred"
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="text-sm font-medium text-textMuted mb-1 block">
                        Detailed Description *
                    </label>
                    <textarea
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        rows={5}
                        className="w-full bg-surface border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm resize-none"
                        placeholder="Provide as much detail as possible about what you observed..."
                        required
                    />
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-textMuted">Contact Information</label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.is_anonymous}
                                onChange={e => setForm({ ...form, is_anonymous: e.target.checked })}
                                className="w-4 h-4 rounded border-borderContent bg-surface text-primary focus:ring-primary/20"
                            />
                            <span className="text-sm text-textMuted">Submit anonymously</span>
                        </label>
                    </div>

                    {!form.is_anonymous && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium text-textMuted mb-1 block">Your Name</label>
                                <input
                                    type="text"
                                    value={form.contact_name}
                                    onChange={e => setForm({ ...form, contact_name: e.target.value })}
                                    className="w-full bg-surface border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm"
                                    placeholder="Your name"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-textMuted mb-1 block">Phone Number</label>
                                <input
                                    type="tel"
                                    value={form.contact_phone}
                                    onChange={e => setForm({ ...form, contact_phone: e.target.value })}
                                    className="w-full bg-surface border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm"
                                    placeholder="Your phone"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-textMuted mb-1 block">Email</label>
                                <input
                                    type="email"
                                    value={form.contact_email}
                                    onChange={e => setForm({ ...form, contact_email: e.target.value })}
                                    className="w-full bg-surface border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm"
                                    placeholder="Your email"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 py-3 bg-primary hover:bg-primaryHover text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {submitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Submit Tip
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Emergency Notice */}
            <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-textMain text-sm">Emergency?</h3>
                        <p className="text-xs text-textMuted mt-1">
                            If this is an emergency or crime in progress, call 911 immediately. This tip form is for non-emergency reports.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TipSubmission;
