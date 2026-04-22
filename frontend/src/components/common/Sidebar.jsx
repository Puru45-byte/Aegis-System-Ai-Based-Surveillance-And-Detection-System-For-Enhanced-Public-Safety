import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ShieldAlert, LayoutDashboard, Video, FolderOpen, ScanLine, MessageSquareText, Eye, Send, AlertTriangle, UserPlus, Building, Mail } from 'lucide-react';

const Sidebar = () => {
    const { user } = useSelector((state) => state.auth);
    const location = useLocation();

    const links = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Scan & Match', path: '/scan', icon: ScanLine },
        { name: 'Submit Tip', path: '/submit-tip', icon: Send },
        { name: 'Missing Person', path: '/missing-person', icon: UserPlus },
    ];

    // Admin-only nav links
    if (user?.role === 'admin') {
        links.push(
            { name: 'Live Feed', path: '/monitor', icon: Video },
            { name: 'Case Management', path: '/watchlist', icon: FolderOpen },
            { name: 'Surveillance Log', path: '/alerts', icon: Eye },
            { name: 'Police Stations', path: '/police-stations', icon: Building },
            { name: 'Send Mails', path: '/send-mails', icon: Mail },
            { name: 'Intelligence Tips', path: '/intelligence', icon: AlertTriangle },
        );
    }

    return (
        <aside className="w-64 border-r border-borderContent bg-surface h-full flex flex-col z-20">
            <div className="h-16 flex items-center px-6 border-b border-borderContent mb-4">
                <ShieldAlert className="w-7 h-7 text-primary mr-3 text-shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
                <span className="text-lg font-bold tracking-widest text-[#f3f4f6]">AEGIS</span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5">
                <p className="px-3 text-xs font-semibold text-textMuted uppercase tracking-wider mb-2 mt-4">Modules</p>

                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname.startsWith(link.path);
                    return (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${isActive
                                ? 'bg-primary/10 text-primary border border-primary/20 shadow-[inset_4px_0_0_0_#3b82f6]'
                                : 'text-textMuted hover:bg-surfaceHover hover:text-textMain'
                                }`}
                        >
                            <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary' : ''}`} />
                            {link.name}
                        </NavLink>
                    );
                })}
            </div>

            <div className="p-4 border-t border-borderContent">
                <div className="bg-[#0f0f11] rounded-lg p-3 border border-borderContent flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2 shadow-[0_0_5px_rgba(34,197,94,0.8)] animate-pulse" />
                    <span className="text-xs text-textMuted">Engine Online</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
