import React, { useState, useEffect } from 'react';
import Icon from '../Icon';
import * as types from '../../types';

interface StaffFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    staffMember: types.User | null;
    onSave: (staffData: Partial<types.User>, password?: string) => Promise<void>;
}

const permissionGroups: { title: string; permissions: (keyof types.StaffPermissions)[] }[] = [
    {
        title: 'Core Access',
        permissions: ['dashboard', 'users', 'staff']
    },
    {
        title: 'User Interaction',
        permissions: ['notifications', 'user_notifications', 'user_history']
    },
    {
        title: 'Tournament Control',
        permissions: ['tournaments', 'categories', 'results', 'leaderboard_control']
    },
    {
        title: 'Financial',
        permissions: ['withdrawals', 'transactions', 'wallet_control', 'promo_codes']
    },
    {
        title: 'Content & Settings',
        permissions: ['promotions', 'advertising', 'referrals', 'profile_mng', 'withdrawal_settings', 'image_settings', 'text_content', 'settings']
    }
];

const permissionDetails: Record<keyof types.StaffPermissions, { label: string; icon: string }> = {
    dashboard: { label: 'Dashboard', icon: 'bar-chart-2' },
    notifications: { label: 'Broadcast', icon: 'send' },
    user_notifications: { label: 'User Notifications', icon: 'inbox' },
    users: { label: 'User Data', icon: 'users' },
    tournaments: { label: 'Tournaments', icon: 'swords' },
    categories: { label: 'Categories', icon: 'layout-grid' },
    results: { label: 'Results', icon: 'trophy' },
    withdrawals: { label: 'Withdrawals', icon: 'dollar-sign' },
    transactions: { label: 'History', icon: 'history' },
    promo_codes: { label: 'Promo Codes', icon: 'ticket' },
    promotions: { label: 'Promotions', icon: 'sliders' },
    advertising: { label: 'Advertising', icon: 'megaphone' },
    leaderboard_control: { label: 'Leaderboard', icon: 'award' },
    user_history: { label: 'User History', icon: 'history' },
    referrals: { label: 'Referrals', icon: 'gift' },
    profile_mng: { label: 'Profile Mng', icon: 'user-cog' },
    withdrawal_settings: { label: 'Withdrawal Settings', icon: 'credit-card' },
    wallet_control: { label: 'Wallet Control', icon: 'wallet' },
    image_settings: { label: 'Image Settings', icon: 'image' },
    text_content: { label: 'Text Content', icon: 'file-text' },
    staff: { label: 'Staff Mgt.', icon: 'user-cog' },
    settings: { label: 'Settings', icon: 'settings' },
};

const StaffFormModal: React.FC<StaffFormModalProps> = ({ isOpen, onClose, staffMember, onSave }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [permissions, setPermissions] = useState<types.StaffPermissions>({});
    const [role, setRole] = useState<'staff' | 'admin'>('staff');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (staffMember) {
                setName(staffMember.name);
                setEmail(staffMember.email);
                setPhone(staffMember.phone || '');
                setRole(staffMember.role as 'staff' | 'admin');
                
                if (staffMember.role === 'admin') {
                    const allPermissions = Object.keys(permissionDetails).reduce((acc, p) => {
                        acc[p as keyof types.StaffPermissions] = true;
                        return acc;
                    }, {} as types.StaffPermissions);
                    setPermissions(allPermissions);
                } else {
                    setPermissions(staffMember.permissions || {});
                }
            } else {
                setName('');
                setEmail('');
                setPhone('');
                setPermissions({});
                setRole('staff');
            }
            setPassword('');
            setConfirmPassword('');
            setError('');
             if(window.lucide) setTimeout(() => window.lucide.createIcons(), 50);
        }
    }, [isOpen, staffMember]);

    useEffect(() => {
        if (role === 'admin') {
             const allPermissions = Object.keys(permissionDetails).reduce((acc, p) => {
                acc[p as keyof types.StaffPermissions] = true;
                return acc;
            }, {} as types.StaffPermissions);
            setPermissions(allPermissions);
        }
    }, [role]);

    const handlePermissionChange = (key: keyof types.StaffPermissions) => {
        setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const allSelected = Object.keys(permissionDetails).length > 0 && Object.keys(permissionDetails).every(p => permissions[p as keyof types.StaffPermissions]);

    const handleSelectAll = () => {
        if (allSelected) {
            setPermissions({});
        } else {
            const allPermissions = Object.keys(permissionDetails).reduce((acc, p) => {
                acc[p as keyof types.StaffPermissions] = true;
                return acc;
            }, {} as types.StaffPermissions);
            setPermissions(allPermissions);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!staffMember && !password) {
            setError('Password is required for new staff members.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsSaving(true);
        const staffData: Partial<types.User> = {
            name,
            email: email.toLowerCase(),
            phone,
            permissions,
            role,
        };
        await onSave(staffData, password || undefined);
        setIsSaving(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-dark-card border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-white/10 bg-dark-bg">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                        <Icon name={staffMember ? 'edit-3' : 'user-plus'} size={20} className="text-brand-primary"/>
                        {staffMember ? 'Edit Team Member' : 'Create Staff Account'}
                    </h3>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Icon name="x" /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                    {/* Account Details */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-white/5 pb-2 flex items-center gap-2"><Icon name="user" size={14}/>Account Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="text-xs text-gray-400 mb-1 block">Role</label>
                                <select 
                                    value={role} 
                                    onChange={e => setRole(e.target.value as 'staff' | 'admin')} 
                                    className="w-full bg-dark-bg border border-gray-700 rounded-lg p-2.5 text-white focus:border-brand-primary outline-none"
                                >
                                    <option value="staff">Staff</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Full Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-dark-bg border border-gray-700 rounded-lg p-2.5 text-white focus:border-brand-primary outline-none" />
                            </div>
                             <div>
                                <label className="text-xs text-gray-400 mb-1 block">Phone</label>
                                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full bg-dark-bg border border-gray-700 rounded-lg p-2.5 text-white focus:border-brand-primary outline-none" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Email</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={!!staffMember} className="w-full bg-dark-bg border border-gray-700 rounded-lg p-2.5 text-white disabled:opacity-50 disabled:cursor-not-allowed" />
                            </div>
                           
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">New Password</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={staffMember ? 'Leave blank to keep current' : 'Set a password'} className="w-full bg-dark-bg border border-gray-700 rounded-lg p-2.5 text-white focus:border-brand-primary outline-none" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Confirm Password</label>
                                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-dark-bg border border-gray-700 rounded-lg p-2.5 text-white focus:border-brand-primary outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* Permissions */}
                    <div>
                        <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <Icon name="shield" size={14}/>Permissions
                            </h4>
                            <button
                                type="button"
                                onClick={handleSelectAll}
                                disabled={role === 'admin'}
                                className="text-xs font-bold text-brand-cyan hover:underline flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Icon name={allSelected ? "minus-square" : "check-square"} size={14} />
                                {allSelected ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <div className="space-y-4">
                            {permissionGroups.map(group => (
                                <div key={group.title} className="bg-dark-bg p-4 rounded-xl border border-white/5">
                                    <h5 className="text-xs font-bold text-brand-primary mb-3">{group.title}</h5>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {group.permissions.map(pKey => {
                                            const p = permissionDetails[pKey];
                                            return (
                                                <label key={p.label} className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${role === 'admin' ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-white/5'} ${permissions[pKey] ? 'border-brand-primary bg-brand-primary/10 shadow-inner' : 'border-transparent'}`}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={!!permissions[pKey]} 
                                                        onChange={() => handlePermissionChange(pKey)} 
                                                        disabled={role === 'admin'}
                                                        className="form-checkbox h-5 w-5 rounded-md bg-dark-card border-gray-600 text-brand-primary focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg focus:ring-brand-primary disabled:cursor-not-allowed" 
                                                    />
                                                    <Icon name={p.icon} size={16} className={`transition-colors ${permissions[pKey] ? 'text-brand-primary' : 'text-gray-400'}`} />
                                                    <span className={`text-sm font-semibold transition-colors ${permissions[pKey] ? 'text-white' : 'text-gray-300'}`}>{p.label}</span>
                                                </label>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded-lg">{error}</p>}
                </form>

                <div className="p-5 border-t border-white/10 bg-dark-bg flex justify-end gap-3">
                    <button type="button" onClick={onClose} disabled={isSaving} className="px-5 py-2.5 text-sm font-bold text-gray-300 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">Cancel</button>
                    <button type="submit" onClick={handleSubmit} disabled={isSaving} className="px-5 py-2.5 text-sm font-bold text-black bg-brand-primary rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-brand-primary/20">
                         {isSaving ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <Icon name="save" size={18}/>}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};
export default StaffFormModal;