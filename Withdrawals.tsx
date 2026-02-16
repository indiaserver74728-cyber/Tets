import React, { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import AdminSection from '../../components/admin/AdminSection';
import * as types from '../../types';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import * as assets from '../../assets';

interface WithdrawalsProps {
    users: types.User[];
    setUsers: React.Dispatch<React.SetStateAction<types.User[]>>;
    paymentMethods: types.PaymentMethod[];
}

const AdminWithdrawalsScreen: React.FC<WithdrawalsProps> = ({ users, setUsers, paymentMethods }) => {
    const [tab, setTab] = useState<'pending' | 'history'>('pending');

    useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    }, [users, tab]);

    const allWithdrawals = users.flatMap(u => 
        u.transactions
            .filter(t => t.type === 'Withdrawal')
            .map(t => ({ ...t, user: u }))
    ).sort((a,b) => b.id - a.id);

    const pendingWithdrawals = allWithdrawals.filter(t => t.status === 'Pending');
    const historyWithdrawals = allWithdrawals.filter(t => t.status !== 'Pending');
    
    const withdrawalsToShow = tab === 'pending' ? pendingWithdrawals : historyWithdrawals;

    const handleStatusUpdate = async (userEmail: string, txId: number, status: 'Completed' | 'Rejected') => {
         const user = users.find(u => u.email === userEmail);
         if (!user) return;

         const newTransactions = user.transactions.map(tx => tx.id === txId ? {...tx, status} : tx);
         let newWinnings = user.winnings;

         // If rejected, refund the amount back to winnings
         if (status === 'Rejected') {
            const tx = user.transactions.find(t => t.id === txId);
            if (tx) {
                newWinnings += Math.abs(tx.amount); // tx.amount is negative for withdrawals
            }
         }
         
         try {
             await updateDoc(doc(db, 'users', userEmail), {
                 transactions: newTransactions,
                 winnings: newWinnings
             });
             // UI will update via Firestore listener
         } catch(e) {
             console.error(e);
             alert("Failed to update transaction status.");
         }
    };
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            // Optional: You could show a toast here if ToastContext was available in props
            // alert('Copied!'); 
        }, (err) => {
            console.error('Copy failed', err);
        });
    };

    const DetailItem = ({ label, value, icon, isCopyable = false, className = '', valueClassName = 'text-gray-200' }: { label: string, value: string, icon: string, isCopyable?: boolean, className?: string, valueClassName?: string }) => (
        <div className={`flex flex-col ${className}`}>
            <p className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1.5 mb-1">
                <Icon name={icon} size={12} className="text-brand-primary/70"/> {label}
            </p>
            <div className="flex items-center gap-2 bg-black/20 p-2 rounded border border-white/5 h-full">
                <p className={`text-sm font-semibold break-all leading-tight ${valueClassName}`}>{value}</p>
                {isCopyable && (
                    <button 
                        onClick={() => copyToClipboard(value)} 
                        className="ml-auto text-gray-500 hover:text-white transition-colors p-1" 
                        title="Copy"
                    >
                        <Icon name="copy" size={12} />
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <AdminSection icon="dollar-sign" title="Withdrawal Requests" subtitle="Manage and Process Users Withdrawal Requests.">
            <div className="flex items-center border border-white/10 rounded-lg p-1 mb-6 max-w-sm bg-dark-bg mx-auto md:mx-0">
                <button onClick={() => setTab('pending')} className={`relative w-1/2 py-2 rounded font-semibold transition-colors text-sm flex items-center justify-center gap-2 ${tab === 'pending' ? 'bg-brand-primary text-black' : 'text-gray-400 hover:text-white'}`}>
                    PENDING 
                    {pendingWithdrawals.length > 0 && <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse">{pendingWithdrawals.length}</span>}
                </button>
                <button onClick={() => setTab('history')} className={`w-1/2 py-2 rounded font-semibold transition-colors text-sm ${tab === 'history' ? 'bg-brand-primary text-black' : 'text-gray-400 hover:text-white'}`}>
                    HISTORY
                </button>
            </div>
            
            <div className="space-y-6">
                {withdrawalsToShow.length > 0 ? (
                    withdrawalsToShow.map(tx => {
                        const method = tx.withdrawalDetails && paymentMethods.find(pm => pm.name === tx.withdrawalDetails.method);
                        return (
                            <div 
                                key={tx.id} 
                                className="bg-dark-card border-2 rounded-xl overflow-hidden shadow-lg transition-all duration-300"
                                style={{ 
                                    animation: 'border-glow 3s linear infinite',
                                    borderColor: '#00F2FF' 
                                }}
                            >
                                
                                {/* Card Header: User Identity */}
                                <div className="bg-white/5 px-4 py-4 flex items-center justify-between border-b border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img src={tx.user.avatar} alt={tx.user.name} className="w-20 h-20 rounded-full object-cover border-2 border-white/10"/>
                                            <div className={`absolute -bottom-0 -right-0 w-3 h-3 rounded-full border-2 border-dark-card ${tx.user.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-sm leading-tight">{tx.user.name}</h3>
                                            <p className="text-[10px] text-gray-400 font-mono mt-2">Reg NO : {tx.user.phone}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                       
                                        <p className="text-[10px] text-white-900 mt-2">{new Date(tx.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row">
                                    {/* Left Side: Payment Details */}
                                    <div className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {tx.withdrawalDetails ? (
                                            <>
                                                <DetailItem label="Account Number" value={tx.withdrawalDetails.accNum} icon="hash" isCopyable={true} />
                                                <DetailItem label="Account Holder Name" value={tx.withdrawalDetails.accName} icon="user" />

                                                <DetailItem label="Withdraw Amount" value={`💎 ${Math.abs(tx.amount)}`} icon="dollar-sign" valueClassName="font-bold text-green-500" />
                                                
                                                {/* Enhanced Payment Method Display */}
                                                <div className="flex flex-col">
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1.5 mb-1">
                                                        <Icon name="credit-card" size={12} className="text-brand-primary/70"/> Payment Method
                                                    </p>
                                                    <div className="flex items-center gap-2 bg-black/20 p-2 rounded border border-white/5 h-full">
                                                        {method?.logoUrl && (
                                                            <img 
                                                                src={method.logoUrl} 
                                                                alt={method.name} 
                                                                className="h-8 object-contain"
                                                            />
                                                        )}
                                                        <p className="text-sm font-semibold text-gray-200 capitalize">{tx.withdrawalDetails.method}</p>
                                                    </div>
                                                </div>

                                                <DetailItem label="Registered Email" value={tx.user.email} icon="mail" isCopyable={true} />
                                                <DetailItem label="Registered Mobile No" value={tx.user.phone} icon="phone" isCopyable={true} />
                                            </>
                                        ) : (
                                            <p className="text-red-500 text-sm italic col-span-2">Missing withdrawal details</p>
                                        )}
                                    </div>

                                    {/* Right Side: Amount & Actions */}
                                    <div className="md:w-64 bg-black/20 p-4 border-t md:border-t-0 md:border-l border-white/5 flex flex-col justify-between">
                                        <div className="text-center md:text-right mb-4">
                                            <p className="text-[10px] font-bold uppercase text-gray-500">Withdraw Amount</p>
                                            <div className="flex items-center justify-center md:justify-end gap-2">
                                                <p className="text-3xl font-extrabold text-white">💎{Math.abs(tx.amount)}</p>
                                            </div>
                                        </div>

                                        {tab === 'pending' ? (
                                            <div className="grid grid-cols-2 gap-2">
                                                <button 
                                                    onClick={() => handleStatusUpdate(tx.user.email, tx.id, 'Rejected')} 
                                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 border border-red-500/20 py-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-1"
                                                >
                                                    <Icon name="x-circle" size={16}/> REJECT
                                                </button>
                                                <button 
                                                    onClick={() => handleStatusUpdate(tx.user.email, tx.id, 'Completed')} 
                                                    className="bg-green-500/10 hover:bg-green-500/20 text-green-500 hover:text-green-400 border border-green-500/20 py-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-1"
                                                >
                                                    <Icon name="check-circle" size={16}/> APPROVE
                                                </button>
                                            </div>
                                        ) : (
                                            <div className={`w-full py-2 text-center rounded-lg font-bold text-xs uppercase border flex items-center justify-center gap-2 ${
                                                tx.status === 'Completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                                            }`}>
                                                <Icon name={tx.status === 'Completed' ? 'check' : 'x'} size={14} />
                                                {tx.status}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-3">
                            <Icon name="inbox" size={32} className="opacity-40"/>
                        </div>
                        <p className="font-semibold">No {tab} withdrawal requests found.</p>
                        <p className="text-xs text-gray-600">Check back later for new requests.</p>
                    </div>
                )}
            </div>
        </AdminSection>
    );
};

export default AdminWithdrawalsScreen;