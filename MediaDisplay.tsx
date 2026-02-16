import React from 'react';

interface MediaDisplayProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

const isVideo = (url: string) => {
    if (!url) return false;
    // Check for data URLs
    if (url.startsWith('data:video/')) {
        return true;
    }
    // Check for common video file extensions
    const videoExtensions = ['.mp4', '.webm', '.mov'];
    try {
        // Use URL constructor for robust parsing of absolute URLs
        const path = new URL(url).pathname;
        return videoExtensions.some(ext => path.toLowerCase().endsWith(ext));
    } catch (e) {
        // Fallback for relative paths or data URLs that aren't full URLs
        return videoExtensions.some(ext => url.toLowerCase().includes(ext));
    }
};

const MediaDisplay: React.FC<MediaDisplayProps> = ({ src, alt, className, style, onError }) => {
    if (isVideo(src)) {
        return (
            <video
                src={src}
                className={className}
                style={style}
                autoPlay
                loop
                muted
                playsInline // Essential for autoplay on iOS
            />
        );
    }

    // Default to img tag for images, including GIFs
    return (
        <img
            src={src}
            alt={alt}
            className={className}
            style={style}
            onError={onError || ((e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; })}
        />
    );
};

export default MediaDisplay;