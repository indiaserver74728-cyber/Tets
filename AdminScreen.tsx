import React, { useState, useEffect, useContext } from 'react';
import Icon from '../components/Icon';
import * as types from '../types';
import AdminSidebar from '../components/admin/AdminSidebar';
import { UserContext } from '../contexts';

// Import all the new admin screen components
import AdminDashboardScreen from './admin/Dashboard';
import AdminNotificationsScreen from './admin/Notifications';
import AdminCategoriesScreen from './admin/Categories';
import AdminTournamentsScreen from './admin/Tournaments';
import AdminResultsScreen from './admin/Results';
import AdminWithdrawalsScreen from './admin/Withdrawals';
import AdminUsersScreen from './admin/Users';
import AdminSettingsScreen from './admin/Settings';
import AdminPromoCodesScreen from './admin/PromoCodes';
import AdminPromotionsScreen from './admin/Promotions';
import AdminAdvertisingScreen from './admin/Advertising';
import AdminLeaderboardControlScreen from './admin/LeaderboardControl';
import AdminUserNotificationsScreen from './admin/UserNotifications';
import AdminTransactions from '../components/admin/AdminTransactions'; 
import AdminStaffScreen from './admin/Staff';
import AdminWithdrawalSettingsScreen from './admin/WithdrawalSettings';
import AdminProfileMngScreen from './admin/ProfileMng';
import AdminReferralsScreen from './admin/Referrals';
import AdminUserHistoryScreen from './admin/UserHistory';
import AdminWalletControlScreen from './admin/WalletControl';
import AdminImageSettingsScreen from './admin/ImageSettings';
import AdminTextContentScreen from './admin/TextContent';

const orderedAdminViews: types.AdminView[] = [
    'dashboard', 'notifications', 'user_notifications', 'users', 'tournaments', 
    'categories', 'results', 'withdrawals', 'transactions', 'promo_codes', 
    'promotions', 'advertising', 'leaderboard_control', 'user_history', 'referrals', 'profile_mng', 
    'withdrawal_settings', 'wallet_control', 'image_settings', 'text_content', 
    'staff', 'settings'
];

const AdminScreen: React.FC<any> = (props) => {
    const { onToggleView, users, matches, appSettings } = props;
    const [view, setView] = useState<types.AdminView>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const userContext = useContext(UserContext);
    const user = userContext?.user;

    useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    }, [view]);

    // Security check: Redirect staff if they land on an unauthorized view
    useEffect(() => {
        if (user?.role === 'staff') {
            const permissions = user.permissions || {};
            if (!permissions[view]) { // If the current view is not permitted
                // Find the first available view they DO have permission for
                const firstPermittedView = orderedAdminViews.find(v => permissions[v]);
                if (firstPermittedView) {
                    setView(firstPermittedView);
                }
            }
        }
    }, [view, user]);


    // Calculate pending withdrawals for sidebar badge
    const pendingWithdrawalsCount = users ? users.flatMap((u: types.User) => u.transactions || []).filter((t: types.Transaction) => t.type === 'Withdrawal' && t.status === 'Pending').length : 0;
    
    // Calculate pending results (matches marked as Results but winnings not distributed)
    const pendingResultsCount = matches ? matches.filter((m: types.Match) => m.type === 'Results' && !m.winningsDistributed).length : 0;
    
    // Calculate pending referrals
    const pendingReferralsCount = users ? users.filter((u: types.User) => u.referredBy && !u.referralRewardClaimed && u.matches === 0).length : 0;

    const renderView = () => {
        switch (view) {
            case 'dashboard': return <AdminDashboardScreen {...props} setView={setView} />;
            case 'notifications': return <AdminNotificationsScreen {...props} />;
            case 'user_notifications': return <AdminUserNotificationsScreen {...props} />;
            case 'categories': return <AdminCategoriesScreen {...props} />;
            case 'tournaments': return <AdminTournamentsScreen {...props} />;
            case 'results': return <AdminResultsScreen {...props} />;
            case 'withdrawals': return <AdminWithdrawalsScreen {...props} />;
            case 'transactions': return <AdminTransactions {...props} />;
            case 'users': return <AdminUsersScreen {...props} />;
            case 'settings': return <AdminSettingsScreen {...props} />;
            case 'promo_codes': return <AdminPromoCodesScreen {...props} />;
            case 'promotions': return <AdminPromotionsScreen {...props} />;
            case 'advertising': return <AdminAdvertisingScreen {...props} />;
            case 'leaderboard_control': return <AdminLeaderboardControlScreen {...props} />;
            case 'user_history': return <AdminUserHistoryScreen {...props} />;
            case 'referrals': return <AdminReferralsScreen {...props} />;
            case 'profile_mng': return <AdminProfileMngScreen {...props} />;
            case 'withdrawal_settings': return <AdminWithdrawalSettingsScreen {...props} />;
            case 'wallet_control': return <AdminWalletControlScreen {...props} />;
            case 'image_settings': return <AdminImageSettingsScreen {...props} />;
            case 'text_content': return <AdminTextContentScreen {...props} />;
            case 'staff': return <AdminStaffScreen {...props} />;
            default: return <AdminDashboardScreen {...props} setView={setView} />;
        }
    };

    return (
        <div className="h-full flex bg-dark-bg text-gray-200 relative">
             {isSidebarOpen && (
                <div 
                    onClick={() => setIsSidebarOpen(false)} 
                    className="fixed inset-0 bg-black/60 z-30 md:hidden"
                    aria-hidden="true"
                ></div>
            )}
            <AdminSidebar 
                currentView={view} 
                setView={setView} 
                isSidebarOpen={isSidebarOpen} 
                setIsSidebarOpen={setIsSidebarOpen} 
                pendingWithdrawalsCount={pendingWithdrawalsCount}
                pendingResultsCount={pendingResultsCount}
                pendingReferralsCount={pendingReferralsCount}
                users={users}
                appSettings={appSettings}
            />
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                 <header className="flex-shrink-0 bg-dark-card border-b border-white/10 p-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-md hover:bg-dark-card-hover md:hidden" aria-label="Open menu">
                            <Icon name="menu" size={20} />
                        </button>
                        <h1 className="text-lg font-bold uppercase text-white tracking-wider">{view.replace('_', ' ')}</h1>
                    </div>
                    <button onClick={onToggleView} className="bg-brand-cyan text-black font-bold text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:opacity-90 transition-opacity">
                        <Icon name="eye" size={14} />
                        USER VIEW
                    </button>
                 </header>
                <main className="flex-1 overflow-y-auto p-2 md:p-6 bg-dark-bg">
                    {renderView()}
                </main>
            </div>
        </div>
    );
};

export default AdminScreen;