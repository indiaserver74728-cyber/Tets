import React from 'react';
import { AppSettings } from '../types';
import Icon from './Icon';
import MediaDisplay from './MediaDisplay';

interface NoInternetScreenProps {
    appSettings: AppSettings;
    cachedAsset: string | null;
}

const NoInternetScreen: React.FC<NoInternetScreenProps> = ({ appSettings, cachedAsset }) => {
    const iconName = appSettings.noInternetIcon;
    const mediaUrl = cachedAsset || appSettings.noInternetImageUrl; // Prioritize cached asset

    return (
        <div className="fixed inset-0 bg-dark-bg z-[99999] flex flex-col items-center justify-center p-4 text-center animate-fade-in">
            {/* Image/GIF or Icon */}
            {mediaUrl ? (
                <MediaDisplay
                    src={mediaUrl}
                    alt={appSettings.noInternetTitle || 'No Connection'}
                    className="mb-6 max-w-[80%]"
                    style={{
                        width: `${appSettings.noInternetImageWidth || 180}px`,
                        height: `${appSettings.noInternetImageHeight || 180}px`,
                        objectFit: 'contain'
                    }}
                />
            ) : iconName ? (
                <div className="w-24 h-24 bg-dark-card rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-red-500/50">
                     <Icon name={iconName} size={48} className="text-red-500 animate-pulse" />
                </div>
            ) : null}

            {/* Title and Message */}
            <h1 className="text-2xl font-bold text-white mb-2">
                {appSettings.noInternetTitle || 'No Internet Connection'}
            </h1>
            <p className="text-gray-400 max-w-sm">
                {appSettings.noInternetMessage || 'Please check your connection and try again.'}
            </p>
        </div>
    );
};

export default NoInternetScreen;