import React, { useState, useEffect } from 'react';
import { InAppAd } from '../types';
import Icon from './Icon';
import MediaDisplay from './MediaDisplay';

interface AdModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: InAppAd | null;
  animationType: 'fade' | 'slide' | 'none';
}

const AdModal: React.FC<AdModalProps> = ({ isOpen, onClose, ad, animationType }) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const handleClose = () => {
    if (animationType === 'none') {
      onClose();
    } else {
      setIsAnimatingOut(true);
    }
  };

  useEffect(() => {
    if (isAnimatingOut) {
      const timer = setTimeout(() => {
        onClose();
        setIsAnimatingOut(false);
      }, 300); // Must match animation duration
      return () => clearTimeout(timer);
    }
  }, [isAnimatingOut, onClose]);

  if (!isOpen || !ad) {
    return null;
  }
  
  const getAnimationClasses = () => {
    if (animationType === 'none') return '';
    if (animationType === 'slide') {
      return isAnimatingOut ? 'animate-slide-out-to-left' : 'animate-slide-in-from-right';
    }
    // Default to fade
    return isAnimatingOut ? 'animate-fade-out' : 'animate-fade-in';
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        key={ad.id} // This is crucial: changing the key unmounts the old and mounts the new, re-triggering animation
        className="relative"
        onClick={(e) => e.stopPropagation()}
        style={{
            width: `${Math.min(ad.width || 100, 100)}%`, 
            height: `${ad.height || 400}px`,
            maxWidth: '24rem',
            maxHeight: '80vh',
        }}
      >
        <div className={`w-full h-full ${getAnimationClasses()}`}>
            {/* Main ad container */}
            <div className="w-full h-full rounded-lg overflow-hidden shadow-2xl shadow-cyan-300/40 border-2 border-cyan-300/50">
                {ad.linkUrl ? (
                    <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                        <MediaDisplay src={ad.imageUrl} alt="Advertisement" className="object-cover w-full h-full" />
                    </a>
                ) : (
                    <div className="w-full h-full">
                        <MediaDisplay src={ad.imageUrl} alt="Advertisement" className="object-cover w-full h-full" />
                    </div>
                )}
            </div>
            
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute -top-4 -right-4 w-9 h-9 bg-dark-card/80 backdrop-blur-sm text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white/10 hover:bg-brand-cyan hover:text-black hover:scale-110 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-brand-cyan"
              aria-label="Close ad"
            >
              <Icon name="x" size={20} strokeWidth="2.5" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default AdModal;