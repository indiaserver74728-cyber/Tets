import React, { useContext, useState, useEffect, useRef } from 'react';
import { UserContext, ViewContext, ToastContext } from '../contexts';
import Icon from '../components/Icon';
import * as types from '../types';
import EditProfileModal from '../components/EditProfileModal';
import NotificationModal from '../components/NotificationModal';
import InfoModal from '../components/InfoModal';
import ConfirmModal from '../components/ConfirmModal';
import { compressImage } from '../utils';
import { uploadMediaAsset } from '../image-hosting';

interface ProfileScreenProps {
    allUsers: types.User[];
    appSettings: types.AppSettings;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ allUsers, appSettings }) => {
    const userContext = useContext(UserContext);
    const viewContext = useContext(ViewContext);
    const toastContext = useContext(ToastContext);

    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
    const [isClearNotifConfirmOpen, setIsClearNotifConfirmOpen] = useState(false);
    
    const [infoModalContent, setInfoModalContent] = useState({ title: '', content: <></> });
    const [shareFeedback, setShareFeedback] = useState('');

    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [isEditProfileOpen, isNotificationsOpen, isInfoModalOpen]);

    if (!userContext || !viewContext || !toastContext) return null;
    const { user, updateUser, logout } = userContext;
    const { setCurrentView } = viewContext;
    const { showToast } = toastContext;

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsUploading(true);
            try {
                const base64Data = await compressImage(file, { maxWidth: 256, maxHeight: 256, quality: 0.8 });
                const downloadURL = await uploadMediaAsset(base64Data);
                updateUser(prevUser => ({ ...prevUser, avatar: downloadURL }));
                showToast("Avatar updated successfully!", "success");
            } catch (error: any) {
                console.error("Avatar upload failed:", error);
                showToast(error.message || "Failed to upload image. Please try again.", "error");
            } finally {
                setIsUploading(false);
            }
        }
    };

    const triggerFileSelect = () => {
        if (isUploading) return;
        fileInputRef.current?.click();
    };

    const handleShareApp = () => {
        const shareMessage = appSettings.shareAppText || `Check out ${appSettings.appName} for exciting tournaments!`;
        const shareUrl = appSettings.shareAppUrl || window.location.origin;

        const showFeedback = (message: string, duration: number = 3000) => {
            setShareFeedback(message);
            setTimeout(() => setShareFeedback(''), duration);
        };

        if (navigator.share) {
            navigator.share({
                title: `Join me on ${appSettings.appName}!`,
                text: shareMessage,
                url: shareUrl,
            }).catch((error) => {
                if (error.name !== 'AbortError') {
                    navigator.clipboard.writeText(`${shareMessage} ${shareUrl}`)
                        .then(() => showFeedback('Sharing failed. Message copied instead!'))
                        .catch(() => showFeedback('Could not share or copy message.'));
                }
            });
        } else {
            navigator.clipboard.writeText(`${shareMessage} ${shareUrl}`).then(() => {
                showFeedback('App link copied to clipboard!');
            });
        }
    };

    const renderInfoContent = (title: string, contentString: string) => {
        if (!contentString) {
            return <p className="text-gray-400 text-center">Content not available.</p>;
        }
    
        if (title === 'FAQ') {
            const qas = contentString.split('\n').reduce((acc, line) => {
                if (line.startsWith('Q:')) {
                    acc.push({ q: line.substring(2).trim(), a: [] });
                } else if (acc.length > 0 && line.trim()) {
                    acc[acc.length - 1].a.push(line.trim());
                }
                return acc;
            }, [] as { q: string, a: string[] }[]);
    
            return (
                <div className="space-y-6">
                    {qas.map((qa, index) => (
                        <div key={index} className="space-y-3">
                            <h4 className="flex items-start gap-3 font-bold text-base text-brand-primary">
                                <Icon name="help-circle" size={20} className="flex-shrink-0 mt-0.5" />
                                <span>{qa.q}</span>
                            </h4>
                            <div className="pl-8 text-sm text-gray-300 space-y-2 leading-relaxed border-l-2 border-brand-primary/20">
                                 {qa.a.map((ans, i) => <p key={i}>{ans}</p>)}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        const getPageStyle = (t: string) => {
            const style = {
                color: 'text-brand-primary',
                border: 'border-brand-primary/20'
            };
            switch (t) {
                case 'About Us':
                    return { ...style, icon: 'info' };
                case 'Privacy Policy':
                    return { ...style, icon: 'shield' };
                case 'Terms & Conditions':
                    return { ...style, icon: 'file-text' };
                default:
                    return { icon: 'file-text', color: 'text-gray-400', border: 'border-gray-400/20' };
            }
        };

        const { icon, color, border } = getPageStyle(title);
        const paragraphs = contentString.split('\n').filter(p => p.trim());

        if (title === 'Terms & Conditions') {
            const sections: { heading: string, content: string[] }[] = [];
            paragraphs.forEach(line => {
                if (/^\d+\.\s/.test(line)) {
                    sections.push({ heading: line, content: [] });
                } else if (sections.length > 0) {
                    sections[sections.length - 1].content.push(line);
                } else {
                    sections.push({ heading: '', content: [line] }); // Content before first heading
                }
            });

            return (
                <div className="space-y-6">
                    {sections.map((section, index) => (
                        <div key={index} className="space-y-3">
                            {section.heading && (
                                <h4 className={`flex items-start gap-3 font-bold text-base ${color}`}>
                                    <Icon name={icon} size={20} className="flex-shrink-0 mt-0.5" />
                                    <span>{section.heading}</span>
                                </h4>
                            )}
                            {section.content.length > 0 && (
                                <div className={`pl-8 text-sm text-gray-300 space-y-2 leading-relaxed border-l-2 ${border}`}>
                                    {section.content.map((p, i) => <p key={i}>{p}</p>)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            );
        }

        // For 'About Us' and 'Privacy Policy', style each paragraph block.
        return (
            <div className="space-y-5">
                {paragraphs.map((paragraph, index) => (
                    <div key={index} className="flex items-start gap-3">
                        <Icon name={icon} size={16} className={`${color} flex-shrink-0 mt-1`} />
                        <p className="text-sm text-gray-300 leading-relaxed">{paragraph}</p>
                    </div>
                ))}
            </div>
        );
    };


    const openInfoModal = (title: string, contentKey: keyof types.AppSettings) => {
        setInfoModalContent({ title, content: renderInfoContent(title, appSettings[contentKey] as string) });
        setIsInfoModalOpen(true);
    };
    
    const handleConfirmLogout = () => {
        logout();
        setIsLogoutConfirmOpen(false);
    };

    const openNotifications = () => {
        setIsNotificationsOpen(true);
    };
    
    const handleMarkAsRead = () => {
        const unreadCount = user.notifications.filter(n => !n.read).length;
        if (unreadCount > 0) {
            updateUser(prevUser => ({
                ...prevUser,
                notifications: prevUser.notifications.map(n => ({ ...n, read: true })),
            }));
        }
    }

    const initiateClearAll = () => {
        if (user.notifications.length > 0) {
            setIsClearNotifConfirmOpen(true);
        }
    };

    const handleConfirmClear = () => {
        updateUser(prevUser => ({
            ...prevUser,
            notifications: []
        }));
        setIsClearNotifConfirmOpen(false);
    };

    // Use current user data for stats. 
    // Fallback to allUsers if needed, though userContext.user should be up to date.
    const currentUserInfo = allUsers.find(u => u.email === user.email) || user;
    
    // Display Lifetime Total Winnings (not current balance)
    const displayTotalWinnings = currentUserInfo.totalWinnings || 0;

    const menuItems = [
        { icon: 'edit-3', label: 'Edit Profile', action: () => setIsEditProfileOpen(true) },
        { icon: 'wallet', label: 'My Wallet', action: () => setCurrentView(types.View.Wallet) },
        { icon: 'bell', label: 'Notifications', action: openNotifications },
        { icon: 'youtube', label: 'Youtube Channel', action: () => window.open(appSettings.youtubeUrl, '_blank') },
        { icon: 'message-circle', label: 'Customer Support', action: () => window.open(`https://wa.me/${appSettings.supportNumber.replace(/\D/g, '')}`, '_blank') },
        { icon: 'help-circle', label: 'FAQ', action: () => openInfoModal('FAQ', 'faq') },
        { icon: 'info', label: 'About Us', action: () => openInfoModal('About Us', 'aboutUs') },
        { icon: 'shield', label: 'Privacy Policy', action: () => openInfoModal('Privacy Policy', 'privacyPolicy') },
        { icon: 'file-text', label: 'Terms & Conditions', action: () => openInfoModal('Terms & Conditions', 'terms') },
        { icon: 'users', label: 'Join Our Whatsapp Channel', action: () => window.open(appSettings.whatsappChannelUrl, '_blank') },
        { icon: 'share-2', label: 'Share App', action: handleShareApp },
        { icon: 'globe', label: 'Visit Our Website', action: () => window.open(appSettings.websiteUrl, '_blank') },
        { icon: 'log-out', label: 'Logout', color: 'text-red-500', action: () => setIsLogoutConfirmOpen(true) },
    ];

    return (
        <>
            <div className="bg-light-bg dark:bg-dark-bg text-gray-900 dark:text-white h-full flex flex-col">
                <div className="p-4 overflow-y-auto">
                    {/* Profile Header */}
                    <div className="flex flex-col items-center my-4">
                        <div className="relative w-28 h-28 mb-4">
                            <button
                                onClick={triggerFileSelect}
                                disabled={isUploading}
                                className="w-28 h-28 rounded-full p-1 bg-gradient-to-br from-brand-pink to-brand-cyan group disabled:cursor-wait"
                            >
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-full h-full rounded-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Icon name="camera" size={24} />
                                    <span className="text-xs font-bold">Change</span>
                                </div>
                                {isUploading && (
                                    <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
                                        <div className="w-8 h-8 border-4 border-white/50 border-t-white rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarChange}
                                accept="image/*,image/gif"
                                className="hidden"
                            />
                        </div>

                        <h2 className="text-2xl font-bold">{user.name}</h2>
                        <p className="text-gray-500 dark:text-gray-400">{user.phone}</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg text-center border border-gray-200 dark:border-white/10 flex flex-col justify-center items-center">
                            <Icon name="wallet" size={28} className="mx-auto mb-1 text-green-500"/>
                            <p className="text-lg font-bold">💎 {user.deposit}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Deposit</p>
                        </div>
                        <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg text-center border border-gray-200 dark:border-white/10 flex flex-col justify-center items-center">
                            <Icon name="trophy" size={28} className="mx-auto mb-1 text-yellow-500"/>
                            <p className="text-lg font-bold">💎 {displayTotalWinnings}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Winnings</p>
                        </div>
                        <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg text-center border border-gray-200 dark:border-white/10 flex flex-col justify-center items-center">
                            <Icon name="swords" size={28} className="mx-auto mb-1 text-red-500"/>
                            <p className="text-lg font-bold">{user.kills}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Total Kills</p>
                        </div>
                        <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg text-center border border-gray-200 dark:border-white/10 flex flex-col justify-center items-center">
                            <Icon name="gamepad-2" size={28} className="mx-auto mb-1 text-blue-500"/>
                            <p className="text-lg font-bold">{user.matches}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Matches Played</p>
                        </div>
                    </div>

                    {/* Menu List */}
                    <div className="space-y-2">
                        {menuItems.map((item, index) => (
                            <button key={index} onClick={item.action} className={`w-full flex items-center p-4 rounded-lg text-left transition-all duration-200 ${item.color ? item.color : 'text-gray-900 dark:text-white'}`}>
                                <Icon name={item.icon} size={20} className="mr-4 text-gray-500 dark:text-gray-400" />
                                <span className="font-semibold">{item.label}</span>
                                <Icon name="chevron-right" size={20} className="ml-auto text-gray-400 dark:text-gray-500" />
                            </button>
                        ))}
                    </div>
                    
                    <div className="h-6 mt-2 flex items-center justify-center">
                        {shareFeedback && (
                            <p className="text-sm font-semibold text-green-500">{shareFeedback}</p>
                        )}
                    </div>
                </div>
            </div>
            <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />
            <NotificationModal 
                isOpen={isNotificationsOpen} 
                onClose={() => setIsNotificationsOpen(false)} 
                notifications={user.notifications}
                onMarkAsRead={handleMarkAsRead}
                onClearAll={initiateClearAll}
            />
            <InfoModal 
                isOpen={isInfoModalOpen} 
                onClose={() => setIsInfoModalOpen(false)}
                title={infoModalContent.title}
            >
                {infoModalContent.content}
            </InfoModal>
            <ConfirmModal
                isOpen={isLogoutConfirmOpen}
                onClose={() => setIsLogoutConfirmOpen(false)}
                onConfirm={handleConfirmLogout}
                title="Confirm Logout"
                message="Are you sure you want to log out?"
                confirmText="Logout"
                confirmIcon="log-out"
            />
            <ConfirmModal
                isOpen={isClearNotifConfirmOpen}
                onClose={() => setIsClearNotifConfirmOpen(false)}
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

export default ProfileScreen;