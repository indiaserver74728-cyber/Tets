import React, { useState, useEffect, useRef } from 'react';
import { Promotion, AppSettings } from '../types';
import MediaDisplay from './MediaDisplay';

interface PromotionSliderProps {
    slides: Promotion[];
    settings: AppSettings;
}

const FADE_DURATION = 1000;
const SLIDE_DURATION = 300;

const PromotionSlider: React.FC<PromotionSliderProps> = ({ slides, settings }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const sliderRef = useRef<HTMLDivElement>(null);

    // Touch state
    const [isDragging, setIsDragging] = useState(false);
    const [touchStartX, setTouchStartX] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);

    const stopInterval = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const startInterval = () => {
        stopInterval();
        if (slides.length <= 1) return;
        intervalRef.current = setInterval(() => {
            setCurrentIndex(prevIndex => (prevIndex + 1) % slides.length);
        }, settings.sliderSpeed || 4000);
    };

    useEffect(() => {
        startInterval();
        return () => stopInterval();
    }, [slides.length, settings.sliderSpeed, settings.sliderAnimation]);

    const goToSlide = (slideIndex: number) => {
        const newIndex = (slideIndex + slides.length) % slides.length;
        setCurrentIndex(newIndex);
    };
    
    const handleSlideClick = (slide: Promotion) => {
        if (Math.abs(dragOffset) > 10) return; // Prevent click during/after a drag
        if(slide.linkUrl) {
            window.open(slide.linkUrl, '_blank');
        }
    }

    // Touch Handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        if (settings.sliderAnimation !== 'slide') return;
        stopInterval();
        setTouchStartX(e.touches[0].clientX);
        setDragOffset(0); // Reset offset on new touch
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || settings.sliderAnimation !== 'slide') return;
        const currentX = e.touches[0].clientX;
        setDragOffset(currentX - touchStartX);
    };

    const handleTouchEnd = () => {
        if (settings.sliderAnimation !== 'slide' || !isDragging) return;
        
        const sliderWidth = sliderRef.current?.offsetWidth || 0;
        const threshold = sliderWidth / 5;

        if (dragOffset < -threshold) { // Swiped left
            goToSlide(currentIndex + 1);
        } else if (dragOffset > threshold) { // Swiped right
            goToSlide(currentIndex - 1);
        }
        
        setIsDragging(false);
        setDragOffset(0);
        startInterval();
    };


    if (!slides || slides.length === 0) {
        return null;
    }

    let slideContainerStyle: React.CSSProperties = {};
    if(settings.sliderAnimation === 'slide') {
         slideContainerStyle = {
            transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
            transition: isDragging ? 'none' : `transform ${SLIDE_DURATION}ms ease-in-out`,
        };
    }

    return (
        <div 
            className="px-4 mb-6 relative mx-auto"
            style={{ 
                width: `${settings.sliderWidth || 100}%`,
                height: `${settings.sliderHeight || 160}px`
            }}
        >
            <div 
                ref={sliderRef}
                className="w-full h-full overflow-hidden group relative"
                style={{ borderRadius: `${settings.sliderBorderRadius || 12}px` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {settings.sliderAnimation === 'slide' ? (
                     <div className="flex h-full w-full" style={slideContainerStyle}>
                        {slides.map((slide) => (
                            <div key={slide.id} className="relative w-full h-full flex-shrink-0" onClick={() => handleSlideClick(slide)} style={{cursor: isDragging ? 'grabbing' : 'pointer'}}>
                                <MediaDisplay src={slide.imageUrl} alt={slide.title || `Promotion slide`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                ) : (
                    slides.map((slide, index) => (
                        <div
                            key={slide.id}
                            className="absolute top-0 left-0 w-full h-full cursor-pointer"
                            style={{ 
                                opacity: index === currentIndex ? 1 : 0,
                                transition: `opacity ${FADE_DURATION}ms ease-in-out`
                            }}
                            onClick={() => handleSlideClick(slide)}
                        >
                            <MediaDisplay src={slide.imageUrl} alt={slide.title || `Promotion slide ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PromotionSlider;