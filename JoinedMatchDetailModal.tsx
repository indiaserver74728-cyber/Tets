import React, { useState, useEffect, useContext } from 'react';
import { Match } from '../types';
import Icon from './Icon';
import * as assets from '../assets';
import MediaDisplay from './MediaDisplay';
import { ToastContext } from '../contexts';

interface JoinedMatchDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  initialView: 'rules' | 'details';
}

const getMapImage = (mapName: string) => {
    switch(mapName.toLowerCase()) {
        case 'kalahari': return assets.KALAHARI_IMG;
        case 'purgatory': return assets.PURGATORY_IMG;
        case 'bermuda':
        default:
            return assets.BERMUDA_IMG;
    }
};

const CountdownTimer: React.FC<{ targetDate: string, onReveal: () => void }> = ({ targetDate, onReveal }) => {
    const calculateTimeLeft = () => {
        const difference = new Date(targetDate).getTime() - new Date().getTime();
        let timeLeft: { days?: number, hours?: number, minutes?: number, seconds?: number } = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);
            const timeDifference = new Date(targetDate).getTime() - new Date().getTime();
            // Check logic inside parent to avoid redundant calls, but safeguard here
            if (timeDifference < 15 * 60 * 1000) {
                 onReveal();
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [timeLeft, targetDate, onReveal]);

    const timerComponents = Object.entries(timeLeft).map(([interval, value]) => {
      if (typeof value !== 'number' || value < 0) return null;
      return (
        <div key={interval} className="text-center">
            <span className="text-2xl font-bold">{String(value).padStart(2, '0')}</span>
            <span className="text-xs block uppercase">{interval}</span>
        </div>
      );
    });

    return (
        <div className="flex justify-center space-x-4 text-gray-800 dark:text-white">
            {timerComponents.length ? timerComponents : <span>Match is starting soon!</span>}
        </div>
    );
}

const JoinedMatchDetailModal: React.FC<JoinedMatchDetailModalProps> = ({ isOpen, onClose, match, initialView }) => {
  const [detailsRevealed, setDetailsRevealed] = useState(false);
  const toastContext = useContext(ToastContext);
  
  useEffect(() => {
      if (!isOpen) {
          setDetailsRevealed(false);
          return;
      }
      
      if (match) {
          const checkReveal = () => {
              const matchTime = new Date(match.time).getTime();
              const now = new Date().getTime();
              const timeDiff = matchTime - now;
              // Reveal if:
              // 1. Match is explicitly marked Ongoing
              // 2. OR Time is within 15 mins (900000ms) of start
              // 3. OR Time is past start (negative diff)
              if (match.type === 'Ongoing' || timeDiff < 15 * 60 * 1000) {
                  setDetailsRevealed(true);
              }
          };
          
          checkReveal(); // Check immediately on open
          const timer = setInterval(checkReveal, 1000); // Poll frequently
          return () => clearInterval(timer);
      }
  }, [isOpen, match]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
        toastContext?.showToast(`${type} copied to clipboard!`, 'info');
    });
  };

  if (!isOpen || !match) return null;
  
  const renderDetails = () => (
    <div className="w-full">
        <h3 className="font-bold text-base mb-2 flex items-center justify-center text-gray-900 dark:text-white"><Icon name="key" className="mr-2 text-brand-cyan" size={16}/>Room Details</h3>
        
        {!detailsRevealed && (
          <div className="text-center p-4 bg-light-bg dark:bg-dark-bg rounded-lg border border-gray-200 dark:border-white/10 mt-4">
            <Icon name="lock" size={24} className="mx-auto text-gray-400 mb-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Details will unlock 15 mins before match time.
            </p>
            <div className="p-1 text-xs rounded-lg">
              <CountdownTimer targetDate={match.time} onReveal={() => setDetailsRevealed(true)} />
            </div>
          </div>
        )}

        {detailsRevealed && (
            <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Room details are now available.</p>
                <div className="space-y-3">
                    <div className="bg-light-bg dark:bg-dark-bg p-3 rounded-lg flex justify-between items-center border border-gray-200 dark:border-white/10">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-left">ROOM ID</p>
                            <p className="text-base font-bold tracking-wider text-gray-900 dark:text-white">{match.roomId || <span className="text-red-500 text-xs">Waiting for admin...</span>}</p>
                        </div>
                        {match.roomId && (
                            <button onClick={() => copyToClipboard(match.roomId!, 'Room ID')} className="bg-light-card-hover dark:bg-dark-card-hover w-8 h-8 rounded-full flex items-center justify-center">
                                <Icon name="copy" size={14}/>
                            </button>
                        )}
                    </div>
                     <div className="bg-light-bg dark:bg-dark-bg p-3 rounded-lg flex justify-between items-center border border-gray-200 dark:border-white/10">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-left">ROOM PASSWORD</p>
                            <p className="text-base font-bold tracking-wider text-gray-900 dark:text-white">{match.roomPassword || <span className="text-red-500 text-xs">Waiting for admin...</span>}</p>
                        </div>
                        {match.roomPassword && (
                            <button onClick={() => copyToClipboard(match.roomPassword!, 'Password')} className="bg-light-card-hover dark:bg-dark-card-hover w-8 h-8 rounded-full flex items-center justify-center">
                            <Icon name="copy" size={14}/>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}
      </div>
  );

  const renderRules = () => {
    const rules = match.rules || [];
    return (
        <div className="w-full">
            <h3 className="font-bold text-base mb-2 flex items-center justify-center text-gray-900 dark:text-white"><Icon name="book-open" className="mr-2 text-brand-cyan" size={16}/>Match Rules</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 bg-light-bg dark:bg-dark-bg p-4 rounded-lg border border-gray-200 dark:border-white/10 max-h-64 overflow-y-auto">
                {rules.length > 0 ? (
                    rules.map((rule, index) => (
                        <div key={index} className="flex items-start">
                            <Icon name="shield" size={14} className="mr-2 mt-1 text-brand-cyan flex-shrink-0"/>
                            <p>{rule}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500 italic">No specific rules have been set for this match.</p>
                )}
            </div>
        </div>
    );
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-70 z-30 flex flex-col justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}>
        <div 
            className={`relative bg-light-card dark:bg-dark-card text-gray-800 dark:text-gray-200 rounded-t-3xl pt-4 w-full max-w-md mx-auto transition-transform duration-300 transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>

            <div className="relative h-32 -mx-4 -mt-4 mb-2">
                <MediaDisplay src={match.imageUrl || getMapImage(match.map)} alt={match.title || ''} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-card to-transparent"></div>
            </div>

            <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full text-gray-200 bg-black/30 hover:bg-black/60 transition-colors z-10">
                <Icon name="x" size={24} />
            </button>
            
            <div className="px-4 pb-4">
                <div className="text-center mb-4 relative z-10 -mt-10">
                    <h2 className="text-xl font-bold text-white drop-shadow-lg">{match.title}</h2>
                    <p className="text-sm font-semibold text-green-400 drop-shadow-md">You have joined this match.</p>
                </div>

                {initialView === 'details' ? renderDetails() : renderRules()}
            </div>
        </div>
    </div>
  );
}

export default JoinedMatchDetailModal;