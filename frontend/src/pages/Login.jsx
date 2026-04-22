import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../store/authSlice';
import { ShieldAlert, User, Lock, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { status, error } = useSelector((state) => state.auth);

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(clearError());

        try {
            console.log('🔍 Attempting login with:', { email, password: '***' });
            const resultAction = await dispatch(loginUser({ email, password }));
            console.log('🔍 Login result action:', resultAction);
            
            if (loginUser.fulfilled.match(resultAction)) {
                console.log('✅ Login successful, navigating to dashboard');
                navigate('/dashboard');
            } else if (loginUser.rejected.match(resultAction)) {
                console.log('❌ Login failed:', resultAction.payload);
            }
        } catch (error) {
            console.error('❌ Login error:', error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary opacity-20 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-danger opacity-10 blur-[150px] rounded-full pointer-events-none" />

            <div className="w-full max-w-md p-8 bg-surface border border-borderContent rounded-2xl shadow-2xl relative z-10 backdrop-blur-sm">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 border border-primary/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                        <ShieldAlert className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-textMain">Aegis System</h1>
                    <p className="text-sm text-textMuted mt-2">Secure Surveillance Authentication</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm text-center">
                        <div className="font-semibold mb-1">Authentication Error</div>
                        <div>{error}</div>
                        <div className="text-xs mt-2 opacity-75">
                            Please check your credentials and try again.
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-textMuted ml-1">Agent Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-textMuted" />
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#18181b] border border-borderContent focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3 pl-10 pr-4 text-textMain outline-none transition-all duration-200"
                                placeholder="operative@aegis.gov"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-textMuted ml-1">Access Clearance (Password)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-textMuted" />
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#18181b] border border-borderContent focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-3 pl-10 pr-4 text-textMain outline-none transition-all duration-200"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full bg-primary hover:bg-primaryHover text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.4)] disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {status === 'loading' ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Initialize Link
                                <ShieldAlert className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-textMuted">
                    Unaffiliated agent? <Link to="/register" className="text-primary hover:underline transition-all">Request Clearance</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
