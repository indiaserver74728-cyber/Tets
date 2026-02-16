import React, { useState, useEffect, useContext } from 'react';
import Icon from '../../components/Icon';
import * as types from '../../types';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import AdminSection from '../../components/admin/AdminSection';
import { ToastContext } from '../../contexts';
import AdFormModal from '../../components/admin/AdFormModal';
import ConfirmModal from '../../components/ConfirmModal';
import MediaDisplay from '../../components/MediaDisplay';

interface AdvertisingProps {
    appSettings: types.AppSettings;
    setAppSettings: React.Dispatch<React.SetStateAction<types.AppSettings>>;
}

const ToggleSwitch: React.FC<{ label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between bg-dark-bg border border-white/5 p-4 rounded-xl hover:border-white/10 transition-colors">
        <div className="mr-4">
            <p className="font-bold text-sm text-white">{label}</p>
            {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        <button
            onClick={() => onChange(!checked)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${checked ? 'bg-brand-primary' : 'bg-gray-700'}`}
        >
            <span
                className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-md transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-0'}`}
            />
        </button>
    </div>
);

const AdminAdvertisingScreen: React.FC<AdvertisingProps> = ({ appSettings, setAppSettings }) => {
    const [adSettings, setAdSettings] = useState(appSettings);
    const [isSaving, setIsSaving] = useState(false);
    const toastContext = useContext(ToastContext);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAd, setEditingAd] = useState<types.InAppAd | null>(null);
    const [deletingAd, setDeletingAd] = useState<types.InAppAd | null>(null);

    useEffect(() => {
        setAdSettings(appSettings);
    }, [appSettings]);

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            await updateDoc(doc(db, 'settings', 'app'), {
                showInAppAd: adSettings.showInAppAd,
                inAppAds: adSettings.inAppAds || [],
                inAppAdAnimation: adSettings.inAppAdAnimation || 'fade',
            });
            setAppSettings(prev => ({...prev, ...adSettings}));
            toastContext?.showToast('Advertising settings saved!', 'success');
        } catch (error) {
            console.error(error);
            toastContext?.showToast('Failed to save settings.', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleSaveAd = (adData: types.InAppAd) => {
        const ads = adSettings.inAppAds || [];

        const otherAds = editingAd ? ads.filter(ad => ad.id !== editingAd.id) : ads;
        if (otherAds.some(ad => ad.id === Number(adData.id))) {
            toastContext?.showToast(`Error: Ad ID "${adData.id}" is already in use. IDs must be unique.`, 'error');
            return;
        }

        let newAds;
        if (editingAd) {
            newAds = ads.map(ad => ad.id === editingAd.id ? { ...adData, id: Number(adData.id) } : ad);
            toastContext?.showToast('Ad updated locally. Save to confirm.', 'info');
        } else {
            newAds = [...ads, { ...adData, id: Number(adData.id) }];
            toastContext?.showToast('Ad added locally. Save to confirm.', 'info');
        }
        
        setAdSettings(prev => ({...prev, inAppAds: newAds}));
        setIsFormOpen(false);
        setEditingAd(null);
    };

    const handleDeleteAd = () => {
        if (!deletingAd) return;
        const newAds = (adSettings.inAppAds || []).filter(ad => ad.id !== deletingAd.id);
        setAdSettings(prev => ({ ...prev, inAppAds: newAds }));
        setDeletingAd(null);
        toastContext?.showToast('Ad removed locally. Save to confirm.', 'info');
    };

    const sortedAds = (adSettings.inAppAds || []).sort((a,b) => a.id - b.id);

    return (
        <>
            <AdminSection icon="megaphone" title="Advertising" subtitle="Manage In-App Ads and Pop Ups.">
                <div className="space-y-6">
                    <div className="bg-dark-bg p-6 rounded-2xl border border-white/10 space-y-4">
                         <ToggleSwitch
                            label="Enable In-App Ads"
                            description="Globally enables or disables the ad pop-up on login."
                            checked={adSettings.showInAppAd}
                            onChange={(v) => setAdSettings(p => ({ ...p, showInAppAd: v }))}
                        />
                         <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <Icon name="film" size={12} className="text-brand-primary/70" /> Animation Style
                            </label>
                            <select 
                                value={adSettings.inAppAdAnimation || 'fade'}
                                onChange={(e) => setAdSettings(p => ({ ...p, inAppAdAnimation: e.target.value as any }))}
                                className="w-full bg-dark-card border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all outline-none"
                            >
                                <option value="slide">Slide</option>
                                <option value="fade">Fade</option>
                                <option value="none">None</option>
                            </select>
                         </div>
                    </div>

                    <div className="bg-dark-bg p-6 rounded-2xl border border-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-bold text-white">Control Ads</h3>
                            <button onClick={() => { setEditingAd(null); setIsFormOpen(true); }} className="bg-brand-primary text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                                <Icon name="plus" size={16}/> Add Ads
                            </button>
                        </div>
                        <div className="space-y-3">
                            {sortedAds.map(ad => (
                                <div key={ad.id} className="bg-dark-card border border-white/5 rounded-xl p-3 flex items-center gap-4 group">
                                    <MediaDisplay src={ad.imageUrl} alt="Ad" className="w-24 h-24 object-contain bg-black rounded-md flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold text-sm ${ad.enabled ? 'text-white' : 'text-gray-500'}`}>Order ID: {ad.id}</p>
                                        <a href={ad.linkUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-cyan font-mono truncate hover:underline block">{ad.linkUrl || 'No link'}</a>
                                        <p className="text-xs text-gray-400">{ad.width}% x {ad.height}px</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                         <span className={`px-3 py-1.5 text-xs font-bold rounded-md ${ad.enabled ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {ad.enabled ? 'ON' : 'OFF'}
                                        </span>
                                        <button onClick={() => { setEditingAd(ad); setIsFormOpen(true); }} className="p-2 bg-blue-500/10 text-blue-500 rounded-md hover:bg-blue-500 hover:text-white transition-colors"><Icon name="edit-3" size={16}/></button>
                                        <button onClick={() => setDeletingAd(ad)} className="p-2 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500 hover:text-white transition-colors"><Icon name="trash-2" size={16}/></button>
                                    </div>
                                </div>
                            ))}
                            {sortedAds.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No ads configured. Click 'Add Ad' to start.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-white/5">
                        <button onClick={handleSaveSettings} disabled={isSaving} className="bg-brand-primary text-black font-extrabold px-8 py-3 rounded-xl flex items-center justify-center gap-2">
                            {isSaving ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <Icon name="save" size={18} />}
                            {isSaving ? 'SAVING...' : 'SAVE ALL CHANGES'}
                        </button>
                    </div>
                </div>
            </AdminSection>

            <AdFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSaveAd}
                ad={editingAd}
            />

            <ConfirmModal
                isOpen={!!deletingAd}
                onClose={() => setDeletingAd(null)}
                onConfirm={handleDeleteAd}
                title="Delete Ad"
                message="Are you sure you want to delete this ad? This action is local until you save all changes."
                confirmText="Delete Ad"
                confirmButtonClass="bg-red-500"
                confirmIcon="trash-2"
            />
        </>
    );
};

export default AdminAdvertisingScreen;