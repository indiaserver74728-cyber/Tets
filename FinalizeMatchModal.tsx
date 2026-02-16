import React, { useContext, useState, useEffect } from 'react';
import { Match, User, Notification, JoinedMatchInfo, MatchResult, Transaction } from '../../types';
import Icon from '../Icon';
import { db } from '../../firebase';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { ToastContext } from '../../contexts';

interface FinalizeMatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    match: Match | null;
    users: User[];
}

const FinalizeMatchModal: React.FC<FinalizeMatchModalProps> = ({ isOpen, onClose, match, users }) => {
    const toastContext = useContext(ToastContext);
    const [isProcessing, setIsProcessing] = useState(false);
    const [playerResults, setPlayerResults] = useState<Record<string, { kills: string; winning: string }>>({});

    const joinedPlayers: { user: User; detail: JoinedMatchInfo }[] = match ? users
        .map(user => {
            const detail = user.joinedMatchDetails.find(d => d.matchId === match.id);
            return detail ? { user, detail } : null;
        })
        .filter((p): p is { user: User; detail: JoinedMatchInfo } => p !== null)
        .sort((a, b) => a.detail.slotNumber - b.detail.slotNumber) : [];

    useEffect(() => {
        if (isOpen && match) {
            const initialResults: Record<string, { kills: string; winning: string }> = {};
            if (match.results && match.results.length > 0) {
                joinedPlayers.forEach(({ user }) => {
                    const existingResult = match.results.find(r => r.email === user.email);
                    initialResults[user.email] = {
                        kills: existingResult ? String(existingResult.kills) : '0',
                        winning: existingResult ? String(existingResult.winning) : '0',
                    };
                });
            } else {
                joinedPlayers.forEach(({ user }) => {
                    initialResults[user.email] = { kills: '0', winning: '0' };
                });
            }
            setPlayerResults(initialResults);
        } else {
            setPlayerResults({});
        }
    }, [isOpen, match, users]);

    if (!isOpen || !match) return null;

    const handleResultChange = (email: string, field: 'kills' | 'winning', value: string) => {
        const sanitizedValue = value.replace(/[^0-9]/g, '');
        setPlayerResults(prev => ({
            ...prev,
            [email]: { ...(prev[email] || { kills: '0', winning: '0' }), [field]: sanitizedValue },
        }));
    };
    
    const handleSetWinner = (winnerEmail: string) => {
        setPlayerResults(prev => {
            const newResults = { ...prev };
            Object.keys(newResults).forEach(email => {
                newResults[email] = {
                    ...newResults[email],
                    winning: email === winnerEmail ? (match.prizePool || 0).toString() : '0'
                };
            });
            return newResults;
        });
    };

    const autoCalculateWinnings = () => {
        setPlayerResults(prev => {
            const newResults = { ...prev };
            Object.keys(newResults).forEach(email => {
                const kills = parseInt(newResults[email].kills, 10) || 0;
                newResults[email] = {
                    ...newResults[email],
                    winning: (kills * (match.perKill || 0)).toString()
                };
            });
            return newResults;
        });
    };

    const totalDistributed = Object.values(playerResults).reduce((sum: number, result: { kills: string; winning: string }) => sum + (parseInt(result.winning, 10) || 0), 0);
    const prizePoolExceeded = totalDistributed > match.prizePool;

    const handleFinalize = async () => {
        setIsProcessing(true);
        try {
            const finalResults: Omit<MatchResult, 'rank'>[] = Object.entries(playerResults)
                .map(([email, data]: [string, { kills: string; winning: string }]) => {
                    const user = users.find(u => u.email === email);
                    const joinInfo = user?.joinedMatchDetails.find(d => d.matchId === match.id);
                    return {
                        email,
                        name: joinInfo?.ign || user?.name || 'Unknown',
                        uid: joinInfo?.uid || 'N/A',
                        kills: parseInt(data.kills, 10) || 0,
                        winning: parseInt(data.winning, 10) || 0,
                    };
                })
                .filter(r => r.winning > 0 || r.kills > 0);

            const sortedResults = finalResults.sort((a, b) => b.winning - a.winning);
            const rankedResults: MatchResult[] = sortedResults.map((result, index) => ({
                ...result,
                rank: index + 1,
            }));

            const oldResults = match.results || [];
            
            await updateDoc(doc(db, 'matches', match.id.toString()), {
                winningsDistributed: true,
                results: rankedResults,
            });
            
            const allInvolvedEmails = new Set([...oldResults.map(r => r.email), ...rankedResults.map(r => r.email)]);

            const distributionPromises = Array.from(allInvolvedEmails).map(async (email) => {
                const userRef = doc(db, 'users', email.toLowerCase());
                const userSnap = await getDoc(userRef);
                if (!userSnap.exists()) return;

                const userData = userSnap.data() as User;
                const newResult = rankedResults.find(r => r.email === email);
                const oldResult = oldResults.find(r => r.email === email);
                
                const newWinnings = newResult?.winning || 0;
                const oldWinnings = oldResult?.winning || 0;
                const winningDifference = newWinnings - oldWinnings;

                const newKills = newResult?.kills || 0;
                const oldKills = oldResult?.kills || 0;
                const killsDifference = newKills - oldKills;

                if (winningDifference === 0 && killsDifference === 0 && newResult) return;

                const newTransactions = [...userData.transactions];
                const oldTxIndex = newTransactions.findIndex(tx => tx.matchId === match.id && tx.type === 'Winnings');
                const newNotifications = [...userData.notifications];
                const oldNotifIndex = newNotifications.findIndex(n => n.matchId === match.id);

                if (newResult && newWinnings > 0) {
                    const newTx: Transaction = {
                        id: oldTxIndex > -1 ? newTransactions[oldTxIndex].id : Date.now() + Math.random(),
                        type: 'Winnings', amount: newWinnings, date: new Date().toISOString(), status: 'Completed', reason: `Rank ${newResult.rank} in ${match.title}`, matchId: match.id,
                    };
                    const newNotif: Notification = {
                        id: oldNotifIndex > -1 ? newNotifications[oldNotifIndex].id : Date.now() + Math.random(),
                        icon: 'trophy', title: `Result for ${match.title}`, message: `You placed #${newResult.rank} and won 💎${newWinnings}.`, time: new Date().toISOString(), read: false, iconColor: 'text-brand-gold', matchId: match.id,
                    };

                    if (oldTxIndex > -1) newTransactions[oldTxIndex] = newTx; else newTransactions.unshift(newTx);
                    if (oldNotifIndex > -1) newNotifications[oldNotifIndex] = newNotif; else newNotifications.unshift(newNotif);
                
                } else {
                    if (oldTxIndex > -1) newTransactions.splice(oldTxIndex, 1);
                    if (oldNotifIndex > -1) newNotifications.splice(oldNotifIndex, 1);
                }

                await updateDoc(userRef, {
                    winnings: increment(winningDifference),
                    totalWinnings: increment(winningDifference),
                    kills: increment(killsDifference),
                    transactions: newTransactions,
                    notifications: newNotifications
                });
            });

            await Promise.all(distributionPromises);

            if (toastContext) toastContext.showToast(`Result updated & Winnings Distributed!`, 'success');
            onClose();
        } catch (error: any) {
            console.error("Error finalizing match:", error);
            if (toastContext) toastContext.showToast(error.message || "Failed to finalize match.", 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={isProcessing ? undefined : onClose}>
            <div className="bg-dark-card rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-white/10" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-white/10 bg-dark-bg/50">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2"><Icon name="list-checks" size={20} className="text-brand-primary"/>{match.results && match.results.length > 0 ? 'Edit' : 'Add'} Match Result</h3>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{match.title}</p>
                    </div>
                    <button onClick={onClose} disabled={isProcessing} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Icon name="x" size={20} /></button>
                </div>

                <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 bg-dark-bg border-b border-white/5">
                    <div className={`p-3 rounded-lg text-center ${prizePoolExceeded ? 'bg-red-500/10 border border-red-500/20' : 'bg-dark-card-hover'}`}>
                        <p className="text-[10px] font-bold uppercase text-gray-400">Prize Pool</p>
                        <p className="font-extrabold text-brand-gold">💎{match.prizePool}</p>
                    </div>
                    <div className={`p-3 rounded-lg text-center ${prizePoolExceeded ? 'bg-red-500/10 border border-red-500/20' : 'bg-dark-card-hover'}`}>
                        <p className="text-[10px] font-bold uppercase text-gray-400">Total Distributed</p>
                        <p className={`font-extrabold ${prizePoolExceeded ? 'text-red-500' : 'text-white'}`}>💎{totalDistributed}</p>
                    </div>
                    <div className="p-3 rounded-lg text-center bg-dark-card-hover">
                        <p className="text-[10px] font-bold uppercase text-gray-400">Per Kill Reward</p>
                        <p className="font-extrabold text-white">💎{match.perKill}</p>
                    </div>
                     <button onClick={autoCalculateWinnings} className="bg-blue-500/10 text-blue-400 text-xs font-bold rounded-lg hover:bg-blue-500 hover:text-white transition-colors flex items-center justify-center gap-2">
                        <Icon name="zap" size={14}/> Auto-Calculate
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="space-y-3">
                        {joinedPlayers.map(({ user, detail }) => (
                            <div key={user.email} className="bg-dark-bg p-3 rounded-xl border border-white/5 grid grid-cols-12 gap-3 items-center">
                                <div className="col-span-1 text-center text-gray-500 font-mono text-sm">#{detail.slotNumber}</div>
                                <div className="col-span-4 flex items-center gap-2">
                                    <img src={user.avatar} className="w-8 h-8 rounded-full object-cover" alt={user.name}/>
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-bold text-white truncate">{detail.ign}</p>
                                        <p className="text-[10px] text-gray-500 truncate">{detail.uid}</p>
                                    </div>
                                </div>
                                <div className="col-span-3">
                                    <div className="relative">
                                        <Icon name="crosshair" size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500"/>
                                        <input type="number" value={playerResults[user.email]?.kills || '0'} onChange={e => handleResultChange(user.email, 'kills', e.target.value)} placeholder="Kills" className="w-full bg-dark-card border border-gray-700 rounded-md py-1.5 pl-6 pr-2 text-white text-xs"/>
                                    </div>
                                </div>
                                <div className="col-span-3">
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-brand-gold font-bold">💎</span>
                                        <input type="number" value={playerResults[user.email]?.winning || '0'} onChange={e => handleResultChange(user.email, 'winning', e.target.value)} placeholder="Winnings" className="w-full bg-dark-card border border-gray-700 rounded-md py-1.5 pl-6 pr-2 text-white text-xs"/>
                                    </div>
                                </div>
                                 <div className="col-span-1 flex justify-center">
                                    <button type="button" onClick={() => handleSetWinner(user.email)} className="p-1.5 text-brand-gold hover:bg-brand-gold/10 rounded-full" title="Set as main winner">
                                        <Icon name="crown" size={14}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-white/10 mt-auto bg-dark-bg/50">
                     <button onClick={handleFinalize} disabled={isProcessing} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                        {isProcessing ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <Icon name="check-circle" size={18} />}
                        {isProcessing ? 'PROCESSING...' : 'CONFIRM & DISTRIBUTE'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FinalizeMatchModal;
