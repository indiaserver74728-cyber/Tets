import React, { useState, useEffect } from 'react';
import { Match, User, AppSettings } from '../types';
import Icon from './Icon';
import * as assets from '../assets';
import MediaDisplay from './MediaDisplay';

interface MatchCardProps {
  match: Match;
  isJoined: boolean;
  allUsers: User[];
  onResultClick?: (matchId: number) => void;
  onJoinClick?: (match: Match) => void;
  onCardClick?: () => void;
  onViewDetailsClick?: (match: Match, initialView: 'rules' | 'details') => void;
  appSettings: AppSettings;
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

const Countdown: React.FC<{ targetDate: string }> = ({ targetDate }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(targetDate) - +new Date();
        let timeLeft: { days?: number; hours?: number; minutes?: number; seconds?: number } = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    });

    if (Object.keys(timeLeft).length === 0) {
        return <span className="font-bold text-red-400 text-xs">Starting...</span>;
    }

    const { days = 0, hours = 0, minutes = 0, seconds = 0 } = timeLeft;
    
    let displayString = '';
    if (days > 0) {
        displayString = `${days}d ${hours}h left`;
    } else {
        displayString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    return <>{displayString}</>;
}


const MatchCard: React.FC<MatchCardProps> = ({ match, isJoined, allUsers, onResultClick, onJoinClick, onCardClick, onViewDetailsClick, appSettings }) => {
  const isResult = match.type === 'Results';
  const isFull = match.registeredPlayers >= match.maxPlayers;
  // Client-side check: If the match is 'Upcoming' and its time is in the past, treat it as closed immediately for UI purposes.
  const isTimeUp = match.type === 'Upcoming' && new Date(match.time) < new Date();
  const isClosed = !!match.registrationClosed || isTimeUp;
  const isOngoing = match.type === 'Ongoing';
  
  const findUserAvatar = (email: string) => allUsers.find(u => u.email === email)?.avatar || appSettings.defaultAvatarUrl || assets.DEFAULT_AVATAR_IMG;

  const handleSingleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isResult) {
      onResultClick?.(match.id);
    } else {
      onJoinClick?.(match);
    }
  };

  const getButtonText = () => {
    if (isResult) return 'VIEW RESULT';
    if (isFull) return 'MATCH FULL';
    if (isClosed) return 'CLOSED';
    return 'JOIN NOW';
  };

  const buttonClass = () => {
      if (isResult) return 'bg-light-card-hover dark:bg-dark-card-hover text-gray-800 dark:text-white border-2 border-brand-cyan btn-chromatic-hover';
      return 'bg-gradient-to-r from-brand-pink to-brand-cyan hover:shadow-lg hover:shadow-brand-cyan/30';
  }

  return (
    <div 
      onClick={onCardClick}
      className="bg-light-card dark:bg-dark-card rounded-lg overflow-hidden mb-4 border border-gray-200 dark:border-white/10 shadow-lg relative transition-all duration-300 hover:border-brand-cyan/50 hover:shadow-brand-cyan/10 cursor-pointer"
    >
      <div className="relative">
          <MediaDisplay
            src={match.imageUrl || getMapImage(match.map)} 
            alt={match.title || match.map}
            className="w-full h-48 object-cover" 
            onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = assets.BERMUDA_IMG;
            }}
          />
          {isOngoing && (
            <div className="absolute top-2 right-2 flex items-center bg-black/50 px-2 py-1 rounded-full">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="ml-2 text-xs font-bold text-red-400 uppercase tracking-wider">{match.status || 'LIVE'}</span>
            </div>
          )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{match.title}</h3>
        
        {match.type === 'Upcoming' ? (
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-4">
                <span className="flex items-center">
                    <Icon name="calendar" size={12} className="mr-1.5"/>
                    {new Date(match.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="font-mono font-bold text-yellow-500 flex items-center gap-1.5">
                   <Icon name="⏳" isEmoji size={12} />
                    <Countdown targetDate={match.time} />
                </span>
            </div>
        ) : (
            <p className="text-xs flex items-center text-gray-500 dark:text-gray-400 mb-4">
                <Icon name="calendar" size={12} className="mr-1.5"/>
                {new Date(match.time).toLocaleString()}
            </p>
        )}

        <div className="grid grid-cols-3 gap-3 text-center border-t border-b border-gray-200 dark:border-white/10 py-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide">PRIZE POOL</p>
            <p className="font-extrabold text-lg text-gray-900 dark:text-white">💎{match.prizePool}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide">PER KILL</p>
            <p className="font-extrabold text-lg text-gray-900 dark:text-white">💎{match.perKill}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide">ENTRY FEE</p>
            <p className={`font-extrabold text-lg ${match.entryFee === 0 ? 'text-green-500 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
              {match.entryFee === 0 ? 'FREE' : `💎${match.entryFee}`}
            </p>
          </div>
        </div>

        {(!isResult || isOngoing) && !isResult && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
              <span>{isOngoing ? 'Players Left' : 'Players'}: {match.registeredPlayers}/{match.maxPlayers}</span>
               {!isOngoing && <span>{isFull || isClosed ? 'Registration Closed' : `${match.maxPlayers - match.registeredPlayers} spots left`}</span>}
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-brand-cyan to-brand-pink h-2.5 rounded-full" 
                style={{ width: `${(match.registeredPlayers / match.maxPlayers) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {isJoined && !isResult ? (
            <div className="flex gap-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); onViewDetailsClick?.(match, 'rules'); }}
                  className="w-full bg-brand-cyan/10 text-brand-cyan font-bold py-3.5 rounded-md transition-all duration-300 text-sm tracking-wider border border-brand-cyan/20 hover:bg-brand-cyan/20 transform hover:-translate-y-1"
                >
                  RULES
                </button>
                <button
                   onClick={(e) => { e.stopPropagation(); onViewDetailsClick?.(match, 'details'); }}
                   className="w-full bg-gradient-to-r from-brand-pink to-brand-cyan text-white font-bold py-3.5 rounded-md transition-all duration-300 text-sm tracking-wider shadow-md hover:shadow-lg hover:shadow-brand-cyan/30 transform hover:-translate-y-1"
                >
                  ROOM DETAILS
                </button>
            </div>
        ) : isResult && match.results && match.results.length > 0 ? (
            <div>
                 <h4 className="font-bold text-sm mb-2 text-gray-800 dark:text-white flex items-center gap-2"><Icon name="trophy" size={16} className="text-brand-gold"/>Top Finishers</h4>
                 <div className="space-y-2 mb-4">
                     {match.results.slice(0, 3).map(winner => (
                        <div key={winner.email} className="flex items-center p-2 bg-light-bg dark:bg-dark-bg rounded-lg border border-gray-200 dark:border-white/5">
                            <div className="w-8 flex justify-center">
                                {winner.rank === 1 && <Icon name="trophy" size={20} className="text-brand-gold"/>}
                            </div>
                            <img src={findUserAvatar(winner.email)} className={`w-10 h-10 rounded-full object-cover mr-3 ${winner.rank === 1 ? 'border-2 border-brand-gold' : 'border-2 border-white/10'}`} alt={winner.name}/>
                            <div className="flex-grow min-w-0">
                                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                  {winner.name}
                                </p>
                                <p className="text-xs text-gray-500">Kills: {winner.kills}</p>
                            </div>
                            <p className="font-bold text-sm text-white ml-2">💎 {winner.winning}</p>
                        </div>
                     ))}
                 </div>
                 <button 
                    onClick={handleSingleButtonClick}
                    className="w-full bg-light-card-hover dark:bg-dark-card-hover text-gray-800 dark:text-white font-bold py-3.5 rounded-md transition-all duration-300 text-sm tracking-wider border-2 border-brand-cyan btn-chromatic-hover transform hover:-translate-y-1"
                >
                    VIEW FULL RESULT
                </button>
            </div>
        ) : (
            <button 
              onClick={handleSingleButtonClick}
              disabled={!isResult && (isFull || isClosed)}
              className={`w-full text-white font-bold py-3.5 rounded-md transition-all duration-300 text-sm tracking-wider shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 ${buttonClass()}`}
            >
              {getButtonText()}
            </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(MatchCard);