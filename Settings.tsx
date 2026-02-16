import React, { useState, useEffect, useRef, useContext } from 'react';
import Icon from '../../components/Icon';
import * as types from '../../types';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ToastContext, ThemeContext } from '../../contexts';
import { compressImage } from '../../utils';
import { uploadMediaAsset } from '../../image-hosting';
import MediaDisplay from '../../components/MediaDisplay';

interface SettingsProps {
    appSettings: types.AppSettings;
    setAppSettings: React.Dispatch<React.SetStateAction<types.AppSettings>>;
}

/* --- Reusable UI Components --- */
const SectionTitle: React.FC<{ title: string; description?: string }> = ({ title, description }) => (
    <div className="mb-6 border-b border-white/5 pb-2">
        <h3 className="text-lg font-bold text-white uppercase tracking-wide">{title}</h3>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
);

const InputGroup: React.FC<{ 
    label: string; 
    icon?: string; 
    value: string | number; 
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; 
    type?: string; 
    multiline?: boolean;
    name: string;
    placeholder?: string;
}> = ({ label, icon, value, onChange, type = "text", multiline = false, name, placeholder }) => (
    <div className="mb-5">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            {icon && <Icon name={icon} size={12} className="text-brand-primary/70" />}
            {label}
        </label>
        <div className="relative group">
            {multiline ? (
                <textarea
                    name={name}
                    value={value}
                    onChange={onChange}
                    rows={4}
                    placeholder={placeholder}
                    className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all outline-none resize-y"
                />
            ) : (
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all outline-none"
                />
            )}
        </div>
    </div>
);

const ToggleSwitch: React.FC<{ label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between bg-dark-bg border border-white/5 p-4 rounded-xl mb-4 hover:border-white/10 transition-colors">
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

const ColorInputGroup: React.FC<{ 
    label: string; 
    value: string; 
    onChange: (val: string) => void; 
}> = ({ label, value, onChange }) => {
    const [hexValue, setHexValue] = useState(value.startsWith('#') ? value.substring(1).toUpperCase() : value.toUpperCase());
    
    // Sync local state when the main value prop changes (e.g., from color picker)
    useEffect(() => {
        setHexValue(value.startsWith('#') ? value.substring(1).toUpperCase() : value.toUpperCase());
    }, [value]);

    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const sanitized = e.target.value.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
        setHexValue(sanitized);
        
        // Only update parent if it's a valid 3 or 6 digit hex
        if (sanitized.length === 3 || sanitized.length === 6) {
            onChange('#' + sanitized);
        }
    };

    return (
        <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
            <div className="flex items-center gap-2 bg-dark-bg p-2 rounded-xl border border-white/10">
                <input 
                    type="color" 
                    value={value} // This always gets the valid color from parent
                    onChange={(e) => onChange(e.target.value)}
                    className="w-10 h-10 rounded-lg border-none cursor-pointer bg-transparent"
                    style={{ WebkitAppearance: 'none', appearance: 'none', padding: 0 }}
                    title="Select color with picker"
                />
                <div className="flex-1 flex items-center bg-dark-card p-2 rounded-lg border border-white/5 h-10">
                    <span className="font-mono text-gray-500 text-sm px-1">#</span>
                    <input 
                        type="text" 
                        value={hexValue}
                        onChange={handleHexChange}
                        maxLength={6}
                        className="w-full bg-transparent font-mono text-white text-sm focus:outline-none tracking-widest"
                        placeholder="F000B8"
                        title="Enter hex code"
                    />
                </div>
            </div>
        </div>
    );
};


/* --- Main Screen Component --- */
const AdminSettingsScreen: React.FC<SettingsProps> = (props) => {
    const [isSaving, setIsSaving] = useState(false);
    const toastContext = useContext(ToastContext);
    const themeContext = useContext(ThemeContext);
    const maintenanceFileInputRef = useRef<HTMLInputElement>(null);
    const whatsappButtonFileInputRef = useRef<HTMLInputElement>(null);
    const noInternetFileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isUploadingNoInternet, setIsUploadingNoInternet] = useState(false);

    const [app, setApp] = useState(props.appSettings);
    
    useEffect(() => {
        setApp(props.appSettings);
    }, [props.appSettings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setApp(p => ({...p, [name]: type === 'number' ? parseFloat(value) || 0 : value}));
    };

    const handleMaintenanceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsUploading(true);
            try {
                const base64Data = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.8 });
                const downloadURL = await uploadMediaAsset(base64Data);
                setApp(prev => ({ ...prev, maintenanceImageUrl: downloadURL }));
                toastContext?.showToast('Image uploaded!', 'success');
            } catch (error: any) {
                console.error("Upload failed:", error);
                toastContext?.showToast(error.message || 'Upload failed. Please try again.', 'error');
            } finally {
                setIsUploading(false);
            }
        }
    };
    
    const handleWhatsAppButtonFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsUploading(true);
            try {
                const base64Data = await compressImage(file, { maxWidth: 128, maxHeight: 128, quality: 0.9 });
                const downloadURL = await uploadMediaAsset(base64Data);
                setApp(prev => ({ ...prev, whatsAppButtonImageUrl: downloadURL }));
                toastContext?.showToast('Button image uploaded!', 'success');
            } catch (error: any) {
                console.error("Upload failed:", error);
                toastContext?.showToast(error.message || 'Upload failed. Please try again.', 'error');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleNoInternetFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsUploadingNoInternet(true);
            try {
                const base64Data = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.8 });
                const downloadURL = await uploadMediaAsset(base64Data);
                setApp(prev => ({ ...prev, noInternetImageUrl: downloadURL }));
                toastContext?.showToast('Offline image uploaded!', 'success');
            } catch (error: any) {
                console.error("Upload failed:", error);
                toastContext?.showToast(error.message || 'Upload failed. Please try again.', 'error');
            } finally {
                setIsUploadingNoInternet(false);
            }
        }
    };


    const handleSave = async () => {
        setIsSaving(true);
        try {
             const settingsToSave = {
                appName: app.appName,
                maintenanceMode: app.maintenanceMode,
                maintenanceMessage: app.maintenanceMessage,
                globalAnnouncement: app.globalAnnouncement,
                showGlobalAnnouncement: app.showGlobalAnnouncement,
                maintenanceImageUrl: app.maintenanceImageUrl,
                maintenanceImageWidth: Number(app.maintenanceImageWidth) || 160,
                maintenanceImageHeight: Number(app.maintenanceImageHeight) || 160,
                brandPrimaryColor: app.brandPrimaryColor,
                brandPinkColor: app.brandPinkColor,
                oneAccountPerDevice: app.oneAccountPerDevice,
                showJoinedMatches: app.showJoinedMatches,
                showWhatsAppButton: app.showWhatsAppButton,
                whatsAppButtonImageUrl: app.whatsAppButtonImageUrl || '',
                noInternetTitle: app.noInternetTitle,
                noInternetMessage: app.noInternetMessage,
                noInternetImageUrl: app.noInternetImageUrl,
                noInternetImageWidth: Number(app.noInternetImageWidth) || 180,
                noInternetImageHeight: Number(app.noInternetImageHeight) || 180,
                noInternetIcon: app.noInternetIcon,
            };

            await updateDoc(doc(db, 'settings', 'app'), settingsToSave);
            
            props.setAppSettings(prev => ({...prev, ...settingsToSave}));

            toastContext?.showToast('General settings saved successfully!', "success");
        } catch (e) {
            console.error("Save Error:", e);
            toastContext?.showToast('Error saving settings.', "error");
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleClearAnnouncement = () => {
        setApp(p => ({...p, globalAnnouncement: ''}));
    };

    return (
      <div className="flex flex-col h-full bg-dark-bg relative">
        <div className="p-4 bg-dark-card border-b border-white/10">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Icon name="settings" className="text-brand-primary"/>General Settings</h2>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-24">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="animate-fade-in space-y-8">

                    <SectionTitle title="Appearance" description="Control the look and feel of the application." />
                    <div className="bg-dark-card border border-white/5 rounded-2xl p-6 shadow-lg">
                        <InputGroup name="appName" label="App Name" value={app.appName} onChange={handleChange} icon="type" />
                        <div className="mt-4">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <Icon name="sun" size={12} className="text-brand-primary/70" />
                                App Theme
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => themeContext?.setTheme('dark')}
                                    className={`flex-1 p-3 rounded-lg border-2 font-bold text-sm ${themeContext?.theme === 'dark' ? 'bg-brand-primary/10 border-brand-primary text-white' : 'bg-dark-bg border-gray-700 text-gray-400'}`}
                                >
                                    Dark Mode
                                </button>
                                <button
                                    onClick={() => themeContext?.setTheme('light')}
                                    className={`flex-1 p-3 rounded-lg border-2 font-bold text-sm ${themeContext?.theme === 'light' ? 'bg-white/90 border-gray-400 text-black' : 'bg-dark-bg border-gray-700 text-gray-400'}`}
                                >
                                    Light Mode
                                </button>
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-white/10">
                            <h4 className="text-sm font-bold text-white mb-4">Theme Colors</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ColorInputGroup 
                                    label="Primary Accent" 
                                    value={app.brandPrimaryColor || '#00F2FF'} 
                                    onChange={(val) => setApp(p => ({...p, brandPrimaryColor: val}))} 
                                />
                                <ColorInputGroup 
                                    label="Secondary Accent" 
                                    value={app.brandPinkColor || '#F000B8'} 
                                    onChange={(val) => setApp(p => ({...p, brandPinkColor: val}))} 
                                />
                            </div>
                        </div>
                    </div>

                    <SectionTitle title="System Status" description="Control app availability and announcements." />
                    <div className={`bg-dark-card p-6 rounded-2xl border ${app.maintenanceMode ? 'border-yellow-500/30' : 'border-white/10'} shadow-lg`}>
                        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                            <Icon name="shield-alert" size={16} className={app.maintenanceMode ? 'text-yellow-500' : 'text-gray-500'} />
                            Maintenance Mode
                        </h3>
                        <ToggleSwitch 
                            label="Enable Maintenance Mode" 
                            description="Restricts app for users (admins can still log in)." 
                            checked={app.maintenanceMode} 
                            onChange={(v) => setApp(p => ({...p, maintenanceMode: v}))} 
                        />
                        {app.maintenanceMode && (
                            <div className="mt-4 animate-fade-in space-y-4">
                                <InputGroup 
                                    name="maintenanceMessage" 
                                    label="Maintenance Message" 
                                    value={app.maintenanceMessage} 
                                    onChange={handleChange} 
                                    multiline 
                                />
                                 <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Icon name="image" size={12}/> Maintenance Image/GIF</label>
                                    <div onClick={!isUploading ? () => maintenanceFileInputRef.current?.click() : undefined} className="w-full aspect-video bg-dark-bg rounded-xl border-2 border-dashed border-gray-700 flex items-center justify-center relative group cursor-pointer">
                                        {isUploading ? <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div> : <MediaDisplay src={app.maintenanceImageUrl} alt="Maintenance Preview" className="w-full h-full object-contain" />}
                                    </div>
                                    <input type="file" ref={maintenanceFileInputRef} onChange={handleMaintenanceFileChange} className="hidden" accept="image/*,image/gif,video/*" />
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <input type="number" name="maintenanceImageWidth" value={app.maintenanceImageWidth || ''} onChange={handleChange} placeholder="Width (px)" className="w-full bg-dark-bg border border-white/10 p-2 text-xs rounded-lg text-gray-400" />
                                        <input type="number" name="maintenanceImageHeight" value={app.maintenanceImageHeight || ''} onChange={handleChange} placeholder="Height (px)" className="w-full bg-dark-bg border border-white/10 p-2 text-xs rounded-lg text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-dark-card border border-white/5 rounded-2xl p-6 shadow-lg">
                        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                            <Icon name="megaphone" size={16} className="text-gray-500" />
                            Global Announcement
                        </h3>
                        <ToggleSwitch label="Show Global Announcement" description="Display a banner at the top of the app." checked={app.showGlobalAnnouncement} onChange={(v) => setApp(p => ({...p, showGlobalAnnouncement: v}))} />
                        <div className="relative mt-4">
                            <InputGroup name="globalAnnouncement" label="Announcement Text" value={app.globalAnnouncement} onChange={handleChange} multiline />
                            {app.globalAnnouncement && (
                                <button
                                    onClick={handleClearAnnouncement}
                                    title="Clear announcement text"
                                    className="absolute top-0 right-0 p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-full transition-colors"
                                >
                                    <Icon name="trash-2" size={12} />
                                </button>
                            )}
                        </div>
                    </div>

                    <SectionTitle title="Offline Screen" description="Customize the screen shown when the user has no internet connection." />
                    <div className="bg-dark-card border border-white/5 rounded-2xl p-6 shadow-lg">
                        <InputGroup 
                            name="noInternetTitle" 
                            label="Title" 
                            value={app.noInternetTitle} 
                            onChange={handleChange} 
                            icon="type"
                        />
                        <InputGroup 
                            name="noInternetMessage" 
                            label="Message" 
                            value={app.noInternetMessage} 
                            onChange={handleChange} 
                            multiline 
                            icon="file-text"
                        />
                        <div className="mb-5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Icon name="image" size={12}/> Offline Image/GIF</label>
                            <div onClick={!isUploadingNoInternet ? () => noInternetFileInputRef.current?.click() : undefined} className="w-full aspect-video bg-dark-bg rounded-xl border-2 border-dashed border-gray-700 flex items-center justify-center relative group cursor-pointer">
                                {isUploadingNoInternet ? <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div> : <MediaDisplay src={app.noInternetImageUrl} alt="Offline Preview" className="w-full h-full object-contain" />}
                            </div>
                            <input type="file" ref={noInternetFileInputRef} onChange={handleNoInternetFileChange} className="hidden" accept="image/*,image/gif,video/*" />
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <input type="number" name="noInternetImageWidth" value={app.noInternetImageWidth || ''} onChange={handleChange} placeholder="Width (px)" className="w-full bg-dark-bg border border-white/10 p-2 text-xs rounded-lg text-gray-400" />
                                <input type="number" name="noInternetImageHeight" value={app.noInternetImageHeight || ''} onChange={handleChange} placeholder="Height (px)" className="w-full bg-dark-bg border border-white/10 p-2 text-xs rounded-lg text-gray-400" />
                            </div>
                        </div>
                        <InputGroup 
                            name="noInternetIcon" 
                            label="Fallback Icon Name" 
                            value={app.noInternetIcon} 
                            onChange={handleChange} 
                            icon="wifi-off"
                        />
                    </div>

                    <SectionTitle title="Home Screen" description="Control visibility of sections on the home screen." />
                    <div className="bg-dark-card p-6 rounded-2xl border border-white/10 shadow-lg">
                        <ToggleSwitch 
                            label="Show 'My Joined Matches' Section" 
                            description="Toggles the visibility of the joined matches list on the home screen." 
                            checked={app.showJoinedMatches} 
                            onChange={(v) => setApp(p => ({...p, showJoinedMatches: v}))} 
                        />
                    </div>
                    
                    <SectionTitle title="Support Features" description="Manage floating support buttons." />
                    <div className="bg-dark-card p-6 rounded-2xl border border-white/10 shadow-lg">
                        <ToggleSwitch 
                            label="Show Floating WhatsApp Button" 
                            description="Displays a quick-contact button for users." 
                            checked={app.showWhatsAppButton} 
                            onChange={(v) => setApp(p => ({...p, showWhatsAppButton: v}))} 
                        />
                         {app.showWhatsAppButton && (
                            <div className="mt-4 animate-fade-in space-y-4 pt-4 border-t border-white/10">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Icon name="image" size={12}/> Custom Button Image (Optional)</label>
                                <div onClick={!isUploading ? () => whatsappButtonFileInputRef.current?.click() : undefined} className="w-24 h-24 bg-dark-bg rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center relative group cursor-pointer mx-auto">
                                    {isUploading ? <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div> : 
                                        app.whatsAppButtonImageUrl ? <MediaDisplay src={app.whatsAppButtonImageUrl} alt="Button Preview" className="w-full h-full object-cover rounded-full" /> : 
                                        <Icon name="upload-cloud" size={32} className="text-gray-500"/>
                                    }
                                </div>
                                <input type="file" ref={whatsappButtonFileInputRef} onChange={handleWhatsAppButtonFileChange} className="hidden" accept="image/*,image/gif" />
                                <InputGroup 
                                    name="whatsAppButtonImageUrl" 
                                    label="Image URL" 
                                    value={app.whatsAppButtonImageUrl || ''} 
                                    onChange={handleChange} 
                                />
                            </div>
                        )}
                    </div>

                    <SectionTitle title="Security" description="Manage app security and access rules." />
                    <div className="bg-dark-card p-6 rounded-2xl border border-white/10 shadow-lg">
                        <ToggleSwitch 
                            label="1 Account Per Device" 
                            description="Restricts users to creating only one account per device." 
                            checked={app.oneAccountPerDevice} 
                            onChange={(v) => setApp(p => ({...p, oneAccountPerDevice: v}))} 
                        />
                    </div>
                </div>
            </div>
        </div>
        <div className="p-4 bg-dark-card border-t border-white/10 z-30 flex justify-end">
            <button onClick={handleSave} disabled={isSaving || isUploading || isUploadingNoInternet} className="bg-brand-primary text-black font-extrabold px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-brand-primary/30 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                {isSaving ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <Icon name="save" size={18} />} 
                {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
        </div>
      </div>
    );
};

export default AdminSettingsScreen;