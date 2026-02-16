import React, { useState, useMemo, useEffect } from 'react';
import Icon from './Icon';
import { User, AppSettings } from '../types';
import TransactionCard from './TransactionCard';
import MediaDisplay from './MediaDisplay';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  appSettings: AppSettings;
}

type FilterType = 'All' | 'Deposits' | 'Withdrawals' | 'Share' | 'Convert';

const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({ isOpen, onClose, user, appSettings }) => {
    const [filter, setFilter] = useState<FilterType>('All');
    
    useEffect(() => {
      if (isOpen && window.lucide) {
        setTimeout(() => window.lucide.createIcons(), 50);
      }
    }, [isOpen, filter]);

    const sortedTransactions = useMemo(() => {
        return [...user.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [user.transactions]);

    const filteredTransactions = useMemo(() => {
        switch (filter) {
            case 'All':
                return sortedTransactions;
            case 'Deposits':
                return sortedTransactions.filter(t => ['Deposit', 'Promo Code', 'Winnings', 'Referral Bonus'].includes(t.type) || (t.type === 'Admin Adjustment' && t.amount > 0) || (t.type === 'Share' && t.amount > 0));
            case 'Withdrawals':
                return sortedTransactions.filter(t => ['Withdrawal', 'Entry Fee'].includes(t.type) || (t.type === 'Admin Adjustment' && t.amount < 0));
            case 'Share':
                return sortedTransactions.filter(t => t.type === 'Share');
            case 'Convert':
                return sortedTransactions.filter(t => t.type === 'Conversion');
            default:
                return sortedTransactions;
        }
    }, [sortedTransactions, filter]);

    const summary = useMemo(() => {
        const credits = filteredTransactions.filter(tx => tx.amount > 0).reduce((acc, tx) => acc + tx.amount, 0);
        const debits = filteredTransactions.filter(tx => tx.amount < 0).reduce((acc, tx) => acc + tx.amount, 0);
        return { count: filteredTransactions.length, credits, debits };
    }, [filteredTransactions]);

    const filters: { label: string, type: FilterType, icon: string }[] = [
        { label: 'All', type: 'All', icon: 'list' },
        { label: 'Deposits', type: 'Deposits', icon: 'arrow-down-circle' },
        { label: 'Withdrawals', type: 'Withdrawals', icon: 'send' },
        { label: 'Share', type: 'Share', icon: 'share-2' },
        { label: 'Convert', type: 'Convert', icon: 'repeat' },
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-dark-bg z-50 flex flex-col max-w-md mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex-shrink-0 p-4 flex justify-between items-center bg-dark-card/80 backdrop-blur-sm border-b border-white/10">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Icon name="history" className="text-brand-cyan" />
                    Transaction History
                </h2>
                <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <Icon name="x" size={20} />
                </button>
            </div>
            
            {/* Filters */}
            <div className="flex-shrink-0 p-4 border-b border-white/10">
                <div className="grid grid-cols-5 gap-2 bg-dark-bg p-1 rounded-lg border border-white/5">
                    {filters.map(f => (
                         <button 
                            key={f.type} 
                            onClick={() => setFilter(f.type)} 
                            className={`flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-bold rounded-md transition-colors duration-200 ${filter === f.type ? 'bg-brand-primary text-black shadow' : 'text-gray-400 hover:bg-white/10'}`}
                        >
                            <Icon name={f.icon} size={14} />
                            {f.label.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary */}
            <div className="flex-shrink-0 p-4 bg-dark-card/50 border-b border-white/5">
                <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-green-500/10 p-2 rounded-lg">
                        <p className="text-[10px] font-bold text-green-400 uppercase">Credits</p>
                        <p className="text-sm font-bold text-white">💎{summary.credits.toFixed(2)}</p>
                    </div>
                     <div className="bg-red-500/10 p-2 rounded-lg">
                        <p className="text-[10px] font-bold text-red-400 uppercase">Debits</p>
                        <p className="text-sm font-bold text-white">💎{Math.abs(summary.debits).toFixed(2)}</p>
                    </div>
                     <div className="bg-blue-500/10 p-2 rounded-lg">
                        <p className="text-[10px] font-bold text-blue-400 uppercase">Total</p>
                        <p className="text-sm font-bold text-white">{summary.count}</p>
                    </div>
                </div>
            </div>


            {/* Content */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {filteredTransactions.length > 0 ? (
                    filteredTransactions.map(tx => (
                        <TransactionCard key={tx.id} transaction={tx} />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 py-16">
                         <MediaDisplay 
                            src={appSettings.noTransactionsImageUrl} 
                            alt="Empty" 
                            className="mx-auto mb-4 object-contain"
                            style={{
                                width: `${appSettings.noTransactionsImageWidth || 160}px`,
                                height: `${appSettings.noTransactionsImageHeight || 120}px`
                            }}
                         />
                         <h3 className="text-lg font-bold">No Transactions Found</h3>
                         <p className="text-sm">This list is empty. Try a different filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransactionHistoryModal;