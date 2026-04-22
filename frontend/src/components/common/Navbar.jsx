import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import { useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, Shield } from 'lucide-react';

const Navbar = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-borderContent flex items-center justify-between px-6 z-10 sticky top-0">
            <div className="text-sm font-medium text-textMuted">
                Node: <span className="text-textMain ml-1">HQ Mainframe</span>
            </div>

            <div className="flex items-center space-x-6">
                <div className="flex items-center text-sm border-r border-borderContent pr-6">
                    <div className="bg-primary/20 text-primary w-8 h-8 rounded-full flex items-center justify-center mr-3 border border-primary/30">
                        {user?.role === 'admin' ? <Shield className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                    </div>
                    <div>
                        <p className="font-semibold text-textMain leadiing-none">{user?.full_name || 'Agent'}</p>
                        <p className="text-xs text-textMuted capitalize leading-none mt-0.5">{user?.role} Clearance</p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="p-2 text-textMuted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors group relative"
                    title="Disconnect Link"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
};

export default Navbar;
