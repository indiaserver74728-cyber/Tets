import React, { useState, useEffect } from 'react';
import { User, Match, Transaction } from '../../types';
import Icon from '../Icon';
import ConfirmModal from '../ConfirmModal';

interface UserDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    matches: Match[];
    onUpdateUser: (updatedUser: User) => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ isOpen, onClose, user, matches, onUpdateUser }) => {
    const [balanceAmount, setBalanceAmount] = useState('');
    const [balanceReason, setBalanceReason] = useState('');
    const [balanceType, setBalanceType] = useState<'deposit' | 'winnings'>('deposit');
    const [loading, setLoading] = useState(false);
    
    // Transaction Editing State
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const [deleteTxId, setDeleteTxId] = useState<number | null>(null);

    useEffect(() => {
        if(isOpen && window.lucide) {
            setTimeout(() => window.lucide.createIcons(), 50);
        }
    }, [isOpen, editingTx]); 

    if (!isOpen || !user) return null;

    const userMatches = matches.filter(m => user.joinedMatchDetails.some(d => d.matchId === m.id));
    // Sort transactions by date (newest first)
    const recentTx = [...user.transactions].sort((a,b) => b.id - a.id);

    const handleAdjustBalance = (e: React.FormEvent) => {
        e.preventDefault();
        if(!balanceAmount) return;
        setLoading(true);
        
        setTimeout(() => { 
            const amount = parseFloat(balanceAmount);
            const newTx: Transaction = {
                id: Date.now(),
                type: 'Admin Adjustment',
                amount: amount,
                date: new Date().toISOString(),
                status: 'Completed',
                reason: balanceReason || 'Admin Manual Adjustment'
            };

            const updatedUser = { ...user };
            if(balanceType === 'deposit') {
                updatedUser.deposit += amount;
            } else {
                updatedUser.winnings += amount;
                // If adding winnings, also update lifetime winnings
                if (amount > 0) {
                    updatedUser.totalWinnings += amount;
                }
            }
            
            updatedUser.transactions = [newTx, ...updatedUser.transactions];
            
            onUpdateUser(updatedUser);
            setBalanceAmount('');
            setBalanceReason('');
            setLoading(false);
            alert(`Balance Adjusted Successfully!`);
        }, 500);
    };

    const handleSaveTx = () => {
        if (!editingTx) return;
        // Map through the ORIGINAL user transactions to ensure we don't lose data or reorder unexpectedly
        const updatedTransactions = user.transactions.map(t => 
            t.id === editingTx.id ? editingTx : t
        );
        
        onUpdateUser({ ...user, transactions: updatedTransactions });
        setEditingTx(null);
    };

    const initiateDeleteTx = (txId: number) => {
        setDeleteTxId(txId);
    };

    const confirmDeleteTx = () => {
        if (deleteTxId === null) return;
        const updatedTransactions = user.transactions.filter(t => t.id !== deleteTxId);
        onUpdateUser({ ...user, transactions: updatedTransactions });
        setDeleteTxId(null);
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="relative bg-dark-bg border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row shadow-2xl overflow-y-auto md:overflow-hidden custom-scrollbar" onClick={e => e.stopPropagation()}>
                
                {/* Mobile Close Button (Floating Top Right) */}
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 z-[70] p-2 bg-black/60 hover:bg-red-500 text-white rounded-lg transition-colors border border-white/10 md:hidden"
                >
                    <Icon name="x" size={20} />
                </button>

                {/* Left Panel: Profile Summary */}
                <div className="w-full md:w-1/3 bg-dark-card border-b md:border-b-0 md:border-r border-white/10 p-6 flex flex-col items-center text-center shrink-0 md:overflow-y-auto custom-scrollbar">
                    {/* Spacer for mobile close button */}
                    <div className="h-6 md:hidden"></div>

                    <div className="relative mb-4 mt-2">
                        <img src={user.avatar} className="w-24 h-24 rounded-full border-4 border-dark-bg ring-2 ring-brand-primary object-cover" alt={user.name} />
                        <span className={`absolute bottom-1 right-1 w-5 h-5 border-2 border-dark-bg rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1 break-all">{user.name}</h2>
                    <p className="text-sm text-gray-400 mb-4 break-all">{user.email}</p>
                    
                    {/* Password Display */}
                    {user.password && (
                         <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20 mb-6 w-full">
                            <p className="text-[10px] text-red-400 font-bold uppercase mb-1 flex items-center justify-center gap-1.5"><Icon name="alert-triangle" size={12}/>Stored Password</p>
                            <p className="text-lg font-mono text-white tracking-widest">{user.password}</p>
                        </div>
                    )}

                    <div className="w-full grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-dark-bg p-3 rounded-lg border border-white/5">
                            <p className="text-[10px] text-gray-500 uppercase font-bold">Matches</p>
                            <p className="text-lg font-bold text-white">{user.matches}</p>
                        </div>
                        <div className="bg-dark-bg p-3 rounded-lg border border-white/5">
                            <p className="text-[10px] text-gray-500 uppercase font-bold">Kills</p>
                            <p className="text-lg font-bold text-white">{user.kills}</p>
                        </div>
                        <div className="bg-dark-bg p-3 rounded-lg border border-white/5 col-span-2">
                            <p className="text-[10px] text-gray-500 uppercase font-bold">Referral Code</p>
                            <p className="text-lg font-bold text-brand-cyan tracking-widest">{user.referralCode}</p>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Detailed Tabs/Sections */}
                <div className="w-full md:flex-1 p-6 bg-[#0f0f0f] relative md:overflow-y-auto custom-scrollbar md:h-full">
                    {/* Desktop Close Button */}
                    <button 
                        onClick={onClose} 
                        className="hidden md:block absolute top-4 right-4 text-gray-500 hover:text-red-500 transition-colors z-10"
                    >
                        <Icon name="x" size={24} />
                    </button>

                    {/* Wallet Section */}
                    <div className="mb-8 mt-2 md:mt-0">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Financial Overview</h3>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 p-4 rounded-xl">
                                <p className="text-xs text-green-400 font-bold uppercase mb-1">Deposit Wallet</p>
                                <p className="text-2xl font-bold text-white">💎{user.deposit}</p>
                            </div>
                            <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 p-4 rounded-xl">
                                <p className="text-xs text-amber-400 font-bold uppercase mb-1">Winnings</p>
                                <p className="text-2xl font-bold text-white">💎{user.winnings}</p>
                            </div>
                        </div>

                        {/* Adjust Balance Form */}
                        <form onSubmit={handleAdjustBalance} className="bg-dark-card p-4 rounded-xl border border-white/5 mb-6">
                            <p className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Icon name="sliders" size={14}/> Quick Balance Adjustment</p>
                            <div className="flex flex-col md:flex-row gap-3">
                                <select 
                                    value={balanceType}
                                    onChange={(e: any) => setBalanceType(e.target.value)}
                                    className="bg-dark-bg border border-gray-700 text-white text-xs rounded-lg p-2.5 focus:border-brand-primary"
                                >
                                    <option value="deposit">Deposit</option>
                                    <option value="winnings">Winnings</option>
                                </select>
                                <input 
                                    type="number" 
                                    placeholder="+/- Amount" 
                                    value={balanceAmount}
                                    onChange={e => setBalanceAmount(e.target.value)}
                                    className="flex-1 bg-dark-bg border border-gray-700 text-white text-xs rounded-lg p-2.5 focus:border-brand-primary"
                                />
                                <input 
                                    type="text" 
                                    placeholder="Reason (Optional)" 
                                    value={balanceReason}
                                    onChange={e => setBalanceReason(e.target.value)}
                                    className="flex-1 bg-dark-bg border border-gray-700 text-white text-xs rounded-lg p-2.5 focus:border-brand-primary"
                                />
                                <button type="submit" disabled={loading} className="bg-brand-primary text-black font-bold text-xs px-4 py-2.5 rounded-lg hover:opacity-90">
                                    {loading ? '...' : 'Apply'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Transactions Section */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Transaction History</h3>
                        <div className="space-y-2">
                            {recentTx.length > 0 ? recentTx.map(tx => (
                                editingTx && editingTx.id === tx.id ? (
                                    // Editing Mode for Transaction
                                    <div key={tx.id} className="bg-dark-card border border-brand-primary/50 p-3 rounded-lg space-y-2 animate-fade-in">
                                        <div className="grid grid-cols-2 gap-2">
                                            <input 
                                                type="text" 
                                                value={editingTx.type} 
                                                onChange={e => setEditingTx({...editingTx, type: e.target.value as any})} 
                                                className="bg-dark-bg border border-gray-700 rounded px-2 py-1.5 text-xs text-white placeholder-gray-500" 
                                                placeholder="Type"
                                            />
                                            {/* Changed to type number for better mobile handling */}
                                            <input 
                                                type="number" 
                                                value={editingTx.amount} 
                                                onChange={e => setEditingTx({...editingTx, amount: parseFloat(e.target.value) || 0})} 
                                                className="bg-dark-bg border border-gray-700 rounded px-2 py-1.5 text-xs text-white placeholder-gray-500" 
                                                placeholder="Amount"
                                            />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={editingTx.reason || ''} 
                                            onChange={e => setEditingTx({...editingTx, reason: e.target.value})} 
                                            placeholder="Reason"
                                            className="w-full bg-dark-bg border border-gray-700 rounded px-2 py-1.5 text-xs text-white placeholder-gray-500" 
                                        />
                                        <div className="flex gap-2 justify-end pt-1">
                                            <button onClick={() => setEditingTx(null)} className="px-3 py-1 rounded bg-gray-700 text-xs text-white hover:bg-gray-600">Cancel</button>
                                            <button onClick={handleSaveTx} className="px-3 py-1 rounded bg-brand-primary text-black text-xs font-bold hover:opacity-90">Save</button>
                                        </div>
                                    </div>
                                ) : (
                                    // View Mode for Transaction
                                    <div key={tx.id} className="group flex justify-between items-center p-3 rounded-lg bg-dark-card border border-white/5 hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-dark-bg shrink-0 ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                <Icon name={tx.amount > 0 ? 'arrow-down-left' : 'arrow-up-right'} size={14} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-200 truncate">{tx.type}</p>
                                                <p className="text-[10px] text-gray-500 truncate">{new Date(tx.date).toLocaleDateString()} • {tx.reason || 'No reason'}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                            <span className={`text-sm font-mono font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {tx.amount > 0 ? '+' : ''}{tx.amount}
                                            </span>
                                            
                                            {/* Edit/Delete Actions */}
                                            <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => setEditingTx(tx)} 
                                                    className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                                                    title="Edit Record"
                                                >
                                                    <Icon name="edit-2" size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => initiateDeleteTx(tx.id)} 
                                                    className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                                    title="Delete Record"
                                                >
                                                    <Icon name="trash" size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )) : <p className="text-gray-500 text-xs italic">No transactions found.</p>}
                        </div>
                    </div>

                    {/* Matches Section */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Recent Matches</h3>
                        <div className="space-y-2">
                            {userMatches.length > 0 ? userMatches.slice(0, 5).map(m => (
                                <div key={m.id} className="flex justify-between items-center p-3 rounded-lg bg-dark-card border border-white/5">
                                    <div>
                                        <p className="text-xs font-bold text-white">{m.title}</p>
                                        <p className="text-[10px] text-gray-500">{m.map} • {m.mode}</p>
                                    </div>
                                    <span className="text-[10px] px-2 py-1 rounded bg-white/5 text-gray-300">{m.type}</span>
                                </div>
                            )) : <p className="text-gray-500 text-xs italic">No matches played yet.</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal 
                isOpen={deleteTxId !== null}
                onClose={() => setDeleteTxId(null)}
                onConfirm={confirmDeleteTx}
                title="Delete Transaction"
                message="Are you sure you want to delete this transaction record? This only removes the history log."
                confirmText="Delete"
                confirmIcon="trash-2"
                confirmButtonClass="bg-red-500 hover:bg-red-600"
            />
        </div>
    );
};

export default UserDetailsModal;