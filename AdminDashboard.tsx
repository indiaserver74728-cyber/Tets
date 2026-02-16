
import React from 'react';
import { Match, User } from '../../types';
import Icon from '../Icon';
import AdminChart from './AdminChart';

type AdminView = 'dashboard' | 'matches' | 'users' | 'transactions';

interface AdminDashboardProps {
    matches: Match[];
    users: User[];
    setView: (view: AdminView) => void;
}

const StatCard: React.FC<{ icon: string; label: string; value: string | number; gradient: string }> = ({ icon, label, value, gradient }) => (
    <div className={`relative p-5 rounded-xl text-white overflow-hidden ${gradient}`}>
        <div className="relative z-10">
            <Icon name={icon} size={28} className="mb-2 opacity-80" />
            <p className="text-3xl font-extrabold">{value}</p>
            <p className="text-sm font-semibold uppercase tracking-wider opacity-90">{label}</p>
        </div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full opacity-50"></div>
    </div>
);


const AdminDashboard: React.FC<AdminDashboardProps> = ({ matches, users, setView }) => {
    const totalUsers = users.filter(u => u.role === 'user').length;
    const totalMatches = matches.length;
    const totalWinnings = users.reduce((acc, user) => acc + user.winnings, 0);
    const totalRevenue = users.reduce((acc, user) => acc + user.deposit, 0);

    const recentMatches = [...matches].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);
    const newUsers = [...users].filter(u => u.role === 'user').slice(-5).reverse();


    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard icon="users" label="Total Users" value={totalUsers} gradient="bg-gradient-to-br from-blue-500 to-indigo-600" />
                <StatCard icon="dollar-sign" label="Total Revenue" value={`💎${(totalRevenue).toLocaleString()}`} gradient="bg-gradient-to-br from-green-500 to-teal-600" />
                <StatCard icon="trophy" label="Winnings Paid" value={`💎${totalWinnings.toLocaleString()}`} gradient="bg-gradient-to-br from-amber-500 to-orange-500" />
                <StatCard icon="swords" label="Total Matches" value={totalMatches} gradient="bg-gradient-to-br from-red-500 to-pink-600" />
            </div>

            <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl border border-gray-200 dark:border-white/10 mb-8">
                 <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Weekly Activity</h2>
                 <AdminChart />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl border border-gray-200 dark:border-white/10">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pending Withdrawals</h2>
                        <button onClick={() => setView('transactions')} className="text-sm font-semibold text-brand-cyan hover:underline">View All</button>
                    </div>
                     <div className="space-y-3">
                        {users.flatMap(u => u.transactions.filter(t => t.status === 'Pending' && t.type === 'Withdrawal').map(t => ({...t, user: u}))).slice(0, 4).map(tx => (
                            <div key={tx.id} className="flex justify-between items-center p-3 bg-light-bg dark:bg-dark-bg rounded-lg">
                                <div className="flex items-center gap-3">
                                    <img src={tx.user.avatar} alt={tx.user.name} className="w-8 h-8 rounded-full"/>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-100">{tx.user.name}</p>
                                        <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <span className="font-bold text-sm text-red-500">💎{tx.amount}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl border border-gray-200 dark:border-white/10">
                     <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Users</h2>
                        <button onClick={() => setView('users')} className="text-sm font-semibold text-brand-cyan hover:underline">View All</button>
                    </div>
                     <div className="space-y-3">
                        {newUsers.map(user => (
                            <div key={user.email} className="flex items-center p-3 bg-light-bg dark:bg-dark-bg rounded-lg">
                                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full mr-4" />
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-gray-100">{user.name}</p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;