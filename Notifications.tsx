
import React, { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import * as types from '../../types';
import { db } from '../../firebase';
import { collection, getDocs, updateDoc, doc, arrayUnion, addDoc, onSnapshot, query, orderBy, deleteDoc } from 'firebase/firestore';
import NotificationEditModal from '../../components/admin/NotificationEditModal';
import ConfirmModal from '../../components/ConfirmModal';

interface NotificationsProps {
    users: types.User[];
    setUsers: React.Dispatch<React.SetStateAction<types.User[]>>;
}

const icons = [
    { name: 'megaphone', color: 'text-brand-primary' },
    { name: 'gift', color: 'text-green-500' },
    { name: 'trophy', color: 'text-brand-gold' },
    { name: 'info', color: 'text-blue-400' },
    { name: 'alert-triangle', color: 'text-yellow-500' },
];

const IconPicker: React.FC<{ selectedIcon: string; onSelect: (icon: string, color: string) => void }> = ({ selectedIcon, onSelect }) => (
    <div>
        <label className="text-xs text-gray-400 mb-2 block font-bold uppercase">Icon</label>
        <div className="flex gap-2 flex-wrap">
            {icons.map(icon => (
                <button
                    type="button"
                    key={icon.name}
                    onClick={() => onSelect(icon.name, icon.color)}
                    className={`p-3 rounded-lg border-2 transition-all ${selectedIcon === icon.name ? 'border-brand-primary bg-brand-primary/10' : 'border-gray-700 bg-dark-bg hover:border-gray-500'}`}
                >
                    <Icon name={icon.name} className={icon.color} size={20} />
                </button>
            ))}
        </div>
    </div>
);

const LivePreview: React.FC<{ notification: { title: string, message: string, icon: string, iconColor: string } }> = ({ notification }) => (
    <div className="relative flex items-start p-4 rounded-xl bg-[#222] border border-brand-primary/20 shadow-lg shadow-black/20">
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mr-4 border border-white/5 bg-gradient-to-br from-gray-800 to-black">
            <Icon name={notification.icon || 'bell'} size={18} className={notification.iconColor} />
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
                <h4 className="text-sm font-bold text-white truncate pr-2">{notification.title || 'Notification Title'}</h4>
                <span className="text-[10px] text-gray-600 font-medium whitespace-nowrap bg-black/20 px-2 py-0.5 rounded-full">Just now</span>
            </div>
            <p className="text-xs leading-relaxed text-gray-300 break-words">{notification.message || 'This is where your message will appear for users.'}</p>
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-brand-cyan rounded-full shadow-[0_0_8px_rgba(0,242,255,0.8)]"></div>
    </div>
);

const AdminNotificationsScreen: React.FC<NotificationsProps> = ({ users, setUsers }) => {
    const [notification, setNotification] = useState({ title: '', message: '', icon: 'megaphone', iconColor: 'text-brand-primary' });
    const [sentNotifications, setSentNotifications] = useState<types.Notification[]>([]);
    
    const [editingNotification, setEditingNotification] = useState<types.Notification | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'notification_history'), orderBy('id', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const history = snapshot.docs.map(doc => ({
                ...(doc.data() as types.Notification),
                firestoreId: doc.id
            }));
            setSentNotifications(history);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    }, [sentNotifications]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setNotification(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleIconSelect = (icon: string, iconColor: string) => {
        setNotification(prev => ({ ...prev, icon, iconColor }));
    };

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!notification.title || !notification.message) return;
        
        const newNotification: Omit<types.Notification, 'firestoreId'> = {
            id: Date.now(),
            icon: notification.icon,
            title: notification.title,
            message: notification.message,
            time: new Date().toISOString(),
            read: false,
            iconColor: notification.iconColor,
        };
        
        setNotification({ title: '', message: '', icon: 'megaphone', iconColor: 'text-brand-primary' });

        try {
            await addDoc(collection(db, 'notification_history'), newNotification);
            
            const querySnapshot = await getDocs(collection(db, 'users'));
            const updatePromises = querySnapshot.docs.map(userDoc => 
                updateDoc(doc(db, 'users', userDoc.id), { notifications: arrayUnion(newNotification) })
            );
            await Promise.all(updatePromises);
            alert('Notification Send and saved to history!');
        } catch (error) {
            console.error("Error broadcasting:", error);
            alert("Failed to Send to database.");
        }
    };

    const handleEdit = (notificationToEdit: types.Notification) => {
        setEditingNotification(notificationToEdit);
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (updatedNotification: types.Notification) => {
        if (!updatedNotification.firestoreId) {
            alert('Cannot save. Notification ID not found.');
            return;
        }

        try {
            const { firestoreId, ...dataToSave } = updatedNotification;
            const docRef = doc(db, 'notification_history', firestoreId);
            await updateDoc(docRef, dataToSave);

            // Update all users who received this notification
            const usersSnap = await getDocs(collection(db, 'users'));
            const updatePromises = usersSnap.docs.map(userDoc => {
                const userData = userDoc.data() as types.User;
                // Check if user has this notification
                const hasNotif = userData.notifications.some(n => n.id === updatedNotification.id);
                
                if (hasNotif) {
                    const newNotifs = userData.notifications.map(n => 
                        n.id === updatedNotification.id 
                        ? { ...n, ...dataToSave, read: n.read } // Update content but keep read status
                        : n
                    );
                    return updateDoc(doc(db, 'users', userDoc.id), { notifications: newNotifs });
                }
                return Promise.resolve();
            });
            await Promise.all(updatePromises);
            
            setIsEditModalOpen(false);
            setEditingNotification(null);
            alert("Notification updated in history and for all users.");
        } catch (error) {
            console.error("Error updating notification:", error);
            alert("Failed to save changes.");
        }
    };
    
    const confirmDelete = async () => {
        if (deleteId === null) return;
        
        // Find the notification object to get its numeric ID before deleting history
        const notifToDelete = sentNotifications.find(n => n.firestoreId === deleteId);
        if (!notifToDelete) {
             setDeleteId(null);
             return;
        }

        try {
            await deleteDoc(doc(db, 'notification_history', deleteId));
            
            // Remove from all users
            const usersSnap = await getDocs(collection(db, 'users'));
            const updatePromises = usersSnap.docs.map(userDoc => {
                const userData = userDoc.data() as types.User;
                const updatedNotifs = userData.notifications.filter(n => n.id !== notifToDelete.id);
                
                // Only update if array changed
                if (updatedNotifs.length !== userData.notifications.length) {
                    return updateDoc(doc(db, 'users', userDoc.id), { notifications: updatedNotifs });
                }
                return Promise.resolve();
            });
            await Promise.all(updatePromises);

            setDeleteId(null);
            alert("Notification deleted from history and removed from all users.");
        } catch (error) {
            console.error("Error deleting notification:", error);
            alert("Failed to delete notification.");
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-dark-card border border-white/10 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <Icon name="send" className="text-brand-primary" /> Send a New Notification 
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <form onSubmit={handleBroadcast} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Title</label>
                            <input type="text" name="title" value={notification.title} onChange={handleChange} placeholder="e.g. New Update!" className="w-full bg-dark-bg border border-gray-700 rounded-lg p-3 text-white focus:border-brand-primary outline-none" required/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Message</label>
                            <textarea name="message" value={notification.message} onChange={handleChange} rows={4} placeholder="Enter the message body..." className="w-full bg-dark-bg border border-gray-700 rounded-lg p-3 text-white focus:border-brand-primary outline-none" required></textarea>
                        </div>
                        <IconPicker selectedIcon={notification.icon} onSelect={handleIconSelect} />
                        <button type="submit" className="w-full bg-brand-primary text-black py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                            <Icon name="send" size={16} /> SEND TO ALL USERS
                        </button>
                    </form>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Live Preview</label>
                        <LivePreview notification={notification} />
                    </div>
                </div>
            </div>

            <div className="bg-dark-card border border-white/10 rounded-2xl shadow-lg">
                <div className="p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <Icon name="history" className="text-brand-primary" /> Notification History
                    </h2>
                </div>
                <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-dark-card-hover text-gray-400">
                            <tr>
                                <th className="px-6 py-4">Notification</th>
                                <th className="px-6 py-4">Date Sent</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sentNotifications.length > 0 ? sentNotifications.map(n => (
                                <tr key={n.id} className="hover:bg-white/5">
                                    <td className="px-6 py-4">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 p-2 bg-dark-bg rounded-full border border-white/5 ${n.iconColor}`}>
                                                <Icon name={n.icon} size={16} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{n.title}</p>
                                                <p className="text-xs text-gray-400 max-w-sm break-words">{n.message}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 whitespace-nowrap">{new Date(n.time).toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleEdit(n)} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"><Icon name="edit" size={16} /></button>
                                            <button onClick={() => setDeleteId(n.firestoreId!)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Icon name="trash-2" size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={3} className="text-center py-12 text-gray-500">No notifications sent yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <NotificationEditModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                notification={editingNotification}
                onSave={handleUpdate}
            />

            <ConfirmModal
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete History Item"
                message="Are you sure? This will remove this notification from history AND delete it from all users' inboxes."
                confirmText="Delete Everywhere"
                confirmIcon="trash-2"
                confirmButtonClass="bg-red-500 hover:bg-red-600"
            />
        </div>
    );
};

export default AdminNotificationsScreen;
