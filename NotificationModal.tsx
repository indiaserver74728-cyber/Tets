import React, { useMemo, useEffect } from 'react';
import Icon from './Icon';
import { Notification } from '../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: () => void;
  onClearAll: () => void;
}

const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    if(isNaN(date.getTime())) return 'Just now';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => (
    <div className={`relative flex items-start p-4 rounded-xl border transition-all duration-200 mb-3 last:mb-0 ${notification.read ? 'bg-[#181818] border-transparent opacity-80' : 'bg-[#222] border-brand-cyan shadow-lg shadow-black/20'}`}>
        
        {/* Left Icon */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mr-4 border border-white/5 ${notification.read ? 'bg-white/5 grayscale' : 'bg-gradient-to-br from-gray-800 to-black'}`}>
            <Icon name={notification.icon} size={18} className={notification.read ? 'text-gray-500' : notification.iconColor} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 w-full overflow-hidden">
            <div className="flex justify-between items-center mb-1">
                <h4 className={`text-sm font-bold truncate pr-2 ${notification.read ? 'text-gray-400' : 'text-white'}`}>
                    {notification.title}
                </h4>
                <span className="text-[10px] text-gray-600 font-medium whitespace-nowrap bg-black/20 px-2 py-0.5 rounded-full">
                    {formatTime(notification.time)}
                </span>
            </div>
            <p className={`text-xs leading-relaxed break-words break-all whitespace-normal w-full ${notification.read ? 'text-gray-500' : 'text-gray-300'}`} dangerouslySetInnerHTML={{ __html: notification.message.replace(/💎(\d+)/g, '<span class="text-brand-cyan font-bold">💎$1</span>') }}></p>
        </div>

        {/* Unread Indicator */}
        {!notification.read && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-brand-cyan rounded-full shadow-[0_0_8px_rgba(0,242,255,0.8)]"></div>
        )}
    </div>
);

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose, notifications, onMarkAsRead, onClearAll }) => {
  
  // FIX: Force icons to render when modal opens.
  useEffect(() => {
      if (isOpen && window.lucide) {
          const timer = setTimeout(() => {
              window.lucide.createIcons();
          }, 50);
          return () => clearTimeout(timer);
      }
  }, [isOpen, notifications]);

  if (!isOpen) return null;

  // Group notifications logic
  const sortedNotifications = [...notifications].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  const now = new Date();
  const newNotifs = sortedNotifications.filter(n => (!n.read || (now.getTime() - new Date(n.time).getTime()) < 24 * 60 * 60 * 1000));
  const earlierNotifs = sortedNotifications.filter(n => !newNotifs.includes(n));

  const hasUnread = notifications.some(n => !n.read);
  const hasNotifications = notifications.length > 0;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={onClose}
        />

        {/* Modal Content */}
        <div 
            key={isOpen ? 'open' : 'closed'}
            className="relative w-full max-w-sm bg-[#121212] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[85vh] transform transition-all animate-fade-in-up"
            style={{ animation: 'slideIn 0.2s ease-out' }}
            onClick={e => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-[#1a1a1a] border-b border-white/5 shadow-md z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-brand-cyan/10 p-2 rounded-xl">
                        <Icon name="bell" className="text-brand-cyan" size={20} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-white leading-tight">Notifications</h2>
                        <p className="text-[10px] text-gray-500 font-medium">
                            {notifications.length} Messages • {notifications.filter(n=>!n.read).length} Unread
                        </p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all active:scale-95 flex items-center justify-center"
                    aria-label="Close"
                >
                    <Icon name="x" size={20} />
                </button>
            </div>

            {/* Actions Bar */}
            {hasNotifications && (
                <div className="flex items-center justify-between px-4 py-2 bg-[#151515] border-b border-white/5 shrink-0">
                     <button 
                        onClick={onClearAll}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-red-500 hover:text-red-400 uppercase tracking-wider px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                    >
                        <Icon name="trash-2" size={12} /> Clear All
                    </button>
                    
                    {hasUnread && (
                        <button 
                            onClick={onMarkAsRead}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-brand-cyan hover:text-cyan-300 uppercase tracking-wider px-2 py-1 rounded hover:bg-brand-cyan/10 transition-colors"
                        >
                            <Icon name="check-circle" size={12} /> Mark Read
                        </button>
                    )}
                </div>
            )}

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#0D0D0D]">
                {!hasNotifications ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center opacity-80">
                        <div className="w-24 h-24 bg-gradient-to-b from-[#1a1a1a] to-transparent rounded-full flex items-center justify-center mb-6 border border-white/5">
                            <Icon name="bell-off" size={32} className="text-gray-600" />
                        </div>
                        <h3 className="text-white font-bold text-lg mb-1">All Caught Up!</h3>
                        <p className="text-gray-500 text-sm max-w-[200px]">You have no new notifications at the moment.</p>
                    </div>
                ) : (
                    <>
                        {newNotifs.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider pl-1 mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-brand-cyan rounded-full shadow-[0_0_5px_rgba(0,242,255,0.8)]"></span> New
                                </h3>
                                {newNotifs.map(n => (
                                    <NotificationItem key={n.id} notification={n} />
                                ))}
                            </div>
                        )}
                        
                        {earlierNotifs.length > 0 && (
                            <div>
                                <h3 className="text-[11px] font-bold text-gray-600 uppercase tracking-widest pl-1 mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-gray-600 rounded-full"></span> Earlier
                                </h3>
                                {earlierNotifs.map(n => (
                                    <NotificationItem key={n.id} notification={n} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
        <style>{`
            @keyframes slideIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
        `}</style>
    </div>
  );
};

export default NotificationModal;