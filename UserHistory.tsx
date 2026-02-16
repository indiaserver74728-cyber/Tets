import React, { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import * as types from '../../types';
import { db } from '../../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import ConfirmModal from '../../components/ConfirmModal';
import SendUserNotificationModal from '../../components/admin/SendUserNotificationModal';

interface UserHistoryProps {
    users: types.User[];
    setUsers: React.Dispatch<React.SetStateAction<types.User[]>>;
}

const AdminUserHistoryScreen: React.FC<UserHistoryProps> = ({ users, setUsers }) => {
    const [selectedUser, setSelectedUser] = useState<types.User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [editingTx, setEditingTx] = useState<types.Transaction | null>(null);
    const [deletingTx, setDeletingTx] = useState<types.Transaction | null>(null);
    const [isSendModalOpen, setIsSendModalOpen] = useState(false);

    // This useEffect safely syncs the detailed view when the master user list updates
    useEffect(() => {
        if (selectedUser) {
            const updatedUserInList = users.find(u => u.email === selectedUser.email);
            // Deep compare to prevent re-renders and race conditions if data hasn't changed.
            if (JSON.stringify(selectedUser) !== JSON.stringify(updatedUserInList)) {
                 setSelectedUser(updatedUserInList || null);
            }
        }
    }, [users, selectedUser]);

    useEffect(() => {
        if(window.lucide) window.lucide.createIcons();
    }, [selectedUser, users, searchTerm, editingTx, deletingTx, isSendModalOpen]);

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => (b.transactions?.length || 0) - (a.transactions?.length || 0));
    
    const handleUpdateUser = async (updatedUser: types.User) => {
        // Optimistically update the local state for immediate UI feedback.
        setSelectedUser(updatedUser);
        try {
            await updateDoc(doc(db, 'users', updatedUser.email.toLowerCase()), updatedUser);
        } catch (error) {
            console.error(error);
            alert('Failed to update user. The UI may be out of sync.');
            // Firestore listener will eventually correct the state on failure
        }
    };

    const handleSaveTx = () => {
        if (!editingTx || !selectedUser) return;
        
        const updatedTransactions = selectedUser.transactions.map(t => 
            t.id === editingTx.id ? editingTx : t
        );
        
        const updatedUser = { ...selectedUser, transactions: updatedTransactions };
        handleUpdateUser(updatedUser);
        setEditingTx(null);
    };

    const handleDeleteTx = () => {
        if (!deletingTx || !selectedUser) return;
        
        const updatedTransactions = selectedUser.transactions.filter(t => t.id !== deletingTx.id);
        const updatedUser = { ...selectedUser, transactions: updatedTransactions };

        handleUpdateUser(updatedUser);
        setDeletingTx(null);
    };

    const handleSendNotification = async (newNotifData: Omit<types.Notification, 'id' | 'time' | 'read'>) => {
        if (!selectedUser) return;

        const originalUser = selectedUser;
        const newNotification: types.Notification = { ...newNotifData, id: Date.now(), time: new Date().toISOString(), read: false };
        const updatedNotifications = [newNotification, ...selectedUser.notifications];
        const updatedUser = { ...selectedUser, notifications: updatedNotifications };
        
        // Optimistic UI update
        setSelectedUser(updatedUser);
        setIsSendModalOpen(false);

        try {
            await updateDoc(doc(db, 'users', selectedUser.email.toLowerCase()), { notifications: updatedNotifications });
        } catch (error) {
            console.error(error);
            alert('Failed to send notification.');
            // Revert on failure
            setSelectedUser(originalUser);
        }
    };
    
    const formatAdminTime = (time: string) => {
        const date = new Date(time);
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        return date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    };

    const sortedTransactions = selectedUser 
        ? [...selectedUser.transactions].sort((a, b) => b.id - a.id)
        : [];

    return (
        <>
            <div className="h-full bg-dark-card border border-white/10 rounded-2xl overflow-hidden relative">
                {/* User List Panel */}
                <div className={`absolute inset-0 w-full md:w-1/2 h-full flex flex-col transition-transform duration-500 ease-in-out ${selectedUser ? '-translate-x-full md:-translate-x-0' : 'translate-x-0'}`}>
                    <div className="p-4 border-b border-white/5 flex-shrink-0">
                        <h2 className="text-lg font-bold text-white mb-3">User List ({filteredUsers.length})</h2>
                        <div className="relative">
                            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input 
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-dark-bg border border-gray-700 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:border-brand-primary outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                        {filteredUsers.map(user => (
                            <div 
                                key={user.email}
                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border-2 ${selectedUser?.email === user.email ? 'border-brand-primary bg-brand-primary/10' : 'border-transparent hover:bg-white/5'}`}
                                onClick={() => setSelectedUser(user)}
                            >
                                <img src={user.avatar} className="w-12 h-12 rounded-full object-cover" alt={user.name} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white text-sm truncate">{user.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                    <div className="flex items-center gap-2 mt-1 text-xs font-mono">
                                        <span className="text-green-400">D:💎{user.deposit}</span>
                                        <span className="text-amber-400">W:💎{user.winnings}</span>
                                    </div>
                                </div>
                                <span className="bg-dark-bg text-brand-cyan text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0 border border-white/5">
                                    {user.transactions?.length || 0}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* History Panel */}
                <div className={`absolute top-0 right-0 w-full md:w-1/2 h-full flex flex-col bg-dark-bg transition-transform duration-500 ease-in-out ${selectedUser ? 'translate-x-0' : 'translate-x-full'}`}>
                    {selectedUser ? (
                        <>
                            <div className="p-4 border-b border-white/5 flex justify-between items-center flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setSelectedUser(null)} className="p-2 bg-white/5 rounded-lg md:hidden"><Icon name="arrow-left" /></button>
                                    <img src={selectedUser.avatar} alt={selectedUser.name} className="w-10 h-10 rounded-full object-cover" />
                                    <div>
                                        <h3 className="font-bold text-white">{selectedUser.name}'s History</h3>
                                        <p className="text-xs text-gray-500">{sortedTransactions.length} total records</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsSendModalOpen(true)} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-colors" title="Send Notification">
                                    <Icon name="send" size={16}/>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {sortedTransactions.length > 0 ? (
                                    sortedTransactions.map(tx => (
                                        editingTx && editingTx.id === tx.id ? (
                                            <div key={tx.id} className="bg-dark-card border-2 border-brand-primary/50 p-4 rounded-xl space-y-3 animate-fade-in shadow-lg shadow-brand-primary/10">
                                                <h4 className="text-xs font-bold text-brand-primary uppercase">Editing Transaction #{tx.id}</h4>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input type="text" value={editingTx.type} onChange={e => setEditingTx({...editingTx, type: e.target.value as any})} className="bg-dark-bg border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-primary outline-none" placeholder="Type"/>
                                                    <input type="number" value={editingTx.amount} onChange={e => setEditingTx({...editingTx, amount: parseFloat(e.target.value) || 0})} className="bg-dark-bg border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-primary outline-none" placeholder="Amount"/>
                                                </div>
                                                <input type="text" value={editingTx.reason || ''} onChange={e => setEditingTx({...editingTx, reason: e.target.value})} placeholder="Reason" className="w-full bg-dark-bg border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-brand-primary outline-none"/>
                                                <div className="flex gap-2 justify-end pt-2">
                                                    <button onClick={() => setEditingTx(null)} className="px-4 py-2 rounded-lg bg-gray-700 text-xs font-bold text-white hover:bg-gray-600">Cancel</button>
                                                    <button onClick={handleSaveTx} className="px-4 py-2 rounded-lg bg-brand-primary text-black text-xs font-bold hover:opacity-90">Save</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div key={tx.id} className="bg-dark-card border border-white/5 rounded-xl overflow-hidden">
                                                <div className="p-4 flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <p className="font-bold text-white">{tx.type}</p>
                                                        <p className="text-xs text-gray-400 mt-1">{tx.reason || 'No reason provided'}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-xl font-bold font-mono ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>{tx.amount > 0 ? '+' : ''}💎{Math.abs(tx.amount)}</p>
                                                        <p className="text-[10px] text-gray-600 font-mono mt-1">ID: {tx.id}</p>
                                                    </div>
                                                </div>
                                                <div className="bg-dark-bg px-4 py-2 border-t border-white/5 flex justify-between items-center">
                                                    <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleString()}</p>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setEditingTx(tx)} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded" title="Edit Record"><Icon name="edit-2" size={14} /></button>
                                                        <button onClick={() => setDeletingTx(tx)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded" title="Delete Record"><Icon name="trash" size={14} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-600">
                                        <Icon name="history" size={48} className="mb-4 opacity-50" />
                                        <h3 className="font-bold text-lg text-gray-400">No History</h3>
                                        <p className="text-sm">This user doesn't have any transactions.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-600 p-8">
                             <Icon name="users" size={48} className="mb-4 opacity-50" />
                            <h3 className="font-bold text-lg text-gray-400">Select a User</h3>
                            <p className="text-sm">Choose a user from the list to view and manage their transaction history.</p>
                        </div>
                    )}
                </div>
            </div>

            <SendUserNotificationModal isOpen={isSendModalOpen} onClose={() => setIsSendModalOpen(false)} onSend={handleSendNotification} user={selectedUser}/>
            <ConfirmModal isOpen={!!deletingTx} onClose={() => setDeletingTx(null)} onConfirm={handleDeleteTx} title="Delete Transaction" message={`Are you sure you want to delete this transaction record? This will not adjust the user's balance and cannot be undone.`} confirmText="Delete Record" confirmIcon="trash-2" confirmButtonClass="bg-red-500 hover:bg-red-600"/>
        </>
    );
};

export default AdminUserHistoryScreen;
