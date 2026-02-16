import React, { useState, useEffect, useContext } from 'react';
import Icon from '../../components/Icon';
import * as types from '../../types';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import AdminSection from '../../components/admin/AdminSection';
import { ToastContext } from '../../contexts';

interface ProfileLinksProps {
    appSettings: types.AppSettings;
    setAppSettings: React.Dispatch<React.SetStateAction<types.AppSettings>>;
}

const InputGroup: React.FC<{ 
    label: string; 
    icon?: string; 
    value: string | number; 
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; 
    type?: string; 
    multiline?: boolean;
    name: string;
}> = ({ label, icon, value, onChange, type = "text", multiline = false, name }) => (
    <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            {icon && <Icon name={icon} size={12} className="text-brand-primary/70" />}
            {label}
        </label>
        {multiline ? (
            <textarea
                name={name}
                value={value}
                onChange={onChange}
                rows={3}
                className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all outline-none resize-y"
            />
        ) : (
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all outline-none"
            />
        )}
    </div>
);

const Section: React.FC<{title: string, description: string, children: React.ReactNode}> = ({title, description, children}) => (
    <section>
        <div className="mb-6 border-b border-white/5 pb-2">
            <h3 className="text-lg font-bold text-white uppercase tracking-wide">{title}</h3>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
        <div className="bg-dark-card border border-white/5 rounded-2xl p-6 shadow-lg space-y-4">
            {children}
        </div>
    </section>
);


const AdminProfileLinksScreen: React.FC<ProfileLinksProps> = (props) => {
    const [settings, setSettings] = useState(props.appSettings);
    const [isSaving, setIsSaving] = useState(false);
    const toastContext = useContext(ToastContext);

    useEffect(() => {
        setSettings(props.appSettings);
    }, [props.appSettings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({...prev, [name]: value}));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const dataToSave = {
                supportNumber: settings.supportNumber,
                websiteUrl: settings.websiteUrl,
                youtubeUrl: settings.youtubeUrl,
                whatsappChannelUrl: settings.whatsappChannelUrl,
                shareAppUrl: settings.shareAppUrl,
                shareAppText: settings.shareAppText
            };
            await updateDoc(doc(db, 'settings', 'app'), dataToSave);
            props.setAppSettings(prev => ({ ...prev, ...dataToSave }));
            toastContext?.showToast("Links updated successfully!", "success");
        } catch (error) {
            console.error(error);
            toastContext?.showToast("Failed to save links.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AdminSection icon="link" title="Profile & App Links" subtitle="Manage external links for the user profile and share functionality.">
            <div className="space-y-8">
                <Section title="Profile Page Links" description="Manage links that appear in the user's profile menu.">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="Customer Support (WhatsApp)" name="supportNumber" value={settings.supportNumber} onChange={handleChange} icon="message-circle" />
                        <InputGroup label="Website URL" name="websiteUrl" value={settings.websiteUrl} onChange={handleChange} icon="globe" />
                        <InputGroup label="YouTube Channel" name="youtubeUrl" value={settings.youtubeUrl} onChange={handleChange} icon="youtube" />
                        <InputGroup label="WhatsApp Channel" name="whatsappChannelUrl" value={settings.whatsappChannelUrl} onChange={handleChange} icon="users" />
                    </div>
                </Section>
                 <Section title="App Sharing" description="Configure the text and URL for the 'Share App' feature.">
                    <InputGroup label="Share App URL" name="shareAppUrl" value={settings.shareAppUrl} onChange={handleChange} icon="share-2" />
                    <InputGroup label="Default Share Text" name="shareAppText" value={settings.shareAppText} onChange={handleChange} multiline />
                </Section>

                <div className="flex justify-end pt-4 border-t border-white/5">
                    <button onClick={handleSave} disabled={isSaving} className="bg-brand-primary text-black font-extrabold px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-brand-primary/30 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                        {isSaving ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <Icon name="save" size={18} />}
                        {isSaving ? 'SAVING...' : 'SAVE LINKS'}
                    </button>
                </div>
            </div>
        </AdminSection>
    );
};

export default AdminProfileLinksScreen;
