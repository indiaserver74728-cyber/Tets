import React, { useState, useContext } from 'react';
import Icon from '../../components/Icon';
import * as types from '../../types';
import { db } from '../../firebase';
import { doc, updateDoc, deleteDoc, setDoc, deleteField } from 'firebase/firestore';
import StaffFormModal from '../../components/admin/StaffFormModal';
import ConfirmModal from '../../components/ConfirmModal';
import { UserContext } from '../../contexts';

interface StaffProps {
    users: types.User[];
    setUsers: React.Dispatch<React.SetStateAction<types.User[]>>;
}

const permissionIconMap: Record<keyof types.StaffPermissions, string> = {
    dashboard: 'bar-chart-2',
    notifications: 'send',
    user_notifications: 'inbox',
    categories: 'layout-grid',
    tournaments: 'swords',
    results: 'trophy',
    withdrawals: 'dollar-sign',
    transactions: 'history',
    users: 'users',
    settings: 'settings',
    promo_codes: 'ticket',
    promotions: 'sliders',
    advertising: 'megaphone',
    leaderboard_control: 'award',
    user_history: 'history',
    referrals: 'gift',
    profile_mng: 'user-cog',
    withdrawal_settings: 'credit-card',
    wallet_control: 'wallet',
    image_settings: 'image',
    staff: 'user-cog',
    text_content: 'file-text',
};

const AdminStaffScreen: React.FC<StaffProps> = ({ users, setUsers }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<types.User | null>(null);
    const [deletingStaff, setDeletingStaff] = useState<types.User | null>(null);
    
    const userContext = useContext(UserContext);
    if (!userContext) return null;
    const { user: currentUser } = userContext;

    const teamMembers = users
        .filter(u => u.role === 'staff' || u.role === 'admin')
        .sort((a, b) => (a.role === 'admin' ? -1 : 1));


    const handleSaveStaff = async (staffData: Partial<types.User>, password?: string) => {
        if (editingStaff) { // Editing existing staff
            const updatedStaff = { ...editingStaff, ...staffData };
            if(password){
                updatedStaff.password = password;
            }

            // --- NEW ROLE LOGIC ---
            if (updatedStaff.role === 'admin') {
                delete updatedStaff.permissions; // Admins have all rights, no permissions object needed
            }
            // --- END NEW ROLE LOGIC ---

            await updateDoc(doc(db, 'users', editingStaff.email.toLowerCase()), updatedStaff);
        } else { // Creating new staff
            if (!staffData.email || !password) {
                alert("Email and password are required for new staff.");
                return;
            }
             
            const newStaff: types.User = {
                role: 'staff',
                status: 'Active',
                deposit: 0, winnings: 0, totalWinnings: 0, kills: 0, matches: 0,
                transactions: [], joinedMatchDetails: [], notifications: [],
                avatar: `https://i.pravatar.cc/150?u=${staffData.email}`,
                referralCode: `STAFF${Math.floor(100 + Math.random() * 900)}`,
                creationDate: new Date().toISOString(),
                ...staffData,
                password: password,
            } as types.User;

            // --- NEW ROLE LOGIC (for creation) ---
            if (newStaff.role === 'admin') {
                delete newStaff.permissions; // Admins have all rights, no permissions object needed
            }
            // --- END NEW ROLE LOGIC ---
            
            await setDoc(doc(db, 'users', staffData.email.toLowerCase()), newStaff);
        }
        setIsFormOpen(false);
        setEditingStaff(null);
    };

    const handleRevokeAccess = async () => {
        if (!deletingStaff) return;
        
        const userRef = doc(db, 'users', deletingStaff.email.toLowerCase());
        await updateDoc(userRef, {
            role: 'user',
            permissions: deleteField()
        });

        setDeletingStaff(null);
    };

    const grantedPermissions = (permissions: types.StaffPermissions | undefined) => {
        if (!permissions) return [];
        return Object.entries(permissions)
            .filter(([_, value]) => value)
            .map(([key]) => key as keyof types.StaffPermissions);
    };

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-dark-card p-4 rounded-xl border border-white/10 shadow-lg">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Icon name="user-cog" className="text-brand-primary" /> Team Management
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">Manage staff members and view administrators.</p>
                </div>
                <button 
                    onClick={() => { setEditingStaff(null); setIsFormOpen(true); }} 
                    className="bg-brand-primary text-black font-bold py-3 px-5 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity w-full md:w-auto shadow-lg shadow-brand-primary/20"
                >
                    <Icon name="plus" size={18} /> Add Staff
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.map(member => {
                    const isAdmin = member.role === 'admin';
                    const isCurrentUser = member.email === currentUser.email;
                    
                    return (
                        <div key={member.email} className="bg-dark-card rounded-2xl overflow-hidden shadow-lg flex flex-col transition-all card-chromatic-border">
                            {/* Header */}
                            <div className="p-5 bg-white/5 flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <img src={member.avatar} className={`w-14 h-14 rounded-full object-cover border-2 ${isAdmin ? 'border-purple-500' : 'border-brand-primary/50'}`} alt={member.name}/>
                                    <div className="min-w-0">
                                        <p className="font-bold text-white text-lg truncate">{member.name}</p>
                                        <p className="text-xs text-gray-400 font-mono truncate">{member.email}</p>
                                    </div>
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full border flex-shrink-0 ${isAdmin ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                                    {isAdmin ? 'Admin' : 'Staff'}
                                </span>
                            </div>
                            
                            {/* Permissions Body */}
                            <div className="p-5 flex-1">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Assigned Permissions</p>
                                <div className="flex flex-wrap gap-2">
                                     {isAdmin ? (
                                        <div className="flex items-center gap-1.5 bg-dark-bg px-2.5 py-1 rounded-full border border-purple-500/20">
                                            <Icon name="shield" size={12} className="text-purple-400" />
                                            <span className="text-xs font-semibold text-purple-300">Full Access</span>
                                        </div>
                                    ) : (
                                        grantedPermissions(member.permissions).length > 0 ? (
                                            grantedPermissions(member.permissions).map(key => (
                                                <div key={key} className="flex items-center gap-1.5 bg-dark-bg px-2.5 py-1 rounded-full border border-white/5" title={key.replace('_', ' ')}>
                                                    <Icon name={permissionIconMap[key] || 'help-circle'} size={12} className="text-brand-primary" />
                                                    <span className="text-xs font-semibold text-gray-300 capitalize">{key.replace('_', ' ')}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-gray-600 italic">No permissions assigned.</p>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-3 bg-dark-bg border-t border-white/5 flex justify-end gap-2 h-[50px] items-center">
                                <button onClick={() => { setEditingStaff(member); setIsFormOpen(true); }} className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-blue-500 hover:text-white transition-all">
                                    <Icon name="edit-3" size={14}/> Edit
                                </button>
                                {isCurrentUser ? (
                                    <span className="text-xs text-gray-600 italic px-2" title="You cannot revoke your own access.">Cannot revoke self</span>
                                ) : (
                                    <button onClick={() => setDeletingStaff(member)} className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all">
                                        <Icon name="user-x" size={14}/> Revoke
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {teamMembers.length === 0 && (
                <div className="text-center text-gray-500 py-20 bg-dark-card rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <Icon name="user-cog" size={32} className="opacity-40" />
                    </div>
                    <h3 className="font-bold text-xl text-white mb-2">No Team Members</h3>
                    <p className="text-sm">Click 'Add Staff' to create the first account.</p>
                </div>
            )}


            <StaffFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                staffMember={editingStaff}
                onSave={handleSaveStaff}
            />

            <ConfirmModal
                isOpen={!!deletingStaff}
                onClose={() => setDeletingStaff(null)}
                onConfirm={handleRevokeAccess}
                title={`Revoke Access`}
                message={`Are you sure you want to revoke privileges for ${deletingStaff?.name}? Their role will be set to 'user' and they will lose all admin/staff access.`}
                confirmText="Revoke Access"
                confirmButtonClass="bg-red-500 hover:bg-red-600"
                confirmIcon="user-x"
            />
        </>
    );
};
export default AdminStaffScreen;