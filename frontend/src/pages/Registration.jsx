import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, loginUser, clearError } from '../store/authSlice';
import { ShieldAlert, User, Lock, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const Registration = () => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirm_password: '',
        role: 'user' // Default role
    });

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { status, error } = useSelector((state) => state.auth);
    const [localError, setLocalError] = useState('');

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(clearError());
        setLocalError('');

        if (formData.password !== formData.confirm_password) {
            return setLocalError("Passwords do not match.");
        }

        if (formData.password.length < 6) {
            return setLocalError("Password must be at least 6 characters.");
        }

        const payload = {
            full_name: formData.full_name,
            email: formData.email,
            password: formData.password,
            role: formData.role
        };

        const resultAction = await dispatch(registerUser(payload));

        if (registerUser.fulfilled.match(resultAction)) {
            // Auto login after registration
            const loginAction = await dispatch(loginUser({ email: formData.email, password: formData.password }));
            if (loginUser.fulfilled.match(loginAction)) {
                navigate('/dashboard');
            } else {
                setLocalError("Registered but auto-login failed. Please log in manually.");
            }
        } else {
            // Show API error — extract from payload or action error
            const errMsg = resultAction.payload
                || resultAction.error?.message
                || "Registration failed. This email may already be registered.";
            setLocalError(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden py-12">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary opacity-20 blur-[150px] rounded-full pointer-events-none" />

            <div className="w-full max-w-md p-8 bg-surface border border-borderContent rounded-2xl shadow-2xl relative z-10 backdrop-blur-sm">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-14 h-14 bg-surfaceHover rounded-full flex items-center justify-center mb-4 border border-borderContent">
                        <ShieldCheck className="w-7 h-7 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-textMain">Agent Onboarding</h1>
                    <p className="text-sm text-textMuted mt-1">Register for Aegis network access</p>
                </div>

                {(error || localError) && (
                    <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm text-center">
                        {localError || error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-textMuted ml-1">Full Designation (Name)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-textMuted" />
                            </div>
                            <input
                                type="text"
                                name="full_name"
                                required
                                value={formData.full_name}
                                onChange={handleInputChange}
                                className="w-full bg-[#18181b] border border-borderContent focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3 pl-10 pr-4 text-textMain outline-none transition-all duration-200"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-textMuted ml-1">Agency Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-textMuted" />
                            </div>
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full bg-[#18181b] border border-borderContent focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3 pl-10 pr-4 text-textMain outline-none transition-all duration-200"
                                placeholder="operative@aegis.gov"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-textMuted ml-1">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-textMuted" />
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full bg-[#18181b] border border-borderContent focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3 pl-9 pr-3 text-sm text-textMain outline-none transition-all duration-200"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-textMuted ml-1">Confirm</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-textMuted" />
                                </div>
                                <input
                                    type="password"
                                    name="confirm_password"
                                    required
                                    value={formData.confirm_password}
                                    onChange={handleInputChange}
                                    className="w-full bg-[#18181b] border border-borderContent focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3 pl-9 pr-3 text-sm text-textMain outline-none transition-all duration-200"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-textMuted ml-1">Clearance Level (Role)</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            className="w-full bg-[#18181b] border border-borderContent focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3 px-4 text-textMain outline-none transition-all duration-200"
                        >
                            <option value="user">Standard User</option>
                            <option value="admin">System Admin</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full bg-surfaceHover hover:bg-[#27272a] border border-borderContent hover:border-primary/50 text-textMain font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center mt-2 disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {status === 'loading' ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            'Submit Authorization Request'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-textMuted">
                    Already cleared? <Link to="/login" className="text-primary hover:underline transition-all">Establish Link</Link>
                </div>
            </div>
        </div>
    );
};

export default Registration;
