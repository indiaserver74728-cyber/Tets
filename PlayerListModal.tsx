
import React, { useState, useEffect } from 'react';
import { Match, User } from '../../types';
import Icon from '../Icon';

interface PlayerListModalProps {
    isOpen: boolean;
    onClose: () => void;
    match: Match | null;
    users: User[];
    onKick: (user: User, slotNumber: number) => void;
}

const PlayerListModal: React.FC<PlayerListModalProps> = ({ isOpen, onClose, match, users, onKick }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [kickConfirmData, setKickConfirmData] = useState<{user: User, slot: number} | null>(null);

    // Filter logic needs to run before useEffect so the DOM is ready
    const players = match ? users.flatMap(u => {
        const joinInfo = u.joinedMatchDetails.find(d => d.matchId === match.id);
        return joinInfo ? { user: u, info: joinInfo } : [];
    }).sort((a, b) => a.info.slotNumber - b.info.slotNumber) : [];

    const filteredPlayers = players.filter(p => 
        p.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.info.ign.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.info.uid.includes(searchTerm) ||
        p.info.slotNumber.toString().includes(searchTerm)
    );

    // Refresh icons whenever the displayed list changes
    useEffect(() => {
        if (isOpen && window.lucide) {
            setTimeout(() => window.lucide.createIcons(), 50);
        }
    }, [isOpen, match, users, kickConfirmData, searchTerm]); // Added searchTerm

    if (!isOpen || !match) return null;

    const handleKickClick = (user: User, slot: number) => {
        setKickConfirmData({ user, slot });
    };

    const confirmKick = () => {
        if (kickConfirmData) {
            onKick(kickConfirmData.user, kickConfirmData.slot);
            setKickConfirmData(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="relative bg-dark-card border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/10 bg-dark-bg">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Icon name="users" className="text-brand-primary" size={20} />
                            Player List
                        </h2>
                        <p className="text-xs text-gray-400 mt-1">
                            {match.title} • {players.length}/{match.maxPlayers} Joined
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors"
                    >
                        <Icon name="x" size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 bg-dark-card border-b border-white/5">
                    <div className="relative">
                        <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input 
                            type="text" 
                            placeholder="Search by Name, IGN, UID or Slot..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-dark-bg border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:border-brand-primary transition-colors"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3 bg-[#0f0f0f]">
                    {filteredPlayers.length > 0 ? (
                        filteredPlayers.map(({ user, info }) => (
                            <div key={info.slotNumber} className="bg-dark-card border border-white/5 rounded-xl p-4 hover:border-brand-primary/30 transition-colors group relative overflow-hidden">
                                <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-brand-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                
                                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                                    {/* Slot & Avatar */}
                                    <div className="flex items-center gap-3 min-w-[180px]">
                                        <div className="w-10 h-10 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary font-bold font-mono text-sm shrink-0">
                                            #{info.slotNumber}
                                        </div>
                                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                                        <div className="overflow-hidden">
                                            <p className="font-bold text-white text-sm truncate">{user.name}</p>
                                            <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                                        </div>
                                    </div>

                                    {/* Game Details */}
                                    <div className="flex-1 grid grid-cols-2 gap-2 w-full">
                                        <div className="bg-black/20 p-2 rounded border border-white/5">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">IGN</p>
                                            <p className="text-xs text-gray-200 font-medium truncate">{info.ign}</p>
                                        </div>
                                        <div className="bg-black/20 p-2 rounded border border-white/5">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold">UID</p>
                                            <p className="text-xs text-gray-200 font-mono">{info.uid}</p>
                                        </div>
                                        <div className="bg-black/20 p-2 rounded border border-white/5 col-span-2 flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] text-gray-500 uppercase font-bold">WhatsApp</p>
                                                <p className="text-xs text-green-400 font-mono">{info.whatsapp}</p>
                                            </div>
                                            <a href={`https://wa.me/${info.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="text-green-500 hover:bg-green-500/10 p-1.5 rounded">
                                                <Icon name="message-circle" size={14} />
                                            </a>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex md:flex-col gap-2 md:border-l md:border-white/5 md:pl-4 w-full md:w-auto mt-2 md:mt-0">
                                        <div className="text-[10px] text-gray-500 text-right w-full hidden md:block">
                                            Joined: {new Date(info.joinTimestamp).toLocaleDateString()}
                                        </div>
                                        <button 
                                            onClick={() => handleKickClick(user, info.slotNumber)}
                                            className="w-full md:w-auto bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all"
                                        >
                                            <Icon name="user-x" size={14} /> KICK
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Icon name="users" size={48} className="mb-2 opacity-20" />
                            <p>No players found.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Kick Confirmation Overlay */}
            {kickConfirmData && (
                <div className="absolute inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-dark-card border border-red-500/30 rounded-xl p-6 w-full max-w-sm shadow-2xl transform scale-105">
                        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-500">
                            <Icon name="alert-triangle" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white text-center mb-2">Kick Player?</h3>
                        <p className="text-sm text-gray-400 text-center mb-6">
                            Are you sure you want to remove <span className="text-white font-bold">{kickConfirmData.user.name}</span> from Slot #{kickConfirmData.slot}? 
                            <br/><br/>
                            <span className="text-yellow-500 text-xs">⚠️ Entry fee will be automatically refunded.</span>
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setKickConfirmData(null)}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmKick}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-lg shadow-red-500/20"
                            >
                                Confirm Kick
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlayerListModal;
