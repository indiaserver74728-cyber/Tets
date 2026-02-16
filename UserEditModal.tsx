import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../types';
import Icon from '../Icon';
import { compressImage } from '../../utils';
import { uploadMediaAsset } from '../../image-hosting';
import MediaDisplay from '../MediaDisplay';

interface UserEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onSave: (updatedUser: User) => Promise<void>;
    onDelete: (user: User) => void;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ isOpen, onClose, user, onSave, onDelete }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'wallet' | 'settings'>('profile');
    const [formData, setFormData] = useState<User | null>(user);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    
    // States for image uploads
    const [isAvatarUploading, setIsAvatarUploading] = useState(false);
    const [isBanImageUploading, setIsBanImageUploading] = useState(false);
    const avatarFileInputRef = useRef<HTMLInputElement>(null);
    const banImageFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setFormData(user);
        setActiveTab('profile');
    }, [user, isOpen]);

    useEffect(() => {
        if (isOpen && window.lucide) {
            setTimeout(() => window.lucide.createIcons(), 50);
        }
    }, [isOpen, activeTab, formData?.status]); 

    if (!isOpen || !formData) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => prev ? { ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value } : null);
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && formData) {
            const file = e.target.files[0];
            setIsAvatarUploading(true);
            try {
                const base64Data = await compressImage(file, { maxWidth: 256, maxHeight: 256, quality: 0.8 });
                const downloadURL = await uploadMediaAsset(base64Data);
                setFormData({ ...formData, avatar: downloadURL });
            } catch (error: any) {
                console.error("Avatar upload failed:", error);
                setError("Avatar upload failed.");
            } finally {
                setIsAvatarUploading(false);
            }
        }
    };
    
    const handleBanImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && formData) {
            const file = e.target.files[0];
            setIsBanImageUploading(true);
            try {
                const base64Data = await compressImage(file, { maxWidth: 512, maxHeight: 512, quality: 0.8 });
                const downloadURL = await uploadMediaAsset(base64Data);
                setFormData({ ...formData, banImageUrl: downloadURL });
            } catch (error: any) {
                console.error("Ban image upload failed:", error);
                setError("Image upload failed.");
            } finally {
                setIsBanImageUploading(false);
            }
        }
    };

    const handleSave = async () => {
        if (!formData) return;
        setIsSaving(true);
        const finalData = { ...formData };
        if (finalData.status !== 'Banned') {
            finalData.banReason = '';
            finalData.banImageUrl = '';
        }
        await onSave(finalData);
        setIsSaving(false);
    };

    const handleDeleteClick = () => {
        if (formData) onDelete(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={isSaving ? undefined : onClose}>
            <div 
                className="relative bg-dark-card border border-white/10 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden max-h-[90vh]" 
                onClick={e => e.stopPropagation()}
            >
                {/* Loading Overlay */}
                {isSaving && (
                    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
                        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-brand-primary font-bold text-lg animate-pulse">Updating User Profile...</p>
                    </div>
                )}

                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-white/10 bg-dark-bg relative">
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-primary/10 p-2 rounded-lg">
                            <Icon name="user-cog" size={20} className="text-brand-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Edit User</h2>
                            <p className="text-xs text-gray-400">Modify user details & stats</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        disabled={isSaving}
                        className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2 rounded-lg transition-all absolute right-4 top-4 disabled:opacity-50"
                        aria-label="Close"
                    >
                        <Icon name="x" size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5 px-4 bg-dark-bg/50 overflow-x-auto hide-scrollbar shrink-0">
                    {['profile', 'stats', 'wallet', 'settings'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            disabled={isSaving}
                            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors capitalize whitespace-nowrap px-4 ${
                                activeTab === tab 
                                ? 'border-brand-primary text-brand-primary' 
                                : 'border-transparent text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-dark-bg">
                    {activeTab === 'profile' && (
                        <div className="space-y-4">
                            <div className="text-center mb-6">
                                <div onClick={() => avatarFileInputRef.current?.click()} className="relative w-20 h-20 mx-auto group cursor-pointer">
                                    <img src={formData.avatar} className="w-20 h-20 rounded-full mx-auto mb-2 border-2 border-brand-primary/30 object-cover" alt="" />
                                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Icon name="camera" size={24} className="text-white"/>
                                    </div>
                                    {isAvatarUploading && <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-white/50 border-t-white rounded-full animate-spin"></div></div>}
                                </div>
                                 <input type="file" ref={avatarFileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                                <p className="text-xs text-gray-500 mt-2">Avatar URL</p>
                                <input type="text" name="avatar" value={formData.avatar} onChange={handleChange} className="mt-2 w-full bg-dark-card border border-gray-700 rounded-lg p-2 text-xs text-gray-400 text-center" />
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Full Name</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-dark-card border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-brand-primary outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Email (ID)</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} disabled className="opacity-50 cursor-not-allowed w-full bg-dark-card border border-gray-700 rounded-lg p-3 text-white text-sm" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Phone Number</label>
                                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-dark-card border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-brand-primary outline-none" />
                                </div>
                                <div className="bg-red-500/5 p-3 rounded-lg border border-red-500/20">
                                    <label className="text-xs text-red-400 mb-1 block font-bold flex items-center gap-2"><Icon name="lock" size={12}/> User Password</label>
                                    <input type="text" name="password" value={formData.password || ''} onChange={handleChange} placeholder="No password stored" className="w-full bg-dark-bg border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-red-500 outline-none" />
                                    <p className="text-[10px] text-gray-500 mt-1">Directly editing the stored password string.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'stats' && (
                        <div className="space-y-6">
                             <div className="bg-dark-card p-4 rounded-xl border border-white/5">
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <Icon name="swords" className="text-red-500" size={16}/> Game Statistics
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">Total Kills</label>
                                        <input type="number" name="kills" value={formData.kills} onChange={handleChange} className="w-full bg-dark-bg border border-gray-700 rounded-lg p-3 text-white text-lg font-bold focus:border-red-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">Matches Played</label>
                                        <input type="number" name="matches" value={formData.matches} onChange={handleChange} className="w-full bg-dark-bg border border-gray-700 rounded-lg p-3 text-white text-lg font-bold focus:border-blue-500 outline-none" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-dark-card p-4 rounded-xl border border-white/5">
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <Icon name="share-2" className="text-purple-500" size={16}/> Referral Data
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">My Referral Code</label>
                                        <input type="text" name="referralCode" value={formData.referralCode} onChange={handleChange} className="w-full bg-dark-bg border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-purple-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">Referred By (Code)</label>
                                        <input type="text" name="referredBy" value={formData.referredBy || ''} onChange={handleChange} placeholder="N/A" className="w-full bg-dark-bg border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-purple-500 outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'wallet' && (
                        <div className="space-y-4">
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4 flex items-start gap-3">
                                <Icon name="info" className="text-blue-400 mt-0.5" size={16} />
                                <div className="text-xs text-blue-200">
                                    <p className="font-bold mb-1">Admin Override</p>
                                    Editing these values updates the database directly without transaction logs. Use this for Corrections.
                                </div>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-green-400 mb-1 block font-bold">Deposit Balance</label>
                                     <p className="text-[10px] text-gray-500 mb-1">Current Deposit Balance</p>
                                    <input type="number" name="deposit" value={formData.deposit} onChange={handleChange} className="w-full bg-dark-card border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-green-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs text-amber-400 mb-1 block font-bold">Winning Balance</label>
                                    <p className="text-[10px] text-gray-500 mb-1">Current Winning Balance</p>
                                    <input type="number" name="winnings" value={formData.winnings} onChange={handleChange} className="w-full bg-dark-card border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-amber-500 outline-none" />
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <label className="text-xs text-brand-gold mb-1 block font-bold">Total Lifetime Winnings (Stats)</label>
                                <p className="text-[10px] text-gray-500 mb-2">This is used for Leaderboards/Stats. It is different from the current Winning balance.</p>
                                <input type="number" name="totalWinnings" value={formData.totalWinnings} onChange={handleChange} className="w-full bg-dark-card border border-gray-700 rounded-lg p-3 text-white text-sm focus:border-brand-gold outline-none" />
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between bg-dark-card p-4 rounded-xl border border-white/5">
                                <div><p className="text-sm font-bold text-white">Account Status</p><p className="text-xs text-gray-500">Controls login access</p></div>
                                <button onClick={() => setFormData(prev => prev ? { ...prev, status: prev.status === 'Active' ? 'Banned' : 'Active' } : null)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${formData.status === 'Active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{formData.status}</button>
                            </div>

                            {formData.status === 'Banned' && (
                                <div className="animate-fade-in space-y-4 bg-dark-bg p-4 rounded-xl border border-red-500/20">
                                    <div>
                                        <label className="text-xs text-red-400 mb-1 block font-bold flex items-center gap-2"><Icon name="alert-triangle" size={12}/> Ban Reason</label>
                                        <input type="text" name="banReason" value={formData.banReason || ''} onChange={handleChange} placeholder="Reason for ban..." className="w-full bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-white text-sm focus:border-red-500 outline-none placeholder-red-300/50" />
                                        <p className="text-[10px] text-gray-500 mt-1">This message will be visible to the user.</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-red-400 mb-1 block font-bold flex items-center gap-2"><Icon name="image" size={12}/> Custom Ban Image/GIF (Optional)</label>
                                        <div onClick={!isBanImageUploading ? () => banImageFileInputRef.current?.click() : undefined} className="w-full aspect-video bg-dark-card rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center relative group cursor-pointer">
                                            {isBanImageUploading ? <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div> : formData.banImageUrl ? <MediaDisplay src={formData.banImageUrl} alt="Ban visual" className="w-full h-full object-contain" /> : <div className="text-center text-gray-500"><Icon name="upload-cloud" size={32}/><p className="text-xs mt-1">Upload Image/GIF</p></div>}
                                        </div>
                                        <input type="file" ref={banImageFileInputRef} onChange={handleBanImageChange} className="hidden" accept="image/*,image/gif" />
                                        <input type="text" name="banImageUrl" value={formData.banImageUrl || ''} onChange={handleChange} placeholder="Or paste image/GIF URL" className="mt-2 w-full bg-dark-card border border-gray-700 rounded-lg p-2 text-xs text-gray-400 text-center" />
                                        <p className="text-[10px] text-gray-500 mt-1">Overrides the default ban image from Image Settings.</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between bg-dark-card p-4 rounded-xl border border-white/5">
                                <div><p className="text-sm font-bold text-white">User Role</p><p className="text-xs text-gray-500">Controls permissions and access</p></div>
                                <select name="role" value={formData.role} onChange={(e) => setFormData(prev => prev ? { ...prev, role: e.target.value as 'user'|'admin'|'staff' } : null)} className="bg-dark-bg border border-gray-700 text-white text-sm rounded-lg p-2 focus:border-brand-primary outline-none">
                                    <option value="user">User</option><option value="staff">Staff</option><option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="mt-8 pt-6 border-t border-red-500/20">
                                <h4 className="text-red-500 font-bold text-sm mb-2 flex items-center gap-2"><Icon name="alert-octagon" size={16}/> Danger Zone</h4>
                                <p className="text-[10px] text-gray-500 mb-4">Deleting a user is permanent and cannot be undone. All data will be lost.</p>
                                <button onClick={handleDeleteClick} disabled={isSaving} className="w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 py-3 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                                    <Icon name="trash-2" size={16} /> Delete User
                                </button>
                            </div>
                        </div>
                    )}
                    {error && <p className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded-lg mt-4">{error}</p>}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-white/10 bg-dark-bg flex gap-3 shrink-0">
                    <button onClick={onClose} disabled={isSaving} className="flex-1 bg-dark-card border border-gray-600 text-white py-3 rounded-xl font-bold hover:bg-white/5 transition-colors text-sm disabled:opacity-50">Cancel</button>
                    <button onClick={handleSave} disabled={isSaving} className="flex-1 bg-brand-primary text-black py-3 rounded-xl font-bold hover:opacity-90 transition-opacity text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 disabled:opacity-50">
                        <Icon name="save" size={16} /> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserEditModal;