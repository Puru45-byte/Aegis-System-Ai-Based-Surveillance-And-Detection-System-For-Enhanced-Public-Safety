import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { ShieldAlert, UserPlus, Upload, Calendar, MapPin, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { handleApiError } from '../utils/errorHandler';

const SubmitMissingPerson = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    
    const [formData, setFormData] = useState({
        missing_person_name: '',
        last_seen_location: '',
        last_seen_date: '',
        contact_phone: '',
        contact_email: '',
        description: '',
        photo: null
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [preview, setPreview] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                photo: file
            }));
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('missing_person_name', formData.missing_person_name);
            formDataToSend.append('last_seen_location', formData.last_seen_location);
            formDataToSend.append('last_seen_date', formData.last_seen_date);
            formDataToSend.append('contact_phone', formData.contact_phone);
            formDataToSend.append('contact_email', formData.contact_email);
            formDataToSend.append('description', formData.description);
            
            if (formData.photo) {
                formDataToSend.append('photo', formData.photo);
            }

            const response = await axiosClient.post('/missing-persons/', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data) {
                alert('Missing person report submitted successfully! We will review it shortly.');
                setFormData({
                    missing_person_name: '',
                    last_seen_location: '',
                    last_seen_date: '',
                    contact_phone: '',
                    contact_email: '',
                    description: '',
                    photo: null
                });
                setPreview(null);
                navigate('/dashboard');
            }
        } catch (error) {
            setError(handleApiError(error));
            console.error('Submit error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="mr-4 p-2 text-textMuted hover:text-textMain transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-textMain tracking-tight">Submit Missing Person Report</h1>
                        <p className="text-textMuted mt-1 text-sm">Report a missing person to help locate them</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            <div className="bg-surface border border-borderContent rounded-2xl p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Person Name */}
                            <div>
                                <label className="block text-sm font-medium text-textMuted mb-2">
                                    Missing Person Name *
                                </label>
                                <input
                                    type="text"
                                    name="missing_person_name"
                                    value={formData.missing_person_name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 bg-background border border-borderContent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-textMain"
                                    placeholder="Enter full name"
                                />
                            </div>

                            {/* Last Seen Location */}
                            <div>
                                <label className="block text-sm font-medium text-textMuted mb-2">
                                    Last Seen Location *
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-textMuted" />
                                    <input
                                        type="text"
                                        name="last_seen_location"
                                        value={formData.last_seen_location}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full pl-12 pr-4 py-3 bg-background border border-borderContent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-textMain"
                                        placeholder="Where were they last seen?"
                                    />
                                </div>
                            </div>

                            {/* Last Seen Date */}
                            <div>
                                <label className="block text-sm font-medium text-textMuted mb-2">
                                    Last Seen Date *
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-textMuted" />
                                    <input
                                        type="date"
                                        name="last_seen_date"
                                        value={formData.last_seen_date}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full pl-12 pr-4 py-3 bg-background border border-borderContent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-textMain"
                                    />
                                </div>
                            </div>

                            {/* Contact Phone */}
                            <div>
                                <label className="block text-sm font-medium text-textMuted mb-2">
                                    Contact Phone *
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3.5 w-5 h-5 text-textMuted" />
                                    <input
                                        type="tel"
                                        name="contact_phone"
                                        value={formData.contact_phone}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full pl-12 pr-4 py-3 bg-background border border-borderContent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-textMain"
                                        placeholder="Contact phone number"
                                    />
                                </div>
                            </div>

                            {/* Contact Email */}
                            <div>
                                <label className="block text-sm font-medium text-textMuted mb-2">
                                    Contact Email *
                                </label>
                                <input
                                    type="email"
                                    name="contact_email"
                                    value={formData.contact_email}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 bg-background border border-borderContent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-textMain"
                                    placeholder="Contact email address"
                                />
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-textMuted mb-2">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={6}
                                    className="w-full px-4 py-3 bg-background border border-borderContent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-textMain resize-none"
                                    placeholder="Provide any additional details about the missing person..."
                                />
                            </div>

                            {/* Photo Upload */}
                            <div>
                                <label className="block text-sm font-medium text-textMuted mb-2">
                                    Photo (Optional)
                                </label>
                                <div className="space-y-4">
                                    {preview ? (
                                        <div className="relative">
                                            <img
                                                src={preview}
                                                alt="Preview"
                                                className="w-full h-64 object-cover rounded-lg border border-borderContent"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPreview(null);
                                                    setFormData(prev => ({ ...prev, photo: null }));
                                                }}
                                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                            >
                                                <AlertCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-borderContent rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                                            <Upload className="w-12 h-12 text-textMuted mx-auto mb-4" />
                                            <p className="text-textMuted mb-4">Click to upload photo</p>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePhotoChange}
                                                className="hidden"
                                                id="photo-upload"
                                            />
                                            <label
                                                htmlFor="photo-upload"
                                                className="cursor-pointer px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                            >
                                                Choose Photo
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full mr-2" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <ShieldAlert className="w-5 h-5 mr-2" />
                                    Submit Report
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubmitMissingPerson;
