
import React, { useState, useEffect } from 'react';
import { User, Notification } from '../../types';
import Icon from '../Icon';

const icons = [
    { name: 'megaphone', color: 'text-brand-primary' },
    { name: 'gift', color: 'text-green-500' },
    { name: 'trophy', color: 'text-brand-gold' },
    { name: 'info', color: 'text-blue-400' },
    { name: 'alert-triangle', color: 'text-yellow-500' },
    { name: 'shield-alert', color: 'text-red-500' },
];

const IconPicker: React.FC<{ selectedIcon: string; onSelect: (icon: string, color: string) => void }> = ({ selectedIcon, onSelect }) => (
    <div>
        <label className="text-xs text-gray-400 mb-2 block font-bold uppercase">Icon</label>
        <div className="flex gap-2 flex-wrap">
            {icons.map(icon => (
                <button
                    type="button"
                    key={icon.name}
                    onClick={() => onSelect(icon.name, icon.color)}
                    className={`p-3 rounded-lg border-2 transition-all ${selectedIcon === icon.name ? 'border-brand-primary bg-brand-primary/10' : 'border-gray-700 bg-dark-bg hover:border-gray-500'}`}
                >
                    <Icon name={icon.name} className={icon.color} size={20} />
                </button>
            ))}
        </div>
    </div>
);

const LivePreview: React.FC<{ notification: { title: string, message: string, icon: string, iconColor: string } }> = ({ notification }) => (
    <div className="relative flex items-start p-4 rounded-xl bg-[#222] border border-brand-primary/20 shadow-lg shadow-black/20">
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mr-4 border border-white/5 bg-gradient-to-br from-gray-800 to-black">
            <Icon name={notification.icon || 'bell'} size={18} className={notification.iconColor} />
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white truncate pr-2">{notification.title || 'Notification Title'}</h4>
            <p className="text-xs leading-relaxed text-gray-300 break-words mt-1">{notification.message || 'This is where your message will appear.'}</p>
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-brand-cyan rounded-full shadow-[0_0_8px_rgba(0,242,255,0.8)]"></div>
    </div>
);


interface SendUserNotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onSend: (notificationData: Omit<Notification, 'id' | 'time' | 'read'>) => Promise<void>;
}

const SendUserNotificationModal: React.FC<SendUserNotificationModalProps> = ({ isOpen, onClose, user, onSend }) => {
    const [notification, setNotification] = useState({ title: '', message: '', icon: 'megaphone', iconColor: 'text-brand-primary' });
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if(isOpen) {
            setNotification({ title: '', message: '', icon: 'megaphone', iconColor: 'text-brand-primary' });
            if(window.lucide) setTimeout(() => window.lucide.createIcons(), 50);
        }
    }, [isOpen]);

    if (!isOpen || !user) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setNotification(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleIconSelect = (icon: string, iconColor: string) => {
        setNotification(prev => ({ ...prev, icon, iconColor }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        await onSend(notification);
        setIsSending(false);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={isSending ? undefined : onClose}>
            <div 
                className="relative bg-dark-card border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-5 border-b border-white/10 bg-dark-bg/50">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Icon name="send" size={20} className="text-brand-primary"/>
                            Send Notification
                        </h3>
                        <p className="text-xs text-gray-400">To: <span className="font-bold text-white">{user.name}</span></p>
                    </div>
                    <button onClick={onClose} disabled={isSending} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"><Icon name="x" size={20} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Title</label>
                        <input type="text" name="title" value={notification.title} onChange={handleChange} className="w-full bg-dark-bg border border-gray-700 rounded-lg p-3 text-white focus:border-brand-primary outline-none" required/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Message</label>
                        <textarea name="message" value={notification.message} onChange={handleChange} rows={3} className="w-full bg-dark-bg border border-gray-700 rounded-lg p-3 text-white focus:border-brand-primary outline-none" required></textarea>
                    </div>
                    <IconPicker selectedIcon={notification.icon} onSelect={handleIconSelect} />

                    <div className="pt-2">
                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Live Preview</label>
                        <LivePreview notification={notification} />
                    </div>
                </form>

                <div className="p-5 border-t border-white/10 bg-dark-bg flex justify-end gap-3">
                    <button type="button" onClick={onClose} disabled={isSending} className="px-5 py-2.5 text-sm font-bold text-gray-300 bg-white/5 rounded-lg hover:bg-white/10">Cancel</button>
                    <button type="submit" onClick={handleSubmit} disabled={isSending} className="px-5 py-2.5 text-sm font-bold text-black bg-brand-primary rounded-lg hover:opacity-90 flex items-center gap-2 disabled:opacity-50">
                         {isSending ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <Icon name="send" size={16}/>}
                         {isSending ? 'Sending...' : 'Send Message'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SendUserNotificationModal;
