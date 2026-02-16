import React from 'react';
import Icon from './Icon';
import { Match, User, AppSettings } from '../types';
import * as assets from '../assets';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  users: User[];
  appSettings: AppSettings;
}

const ResultModal: React.FC<ResultModalProps> = ({ isOpen, onClose, match, users, appSettings }) => {
  if (!isOpen) return null;

  const winners = match?.results?.sort((a,b) => a.rank - b.rank) || [];
  const findUserAvatar = (email: string) => users.find(u => u.email === email)?.avatar || appSettings.defaultAvatarUrl || assets.DEFAULT_AVATAR_IMG;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="relative bg-dark-card border border-white/10 rounded-2xl w-full max-w-md mx-auto transform transition-all shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-white/5 bg-dark-bg/50">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 rounded-full text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white transition-colors z-10"
          >
              <Icon name="x" size={20} />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-white uppercase flex items-center justify-center gap-2">
                <Icon name="trophy" className="text-brand-gold"/>Match Result
            </h2>
            <p className="text-xs text-gray-500 mt-1 truncate">{match?.title}</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
            {!match?.results || match.results.length === 0 ? (
                <div className="text-center py-12">
                    <Icon name="loader" size={40} className="text-brand-cyan animate-spin mx-auto mb-4"/>
                    <p className="font-semibold text-gray-300">Results are Being Prepared...</p>
                    <p className="text-xs text-gray-500">Please check again shortly.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {winners.map(player => (
                        <div key={player.email} className={`flex items-center p-3 bg-dark-bg rounded-xl border ${player.rank === 1 ? 'border-brand-gold/50' : 'border-white/5'}`}>
                            <div className="w-8 flex justify-center mr-2">
                                {player.rank === 1 && <Icon name="trophy" size={20} className="text-brand-gold"/>}
                            </div>
                            <img 
                                src={findUserAvatar(player.email)} 
                                alt={player.name} 
                                className={`w-12 h-12 rounded-full object-cover mr-4 ${player.rank === 1 ? 'border-2 border-brand-gold' : 'border-2 border-white/10'}`}
                            />
                            <div className="flex-grow min-w-0">
                                <p className="font-bold text-white text-base truncate">
                                  {player.name}
                                </p>
                                <p className="text-xs text-gray-500">Kills: {player.kills}</p>
                            </div>
                            <div className="font-bold text-white text-lg ml-4">💎 {player.winning}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ResultModal;