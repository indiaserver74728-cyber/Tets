
import React, { useState, useEffect } from 'react';
import { User, Match } from '../../types';
import Icon from '../../components/Icon';
import UserDetailsModal from '../../components/admin/UserDetailsModal';
import UserEditModal from '../../components/admin/UserEditModal';
import { db } from '../../firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface AdminUsersProps {
    users: User[];
    matches: Match[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const StatCard: React.FC<{ label: string; value: number | string; icon: string; color: string }> = ({ label, value, icon, color }) => (
    <div className="bg-dark-card border border-white/5 rounded-xl p-4 flex items-center justify-between shadow-lg relative overflow-hidden group">
        <div className={`absolute right-0 top-0 w-16 h-16 ${color} opacity-10 rounded-bl-full transition-transform group-hover:scale-110`}></div>
        <div>
            <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-wider">{label}</p>
            <p className="text-xl md:text-2xl font-extrabold text-white mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color} bg-opacity-20 text-white shadow-inner`}>
             <Icon name={icon} size={20} />
        </div>
    </div>
);

const UserCardMobile: React.FC<{ user: User; onEdit: () => void; onView: () => void; onDelete: () => void; }> = ({ user, onEdit, onView, onDelete }) => (
    <div className="bg-dark-card p-4 rounded-xl border border-white/5 shadow-md relative overflow-hidden transition-all active:scale-[0.98]">
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${user.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
        
        <div className="flex items-start gap-3 pl-2 mb-3">
            <div className="relative">
                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover border-2 border-white/10" />
                {user.role === 'admin' && (
                    <div className="absolute -bottom-1 -right-1 bg-purple-600 rounded-full p-1 border border-dark-card">
                        <Icon name="shield" size={8} className="text-white" />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white text-base truncate">{user.name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${user.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {user.status}
                    </span>
                </div>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                     <p className="text-[10px] text-gray-500 flex items-center gap-1"><Icon name="phone" size={10}/> {user.phone}</p>
                     <p className="text-[10px] text-brand-cyan font-mono">{user.referralCode}</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 pl-2">
            <div className="bg-dark-bg/50 p-2 rounded-lg border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase font-bold">Wallet</p>
                <div className="flex items-center gap-1">
                    <span className="text-green-400 font-bold text-sm">💎{user.deposit}</span>
                    <span className="text-gray-600 text-xs">/</span>
                    <span className="text-amber-400 font-bold text-sm">💎{user.winnings}</span>
                </div>
            </div>
             <div className="bg-dark-bg/50 p-2 rounded-lg border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase font-bold">Stats</p>
                <div className="flex items-center gap-2 text-xs text-gray-300">
                    <span className="flex items-center gap-1"><Icon name="swords" size={10} className="text-red-500"/> {user.kills}</span>
                    <span className="flex items-center gap-1"><Icon name="gamepad-2" size={10} className="text-blue-500"/> {user.matches}</span>
                </div>
            </div>
        </div>

        <div className="flex gap-2 pl-2">
            <button onClick={onView} className="flex-1 bg-gray-700/50 hover:bg-gray-700 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors">
                <Icon name="eye" size={14} /> Details
            </button>
            <button onClick={onEdit} className="flex-1 bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-brand-cyan/20">
                <Icon name="edit-3" size={14} /> Edit
            </button>
        </div>
    </div>
);

const AdminUsersScreen: React.FC<AdminUsersProps> = ({ users, matches, setUsers }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Banned'>('All');
    const [roleFilter, setRoleFilter] = useState<'All' | 'Admin' | 'User'>('All');
    
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        if(window.lucide) window.lucide.createIcons();
    }, [users, statusFilter, roleFilter]);

    // Stats
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'Active').length;
    const bannedUsers = users.filter(u => u.status === 'Banned').length;
    const totalAdmins = users.filter(u => u.role === 'admin').length;

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              user.phone.includes(searchTerm);
        const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
        const matchesRole = roleFilter === 'All' || (roleFilter === 'Admin' ? user.role === 'admin' : user.role === 'user');
        
        return matchesSearch && matchesStatus && matchesRole;
    });

    const handleUpdateUser = async (updatedUser: User) => {
        try {
            await updateDoc(doc(db, 'users', updatedUser.email.toLowerCase()), updatedUser);
            setUsers(prev => prev.map(u => u.email === updatedUser.email ? updatedUser : u));
            
            if(isEditModalOpen) {
                setIsEditModalOpen(false);
                setUserToEdit(null);
            }
            if(isDetailsModalOpen) {
                setSelectedUser(updatedUser);
            }
        } catch (e) {
            console.error("Failed to update user:", e);
            alert("Failed to update user in database.");
        }
    };

    const handleDeleteUser = async (user: User) => {
        if(confirm(`DELETE ${user.name}? This cannot be undone.`)) {
             try {
                await deleteDoc(doc(db, 'users', user.email.toLowerCase()));
                setUsers(prev => prev.filter(u => u.email !== user.email));
                if(isEditModalOpen) setIsEditModalOpen(false); // Close edit modal if open
            } catch (e) {
                console.error("Failed to delete user:", e);
                alert("Failed to delete user.");
            }
        }
    }

    return (
        <div className="space-y-6 pb-20 md:pb-0">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <StatCard label="Total Users" value={totalUsers} icon="users" color="bg-blue-500" />
                <StatCard label="Active" value={activeUsers} icon="check-circle" color="bg-green-500" />
                <StatCard label="Banned" value={bannedUsers} icon="slash" color="bg-red-500" />
                <StatCard label="Total Admins" value={totalAdmins} icon="shield" color="bg-purple-500" />
            </div>

            {/* Toolbar */}
            <div className="bg-dark-card p-4 rounded-xl border border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
                <div className="relative w-full md:w-96">
                    <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-dark-bg border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-sm"
                    />
                </div>
                
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
                    <select 
                        value={statusFilter} 
                        onChange={(e: any) => setStatusFilter(e.target.value)}
                        className="bg-dark-bg border border-gray-700 text-white text-sm rounded-lg focus:ring-brand-primary focus:border-brand-primary block p-2.5"
                    >
                        <option value="All">Status: All</option>
                        <option value="Active">Active Only</option>
                        <option value="Banned">Banned Only</option>
                    </select>
                    
                    <select 
                        value={roleFilter} 
                        onChange={(e: any) => setRoleFilter(e.target.value)}
                        className="bg-dark-bg border border-gray-700 text-white text-sm rounded-lg focus:ring-brand-primary focus:border-brand-primary block p-2.5"
                    >
                        <option value="All">Role: All</option>
                        <option value="User">Users</option>
                        <option value="Admin">Admins</option>
                    </select>
                </div>
            </div>

            {/* Mobile View: Cards */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredUsers.length > 0 ? filteredUsers.map(user => (
                    <UserCardMobile 
                        key={user.email} 
                        user={user} 
                        onEdit={() => { setUserToEdit(user); setIsEditModalOpen(true); }}
                        onView={() => { setSelectedUser(user); setIsDetailsModalOpen(true); }}
                        onDelete={() => handleDeleteUser(user)}
                    />
                )) : (
                    <div className="text-center text-gray-500 py-10">No users found.</div>
                )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block bg-dark-card rounded-xl border border-white/10 overflow-hidden shadow-xl">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs uppercase bg-dark-card-hover text-gray-300 border-b border-white/10">
                        <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Stats</th>
                            <th className="px-6 py-4">Wallet</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredUsers.map((user) => (
                            <tr key={user.email} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img src={user.avatar} className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10" alt="" />
                                            {user.role === 'admin' && <div className="absolute -top-1 -right-1 bg-purple-500 rounded-full p-0.5"><Icon name="shield" size={10} className="text-white"/></div>}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{user.name}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase text-gray-500 font-bold">Kills</span>
                                            <span className="text-white font-bold">{user.kills}</span>
                                        </div>
                                         <div className="flex flex-col">
                                            <span className="text-[10px] uppercase text-gray-500 font-bold">Matches</span>
                                            <span className="text-white font-bold">{user.matches}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-mono">
                                    <div className="flex flex-col">
                                        <span className="text-green-400 text-xs">Dep: 💎{user.deposit}</span>
                                        <span className="text-amber-400 text-xs">Win: 💎{user.winnings}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                                        user.status === 'Active' 
                                        ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setSelectedUser(user); setIsDetailsModalOpen(true); }} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all">
                                            <Icon name="eye" size={16} />
                                        </button>
                                        <button onClick={() => { setUserToEdit(user); setIsEditModalOpen(true); }} className="p-2 bg-brand-cyan/10 text-brand-cyan rounded-lg hover:bg-brand-cyan hover:text-black transition-all">
                                            <Icon name="edit-3" size={16} />
                                        </button>
                                        {user.role !== 'admin' && (
                                            <button onClick={() => handleDeleteUser(user)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                                                <Icon name="trash-2" size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-8 text-gray-500">No users found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <UserDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                user={selectedUser}
                matches={matches}
                onUpdateUser={handleUpdateUser}
            />

            <UserEditModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                user={userToEdit}
                onSave={handleUpdateUser}
                onDelete={handleDeleteUser}
            />
        </div>
    );
};

export default AdminUsersScreen;
