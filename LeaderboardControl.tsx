import React, { useState, useMemo, useContext, useEffect, useRef } from 'react';
import Icon from '../../components/Icon';
import * as types from '../../types';
import { db } from '../../firebase';
import { doc, updateDoc, writeBatch, setDoc } from 'firebase/firestore';
import AdminSection from '../../components/admin/AdminSection';
import ConfirmModal from '../../components/ConfirmModal';
import { ToastContext } from '../../contexts';
import LeaderboardEditModal from '../../components/admin/LeaderboardEditModal';
import { compressImage } from '../../utils';
import { uploadMediaAsset } from '../../image-hosting';
import MediaDisplay from '../../components/MediaDisplay';

interface LeaderboardControlProps {
    users: types.User[];
    setUsers: React.Dispatch<React.SetStateAction<types.User[]>>;
    appSettings: types.AppSettings;
    setAppSettings: React.Dispatch<React.SetStateAction<types.AppSettings>>;
}

const AdminLeaderboardControlScreen: React.FC<LeaderboardControlProps> = ({ users, setUsers, appSettings, setAppSettings }) => {
    const toastContext = useContext(ToastContext);

    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingUser, setEditingUser] = useState<types.User | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [maintenanceSettings, setMaintenanceSettings] = useState({
        leaderboardMaintenanceMode: appSettings.leaderboardMaintenanceMode,
        leaderboardMaintenanceMessage: appSettings.leaderboardMaintenanceMessage,
        leaderboardMaintenanceImageUrl: appSettings.leaderboardMaintenanceImageUrl,
        leaderboardMaintenanceImageWidth: appSettings.leaderboardMaintenanceImageWidth || 160,
        leaderboardMaintenanceImageHeight: appSettings.leaderboardMaintenanceImageHeight || 160,
    });
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMaintenanceSettings({
            leaderboardMaintenanceMode: appSettings.leaderboardMaintenanceMode,
            leaderboardMaintenanceMessage: appSettings.leaderboardMaintenanceMessage,
            leaderboardMaintenanceImageUrl: appSettings.leaderboardMaintenanceImageUrl,
            leaderboardMaintenanceImageWidth: appSettings.leaderboardMaintenanceImageWidth || 160,
            leaderboardMaintenanceImageHeight: appSettings.leaderboardMaintenanceImageHeight || 160,
        });
    }, [appSettings]);

    const rankedUsers = useMemo(() =>
        [...users]
            .sort((a, b) => b.totalWinnings - a.totalWinnings)
            .map((user, index) => ({ ...user, rank: index + 1 })),
        [users]
    );

    const handleResetAllWinnings = async () => {
        setIsSaving(true);
        try {
            const batch = writeBatch(db);
            users.forEach(user => {
                const userRef = doc(db, 'users', user.email.toLowerCase());
                batch.update(userRef, { totalWinnings: 0, kills: 0, matches: 0 });
            });
            await batch.commit();
            toastContext?.showToast('All lifetime winnings, kills, and matches have been reset!', 'success');
        } catch (error) {
            console.error(error);
            toastContext?.showToast('Failed to reset stats.', 'error');
        } finally {
            setIsSaving(false);
            setIsResetConfirmOpen(false);
        }
    };

    const handleEditUser = (user: types.User) => {
        setEditingUser(user);
        setIsEditModalOpen(true);
    };

    const handleSaveStats = async (updatedUser: types.User) => {
        setIsSaving(true);
        try {
            const userRef = doc(db, 'users', updatedUser.email.toLowerCase());
            await updateDoc(userRef, {
                totalWinnings: updatedUser.totalWinnings,
                kills: updatedUser.kills,
                matches: updatedUser.matches
            });
            setIsEditModalOpen(false);
            toastContext?.showToast(`${updatedUser.name}'s stats updated!`, 'success');
        } catch (e) {
            console.error(e);
            toastContext?.showToast("Failed to update user stats.", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSettingsChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setMaintenanceSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleToggleMaintenance = () => {
        setMaintenanceSettings(prev => ({ ...prev, leaderboardMaintenanceMode: !prev.leaderboardMaintenanceMode }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsUploading(true);
            try {
                const base64Data = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.8 });
                const downloadURL = await uploadMediaAsset(base64Data);
                setMaintenanceSettings(prev => ({ ...prev, leaderboardMaintenanceImageUrl: downloadURL }));
                toastContext?.showToast('Image uploaded!', 'success');
            } catch (error: any) {
                console.error("Upload failed:", error);
                toastContext?.showToast(error.message || 'Upload failed. Please try again.', 'error');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        try {
            await updateDoc(doc(db, 'settings', 'app'), {
                leaderboardMaintenanceMode: maintenanceSettings.leaderboardMaintenanceMode,
                leaderboardMaintenanceMessage: maintenanceSettings.leaderboardMaintenanceMessage,
                leaderboardMaintenanceImageUrl: maintenanceSettings.leaderboardMaintenanceImageUrl,
                leaderboardMaintenanceImageWidth: Number(maintenanceSettings.leaderboardMaintenanceImageWidth),
                leaderboardMaintenanceImageHeight: Number(maintenanceSettings.leaderboardMaintenanceImageHeight),
            });
            toastContext?.showToast('Leaderboard settings saved!', 'success');
        } catch (error) {
            console.error(error);
            toastContext?.showToast('Failed to save settings.', 'error');
        } finally {
            setIsSavingSettings(false);
        }
    };

    return (
        <>
            <AdminSection icon="award" title="Leaderboard Control" subtitle="Manage user rankings and reset seasons.">
                {/* Maintenance Mode Section */}
                <div className="bg-dark-bg border border-white/10 rounded-xl p-4 mb-6">
                    <h4 className="font-bold text-white flex items-center gap-2 mb-4"><Icon name="shield-alert" /> Maintenance Mode</h4>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-dark-card p-3 rounded-lg">
                            <div>
                                <p className="font-semibold text-sm text-white">Enable Leaderboard Maintenance</p>
                                <p className="text-xs text-gray-500">Shows a maintenance message instead of rankings.</p>
                            </div>
                            <button
                                onClick={handleToggleMaintenance}
                                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${maintenanceSettings.leaderboardMaintenanceMode ? 'bg-brand-primary' : 'bg-gray-700'}`}
                            >
                                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-md transition-transform duration-300 ${maintenanceSettings.leaderboardMaintenanceMode ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                        {maintenanceSettings.leaderboardMaintenanceMode && (
                            <div className="animate-fade-in space-y-4">
                                <div>
                                    <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Maintenance Message</label>
                                    <textarea
                                        name="leaderboardMaintenanceMessage"
                                        value={maintenanceSettings.leaderboardMaintenanceMessage}
                                        onChange={handleSettingsChange}
                                        rows={3}
                                        className="w-full bg-dark-card border border-gray-700 rounded-lg p-3 text-white focus:border-brand-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Maintenance Image</label>
                                    <div onClick={!isUploading ? () => fileInputRef.current?.click() : undefined} className="w-full aspect-video bg-dark-card rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center relative overflow-hidden cursor-pointer hover:border-brand-primary group">
                                        {isUploading ? <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div> : <MediaDisplay src={maintenanceSettings.leaderboardMaintenanceImageUrl} alt="Maintenance Preview" className="w-full h-full object-contain p-2" />}
                                    </div>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="number" name="leaderboardMaintenanceImageWidth" value={maintenanceSettings.leaderboardMaintenanceImageWidth} onChange={handleSettingsChange} placeholder="Width (px)" className="w-full bg-dark-card border border-gray-700 rounded-lg p-2 text-white text-sm" />
                                    <input type="number" name="leaderboardMaintenanceImageHeight" value={maintenanceSettings.leaderboardMaintenanceImageHeight} onChange={handleSettingsChange} placeholder="Height (px)" className="w-full bg-dark-card border border-gray-700 rounded-lg p-2 text-white text-sm" />
                                </div>
                            </div>
                        )}
                        <button
                            onClick={handleSaveSettings}
                            disabled={isSavingSettings}
                            className="w-full md:w-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-5 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50"
                        >
                            {isSavingSettings ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Icon name="save" />}
                            {isSavingSettings ? 'Saving...' : 'Save Maintenance Settings'}
                        </button>
                    </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div>
                        <h4 className="font-bold text-red-400 flex items-center gap-2"><Icon name="alert-triangle" /> Danger Zone</h4>
                        <p className="text-xs text-gray-400 mt-1">Resetting will set every user's lifetime winnings, kills, and matches to 0. This is permanent and used for starting new seasons.</p>
                    </div>
                    <button
                        onClick={() => setIsResetConfirmOpen(true)}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-5 rounded-lg flex items-center justify-center gap-2 text-sm w-full md:w-auto transition-colors"
                    >
                        <Icon name="trash-2" /> Reset All Lifetime Winnings
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-dark-card-hover text-gray-400">
                            <tr>
                                <th className="px-6 py-4">Rank</th>
                                <th className="px-6 py-4">Player</th>
                                <th className="px-6 py-4">Total Winnings</th>
                                <th className="px-6 py-4">Kills</th>
                                <th className="px-6 py-4">Matches</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {rankedUsers.map(user => (
                                <tr key={user.email} className="hover:bg-white/5">
                                    <td className="px-6 py-4 font-bold text-lg text-white">#{user.rank}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                                            <div>
                                                <p className="font-bold text-white text-sm">{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-lg text-brand-gold">💎{user.totalWinnings}</td>
                                    <td className="px-6 py-4 text-white font-semibold">{user.kills}</td>
                                    <td className="px-6 py-4 text-white font-semibold">{user.matches}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleEditUser(user)} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-colors">
                                            <Icon name="edit-3" size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </AdminSection>

            <ConfirmModal
                isOpen={isResetConfirmOpen}
                onClose={() => setIsResetConfirmOpen(false)}
                onConfirm={handleResetAllWinnings}
                title="Confirm Leaderboard Reset"
                message="Are you absolutely sure? This will reset ALL users' lifetime winnings, kills, and matches to 0. This action cannot be undone."
                confirmText={isSaving ? "Resetting..." : "Yes, Reset Leaderboard"}
                confirmIcon="trash-2"
                confirmButtonClass="bg-red-500 hover:bg-red-600"
            />

            <LeaderboardEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                user={editingUser}
                onSave={handleSaveStats}
                isSaving={isSaving}
            />
        </>
    );
};

export default AdminLeaderboardControlScreen;