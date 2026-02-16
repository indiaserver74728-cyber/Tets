import React, { useMemo, useState, useEffect } from 'react';
import { User, Transaction } from '../../types';
import Icon from '../Icon';
import AdminSection from './AdminSection';

interface AdminTransactionsProps {
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

type FormattedTransaction = Transaction & { userEmail: string, userName: string, userAvatar: string, userStatus: string, userPhone: string };

const AdminTransactions: React.FC<AdminTransactionsProps> = ({ users, setUsers }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('All');

    useEffect(() => {
        if(window.lucide) window.lucide.createIcons();
    }, [filterType, searchTerm]);

    const allTransactions = useMemo<FormattedTransaction[]>(() => {
        return users
            .flatMap(user => 
                user.transactions.map(tx => ({
                    ...tx,
                    userEmail: user.email,
                    userName: user.name,
                    userAvatar: user.avatar,
                    userStatus: user.status,
                    userPhone: user.phone
                }))
            )
            .filter(tx => tx.type !== 'Withdrawal') // EXCLUDE WITHDRAWALS
            .sort((a, b) => b.id - a.id);
    }, [users]);

    const filteredTransactions = useMemo(() => {
        return allTransactions.filter(tx => {
            const typeMatch = filterType === 'All' || tx.type === filterType;
            const searchMatch = tx.userName.toLowerCase().includes(searchTerm.toLowerCase()) || tx.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
            return typeMatch && searchMatch;
        });
    }, [allTransactions, searchTerm, filterType]);

    const transactionTypes = ['All', ...Array.from(new Set(allTransactions.map(tx => tx.type)))];

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const DetailItem = ({ label, value, icon, isCopyable = false }: { label: string, value: string, icon: string, isCopyable?: boolean }) => (
        <div className="flex flex-col">
            <p className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1.5 mb-1">
                <Icon name={icon} size={12} className="text-brand-primary/70"/> {label}
            </p>
            <div className="flex items-center gap-2 bg-black/20 p-2 rounded border border-white/5 h-full">
                <p className="text-sm font-semibold text-gray-200 break-all leading-tight">{value}</p>
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
        <AdminSection icon="history" title="Transaction History" subtitle="View all system transactions (excluding withdrawals).">
            
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
                <div className="relative w-full md:w-64">
                    <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                        type="text" 
                        placeholder="Search user..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-dark-bg border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:border-brand-primary outline-none"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
                    {transactionTypes.map(type => (
                        <button 
                            key={type} 
                            onClick={() => setFilterType(type)} 
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-colors border ${filterType === type ? 'bg-brand-primary text-black border-brand-primary' : 'bg-transparent text-gray-400 border-white/10 hover:text-white hover:border-white/30'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {filteredTransactions.length > 0 ? (
                    filteredTransactions.map(tx => (
                        <div 
                            key={tx.id} 
                            className="bg-dark-card border border-white/10 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:border-white/20"
                        >
                            {/* Card Header */}
                            <div className="bg-white/5 px-4 py-3 flex items-center justify-between border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <img src={tx.userAvatar} alt={tx.userName} className="w-20 h-auto rounded-full object-cover  border-white/10"/>
                                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-dark-card ${tx.userStatus === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    </div>
                                    <div className={'pl-2'}>
                                        <h3 className="font-bold text-white text-sm leading-tight">{tx.userName}</h3>
                                        <p className="text-[10px] text-gray-400 font-mono mt-2">Reg NO: {tx.userPhone}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                   
                                    <p className="text-[10px] text-white-900 mt-2">{new Date(tx.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row">
                                {/* Left Side: Details */}
                                <div className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <DetailItem label="Transaction Type" value={tx.type} icon="tag" />
                                    <DetailItem label="User Email" value={tx.userEmail} icon="mail" isCopyable={true} />
                                    <DetailItem label="Reg No" value={tx.userPhone} icon="phone" isCopyable={true} />
                                    {tx.reason && (
                                        <div className="col-span-1 sm:col-span-2">
                                            <DetailItem label="Description / Reason" value={tx.reason} icon="file-text" />
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Amount */}
                                <div className="md:w-64 bg-black/20 p-4 border-t md:border-t-0 md:border-l border-white/5 flex flex-col justify-center items-center md:items-end">
                                    <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Amount</p>
                                    <div className="flex items-center gap-2 mb-2">
                                        <p className={`text-3xl font-extrabold ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {tx.amount > 0 ? '+' : ''}💎{Math.abs(tx.amount)}
                                        </p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border flex items-center gap-1.5 ${
                                        tx.status === 'Completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                                        tx.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                                        'bg-red-500/10 text-red-500 border-red-500/20'
                                    }`}>
                                        <Icon name={tx.status === 'Completed' ? 'check' : tx.status === 'Pending' ? 'loader' : 'x'} size={10} />
                                        {tx.status}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
                        <Icon name="history" size={32} className="opacity-40 mb-3"/>
                        <p className="font-semibold">No transactions found.</p>
                        <p className="text-xs text-gray-600">Try adjusting your search or filters.</p>
                    </div>
                )}
            </div>
        </AdminSection>
    );
};

export default AdminTransactions;