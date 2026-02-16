import React, { useState, useEffect, useContext } from 'react';
import Icon from '../../components/Icon';
import * as types from '../../types';
import { db } from '../../firebase';
import { doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import ConfirmModal from '../../components/ConfirmModal';
import PromotionFormModal from '../../components/admin/PromotionFormModal';
import { ToastContext } from '../../contexts';

interface PromotionsProps {
    promotions: types.Promotion[];
    setPromotions: React.Dispatch<React.SetStateAction<types.Promotion[]>>;
    appSettings: types.AppSettings;
    setAppSettings: React.Dispatch<React.SetStateAction<types.AppSettings>>;
}

const InputGroup: React.FC<{ 
    label: string; 
    icon?: string; 
    value: string | number; 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
    type?: string; 
    name: string;
}> = ({ label, icon, value, onChange, type = "text", name }) => (
    <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            {icon && <Icon name={icon} size={12} className="text-brand-primary/70" />}
            {label}
        </label>
        <div className="relative group">
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all outline-none"
            />
        </div>
    </div>
);

const SelectGroup: React.FC<{
    label: string;
    icon?: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    name: string;
    children: React.ReactNode;
}> = ({ label, icon, value, onChange, name, children }) => (
    <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            {icon && <Icon name={icon} size={12} className="text-brand-primary/70" />}
            {label}
        </label>
        <div className="relative group">
            <select
                name={name}
                value={value}
                onChange={onChange}
                className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all outline-none appearance-none"
            >
                {children}
            </select>
             <Icon name="chevron-down" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"/>
        </div>
    </div>
);


const AdminPromotionsScreen: React.FC<PromotionsProps> = ({ promotions, setPromotions, appSettings, setAppSettings }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState<types.Promotion | null>(null);
    const [deletingPromo, setDeletingPromo] = useState<types.Promotion | null>(null);
    const toastContext = useContext(ToastContext);
    
    const [localSettings, setLocalSettings] = useState(appSettings);
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    useEffect(() => {
        setLocalSettings(appSettings);
    }, [appSettings]);

    useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    }, [promotions, localSettings]);

    const handleSave = async (promoData: Partial<types.Promotion>) => {
        try {
            if (editingPromo) {
                const updatedPromo = { ...editingPromo, ...promoData };
                await updateDoc(doc(db, 'promotions', editingPromo.id.toString()), updatedPromo);
                toastContext?.showToast('Promotion updated!', 'success');
            } else {
                const newId = Date.now();
                const newPromo: types.Promotion = {
                    id: newId,
                    title: promoData.title || '',
                    imageUrl: promoData.imageUrl || '',
                    linkUrl: promoData.linkUrl || '',
                };
                await setDoc(doc(db, 'promotions', newId.toString()), newPromo);
                toastContext?.showToast('Promotion created!', 'success');
            }
            setIsFormOpen(false);
        } catch (error) {
            console.error("Save failed:", error);
            toastContext?.showToast('Failed to save promotion.', 'error');
        }
    };

    const handleDelete = async () => {
        if (!deletingPromo) return;
        try {
            await deleteDoc(doc(db, 'promotions', deletingPromo.id.toString()));
            toastContext?.showToast('Promotion deleted.', 'info');
            setDeletingPromo(null);
        } catch (error) {
            console.error("Delete failed:", error);
            toastContext?.showToast('Failed to delete promotion.', 'error');
        }
    };
    
    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setLocalSettings(p => ({...p, [name]: (e.target as HTMLInputElement).type === 'number' ? parseFloat(value) || 0 : value}));
    };

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        try {
            const settingsToSave = {
                sliderHeight: Number(localSettings.sliderHeight) || 160,
                sliderWidth: Number(localSettings.sliderWidth) || 100,
                sliderBorderRadius: Number(localSettings.sliderBorderRadius) || 12,
                sliderSpeed: Number(localSettings.sliderSpeed) || 4000,
                sliderAnimation: localSettings.sliderAnimation || 'fade',
            };
            await updateDoc(doc(db, 'settings', 'app'), settingsToSave);
            setAppSettings(prev => ({...prev, ...settingsToSave}));
            toastContext?.showToast('Slider settings saved!', "success");
        } catch (e) {
            console.error("Save Error:", e);
            toastContext?.showToast('Error saving settings.', "error");
        } finally {
            setIsSavingSettings(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Icon name="sliders" className="text-brand-primary" />
                        Promotions
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">Manage home screen sliders and their appearance.</p>
                </div>
                <button onClick={() => { setEditingPromo(null); setIsFormOpen(true); }} className="bg-brand-primary text-black font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity">
                    <Icon name="plus" size={18} /> Add New
                </button>
            </div>
            
            <div className="bg-dark-card border border-white/5 rounded-2xl p-6 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-bold text-white">Slider Customization</h3>
                    <button onClick={handleSaveSettings} disabled={isSavingSettings} className="bg-blue-500/10 text-blue-400 font-bold px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm hover:bg-blue-500 hover:text-white transition-colors">
                        {isSavingSettings ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <Icon name="save" size={16} />}
                        Save Settings
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InputGroup name="sliderHeight" label="Height (px)" value={localSettings.sliderHeight} onChange={handleSettingsChange} type="number" icon="move-vertical" />
                    <InputGroup name="sliderWidth" label="Width (%)" value={localSettings.sliderWidth} onChange={handleSettingsChange} type="number" icon="move-horizontal" />
                    <InputGroup name="sliderBorderRadius" label="Border Radius (px)" value={localSettings.sliderBorderRadius} onChange={handleSettingsChange} type="number" icon="square" />
                    <InputGroup name="sliderSpeed" label="Speed (ms)" value={localSettings.sliderSpeed} onChange={handleSettingsChange} type="number" icon="clock" />
                    <SelectGroup label="Animation" name="sliderAnimation" value={localSettings.sliderAnimation} onChange={handleSettingsChange} icon="film">
                        <option value="fade">Fade</option>
                        <option value="slide">Slide</option>
                    </SelectGroup>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {promotions.map(promo => (
                    <div key={promo.id} className="bg-dark-card border border-white/10 rounded-2xl overflow-hidden group">
                        <div className="aspect-video relative overflow-hidden">
                            <img src={promo.imageUrl} alt={promo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                            <div className="absolute bottom-4 left-4">
                                <p className="text-white font-bold text-lg drop-shadow-md">{promo.title}</p>
                            </div>
                        </div>
                        <div className="p-4 bg-dark-card-hover border-t border-white/5 flex justify-between items-center">
                            <a href={promo.linkUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-cyan font-mono truncate hover:underline flex items-center gap-2">
                                <Icon name="link" size={12} /> {promo.linkUrl || 'No link'}
                            </a>
                            <div className="flex gap-2">
                                <button onClick={() => { setEditingPromo(promo); setIsFormOpen(true); }} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"><Icon name="edit-3" size={16} /></button>
                                <button onClick={() => setDeletingPromo(promo)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Icon name="trash-2" size={16} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {promotions.length === 0 && <p className="text-center text-gray-500 py-10">No promotions found. Click 'Add New' to create one.</p>}
            
            <PromotionFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSave}
                promotion={editingPromo}
            />

            <ConfirmModal
                isOpen={!!deletingPromo}
                onClose={() => setDeletingPromo(null)}
                onConfirm={handleDelete}
                title="Delete Promotion"
                message={`Are you sure you want to delete this promotion? It will be removed from the home screen slider.`}
                confirmText="Delete"
                confirmIcon="trash-2"
                confirmButtonClass="bg-red-500 hover:bg-red-600"
            />
        </div>
    );
};

export default AdminPromotionsScreen;