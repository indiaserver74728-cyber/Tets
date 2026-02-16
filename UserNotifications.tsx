import React, { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import * as types from '../../types';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import NotificationEditModal from '../../components/admin/NotificationEditModal';
import SendUserNotificationModal from '../../components/admin/SendUserNotificationModal';
import ConfirmModal from '../../components/ConfirmModal';

interface UserNotificationsProps {
    users: types.User[];
    setUsers: React.Dispatch<React.SetStateAction<types.User[]>>;
}

const AdminUserNotificationsScreen: React.FC<UserNotificationsProps> = ({ users, setUsers }) => {
    const [selectedUser, setSelectedUser] = useState<types.User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [editingNotification, setEditingNotification] = useState<types.Notification | null>(null);
    const [deletingNotification, setDeletingNotification] = useState<types.Notification | null>(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    
    // Syncs local selectedUser state with updated props from App.tsx.
    // This effect runs ONLY when the main `users` list changes to prevent infinite loops.
    useEffect(() => {
        if (selectedUser) {
            // Find the latest version of the selected user from the master `users` list.
            const updatedUser = users.find(u => u.email === selectedUser.email);
            // This ensures our detailed view has the most up-to-date user data.
            // If the user was deleted, this will correctly set it to null.
            setSelectedUser(updatedUser || null);
        }
    }, [users]);

    useEffect(() => {
        if(window.lucide) window.lucide.createIcons();
    }, [selectedUser, users, searchTerm]);

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => (b.notifications?.length || 0) - (a.notifications?.length || 0));
    
    // Handlers
    const handleUpdateNotification = async (updatedNotif: types.Notification) => {
        if (!selectedUser) return;

        const updatedNotifications = selectedUser.notifications.map(n => 
            n.id === updatedNotif.id ? updatedNotif : n
        );
        
        try {
            await updateDoc(doc(db, 'users', selectedUser.email.toLowerCase()), {
                notifications: updatedNotifications
            });
            setIsEditModalOpen(false);
        } catch (error) {
            console.error(error);
            alert('Failed to update notification.');
        }
    };
    
    const handleDeleteNotification = async () => {
        if (!selectedUser || !deletingNotification) return;

        const updatedNotifications = selectedUser.notifications.filter(n => n.id !== deletingNotification.id);
        
        try {
            await updateDoc(doc(db, 'users', selectedUser.email.toLowerCase()), {
                notifications: updatedNotifications
            });
            setDeletingNotification(null);
        } catch (error) {
            console.error(error);
            alert('Failed to delete notification.');
        }
    };
    
    const handleSendNotification = async (newNotifData: Omit<types.Notification, 'id' | 'time' | 'read'>) => {
        if (!selectedUser) return;

        const newNotification: types.Notification = {
            ...newNotifData,
            id: Date.now(),
            time: new Date().toISOString(),
            read: false,
        };
        
        const updatedNotifications = [newNotification, ...selectedUser.notifications];

        try {
            await updateDoc(doc(db, 'users', selectedUser.email.toLowerCase()), {
                notifications: updatedNotifications
            });
            setIsSendModalOpen(false);
        } catch (error) {
            console.error(error);
            alert('Failed to send notification.');
        }
    };
    
    const formatAdminTime = (time: string) => {
        const date = new Date(time);
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        return date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    };

    return (
        <div className="h-full bg-dark-card border border-white/10 rounded-2xl overflow-hidden relative">
            {/* User List Panel */}
            <div className={`absolute inset-0 w-full h-full flex flex-col transition-transform duration-300 ease-in-out ${selectedUser ? '-translate-x-full' : 'translate-x-0'}`}>
                <div className="p-4 border-b border-white/5 flex-shrink-0">
                    <h2 className="text-lg font-bold text-white mb-3">Users</h2>
                    <div className="relative">
                        <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input 
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-dark-bg border border-gray-700 rounded-lg py-2 pl-9 pr-4 text-sm text-white"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredUsers.map(user => (
                        <div 
                            key={user.email}
                            className="flex items-center gap-3 p-3 border-b border-white/5"
                        >
                            <div 
                                className="flex-1 flex items-center gap-3 min-w-0 cursor-pointer"
                                onClick={() => setSelectedUser(user)}
                            >
                                <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" alt={user.name} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white text-sm truncate">{user.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                </div>
                                <span className="bg-brand-primary text-black text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0">
                                    {user.notifications?.length || 0}
                                </span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUser(user);
                                    setIsSendModalOpen(true);
                                }}
                                className="ml-2 p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-colors flex-shrink-0"
                                title={`Send message to ${user.name}`}
                            >
                                <Icon name="send" size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Notifications Panel */}
            <div className={`absolute inset-0 w-full h-full flex flex-col bg-dark-bg transition-transform duration-300 ease-in-out ${selectedUser ? 'translate-x-0' : 'translate-x-full'}`}>
                {selectedUser ? (
                    <>
                        <div className="p-4 border-b border-white/5 flex justify-between items-center flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedUser(null)} className="p-2 bg-white/5 rounded-lg"><Icon name="arrow-left" /></button>
                                <img src={selectedUser.avatar} alt={selectedUser.name} className="w-10 h-10 rounded-full object-cover" />
                                <div>
                                    <h3 className="font-bold text-white">{selectedUser.name}'s Inbox</h3>
                                    <p className="text-xs text-gray-500">{selectedUser.notifications.length} total messages</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {selectedUser.notifications.length > 0 ? (
                                selectedUser.notifications.map(n => (
                                    <div key={n.id} className="bg-dark-card p-3 rounded-lg border border-white/5 group">
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-full ${n.iconColor}`}><Icon name={n.icon} size={16} /></div>
                                            <div className="flex-1">
                                                <p className="font-bold text-white text-sm">{n.title}</p>
                                                <p className="text-xs text-gray-400 mt-1 break-words">{n.message}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-gray-600 font-mono">{formatAdminTime(n.time)}</p>
                                                <div className="flex gap-1 mt-2">
                                                    <button onClick={() => {setEditingNotification(n); setIsEditModalOpen(true);}} className="p-1.5 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500 hover:text-white transition-colors"><Icon name="edit" size={12}/></button>
                                                    <button onClick={() => setDeletingNotification(n)} className="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500 hover:text-white transition-colors"><Icon name="trash-2" size={12}/></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center text-gray-600">
                                    <Icon name="inbox" size={48} className="mb-4 opacity-50" />
                                    <h3 className="font-bold text-lg text-gray-400">Empty Inbox</h3>
                                    <p className="text-sm">This user doesn't have any notifications.</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div />
                )}
            </div>

            {/* Modals */}
            <NotificationEditModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                notification={editingNotification}
                onSave={handleUpdateNotification}
            />
            <SendUserNotificationModal
                isOpen={isSendModalOpen}
                onClose={() => setIsSendModalOpen(false)}
                onSend={handleSendNotification}
                user={selectedUser}
            />
            <ConfirmModal
                isOpen={!!deletingNotification}
                onClose={() => setDeletingNotification(null)}
                onConfirm={handleDeleteNotification}
                title="Delete Notification"
                message={`Are you sure you want to delete this notification for ${selectedUser?.name}? This cannot be undone.`}
                confirmText="Delete"
                confirmButtonClass="bg-red-500"
                confirmIcon="trash-2"
            />
        </div>
    );
};

export default AdminUserNotificationsScreen;