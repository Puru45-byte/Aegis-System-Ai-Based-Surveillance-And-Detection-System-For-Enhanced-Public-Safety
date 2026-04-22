import React, { useState } from 'react';
import { submitMissingPersonReport } from '../api/missingPersonApi';
import { User, MapPin, Phone, Mail, Calendar, AlertTriangle, Send, Shield, Clock, CheckCircle, Upload, Image as ImageIcon, X, UserPlus } from 'lucide-react';

const MissingPersonReport = () => {
    const [form, setForm] = useState({
        missing_person_name: '',
        age: '',
        gender: '',
        height: '',
        weight: '',
        hair_color: '',
        eye_color: '',
        clothing_description: '',
        last_seen_location: '',
        last_seen_date: '',
        last_seen_time: '',
        circumstances: '',
        medical_conditions: '',
        contact_name: '',
        contact_phone: '',
        contact_email: '',
        relationship_to_missing: '',
        is_anonymous: false,
        photo_file: null
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [photoPreview, setPhotoPreview] = useState(null);
    const [dragging, setDragging] = useState(false);

    const handlePhotoChange = (file) => {
        if (!file || !file.type.startsWith('image/')) {
            setError('Please select a valid image file');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('Photo size should be less than 5MB');
            return;
        }
        
        setForm({ ...form, photo_file: file });
        setPhotoPreview(URL.createObjectURL(file));
        setError('');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        handlePhotoChange(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!form.missing_person_name.trim()) {
            setError('Please provide the missing person\'s name');
            return;
        }
        if (!form.last_seen_location.trim()) {
            setError('Please provide the last seen location');
            return;
        }
        if (!form.last_seen_date) {
            setError('Please provide the last seen date');
            return;
        }
        if (!form.contact_phone.trim()) {
            setError('Please provide a contact phone number');
            return;
        }

        setSubmitting(true);
        setError('');
        
        try {
            await submitMissingPersonReport(form);
            setSubmitted(true);
            
            // Reset form
            setForm({
                missing_person_name: '',
                age: '',
                gender: '',
                height: '',
                weight: '',
                hair_color: '',
                eye_color: '',
                clothing_description: '',
                last_seen_location: '',
                last_seen_date: '',
                last_seen_time: '',
                circumstances: '',
                medical_conditions: '',
                contact_name: '',
                contact_phone: '',
                contact_email: '',
                relationship_to_missing: '',
                is_anonymous: false,
                photo_file: null
            });
            setPhotoPreview(null);
            
        } catch (err) {
            setError('Failed to submit report. Please try again.');
            console.error('Missing person report error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/30 rounded-2xl p-8 text-center">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-textMain mb-2">Report Submitted Successfully</h2>
                    <p className="text-textMuted mb-6">
                        Thank you for reporting this missing person. Your report has been received and will be reviewed immediately by our team.
                    </p>
                    <div className="bg-surface/50 rounded-xl p-4 text-left space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                            <Clock className="w-4 h-4 text-blue-400" />
                            <span className="text-textMuted">Response time: Within 24 hours</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Shield className="w-4 h-4 text-green-400" />
                            <span className="text-textMuted">Your information is kept confidential</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                            <span className="text-textMuted">In case of immediate danger, call emergency services</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setSubmitted(false)}
                        className="mt-6 px-6 py-2.5 bg-primary hover:bg-primaryHover text-white font-medium rounded-xl transition-all"
                    >
                        Submit Another Report
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                    <UserPlus className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-textMain">Missing Person Report</h1>
                    <p className="text-textMuted text-sm mt-1">
                        Help locate missing individuals by providing detailed information about the person and circumstances
                    </p>
                </div>
            </div>

            {/* Security Notice */}
            <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold text-textMain text-sm">Important Information</h3>
                        <p className="text-xs text-textMuted mt-1">
                            All reports are treated with urgency and confidentiality. Please provide as much detail as possible to help in the search efforts.
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Missing Person Information */}
                <div className="bg-surface border border-borderContent rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-textMain flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Missing Person Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-textMuted mb-1 block">Full Name *</label>
                            <input
                                type="text"
                                value={form.missing_person_name}
                                onChange={e => setForm({ ...form, missing_person_name: e.target.value })}
                                className="w-full bg-surface border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm"
                                placeholder="Enter full name"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-textMuted mb-1 block">Age</label>
                            <input
                                type="text"
                                value={form.age}
                                onChange={e => setForm({ ...form, age: e.target.value })}
                                className="w-full bg-surface border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm"
                                placeholder="Age or age range"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-textMuted mb-1 block">Gender</label>
                            <select
                                value={form.gender}
                                onChange={e => setForm({ ...form, gender: e.target.value })}
                                className="w-full bg-surface border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm"
                            >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-textMuted mb-1 block">Height</label>
                            <input
                                type="text"
                                value={form.height}
                                onChange={e => setForm({ ...form, height: e.target.value })}
                                className="w-full bg-surface border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm"
                                placeholder="e.g., 5'10&quot; or 178cm"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-textMuted mb-1 block">Weight</label>
                            <input
                                type="text"
                                value={form.weight}
                                onChange={e => setForm({ ...form, weight: e.target.value })}
                                className="w-full bg-surface border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm"
                                placeholder="e.g., 150 lbs or 68kg"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-textMuted mb-1 block">Hair Color</label>
                            <input
                                type="text"
                                value={form.hair_color}
                                onChange={e => setForm({ ...form, hair_color: e.target.value })}
                                className="w-full bg-surface border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm"
                                placeholder="e.g., Brown, Black, Blonde"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-textMuted mb-1 block">Eye Color</label>
                            <input
                                type="text"
                                value={form.eye_color}
                                onChange={e => setForm({ ...form, eye_color: e.target.value })}
                                className="w-full bg-surface border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm"
                                placeholder="e.g., Brown, Blue, Green"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-textMuted mb-1 block">Clothing Description</label>
                        <textarea
                            value={form.clothing_description}
                            onChange={e => setForm({ ...form, clothing_description: e.target.value })}
                            rows={3}
                            className="w-full bg-surface border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm resize-none"
                            placeholder="Describe what the person was wearing when last seen"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-textMuted mb-1 block">Medical Conditions or Special Needs</label>
                        <textarea
                            value={form.medical_conditions}
                            onChange={e => setForm({ ...form, medical_conditions: e.target.value })}
                            rows={3}
                            className="w-full bg-surface border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm resize-none"
                            placeholder="Any medical conditions, medications, or special needs that may be relevant"
                        />
                    </div>
                </div>

                {/* Photo Upload */}
                <div className="bg-surface border border-borderContent rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-textMain mb-4 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        Photo (Optional but Recommended)
                    </h3>
                    
                    <div
                        className={`relative border-2 border-dashed rounded-2xl transition-all duration-200 overflow-hidden
                            ${dragging ? 'border-primary bg-primary/10' : 'border-borderContent hover:border-primary/50'}`}
                        style={{ minHeight: '200px' }}
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoChange(e.target.files[0])}
                            className="hidden"
                            id="photo-upload"
                        />
                        
                        {photoPreview ? (
                            <div className="relative group cursor-pointer" onClick={() => document.getElementById('photo-upload').click()}>
                                <img
                                    src={photoPreview}
                                    alt="Missing person"
                                    className="w-full h-full object-contain p-4"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                                    <p className="text-white text-sm font-medium flex items-center gap-2">
                                        <Upload className="w-4 h-4" /> Change Photo
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPhotoPreview(null);
                                        setForm({ ...form, photo_file: null });
                                    }}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <label htmlFor="photo-upload" className="cursor-pointer">
                                <div className="flex flex-col items-center justify-center py-12 text-textMuted">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                                        <Upload className="w-7 h-7 text-primary/60" />
                                    </div>
                                    <p className="text-sm font-medium text-textMain">Click to upload or drag and drop</p>
                                    <p className="text-xs text-textMuted mt-1">PNG, JPG, WEBP up to 5MB</p>
                                </div>
                            </label>
                        )}
                    </div>
                </div>

                {/* Last Seen Information */}
                <div className="bg-surface border border-borderContent rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-textMain flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Last Seen Information
                    </h3>
                    
                    <div>
                        <label className="text-sm font-medium text-textMuted mb-1 block">Last Seen Location *</label>
                        <input
                            type="text"
                            value={form.last_seen_location}
                            onChange={e => setForm({ ...form, last_seen_location: e.target.value })}
                            className="w-full bg-surface border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm"
                            placeholder="Specific location where person was last seen"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-textMuted mb-1 block">Last Seen Date *</label>
                            <input
                                type="date"
                                value={form.last_seen_date}
                                onChange={e => setForm({ ...form, last_seen_date: e.target.value })}
                                className="w-full bg-surface border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-textMuted mb-1 block">Last Seen Time</label>
                            <input
                                type="time"
                                value={form.last_seen_time}
                                onChange={e => setForm({ ...form, last_seen_time: e.target.value })}
                                className="w-full bg-surface border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-textMuted mb-1 block">Circumstances of Disappearance</label>
                        <textarea
                            value={form.circumstances}
                            onChange={e => setForm({ ...form, circumstances: e.target.value })}
                            rows={4}
                            className="w-full bg-surface border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm resize-none"
                            placeholder="Describe the circumstances surrounding the disappearance"
                        />
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-surface border border-borderContent rounded-2xl p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-textMain flex items-center gap-2">
                        <Phone className="w-5 h-5" />
                        Contact Information
                    </h3>
                    
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-textMuted">Report Anonymously</label>
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
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-textMuted mb-1 block">Your Name</label>
                                    <input
                                        type="text"
                                        value={form.contact_name}
                                        onChange={e => setForm({ ...form, contact_name: e.target.value })}
                                        className="w-full bg-surface border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm"
                                        placeholder="Your full name"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-textMuted mb-1 block">Relationship to Missing Person</label>
                                    <input
                                        type="text"
                                        value={form.relationship_to_missing}
                                        onChange={e => setForm({ ...form, relationship_to_missing: e.target.value })}
                                        className="w-full bg-surface border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm"
                                        placeholder="e.g., Parent, Sibling, Friend"
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-textMuted mb-1 block">Phone Number *</label>
                                    <input
                                        type="tel"
                                        value={form.contact_phone}
                                        onChange={e => setForm({ ...form, contact_phone: e.target.value })}
                                        className="w-full bg-surface border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm"
                                        placeholder="Your phone number"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-textMuted mb-1 block">Email</label>
                                    <input
                                        type="email"
                                        value={form.contact_email}
                                        onChange={e => setForm({ ...form, contact_email: e.target.value })}
                                        className="w-full bg-surface border border-borderContent focus:border-primary rounded-xl py-2.5 px-4 text-textMain outline-none text-sm"
                                        placeholder="Your email address"
                                    />
                                </div>
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
                        className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Submitting Report...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Submit Missing Person Report
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
                            If this is an emergency or the person is in immediate danger, call emergency services immediately.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MissingPersonReport;
