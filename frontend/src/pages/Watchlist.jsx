import React, { useState, useEffect, useRef } from 'react';
import { getCases, createCase, updateCase, deleteCase, uploadCasePhoto, getCasePhotoUrl } from '../api/watchlistApi';
import { FolderOpen, Plus, Pencil, Trash2, X, Loader2, Upload, ImageOff, UserCircle2, UserPlus } from 'lucide-react';

const ThreatBadge = ({ level }) => {
    const styles = {
        high: 'bg-red-500/20 text-red-400 border-red-500/30',
        medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        low: 'bg-green-500/20 text-green-400 border-green-500/30',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${styles[level] || styles.low}`}>
            {level}
        </span>
    );
};

const StatusBadge = ({ status }) => {
    const styles = {
        active: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        closed: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
        pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${styles[status] || ''}`}>
            {status}
        </span>
    );
};

const getMissingPersonPhotoUrl = (id) => {
    return `/api/v1/missing-persons/${id}/photo`;
};

const CaseModal = ({ caseData, onClose, onSave }) => {
    const [form, setForm] = useState(caseData || {
        title: '', description: '', suspect_name: '', location: '', threat_level: 'medium', status: 'active'
    });
    const [saving, setSaving] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(caseData?.photo_path ? getCasePhotoUrl(caseData.id) : null);
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef();

    const handlePhotoChange = (file) => {
        if (!file || !file.type.startsWith('image/')) return;
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        handlePhotoChange(file);
    };

    const handleSave = async () => {
        if (!form.title) return;
        setSaving(true);
        try {
            await onSave(form, photoFile);  // pass photoFile to parent
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface border border-borderContent rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-borderContent">
                    <h2 className="text-lg font-bold text-textMain">{caseData ? 'Edit Case' : 'New Case'}</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-surfaceHover text-textMuted"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Photo Upload */}
                    <div>
                        <label className="text-sm font-medium text-textMuted mb-2 block">Subject Photo</label>
                        <div
                            className={`relative border-2 border-dashed rounded-2xl transition-all duration-200 overflow-hidden
                                ${dragging ? 'border-primary bg-primary/10' : 'border-borderContent hover:border-primary/50'}`}
                            style={{ minHeight: '180px' }}
                            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handlePhotoChange(e.target.files[0])}
                            />
                            {photoPreview ? (
                                <div className="relative group cursor-pointer">
                                    <img
                                        src={photoPreview}
                                        alt="Subject"
                                        className="w-full object-cover rounded-2xl"
                                        style={{ maxHeight: '260px', objectPosition: 'top' }}
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                                        <p className="text-white text-sm font-medium flex items-center gap-2">
                                            <Upload className="w-4 h-4" /> Change Photo
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 cursor-pointer text-textMuted">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                                        <Upload className="w-7 h-7 text-primary/60" />
                                    </div>
                                    <p className="text-sm font-medium text-textMain">Drag & drop or click to upload</p>
                                    <p className="text-xs text-textMuted mt-1 opacity-70">PNG, JPG, WEBP — subject face photo</p>
                                </div>
                            )}
                        </div>
                        {photoFile && (
                            <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                {photoFile.name} selected
                            </p>
                        )}
                    </div>

                    {/* Text Fields */}
                    {[
                        { label: 'Case Title *', key: 'title', type: 'text' },
                        { label: 'Suspect / Subject Name', key: 'suspect_name', type: 'text' },
                        { label: 'Last Known Location', key: 'location', type: 'text' },
                    ].map(f => (
                        <div key={f.key}>
                            <label className="text-sm text-textMuted mb-1 block">{f.label}</label>
                            <input
                                type={f.type}
                                value={form[f.key] || ''}
                                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                className="w-full bg-[#18181b] border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm"
                            />
                        </div>
                    ))}

                    <div>
                        <label className="text-sm text-textMuted mb-1 block">Case Description</label>
                        <textarea
                            value={form.description || ''}
                            rows={3}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            className="w-full bg-[#18181b] border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-textMuted mb-1 block">Threat Level</label>
                            <select
                                value={form.threat_level}
                                onChange={e => setForm({ ...form, threat_level: e.target.value })}
                                className="w-full bg-[#18181b] border border-borderContent rounded-xl py-2.5 px-4 text-textMain outline-none text-sm"
                            >
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-textMuted mb-1 block">Status</label>
                            <select
                                value={form.status}
                                onChange={e => setForm({ ...form, status: e.target.value })}
                                className="w-full bg-[#18181b] border border-borderContent rounded-xl py-2.5 px-4 text-textMain outline-none text-sm"
                            >
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 p-6 border-t border-borderContent">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-borderContent rounded-xl text-sm text-textMuted hover:bg-surfaceHover transition-all">Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !form.title}
                        className="flex-1 py-2.5 bg-primary rounded-xl text-sm text-white font-semibold hover:bg-primaryHover transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Case'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const CaseManagement = () => {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editCase, setEditCase] = useState(null);

    const load = async () => {
        setLoading(true);
        try { const { data } = await getCases(); setCases(data); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleSave = async (form, photoFile) => {
        let saved;
        if (editCase) {
            const { data } = await updateCase(editCase.id, form);
            saved = data;
        } else {
            const { data } = await createCase(form);
            saved = data;
        }
        // Upload photo BEFORE closing modal and reloading
        if (photoFile && saved?.id) {
            await uploadCasePhoto(saved.id, photoFile);
        }
        setShowModal(false);
        setEditCase(null);
        load();
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this case?')) return;
        await deleteCase(id);
        load();
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {showModal && (
                <CaseModal
                    caseData={editCase}
                    onClose={() => { setShowModal(false); setEditCase(null); }}
                    onSave={handleSave}
                />
            )}

            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-textMain">Case Management</h1>
                    <p className="text-textMuted text-sm mt-1">Manage all active investigations and suspect cases.</p>
                </div>
                <button
                    onClick={() => { setEditCase(null); setShowModal(true); }}
                    className="flex items-center bg-primary hover:bg-primaryHover text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                >
                    <Plus className="w-4 h-4 mr-2" /> New Case
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : cases.length === 0 ? (
                <div className="text-center py-24 border border-dashed border-borderContent rounded-2xl">
                    <FolderOpen className="w-12 h-12 mx-auto text-textMuted mb-3 opacity-40" />
                    <p className="text-textMuted">No cases found. Create the first case above.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {cases.map(c => (
                        <div key={c.id} className="group bg-gradient-to-br from-surface to-surface/50 backdrop-blur-sm border border-borderContent/50 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all duration-300">
                            {/* Header with photo */}
                            <div className="relative h-48 bg-gradient-to-br from-[#1a1a1f] to-[#0f0f11] overflow-hidden">
                                {c.photo_path ? (
                                    <img
                                        src={c.is_missing_person ? getMissingPersonPhotoUrl(c.id) : getCasePhotoUrl(c.id)}
                                        alt={c.suspect_name || c.missing_person_name || 'Subject'}
                                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                    />
                                ) : null}
                                <div className={`absolute inset-0 flex items-center justify-center ${c.photo_path ? 'hidden' : 'flex'}`}>
                                    <div className="text-center">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center mb-3 mx-auto">
                                            <UserCircle2 className="w-12 h-12 text-primary/60" />
                                        </div>
                                        <p className="text-sm text-textMuted/70">No Photo</p>
                                    </div>
                                </div>
                                
                                {/* Overlay gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                                
                                {/* Status badge overlay */}
                                <div className="absolute top-3 right-3 flex items-center gap-2">
                                    {/* Missing Person indicator */}
                                    {c.is_missing_person && (
                                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-blue-500/80 text-white border border-blue-400/50 backdrop-blur-sm">
                                            <UserPlus className="w-3 h-3" />
                                            Missing Person
                                        </div>
                                    )}
                                    <StatusBadge status={c.status} />
                                </div>
                                
                                {/* Threat level indicator */}
                                <div className="absolute bottom-3 left-3">
                                    <div className={`px-2 py-1 rounded-lg text-xs font-bold backdrop-blur-sm border ${
                                        c.threat_level === 'high' ? 'bg-red-500/80 text-white border-red-400/50' :
                                        c.threat_level === 'medium' ? 'bg-amber-500/80 text-white border-amber-400/50' :
                                        'bg-green-500/80 text-white border-green-400/50'
                                    }`}>
                                        {c.threat_level?.toUpperCase()}
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5 space-y-4">
                                {/* Title and actions */}
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-textMain text-lg leading-tight truncate group-hover:text-primary transition-colors">
                                            {c.title}
                                        </h3>
                                        {(c.suspect_name || c.missing_person_name) && (
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                                                <p className="text-sm font-medium text-textMuted">
                                                    {c.suspect_name || c.missing_person_name}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => { setEditCase(c); setShowModal(true); }}
                                            className="p-2 text-textMuted hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                            title="Edit Case"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(c.id)}
                                            className="p-2 text-textMuted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                            title="Delete Case"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Description */}
                                {c.description && (
                                    <p className="text-sm text-textMuted/80 leading-relaxed line-clamp-2 group-hover:line-clamp-3 transition-all">
                                        {c.description}
                                    </p>
                                )}

                                {/* Location and date */}
                                <div className="space-y-2">
                                    {(c.location || c.last_seen_location) && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                            <span className="text-textMuted/90">📍 {c.location || c.last_seen_location}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between text-xs text-textMuted/60">
                                        <span>Created {c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { 
                                            month: 'short', 
                                            day: 'numeric', 
                                            year: 'numeric' 
                                        }) : ''}</span>
                                        <ThreatBadge level={c.threat_level} />
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => { setEditCase(c); setShowModal(true); }}
                                        className="flex-1 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(c.id)}
                                        className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CaseManagement;
