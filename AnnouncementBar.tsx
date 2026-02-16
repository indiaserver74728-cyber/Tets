import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import Icon from './Icon';

interface AnnouncementBarProps {
    settings: AppSettings;
}

const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ settings }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if this specific announcement has been dismissed this session
        const dismissedKey = `announcement_dismissed_${settings.globalAnnouncement}`;
        const dismissed = sessionStorage.getItem(dismissedKey);
        
        if (!dismissed && settings.showGlobalAnnouncement && settings.globalAnnouncement) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [settings.showGlobalAnnouncement, settings.globalAnnouncement]);

    const handleDismiss = () => {
        setIsVisible(false);
        // Store the exact announcement text so a new announcement will show up
        const dismissedKey = `announcement_dismissed_${settings.globalAnnouncement}`;
        sessionStorage.setItem(dismissedKey, 'true');
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-brand-pink to-brand-cyan text-black text-sm font-semibold p-2 flex items-center justify-center text-center relative animate-slide-down">
            <Icon name="megaphone" size={20} className="mr-1 flex-shrink-0" />
            <span className="flex-grow px-6">{settings.globalAnnouncement}</span>
            <button onClick={handleDismiss} className="absolute right-2 p-1 rounded-full hover:bg-black/20 transition-colors">
                <Icon name="x" size={20} />
            </button>
        </div>
    );
};

export default AnnouncementBar;