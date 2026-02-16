import React, { useContext, useState } from 'react';
import Icon from './Icon';
import * as assets from '../assets';
import { View, AppSettings } from '../types';
import { UserContext, ViewContext } from '../contexts';
import NotificationModal from './NotificationModal';
import ConfirmModal from './ConfirmModal';
import MediaDisplay from './MediaDisplay';

interface HeaderProps {
    currentView: View;
    onToggleAdminView?: () => void;
    appSettings: AppSettings;
}

const Header: React.FC<HeaderProps> = ({ currentView, onToggleAdminView, appSettings }) => {
    const userContext = useContext(UserContext);
    const viewContext = useContext(ViewContext);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

    const viewTitles: { [key in View]: string } = {
        [View.Home]: appSettings.appName || 'WarHub',
        [View.Wallet]: 'My Wallet',
        [View.Leaderboard]: 'Leaderboard',
        [View.Refer]: 'Refer & Earn',
        [View.Profile]: 'Profile',
    };
    
    const title = viewTitles[currentView];

    if (!userContext || !viewContext) return null;
    const { user, updateUser } = userContext;

    const handleWalletClick = () => {
        if (viewContext) {
            viewContext.setCurrentView(View.Wallet);
        }
    };

    const unreadCount = user.notifications.filter(n => !n.read).length;

    const openNotifications = () => {
        setIsNotificationModalOpen(true);
    };

    const handleMarkAsRead = () => {
        if (unreadCount > 0) {
            updateUser(prevUser => ({
                ...prevUser,
                notifications: prevUser.notifications.map(n => ({ ...n, read: true }))
            }));
        }
    };

    const initiateClearAll = () => {
        if (user.notifications.length > 0) {
            setIsClearConfirmOpen(true);
        }
    };

    const handleConfirmClear = () => {
        updateUser(prevUser => ({
            ...prevUser,
            notifications: []
        }));
        setIsClearConfirmOpen(false);
    };

    return (
        <>
            <header className="p-4 flex justify-between items-center bg-light-bg/80 dark:bg-dark-bg/80 backdrop-blur-sm z-10 border-b border-gray-200 dark:border-white/10 w-full flex-shrink-0">
                <div className="flex items-center">
                    {currentView === View.Home && (
                        <MediaDisplay src={appSettings.appLogoUrl} alt="WarHub Logo" className="w-9 h-9 rounded-full mr-2 object-cover" />
                    )}
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
                </div>
                <div className="flex items-center space-x-2">
                    {(user.role === 'admin' || user.role === 'staff') && onToggleAdminView && (
                        <button onClick={onToggleAdminView} className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-red-600 transition-colors">
                            <Icon name="shield" size={12} /> ADMIN
                        </button>
                    )}
                    <button onClick={openNotifications} className="relative p-2 rounded-full text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-dark-card transition-colors">
                        <Icon name="bell" size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold ring-2 ring-light-bg dark:ring-dark-bg">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    <button onClick={handleWalletClick} className="flex items-center bg-light-card-hover dark:bg-dark-card px-3 py-1.5 rounded-full text-sm font-bold text-gray-800 dark:text-white transition-colors hover:bg-light-card dark:hover:bg-dark-card-hover border border-gray-200 dark:border-white/10">
                        <span>💎 {user.deposit.toFixed(0)}</span>
                    </button>
                </div>
            </header>
            
            <NotificationModal
                isOpen={isNotificationModalOpen}
                onClose={() => setIsNotificationModalOpen(false)}
                notifications={user.notifications}
                onMarkAsRead={handleMarkAsRead}
                onClearAll={initiateClearAll}
            />

            <ConfirmModal
                isOpen={isClearConfirmOpen}
                onClose={() => setIsClearConfirmOpen(false)}
                onConfirm={handleConfirmClear}
                title="Clear Notifications"
                message="Are you sure you want to delete all notifications? This action cannot be undone."
                confirmText="Clear All"
                confirmIcon="trash-2"
                confirmButtonClass="bg-red-500 hover:bg-red-600"
            />
        </>
    );
};

export default Header;