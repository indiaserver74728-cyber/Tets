import React from 'react';
import { Match } from '../types';
import Icon from './Icon';

interface MatchDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  onJoin: (match: Match) => void;
  isJoined?: boolean;
  onViewRoom?: (match: Match) => void;
}

const DetailItem: React.FC<{ icon: string; label: string; value: string | number; color?: string }> = ({ icon, label, value, color = 'text-gray-400' }) => (
    <div className="bg-dark-card p-3 rounded-lg text-center border border-white/10 flex flex-col justify-center items-center h-24">
        <Icon name={icon} size={24} className={`mb-1 ${color}`} />
        <p className="text-xs text-gray-400 font-medium uppercase">{label}</p>
        <p className="font-bold text-white text-base mt-0.5">{value}</p>
    </div>
);

const MatchDetailModal: React.FC<MatchDetailModalProps> = ({ isOpen, onClose, match, onJoin, isJoined = false, onViewRoom }) => {
  if (!isOpen || !match) return null;
  
  const slots = Array.from({ length: match.maxPlayers });
  const filledSlots = match.filledSlots || [];
  const isFull = match.registeredPlayers >= match.maxPlayers;
  const isClosed = !!match.registrationClosed;

  const handleAction = () => {
      if (isJoined) {
          if (onViewRoom) {
              onViewRoom(match);
          }
      } else {
          onJoin(match);
      }
  };

  return (
    <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-30 flex justify-center items-center p-4 animate-fade-in`} onClick={onClose}>
        <div 
            className={`relative bg-dark-bg text-white rounded-2xl w-full max-w-md mx-auto flex flex-col max-h-[90vh] border border-white/10`}
            onClick={(e) => e.stopPropagation()}
        >
            <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full text-gray-400 bg-black/30 hover:bg-black/60 transition-colors z-10">
                <Icon name="x" size={20} />
            </button>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {/* Header */}
                <div className="text-center mb-6 pt-4">
                    <h2 className="text-2xl font-bold text-white uppercase tracking-wider">{match.title}</h2>
                    <p className="text-sm text-gray-400">{new Date(match.time).toLocaleString()}</p>
                </div>
                
                {/* Prize Pool */}
                <div className="bg-gradient-to-r from-brand-pink to-brand-cyan p-4 rounded-xl text-center mb-6">
                    <p className="text-sm font-semibold text-white uppercase tracking-wider">Total Prize Pool</p>
                    <div className="flex items-center justify-center gap-2 mt-1">
                       <Icon name="💎" isEmoji size={32} />
                        <p className="text-5xl font-extrabold text-white">{match.prizePool}</p>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <DetailItem icon="gem" label="Entry Fee" value={match.entryFee === 0 ? 'FREE' : `💎 ${match.entryFee}`} color="text-brand-cyan" />
                    <DetailItem icon="swords" label="Per Kill" value={`💎 ${match.perKill}`} color="text-red-500" />
                    <DetailItem icon="gamepad-2" label="Mode" value={match.mode} color="text-purple-400" />
                    <DetailItem icon="map" label="Map" value={match.map} color="text-green-400" />
                    <DetailItem icon="shield" label="Version" value="TPP" color="text-blue-400" />
                    <DetailItem icon="users" label="Players" value={`${match.registeredPlayers}/${match.maxPlayers}`} color="text-yellow-500" />
                </div>

                {/* Players List */}
                <div className="mb-4">
                    <h3 className="font-bold text-white mb-3 text-lg">Player Slots</h3>
                    <div className="grid grid-cols-4 gap-2 text-center">
                        {slots.map((_, index) => {
                            const slotNumber = index + 1;
                            const isFilled = filledSlots.includes(slotNumber);
                            return (
                                <div key={index} className={`py-2 rounded-md flex items-center justify-center ${isFilled ? 'bg-dark-bg' : 'bg-dark-card'}`}>
                                    <span className={`text-xs font-bold ${isFilled ? 'text-gray-600' : 'text-gray-300'}`}>
                                        #{slotNumber}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Footer Button */}
            <div className="p-4 border-t border-white/10 shrink-0">
                {match.type === 'Upcoming' && (
                    <button 
                      onClick={handleAction}
                      disabled={!isJoined && (isFull || isClosed)}
                      className={`w-full font-bold py-3.5 rounded-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-brand-pink to-brand-cyan text-white hover:shadow-lg hover:shadow-brand-cyan/30`}
                    >
                      {isJoined ? 'VIEW ROOM DETAILS' : isFull ? 'MATCH FULL' : isClosed ? 'REGISTRATION CLOSED' : 'JOIN NOW'}
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};

export default MatchDetailModal;
