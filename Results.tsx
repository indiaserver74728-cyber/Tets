
import React, { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import * as types from '../../types';
import FinalizeMatchModal from '../../components/admin/FinalizeMatchModal';
import ConfirmModal from '../../components/ConfirmModal';
import { db } from '../../firebase';
import { doc, updateDoc, getDoc, increment } from 'firebase/firestore';

interface ResultsProps {
    matches: types.Match[];
    setMatches: React.Dispatch<React.SetStateAction<types.Match[]>>;
    users: types.User[];
    setUsers: React.Dispatch<React.SetStateAction<types.User[]>>;
}

const AdminResultsScreen: React.FC<ResultsProps> = ({ matches, setMatches, users, setUsers }) => {
    const [tab, setTab] = useState<'pending' | 'history'>('pending');
    const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
    const [matchToFinalize, setMatchToFinalize] = useState<types.Match | null>(null);
    const [deleteMatchId, setDeleteMatchId] = useState<number | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    }, [matches, tab, expandedId]);

    const handleOpenFinalizeModal = (match: types.Match) => {
        setMatchToFinalize(match);
        setIsFinalizeModalOpen(true);
    };

    const initiateDeleteResult = (id: number) => {
        setDeleteMatchId(id);
    };

    const confirmDeleteResult = async () => {
        if (deleteMatchId === null) return;
        const matchToDelete = matches.find(m => m.id === deleteMatchId);
        if (!matchToDelete) return;

        try {
            if (matchToDelete.results && matchToDelete.results.length > 0) {
                const revertPromises = matchToDelete.results.map(async (result) => {
                    if (result.winning === 0 && result.kills === 0) return;
                    const userRef = doc(db, 'users', result.email.toLowerCase());
                    const userSnap = await getDoc(userRef);
                    if (!userSnap.exists()) return;

                    const userData = userSnap.data() as types.User;
                    const updatedTransactions = userData.transactions.filter(tx => !(tx.matchId === deleteMatchId && tx.type === 'Winnings'));
                    const updatedNotifications = userData.notifications.filter(n => n.matchId !== deleteMatchId);

                    return updateDoc(userRef, {
                        winnings: increment(-result.winning),
                        totalWinnings: increment(-result.winning),
                        kills: increment(-result.kills),
                        transactions: updatedTransactions,
                        notifications: updatedNotifications
                    });
                });
                await Promise.all(revertPromises);
            }
            await updateDoc(doc(db, 'matches', deleteMatchId.toString()), { results: [], winningsDistributed: false });
            alert('Result deleted and all winnings/stats have been reverted.');
        } catch (error) {
            console.error("Error deleting result:", error);
            alert("An error occurred during reversal.");
        } finally {
            setDeleteMatchId(null);
        }
    };

    const matchesToDeclare = matches.filter(m => m.type === 'Results' && !m.winningsDistributed);
    const resultHistory = matches.filter(m => m.winningsDistributed).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    const findUserAvatar = (email: string) => users.find(u => u.email === email)?.avatar || 'https://i.pravatar.cc/150';

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-white">Match Results</h1>
                   
                </div> <div className="flex items-center border border-white/10 rounded-lg p-1 bg-dark-bg">
                        <button onClick={() => setTab('pending')} className={`relative w-full px-4 py-2 text-sm font-semibold rounded-md transition-colors ${tab === 'pending' ? 'bg-brand-primary text-black' : 'text-gray-400 hover:text-white'}`}>
                            Pending
                            {matchesToDeclare.length > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center animate-pulse">{matchesToDeclare.length}</span>}
                        </button>
                        <button onClick={() => setTab('history')} className={`w-full px-4 py-2 text-sm font-semibold rounded-md transition-colors ${tab === 'history' ? 'bg-brand-primary text-black' : 'text-gray-400 hover:text-white'}`}>
                            History
                        </button>
                    </div>

                {tab === 'pending' && (
                    <div className="space-y-4">
                        {matchesToDeclare.length > 0 ? (
                            matchesToDeclare.map(match => (
                                <div key={match.id} className="bg-dark-card rounded-2xl border-2 border-transparent p-6 shadow-lg relative overflow-hidden" style={{animation: 'border-glow 3s linear infinite', borderColor: '#00F2FF'}}>
                                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                        <div>
                                            <h3 className="font-bold text-white text-xl">{match.title}</h3>
                                            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 mt-2">
                                                <span className="flex items-center gap-1.5"><Icon name="calendar" size={12}/> {new Date(match.time).toLocaleDateString()}</span>
                                                <span className="flex items-center gap-1.5"><Icon name="users" size={12}/> {match.registeredPlayers} Players</span>
                                                <span className="flex items-center gap-1.5"><Icon name="trophy" size={12} className="text-brand-gold"/> 💎{match.prizePool}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleOpenFinalizeModal(match)} className="bg-brand-primary text-black font-bold px-6 py-3 rounded-lg flex items-center justify-center gap-2 text-sm hover:opacity-90 transition-opacity shadow-lg shadow-brand-primary/20 w-full md:w-auto">
                                            <Icon name="list-plus" size={18} /> DECLARE WINNERS
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 text-gray-500 bg-dark-card rounded-2xl border border-dashed border-white/10">
                                <Icon name="check-check" size={48} className="mx-auto opacity-30 mb-4"/>
                                <h3 className="text-xl font-bold text-white">All Clear!</h3>
                                <p>No pending results to declare.</p>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'history' && (
                     <div className="space-y-3">
                        {resultHistory.length > 0 ? resultHistory.map(match => {
                            const isExpanded = expandedId === match.id;
                            const winner = match.results?.find(r => r.rank === 1);
                            return (
                                <div key={match.id} className="bg-dark-card rounded-xl border border-white/5 overflow-hidden">
                                    <div className="flex items-center p-4 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setExpandedId(isExpanded ? null : match.id)}>
                                        <Icon name={isExpanded ? "chevron-down" : "chevron-right"} size={20} className="text-gray-500 mr-4 transition-transform" style={{transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)'}}/>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-white truncate">{match.title}</h3>
                                            <p className="text-xs text-gray-500">{new Date(match.time).toLocaleString()}</p>
                                        </div>
                                        {winner && (
                                            <div className="flex items-center gap-2 text-xs mx-4 hidden sm:flex">
                                                <Icon name="trophy" size={14} className="text-brand-gold"/>
                                                <img src={findUserAvatar(winner.email)} className="w-6 h-6 rounded-full" />
                                                <span className="text-gray-300 font-semibold">{winner.name}</span>
                                            </div>
                                        )}
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400">Distributed</p>
                                            <p className="font-bold text-brand-cyan">💎{match.results?.reduce((acc, r) => acc + r.winning, 0)}</p>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="bg-dark-bg p-4 border-t border-white/5 animate-fade-in">
                                           
                                            <div className="space-y-2">
                                                {match.results?.map(res => {
                                                    const rankIcon = res.rank === 1 ? 'trophy' : res.rank === 2 ? 'medal' : res.rank === 3 ? 'award' : null;
                                                    const rankColor = res.rank === 1 ? 'text-brand-gold' : res.rank === 2 ? 'text-brand-silver' : res.rank === 3 ? 'text-brand-bronze' : 'text-gray-500';
                                                    return (
                                                        <div key={res.rank} className="flex items-center gap-4 bg-dark-card-hover p-2 rounded-lg">
                                                            <div className={`w-10 text-center font-bold text-lg ${rankColor}`}>
                                                                {rankIcon ? <Icon name={rankIcon} className="mx-auto"/> : `#${res.rank}`}
                                                            </div>
                                                            <img src={findUserAvatar(res.email)} className="w-8 h-8 rounded-full"/>
                                                            <p className="flex-1 font-semibold text-white text-sm truncate">{res.name}</p>
                                                            <p className="text-xs text-gray-400 flex items-center gap-1.5"><Icon name="crosshair" size={12} className="text-red-500"/>{res.kills}</p>
                                                            <p className="font-bold text-brand-cyan text-sm w-20 text-right">💎{res.winning}</p>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                             <div className="flex justify-end gap-2 mt-4">
                                                <button onClick={() => handleOpenFinalizeModal(match)} className="px-3 py-1.5 bg-blue-500/10 text-blue-400 text-xs font-bold rounded flex items-center gap-1.5 hover:bg-blue-500 hover:text-white transition-colors"><Icon name="edit" size={12}/> Edit</button>
                                                <button onClick={() => initiateDeleteResult(match.id)} className="px-3 py-1.5 bg-red-500/10 text-red-400 text-xs font-bold rounded flex items-center gap-1.5 hover:bg-red-500 hover:text-white transition-colors"><Icon name="trash-2" size={12}/> Revert & Delete</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        }) : (
                             <div className="text-center py-20 text-gray-500 bg-dark-card rounded-2xl border border-dashed border-white/10">
                                <Icon name="history" size={48} className="mx-auto opacity-30 mb-4"/>
                                <h3 className="text-xl font-bold text-white">No History</h3>
                                <p>Completed match results will appear here.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

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
                onConfirm={confirmDeleteResult}
                title="Revert & Delete Result"
                message="This will revert all winnings, stats, and transaction history for the involved players. This action cannot be undone."
                confirmText="Yes, Revert"
                confirmIcon="trash-2"
                confirmButtonClass="bg-red-500 hover:bg-red-600"
            />
        </>
    );
};

export default AdminResultsScreen;
