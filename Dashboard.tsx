import React, { useMemo } from 'react';
import { Match, User, Promotion, AdminView } from '../../types';
import Icon from '../../components/Icon';

interface AdminDashboardProps {
    matches: Match[];
    users: User[];
    promotions: Promotion[];
    setView: (view: AdminView) => void;
}

const StatCard: React.FC<{ icon: string; label: string; value: string | number; onClick?: () => void }> = ({ icon, label, value, onClick }) => (
    <div 
        onClick={onClick}
        className={`bg-dark-card p-6 rounded-2xl flex items-center justify-between card-chromatic-border transition-all duration-300 ${onClick ? 'cursor-pointer hover:bg-dark-card-hover' : ''}`}
    >
        <div>
            <p className="text-4xl font-extrabold text-white">{value}</p>
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-400 mt-1">{label}</p>
        </div>
        <div className="bg-white/5 p-4 rounded-full">
            <Icon name={icon} size={28} className="text-brand-cyan" />
        </div>
    </div>
);


const AdminDashboardScreen: React.FC<AdminDashboardProps> = ({ matches, users, promotions, setView }) => {
    
    const stats = useMemo(() => {
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const newUsers24h = users.filter(u => {
            if (u.role !== 'user') return false;
            try {
                const creationDate = new Date(u.creationDate);
                return creationDate >= twentyFourHoursAgo;
            } catch (e) {
                return false;
            }
        }).length;
        
        const totalUsers = users.filter(u => u.role === 'user').length;
        const pendingWithdrawals = users.flatMap(u => u.transactions).filter(t => t.type === 'Withdrawal' && t.status === 'Pending').length;
        const pendingReferrals = users.filter(u => u.referredBy && !u.referralRewardClaimed && u.matches === 0).length;
        const pendingResults = matches.filter(m => m.type === 'Results' && !m.winningsDistributed).length;
        const activePromos = promotions.length;
        const upcomingMatches = matches.filter(m => m.type === 'Upcoming').length;
        const totalAdmins = users.filter(u => u.role === 'admin').length;
        const totalStaff = users.filter(u => u.role === 'staff').length;

        return { newUsers24h, totalUsers, pendingWithdrawals, pendingReferrals, pendingResults, activePromos, upcomingMatches, totalAdmins, totalStaff };
    }, [users, matches, promotions]);


    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-white">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                    icon="users" 
                    label="Total Users" 
                    value={stats.totalUsers} 
                    onClick={() => setView('users')} 
                />
                <StatCard 
                    icon="user-plus" 
                    label="New Users (24h)" 
                    value={stats.newUsers24h} 
                    onClick={() => setView('users')} 
                />
                 <StatCard 
                    icon="calendar" 
                    label="Upcoming Matches" 
                    value={stats.upcomingMatches} 
                    onClick={() => setView('tournaments')} 
                />
                <StatCard 
                    icon="dollar-sign" 
                    label="Pending Withdrawals" 
                    value={stats.pendingWithdrawals} 
                    onClick={() => setView('withdrawals')} 
                />
                <StatCard 
                    icon="gift" 
                    label="Pending Referrals" 
                    value={stats.pendingReferrals} 
                    onClick={() => setView('referrals')} 
                />
                <StatCard 
                    icon="trophy" 
                    label="Pending Results" 
                    value={stats.pendingResults} 
                    onClick={() => setView('results')} 
                />
                <StatCard 
                    icon="shield" 
                    label="Total Admins" 
                    value={stats.totalAdmins} 
                    onClick={() => setView('staff')} 
                />
                <StatCard 
                    icon="user-cog" 
                    label="Total Staff" 
                    value={stats.totalStaff} 
                    onClick={() => setView('staff')} 
                />
                <StatCard 
                    icon="sliders" 
                    label="Active Promos" 
                    value={stats.activePromos} 
                    onClick={() => setView('promotions')} 
                />
            </div>
        </div>
    );
};

export default AdminDashboardScreen;