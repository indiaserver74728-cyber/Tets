import React, { useContext, useMemo } from 'react';
import Icon from '../Icon';
import { UserContext } from '../../contexts';
import * as assets from '../../assets';
import * as types from '../../types';
import MediaDisplay from '../MediaDisplay';

interface AdminSidebarProps {
    currentView: types.AdminView;
    setView: (view: types.AdminView) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    pendingWithdrawalsCount?: number;
    pendingResultsCount?: number;
    pendingReferralsCount?: number;
    users?: types.User[];
    appSettings: types.AppSettings;
}

const navItems: { id: types.AdminView; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'bar-chart-2' },
    { id: 'notifications', label: 'Notification', icon: 'send' },
    { id: 'user_notifications', label: 'User Notifications', icon: 'inbox' },
    { id: 'users', label: 'Users', icon: 'users' },
    { id: 'tournaments', label: 'Tournaments', icon: 'swords' },
    { id: 'categories', label: 'Categories', icon: 'layout-grid' },
    { id: 'results', label: 'Results', icon: 'trophy' },
    { id: 'withdrawals', label: 'Withdrawals', icon: 'dollar-sign' },
    { id: 'transactions', label: 'Transaction History', icon: 'history' },
    { id: 'promo_codes', label: 'Payment IDs', icon: 'wallet' },
    { id: 'promotions', label: 'Promotion Slider', icon: 'sliders' },
    { id: 'advertising', label: 'In App ADs', icon: 'megaphone' },
    { id: 'leaderboard_control', label: 'Leaderboard', icon: 'award' },
    { id: 'user_history', label: 'User History', icon: 'history' },
    { id: 'referrals', label: 'Referrals', icon: 'gift' },
    { id: 'profile_mng', label: 'Profile Links', icon: 'user' },
    { id: 'withdrawal_settings', label: 'Withdrawal Control', icon: 'credit-card' },
    { id: 'wallet_control', label: 'Wallet Control', icon: 'wallet' },
    { id: 'image_settings', label: 'App Images', icon: 'image' },
    { id: 'text_content', label: 'Announcement', icon: 'file-text' },
    { id: 'staff', label: 'Admin/Staff', icon: 'user-cog' },
    { id: 'settings', label: 'App Settings', icon: 'settings' },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentView, setView, isSidebarOpen, setIsSidebarOpen, pendingWithdrawalsCount = 0, pendingResultsCount = 0, pendingReferralsCount = 0, users = [], appSettings }) => {
    const userContext = useContext(UserContext);
    const { user, logout } = userContext!;

    const handleNavigation = (view: types.AdminView) => {
        setView(view);
        setIsSidebarOpen(false); // Close sidebar on mobile after navigation
    };
    
    const visibleNavItems = useMemo(() => {
        if (!user) return [];
        if (user.role === 'admin') {
            return navItems;
        }
        if (user.role === 'staff') {
            const userPermissions = user.permissions || {};
            // Staff can always see the dashboard if they have permission
            return navItems.filter(item => userPermissions[item.id as keyof types.StaffPermissions]);
        }
        return []; // Should not happen for logged-in admin/staff
    }, [user]);

    const adminsAndStaff = users.filter(u => u.role === 'admin' || u.role === 'staff').sort((a, b) => a.role === 'admin' ? -1 : 1);

    return (
        <aside className={`fixed inset-y-0 left-0 w-64 bg-dark-card border-r border-white/10 flex flex-col h-full z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                 <div className="flex items-center gap-3">
                    <MediaDisplay src={appSettings.appLogoUrl} alt="Logo" className="w-10 h-10 rounded-full object-cover" />
                    <div>
                        <h1 className="font-bold text-lg text-white">Admin Panel</h1>
                        <p className="text-xs text-gray-500">Control full App</p>
                    </div>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded-full hover:bg-dark-card-hover md:hidden" aria-label="Close menu">
                    <Icon name="x" size={20} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <nav className="p-4 space-y-2">
                    {visibleNavItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleNavigation(item.id)}
                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                                currentView === item.id
                                    ? 'bg-brand-primary text-black shadow-lg shadow-brand-primary/30'
                                    : 'text-gray-400 hover:bg-dark-card-hover hover:text-white'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Icon name={item.icon} size={18} />
                                <span>{item.label}</span>
                            </div>
                            {item.id === 'withdrawals' && pendingWithdrawalsCount > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-md shadow-red-500/20">
                                    {pendingWithdrawalsCount}
                                </span>
                            )}
                            {item.id === 'results' && pendingResultsCount > 0 && (
                                <span className="bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md shadow-yellow-500/20">
                                    {pendingResultsCount}
                                </span>
                            )}
                            {item.id === 'referrals' && pendingReferralsCount > 0 && (
                                <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-md shadow-blue-500/20">
                                    {pendingReferralsCount}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-white/10">
                    {user.role === 'admin' && (
                        <div className="mb-4">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">Team</p>
                            <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                                {adminsAndStaff.map(teamMember => (
                                    <div key={teamMember.email} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${user.email === teamMember.email ? 'bg-brand-primary/10' : 'hover:bg-white/5'}`}>
                                        <div className="relative">
                                            <img src={teamMember.avatar} alt={teamMember.name} className="w-8 h-8 rounded-full object-cover" />
                                            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-dark-card ${teamMember.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-xs text-white truncate">{teamMember.name}</p>
                                            <p className={`text-[10px] font-bold uppercase ${teamMember.role === 'admin' ? 'text-purple-400' : 'text-blue-400'}`}>{teamMember.role}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors mt-4 border-t border-white/5 pt-4"
                    >
                        <Icon name="log-out" size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default AdminSidebar;