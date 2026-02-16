
import React, { useState } from 'react';
import { User, Match } from '../../types';
import Icon from '../Icon';
import UserDetailsModal from './UserDetailsModal';

interface AdminUsersProps {
    users: User[];
    matches: Match[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const AdminUsers: React.FC<AdminUsersProps> = ({ users, matches, setUsers }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const regularUsers = users.filter(u => u.role !== 'admin');
    
    const filteredUsers = regularUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleUserClick = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };
    
    const handleUpdateUser = (updatedUser: User) => {
        setUsers(prev => prev.map(u => u.email === updatedUser.email ? updatedUser : u));
        setSelectedUser(updatedUser); // Keep modal updated
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
                <div className="relative">
                    <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input 
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-light-card dark:bg-dark-card border border-gray-300 dark:border-gray-700 rounded-lg py-2 pl-10 pr-4 text-gray-900 dark:text-white focus:border-brand-cyan focus:ring-brand-cyan transition-colors"
                    />
                </div>
            </div>
            <div className="bg-light-card dark:bg-dark-card rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-dark-card-hover dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">User</th>
                                <th scope="col" className="px-6 py-3">Contact</th>
                                <th scope="col" className="px-6 py-3">Balances</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3">Matches</th>
                                <th scope="col" className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr 
                                    key={user.email} 
                                    onClick={() => handleUserClick(user)} 
                                    className={`bg-light-card dark:bg-dark-card border-b dark:border-gray-700 hover:bg-light-card-hover dark:hover:bg-dark-card-hover/50 cursor-pointer transition-opacity ${user.status === 'Banned' ? 'opacity-50' : ''}`}
                                >
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white flex items-center gap-3">
                                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                                        <span>{user.name}</span>
                                    </th>
                                    <td className="px-6 py-4">
                                        <div>{user.email}</div>
                                        <div className="text-xs text-gray-400">{user.phone}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-green-500">D: 💎{user.deposit}</div>
                                        <div className="font-semibold text-amber-500 text-xs">W: 💎{user.winnings}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${user.status === 'Active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{user.matches}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center items-center gap-2">
                                            <button className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-md" onClick={(e) => {e.stopPropagation(); handleUserClick(user)}}><Icon name="eye" size={16} /></button>
                                            <button className="p-2 text-red-500 hover:bg-red-500/10 rounded-md" onClick={(e) => {e.stopPropagation(); alert('This should be handled in the details modal now.')}}><Icon name="trash-2" size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <UserDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={selectedUser}
                matches={matches}
                onUpdateUser={handleUpdateUser}
            />
        </div>
    );
};

export default AdminUsers;