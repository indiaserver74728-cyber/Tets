import React, { useState, useEffect, useContext } from 'react';
import Icon from '../../components/Icon';
import * as types from '../../types';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import AdminSection from '../../components/admin/AdminSection';
import { ToastContext } from '../../contexts';

// Reusable UI Components
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


interface WalletControlProps {
    appSettings: types.AppSettings;
    setAppSettings: React.Dispatch<React.SetStateAction<types.AppSettings>>;
}

const AdminWalletControlScreen: React.FC<WalletControlProps> = (props) => {
    const [settings, setSettings] = useState(props.appSettings);
    const [isSaving, setIsSaving] = useState(false);
    const toastContext = useContext(ToastContext);

    useEffect(() => {
        setSettings(props.appSettings);
    }, [props.appSettings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(p => ({...p, [name]: (e.target as HTMLInputElement).type === 'number' ? parseFloat(value) || 0 : value}));
    };
    
    const handleToggle = (name: keyof types.AppSettings, value: boolean) => {
        setSettings(p => ({...p, [name]: value}));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const dataToSave = {
                showDepositButton: settings.showDepositButton,
                showWithdrawButton: settings.showWithdrawButton,
                showShareButton: settings.showShareButton,
                showConvertButton: settings.showConvertButton,
                shareLimit: Number(settings.shareLimit) || 0,
            };
            await updateDoc(doc(db, 'settings', 'app'), dataToSave);
            props.setAppSettings(prev => ({ ...prev, ...dataToSave }));
            toastContext?.showToast("Wallet settings saved successfully!", "success");
        } catch (error) {
            console.error(error);
            toastContext?.showToast("Failed to save wallet settings.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AdminSection icon="wallet" title="Wallet Control" subtitle="Enable or disable wallet features for all users.">
             <div className="space-y-6 relative">
                 {isSaving && (
                    <div className="absolute inset-0 bg-dark-card/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl animate-fade-in">
                        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 font-bold text-white text-lg">Saving Settings...</p>
                    </div>
                )}
                
                <div className="bg-dark-bg p-6 rounded-2xl border border-white/10">
                    <h3 className="text-base font-bold text-white mb-4">Quick Action Buttons</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ToggleSwitch label="Show Deposit Button" checked={settings.showDepositButton} onChange={(v) => handleToggle('showDepositButton', v)} />
                        <ToggleSwitch label="Show Withdraw Button" checked={settings.showWithdrawButton} onChange={(v) => handleToggle('showWithdrawButton', v)} />
                        <ToggleSwitch label="Show Share Button" checked={settings.showShareButton} onChange={(v) => handleToggle('showShareButton', v)} />
                        <ToggleSwitch label="Show Convert Button" checked={settings.showConvertButton} onChange={(v) => handleToggle('showConvertButton', v)} />
                    </div>
                </div>

                 <div className="bg-dark-bg p-6 rounded-2xl border border-white/10">
                    <h3 className="text-base font-bold text-white mb-4">Share Settings</h3>
                    <InputGroup
                        label="Share Limit"
                        name="shareLimit"
                        icon="share-2"
                        type="number"
                        value={settings.shareLimit}
                        onChange={handleChange}
                    />
                 </div>

                <div className="flex justify-end pt-4 border-t border-white/5">
                    <button onClick={handleSave} disabled={isSaving} className="bg-brand-primary text-black font-extrabold px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-brand-primary/30 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                        {isSaving ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <Icon name="save" size={18} />}
                        {isSaving ? 'SAVING...' : 'SAVE WALLET SETTINGS'}
                    </button>
                </div>
             </div>
        </AdminSection>
    );
};

export default AdminWalletControlScreen;
