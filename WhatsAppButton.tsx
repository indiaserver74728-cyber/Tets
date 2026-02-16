import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppSettings } from '../types';
import Icon from './Icon';
import MediaDisplay from './MediaDisplay';

interface WhatsAppButtonProps {
    settings: AppSettings;
}

const BUTTON_SIZE = 56; // Corresponds to w-14 h-14

// Function to calculate the default position, placing the button above the nav bar
const getDefaultPosition = () => {
    const navBarHeight = 64; // h-16 in tailwind.config
    const marginBottom = 8; // 0.5rem gap above nav bar, moved down slightly
    const marginRight = 16;  // 1rem gap from the right edge

    return {
        x: window.innerWidth - BUTTON_SIZE - marginRight,
        y: window.innerHeight - navBarHeight - BUTTON_SIZE - marginBottom,
    };
};

// Function to get the initial position, trying localStorage first and falling back to default
const getInitialPosition = () => {
    try {
        const savedPos = localStorage.getItem('whatsapp-button-pos');
        if (savedPos) {
            const parsedPos = JSON.parse(savedPos);
            // Clamp position to be within the viewport on load
            const clampedX = Math.min(Math.max(0, parsedPos.x), window.innerWidth - BUTTON_SIZE);
            const clampedY = Math.min(Math.max(0, parsedPos.y), window.innerHeight - BUTTON_SIZE);
            return { x: clampedX, y: clampedY };
        }
    } catch (e) {
        console.error("Failed to parse button position from localStorage", e);
    }
    // If no saved position or if parsing fails, return the calculated default
    return getDefaultPosition();
};


const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ settings }) => {
    const linkRef = useRef<HTMLAnchorElement>(null);
    // Use lazy initialization for useState to read from localStorage only once
    const [position, setPosition] = useState(getInitialPosition);
    const [isDragging, setIsDragging] = useState(false);
    
    // Use refs for drag-related state to prevent re-renders on move
    const dragStartPos = useRef({ x: 0, y: 0 });
    const elementStartPos = useRef({ x: 0, y: 0 });
    const hasDragged = useRef(false);

    const onDragMove = useCallback((e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const dx = clientX - dragStartPos.current.x;
        const dy = clientY - dragStartPos.current.y;

        if (!hasDragged.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
            hasDragged.current = true;
        }

        const newX = Math.min(Math.max(0, elementStartPos.current.x + dx), window.innerWidth - BUTTON_SIZE);
        const newY = Math.min(Math.max(0, elementStartPos.current.y + dy), window.innerHeight - BUTTON_SIZE);
        
        setPosition({ x: newX, y: newY });
    }, []);

    const onDragEnd = useCallback(() => {
        setIsDragging(false);
        // Only save position if a drag actually happened
        if (hasDragged.current) {
            localStorage.setItem('whatsapp-button-pos', JSON.stringify(position));
        }
        
        window.removeEventListener('mousemove', onDragMove);
        window.removeEventListener('mouseup', onDragEnd);
        window.removeEventListener('touchmove', onDragMove);
        window.removeEventListener('touchend', onDragEnd);
    }, [position, onDragMove]);
    
    const onDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        hasDragged.current = false;
        setIsDragging(true);

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        dragStartPos.current = { x: clientX, y: clientY };
        elementStartPos.current = { ...position };

        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragEnd);
        window.addEventListener('touchmove', onDragMove, { passive: false });
        window.addEventListener('touchend', onDragEnd);
    };

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (hasDragged.current) {
            e.preventDefault();
        }
    };

    if (!settings.supportNumber) {
        return null;
    }
    
    const whatsappNumber = settings.supportNumber.replace(/\D/g, '');
    
    const buttonContent = settings.whatsAppButtonImageUrl ? (
        <MediaDisplay src={settings.whatsAppButtonImageUrl} alt="Support" className="w-full h-full object-cover rounded-full" />
    ) : (
        <Icon name="message-circle" size={32} />
    );

    const buttonClasses = settings.whatsAppButtonImageUrl 
        ? 'w-14 h-14 bg-dark-card rounded-full flex items-center justify-center text-white shadow-lg transform transition-transform active:scale-95 border-2 border-white/20'
        : 'w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-lg transform transition-transform active:scale-95';

    return (
        <a
            ref={linkRef}
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            onMouseDown={onDragStart}
            onTouchStart={onDragStart}
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                zIndex: 40,
                cursor: isDragging ? 'grabbing' : 'grab',
                touchAction: 'none'
            }}
            className={buttonClasses}
            aria-label="Contact support on WhatsApp"
            title="Contact Support"
        >
            {buttonContent}
        </a>
    );
};

export default WhatsAppButton;