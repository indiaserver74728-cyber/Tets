
import React, { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import * as types from '../../types';
import MatchFormModal from '../../components/admin/MatchFormModal';
import PlayerListModal from '../../components/admin/PlayerListModal';
import ConfirmModal from '../../components/ConfirmModal';
import UpdateRoomModal from '../../components/admin/UpdateRoomModal';
import { db } from '../../firebase';
import { doc, deleteDoc, updateDoc, arrayRemove, increment, arrayUnion } from 'firebase/firestore';
import * as assets from '../../assets';
import FinalizeMatchModal from '../../components/admin/FinalizeMatchModal';

interface TournamentsProps {
    matches: types.Match[];
    setMatches: React.Dispatch<React.SetStateAction<types.Match[]>>;
    users: types.User[];
    setUsers: React.Dispatch<React.SetStateAction<types.User[]>>;
    categories: types.Category[];
}

const AdminTournamentsScreen: React.FC<TournamentsProps> = ({ matches, setMatches, users, setUsers, categories }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMatch, setEditingMatch] = useState<types.Match | null>(null);
    
    // Player List Modal State
    const [playersMatch, setPlayersMatch] = useState<types.Match | null>(null);
    
    // Room Modal State
    const [roomMatch, setRoomMatch] = useState<types.Match | null>(null);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

    // Confirmation Modals State
    const [deleteMatchId, setDeleteMatchId] = useState<number | null>(null);
    const [resultMatchId, setResultMatchId] = useState<number | null>(null);

    // Finalize Modal State
    const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
    const [matchToFinalize, setMatchToFinalize] = useState<types.Match | null>(null);

    const [filter, setFilter] = useState<'All' | 'Upcoming' | 'Ongoing' | 'Results'>('All');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    }, [matches, filter, playersMatch, deleteMatchId, resultMatchId, isFinalizeModalOpen, isRoomModalOpen]);

    const handleCreate = () => {
        setEditingMatch(null);
        setIsFormOpen(true);
    };

    const handleEdit = (match: types.Match) => {
        setEditingMatch(match);
        setIsFormOpen(true);
    };
    
    const handleUpdateRoom = (match: types.Match) => {
        setRoomMatch(match);
        setIsRoomModalOpen(true);
    };

    const initiateDelete = (id: number) => setDeleteMatchId(id);
    const initiateMoveToResult = (id: number) => setResultMatchId(id);

    const handleToggleRegistration = async (match: types.Match) => {
        const newStatus = !match.registrationClosed;
        // Optimistic UI update for instant feedback
        setMatches(prev => prev.map(m => m.id === match.id ? { ...m, registrationClosed: newStatus } : m));

        try {
            await updateDoc(doc(db, 'matches', match.id.toString()), {
                registrationClosed: newStatus
            });
        } catch (err) {
            console.error(err);
            // Revert on failure
            setMatches(prev => prev.map(m => m.id === match.id ? { ...m, registrationClosed: !newStatus } : m));
            alert('Failed to update registration status.');
        }
    };

    const confirmDeleteMatch = async () => {
        if (deleteMatchId === null) return;
        try {
            await deleteDoc(doc(db, 'matches', deleteMatchId.toString()));
            setDeleteMatchId(null);
        } catch (err) {
            console.error(err);
            alert('Failed to delete match.');
        }
    };

    const confirmMoveToResult = async () => {
        if (resultMatchId === null) return;
        const originalType = matches.find(m => m.id === resultMatchId)?.type || 'Upcoming';

        // Optimistic UI Update for instant feedback
        setMatches(prev => prev.map(m => 
            m.id === resultMatchId ? { ...m, type: 'Results' } : m
        ));
        setResultMatchId(null); // Close modal immediately

        try {
            await updateDoc(doc(db, 'matches', resultMatchId.toString()), {
                type: 'Results'
            });
        } catch (err) {
            console.error(err);
             // Revert on failure
            setMatches(prev => prev.map(m => 
                m.id === resultMatchId ? { ...m, type: originalType } : m
            ));
            alert('Failed to move match to results.');
        }
    };

    const handleKickPlayer = async (user: types.User, slotNumber: number) => {
        if(!playersMatch) return;
        const matchId = playersMatch.id;
        const match = matches.find(m => m.id === matchId);
        
        if(!match) {
            alert("Match not found.");
            return;
        }

        try {
            const matchRef = doc(db, 'matches', matchId.toString());
            await updateDoc(matchRef, {
                filledSlots: arrayRemove(slotNumber),
                registeredPlayers: increment(-1)
            });

            const userRef = doc(db, 'users', user.email.toLowerCase());
            const updatedJoinedMatchDetails = user.joinedMatchDetails.filter(d => d.matchId !== matchId);
            const refundTx = {
                id: Date.now(),
                type: 'Admin Adjustment' as const,
                amount: match.entryFee,
                date: new Date().toISOString().split('T')[0],
                status: 'Completed' as const,
                reason: `Refund: Kicked from ${match.title}`
            };

            await updateDoc(userRef, {
                joinedMatchDetails: updatedJoinedMatchDetails,
                deposit: increment(match.entryFee),
                transactions: arrayUnion(refundTx)
            });
        } catch (error) {
            console.error("Kick failed:", error);
            alert("Failed to kick player via Database.");
        }
    };

    const getMapImage = (mapName: string) => {
        switch(mapName.toLowerCase()) {
            case 'kalahari': return assets.KALAHARI_IMG;
            case 'purgatory': return assets.PURGATORY_IMG;
            default: return assets.BERMUDA_IMG;
        }
    };

    const filteredMatches = matches
        .filter(m => filter === 'All' || m.type === filter)
        .filter(m => m.title && m.title.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return (
        <div className="space-y-6 pb-20 md:pb-0">
             <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-dark-card p-4 rounded-xl border border-white/10 shadow-lg">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Icon name="swords" className="text-brand-primary" />
                        Tournaments
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">Manage all upcoming, ongoing, and completed matches.</p>
                </div>
                <button 
                    onClick={handleCreate}
                    className="bg-brand-primary text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity whitespace-nowrap shadow-lg shadow-brand-primary/20 w-full justify-center md:w-auto"
                >
                    <Icon name="plus" size={16} /> HOST NEW
                </button>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:flex-1">
                    <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                        type="text" 
                        placeholder="Search by match title..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-dark-card border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:border-brand-primary transition-colors"
                    />
                </div>
                
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar bg-dark-card p-1 rounded-lg border border-white/10">
                    {(['All', 'Upcoming', 'Ongoing', 'Results'] as const).map(f => (
                        <button 
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-colors ${filter === f ? 'bg-white text-black' : 'bg-transparent text-gray-400 hover:text-white'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredMatches.map(match => {
                    const isTimePassed = new Date(match.time) < new Date();
                    return (
                    <div 
                        key={match.id} 
                        className="bg-dark-card rounded-xl border-2 overflow-hidden group hover:border-white/20 transition-all duration-300"
                        style={{ 
                            animation: 'border-glow 3s linear infinite',
                            borderColor: '#00F2FF' // This sets the base border color for the glow animation
                        }}
                    >
                        <div className="flex flex-col md:flex-row">
                            <div className="relative h-32 md:h-auto md:w-48 shrink-0">
                                <img 
                                    src={match.imageUrl || getMapImage(match.map)} 
                                    alt={match.title || match.map} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        if (match.imageUrl) {
                                            (e.currentTarget as HTMLImageElement).src = getMapImage(match.map);
                                        }
                                    }}
                                />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                                <div className="absolute top-2 left-2">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase shadow-sm ${
                                        match.type === 'Ongoing' ? 'bg-red-500 text-white animate-pulse' : 
                                        match.type === 'Upcoming' ? 'bg-blue-500 text-white' : 
                                        'bg-gray-600 text-gray-200'
                                    }`}>
                                        {match.type}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 flex-1 flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg text-white mb-1 flex items-center gap-2 truncate" title={match.title}>
                                            {match.title}
                                            {match.winningsDistributed && <Icon name="check-circle" size={16} className="text-green-500" title="Completed"/>}
                                            {match.registrationClosed && <Icon name="lock" size={16} className="text-yellow-500" title="Registration Closed"/>}
                                        </h3>
                                        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 mt-2">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                <Icon name="calendar" size={12}/> {new Date(match.time).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5 shrink-0 ml-4">
                                        <div className="flex items-center gap-1.5 justify-end">
                                            <button onClick={() => handleEdit(match)} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-colors" title="Edit"><Icon name="edit-3" size={16} /></button>
                                            <button onClick={() => initiateDelete(match.id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors" title="Delete"><Icon name="trash-2" size={16} /></button>
                                        </div>
                                        <div className="flex items-center gap-1.5 justify-end h-8">
                                            {(match.type === 'Upcoming' || match.type === 'Ongoing') && !match.winningsDistributed && (
                                                <>
                                                    {!isTimePassed && (
                                                        <>
                                                            {match.registrationClosed ? (
                                                                <button onClick={() => handleToggleRegistration(match)} className="p-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500 hover:text-white transition-colors" title="Re-open Registration">
                                                                    <Icon name="timer-reset" size={16} />
                                                                </button>
                                                            ) : (
                                                                <button onClick={() => handleToggleRegistration(match)} className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg hover:bg-yellow-500 hover:text-white transition-colors" title="Timeout Match (Close Registration)">
                                                                    <Icon name="timer-off" size={16} />
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                    <button onClick={() => initiateMoveToResult(match.id)} className="p-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500 hover:text-white transition-colors" title="Move to Results"><Icon name="flag-checkered" size={16} /></button>
                                                    <button onClick={() => handleUpdateRoom(match)} className="p-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500 hover:text-white transition-colors" title="Update Room Details"><Icon name="key" size={16} /></button>
                                                </>
                                            )}
                                            {match.type === 'Results' && !match.winningsDistributed && (
                                                <button onClick={() => {setMatchToFinalize(match); setIsFinalizeModalOpen(true);}} className="p-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500 hover:text-white transition-colors" title="Finalize Results">
                                                    <Icon name="list-checks" size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-3 border-y border-white/5 my-2">
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Entry</p>
                                        <p className="text-white font-bold text-sm">{match.entryFee === 0 ? <span className="text-green-400">FREE</span> : `💎${match.entryFee}`}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Prize Pool</p>
                                        <p className="text-brand-gold font-bold text-sm">💎{match.prizePool}</p>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                         <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                            <span>Slots: {match.registeredPlayers}/{match.maxPlayers}</span>
                                            {match.registrationClosed ? <span className="font-bold text-red-400">CLOSED</span> : <span>{Math.round((match.registeredPlayers/match.maxPlayers)*100)}% Full</span>}
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-brand-primary h-full rounded-full transition-all" style={{ width: `${(match.registeredPlayers / match.maxPlayers) * 100}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                     <div className="flex items-center gap-2">
                                        {match.roomId ? (
                                            <div className="flex items-center gap-2 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                                                <Icon name="key" size={12} className="text-green-500"/>
                                                <span className="text-xs text-green-400 font-mono">ID: {match.roomId}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                                                <Icon name="alert-circle" size={12} className="text-red-500"/>
                                                <span className="text-xs text-red-400">No Room Details</span>
                                            </div>
                                        )}
                                     </div>
                                     <button 
                                        onClick={() => setPlayersMatch(match)} 
                                        className="text-xs font-bold flex items-center gap-1 transition-colors text-brand-primary hover:text-white px-3 py-1.5 rounded-lg bg-brand-primary/10 hover:bg-brand-primary/20"
                                    >
                                        <Icon name="users" size={14} />
                                        View Players
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )})}

                {filteredMatches.length === 0 && (
                    <div className="text-center py-12">
                        <div className="bg-dark-card inline-block p-6 rounded-full mb-4 border border-white/5">
                            <Icon name="swords" size={48} className="text-gray-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-400">No Matches Found</h3>
                        <p className="text-gray-500 mt-2">Try changing filters or host a new tournament.</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            <MatchFormModal 
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                match={editingMatch}
                setMatches={setMatches}
                categories={categories}
            />

            <UpdateRoomModal
                isOpen={isRoomModalOpen}
                onClose={() => setIsRoomModalOpen(false)}
                match={roomMatch}
                setMatches={setMatches}
            />

            <PlayerListModal
                isOpen={!!playersMatch}
                onClose={() => setPlayersMatch(null)}
                match={playersMatch}
                users={users}
                onKick={handleKickPlayer}
            />

            <FinalizeMatchModal
                isOpen={isFinalizeModalOpen}
                onClose={() => setIsFinalizeModalOpen(false)}
                match={matchToFinalize}
                users={users}
                setMatches={setMatches}
                setUsers={setUsers}
            />

            <ConfirmModal 
                isOpen={deleteMatchId !== null}
                onClose={() => setDeleteMatchId(null)}
                onConfirm={confirmDeleteMatch}
                title="Delete Tournament"
                message="Are you sure you want to delete this tournament? This action cannot be undone."
                confirmText="Delete"
                confirmIcon="trash-2"
                confirmButtonClass="bg-red-500 hover:bg-red-600"
            />

            <ConfirmModal
                isOpen={resultMatchId !== null}
                onClose={() => setResultMatchId(null)}
                onConfirm={confirmMoveToResult}
                title="Move to Results"
                message="This will move the match to the 'Results' tab, where you can declare winners. This action cannot be undone. Continue?"
                confirmText="Move to Results"
                confirmIcon="flag-checkered"
                confirmButtonClass="bg-green-500 hover:bg-green-600"
            />
        </div>
    );
};

export default AdminTournamentsScreen;
