import React, { useState, useEffect, useRef, useContext } from 'react';
import Icon from '../../components/Icon';
import * as types from '../../types';
import { db } from '../../firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import AdminSection from '../../components/admin/AdminSection';
import { ToastContext } from '../../contexts';
import { compressImage } from '../../utils';
import { uploadMediaAsset } from '../../image-hosting';

interface ImageSettingsProps {
    appSettings: types.AppSettings;
    setAppSettings: React.Dispatch<React.SetStateAction<types.AppSettings>>;
    referralSettings: types.ReferralSettings;
    setReferralSettings: React.Dispatch<React.SetStateAction<types.ReferralSettings>>;
}

const MediaUploader: React.FC<{ 
    label: string; 
    value: string; 
    onChange: (val: string) => void; 
    helper?: string;
    aspectRatio?: 'square' | 'video' | '4/3';
    width?: number;
    onWidthChange?: (val: string) => void;
    height?: number;
    onHeightChange?: (val: string) => void;
}> = ({ label, value, onChange, helper, aspectRatio = 'square', width, onWidthChange, height, onHeightChange }) => {
    const fileRef = useRef<HTMLInputElement>(null);
    const toastContext = useContext(ToastContext);
    const [isUploading, setIsUploading] = useState(false);

    const isVideo = (url: string) => {
        if (!url) return false;
        if (url.startsWith('data:video/')) return true;
        return ['.mp4', '.webm', '.mov'].some(ext => url.toLowerCase().includes(ext));
    };

    const aspectClass = {
        'square': 'aspect-square',
        'video': 'aspect-video',
        '4/3': 'aspect-[4/3]',
    }[aspectRatio];

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit for external service
            if (file.size > MAX_SIZE_BYTES) {
                toastContext?.showToast(`File size cannot exceed 10 MB.`, 'error');
                return;
            }
            
            setIsUploading(true);
            try {
                // `compressImage` converts all media types to base64, which is required by our new service
                const base64Data = await compressImage(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.8 });
                const imageUrl = await uploadMediaAsset(base64Data);
                onChange(imageUrl); // This sets the hosted URL, not the base64 data
                toastContext?.showToast('Media uploaded!', 'success');
            } catch (error: any) {
                console.error("Failed to upload file:", error);
                toastContext?.showToast(error.message || 'Upload failed. Please try again.', 'error');
            } finally {
                setIsUploading(false);
            }
        }
    };
    return (
        <div className="mb-5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">{label}</label>
            <div 
                onClick={!isUploading ? () => fileRef.current?.click() : undefined}
                className={`relative w-full ${aspectClass} bg-dark-bg border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center overflow-hidden ${isUploading ? 'cursor-wait' : 'cursor-pointer hover:border-brand-primary/50 group'}`}
            >
                 {isUploading ? (
                     <div className="flex flex-col items-center justify-center text-white">
                        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <p className="text-xs mt-2 font-bold">Uploading...</p>
                    </div>
                ) : value ? (
                    isVideo(value) ? (
                        <video src={value} className="w-full h-full object-contain" autoPlay loop muted playsInline />
                    ) : (
                        <img src={value} alt="Preview" className="w-full h-full object-contain" />
                    )
                ) : (
                    <div className="text-center text-gray-500">
                        <Icon name="image" size={32}/>
                        <p className="mt-2 text-xs">No media selected</p>
                    </div>
                )}
            </div>
            <input type="file" ref={fileRef} onChange={handleFile} className="hidden" accept="image/*,video/*,image/gif" />
            <div className="mt-2 grid grid-cols-2 gap-2">
                 <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder="Or paste media URL..." className="col-span-1 w-full bg-dark-bg border border-white/10 p-2 text-xs rounded-lg text-gray-400 focus:border-brand-primary outline-none" />
                 <button 
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={isUploading}
                    className="col-span-1 bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Icon name="upload-cloud" size={14}/> Upload File
                </button>
            </div>

            {onWidthChange && onHeightChange && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Width (px)</label>
                        <input type="number" value={width || ''} onChange={e => onWidthChange(e.target.value)} placeholder="Auto" className="w-full bg-dark-bg border border-white/10 p-2 text-xs rounded-lg text-gray-400 focus:border-brand-primary outline-none" />
                    </div>
                        <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Height (px)</label>
                        <input type="number" value={height || ''} onChange={e => onHeightChange(e.target.value)} placeholder="Auto" className="w-full bg-dark-bg border border-white/10 p-2 text-xs rounded-lg text-gray-400 focus:border-brand-primary outline-none" />
                    </div>
                </div>
            )}
            
            {helper && <p className="text-[10px] text-gray-600 mt-1.5 ml-1">{helper}</p>}
        </div>
    );
};

const Section: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
    <section>
        <div className="mb-6 border-b border-white/5 pb-2">
            <h3 className="text-lg font-bold text-white uppercase tracking-wide">{title}</h3>
        </div>
        <div className="bg-dark-bg border border-white/5 rounded-2xl p-6 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {children}
            </div>
        </div>
    </section>
);


const AdminImageSettingsScreen: React.FC<ImageSettingsProps> = (props) => {
    const [appSettings, setAppSettings] = useState(props.appSettings);
    const [referralSettings, setReferralSettings] = useState(props.referralSettings);
    const [isSaving, setIsSaving] = useState(false);
    const toastContext = useContext(ToastContext);

    useEffect(() => {
        setAppSettings(props.appSettings);
    }, [props.appSettings]);

     useEffect(() => {
        setReferralSettings(props.referralSettings);
    }, [props.referralSettings]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // 1. Prepare data for 'settings/app' document
            const appSettingsUpdates = {
                appLogoUrl: appSettings.appLogoUrl,
                defaultAvatarUrl: appSettings.defaultAvatarUrl,
                upcomingFallbackUrl: appSettings.upcomingFallbackUrl,
                ongoingFallbackUrl: appSettings.ongoingFallbackUrl,
                resultsFallbackUrl: appSettings.resultsFallbackUrl,
                noTransactionsImageUrl: appSettings.noTransactionsImageUrl,
                noReferralsImageUrl: appSettings.noReferralsImageUrl,
                
                // Include dimensions
                upcomingFallbackWidth: Number(appSettings.upcomingFallbackWidth) || 160,
                upcomingFallbackHeight: Number(appSettings.upcomingFallbackHeight) || 160,
                ongoingFallbackWidth: Number(appSettings.ongoingFallbackWidth) || 160,
                ongoingFallbackHeight: Number(appSettings.ongoingFallbackHeight) || 160,
                resultsFallbackWidth: Number(appSettings.resultsFallbackWidth) || 160,
                resultsFallbackHeight: Number(appSettings.resultsFallbackHeight) || 160,
                noTransactionsImageWidth: Number(appSettings.noTransactionsImageWidth) || 160,
                noTransactionsImageHeight: Number(appSettings.noTransactionsImageHeight) || 120,
                noReferralsImageWidth: Number(appSettings.noReferralsImageWidth) || 160,
                noReferralsImageHeight: Number(appSettings.noReferralsImageHeight) || 160,
            };

            const appSettingsPromise = updateDoc(doc(db, 'settings', 'app'), appSettingsUpdates);

            // 2. Prepare data for 'settings/referral' document
            const referralSettingsUpdates = {
                imageUrl: referralSettings.imageUrl,
            };
            
            const referralSettingsPromise = updateDoc(doc(db, 'settings', 'referral'), referralSettingsUpdates);

            await Promise.all([appSettingsPromise, referralSettingsPromise]);
            
            toastContext?.showToast("Image settings saved!", "success");
        } catch (error) {
            console.error(error);
            toastContext?.showToast("Failed to save image settings.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AdminSection icon="image" title="Image Settings" subtitle="Manage logos, banners, and fallback images for the app.">
             <div className="space-y-12 relative">
                {isSaving && (
                    <div className="absolute inset-0 bg-dark-card/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl animate-fade-in">
                        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 font-bold text-white text-lg">Saving Images...</p>
                    </div>
                )}
                
                <Section title="Branding & Banners">
                    <MediaUploader label="App Logo" aspectRatio="square" value={appSettings.appLogoUrl} onChange={(v) => setAppSettings(p => ({...p, appLogoUrl: v}))} />
                    <MediaUploader label="Referral Page Image" aspectRatio="video" value={referralSettings.imageUrl} onChange={(v) => setReferralSettings(p => ({...p, imageUrl: v}))} />
                </Section>
                
                <Section title="Default Images">
                    <MediaUploader label="Default User Avatar" aspectRatio="square" value={appSettings.defaultAvatarUrl} onChange={(v) => setAppSettings(p => ({...p, defaultAvatarUrl: v}))} helper="Avatar for newly registered users."/>
                    <div/>
                </Section>

                <Section title="Match Fallbacks">
                    <MediaUploader label="Upcoming Fallback" aspectRatio="square" value={appSettings.upcomingFallbackUrl} onChange={(v) => setAppSettings(p => ({...p, upcomingFallbackUrl: v}))} width={appSettings.upcomingFallbackWidth} onWidthChange={(v) => setAppSettings(p => ({...p, upcomingFallbackWidth: Number(v)}))} height={appSettings.upcomingFallbackHeight} onHeightChange={(v) => setAppSettings(p => ({...p, upcomingFallbackHeight: Number(v)}))} helper="Shows when the 'Upcoming' match list is empty."/>
                    <MediaUploader label="Ongoing Fallback" aspectRatio="square" value={appSettings.ongoingFallbackUrl} onChange={(v) => setAppSettings(p => ({...p, ongoingFallbackUrl: v}))} width={appSettings.ongoingFallbackWidth} onWidthChange={(v) => setAppSettings(p => ({...p, ongoingFallbackWidth: Number(v)}))} height={appSettings.ongoingFallbackHeight} onHeightChange={(v) => setAppSettings(p => ({...p, ongoingFallbackHeight: Number(v)}))} helper="Shows when the 'Ongoing' match list is empty."/>
                    <MediaUploader label="Results Fallback" aspectRatio="square" value={appSettings.resultsFallbackUrl} onChange={(v) => setAppSettings(p => ({...p, resultsFallbackUrl: v}))} width={appSettings.resultsFallbackWidth} onWidthChange={(v) => setAppSettings(p => ({...p, resultsFallbackWidth: Number(v)}))} height={appSettings.resultsFallbackHeight} onHeightChange={(v) => setAppSettings(p => ({...p, resultsFallbackHeight: Number(v)}))} helper="Shows when the 'Results' match list is empty."/>
                </Section>

                <Section title="Empty State Placeholders">
                    <MediaUploader label="No Transactions Image" aspectRatio="4/3" value={appSettings.noTransactionsImageUrl} onChange={(v) => setAppSettings(p => ({...p, noTransactionsImageUrl: v}))} width={appSettings.noTransactionsImageWidth} onWidthChange={(v) => setAppSettings(p => ({...p, noTransactionsImageWidth: Number(v)}))} height={appSettings.noTransactionsImageHeight} onHeightChange={(v) => setAppSettings(p => ({...p, noTransactionsImageHeight: Number(v)}))} helper="Shows in empty transaction history screens."/>
                    <MediaUploader label="No Referrals Image" aspectRatio="square" value={appSettings.noReferralsImageUrl} onChange={(v) => setAppSettings(p => ({...p, noReferralsImageUrl: v}))} width={appSettings.noReferralsImageWidth} onWidthChange={(v) => setAppSettings(p => ({...p, noReferralsImageWidth: Number(v)}))} height={appSettings.noReferralsImageHeight} onHeightChange={(v) => setAppSettings(p => ({...p, noReferralsImageHeight: Number(v)}))} helper="Shows in the empty referral list modal."/>
                </Section>

                <div className="flex justify-end pt-4 border-t border-white/5">
                    <button onClick={handleSave} disabled={isSaving} className="bg-brand-primary text-black font-extrabold px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-brand-primary/30 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                        {isSaving ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <Icon name="save" size={18} />}
                        {isSaving ? 'SAVING...' : 'SAVE ALL IMAGES'}
                    </button>
                </div>
             </div>
        </AdminSection>
    );
};

export default AdminImageSettingsScreen;