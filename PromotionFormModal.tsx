import React, { useState, useEffect, useRef, useContext } from 'react';
import { Promotion } from '../../types';
import Icon from '../Icon';
import { ToastContext } from '../../contexts';
import { compressImage } from '../../utils';
import { uploadMediaAsset } from '../../image-hosting';

interface PromotionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (promoData: Partial<Promotion>) => Promise<void>;
    promotion: Promotion | null;
}

const ImageUploader: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toastContext = useContext(ToastContext);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsUploading(true);
            try {
                const base64Data = await compressImage(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.8 });
                const downloadURL = await uploadMediaAsset(base64Data);
                onChange(downloadURL);
                toastContext?.showToast('Media uploaded!', 'success');
            } catch (error: any) {
                console.error("Upload failed:", error);
                toastContext?.showToast(error.message || 'Upload failed. Please try again.', 'error');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const isVideo = (url: string) => {
        if (!url) return false;
        if (url.startsWith('data:video/')) return true;
        const videoExtensions = ['.mp4', '.webm', '.mov'];
        try {
            const path = new URL(url).pathname;
            return videoExtensions.some(ext => path.toLowerCase().endsWith(ext));
        } catch (e) {
            return videoExtensions.some(ext => url.toLowerCase().includes(ext));
        }
    };

    return (
        <div>
            <div 
                onClick={!isUploading ? () => fileInputRef.current?.click() : undefined}
                className={`w-full aspect-video bg-dark-bg rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center relative overflow-hidden ${isUploading ? 'cursor-wait' : 'cursor-pointer hover:border-brand-primary group'}`}
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
                        <Icon name="upload-cloud" size={24} />
                        <p className="text-xs mt-1">Upload Media</p>
                    </div>
                )}
            </div>
             <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full mt-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
                <Icon name="upload-cloud" size={14}/> Upload File
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*,image/gif" />
        </div>
    );
};


const PromotionFormModal: React.FC<PromotionFormModalProps> = ({ isOpen, onClose, onSave, promotion }) => {
    const [formData, setFormData] = useState({ title: '', imageUrl: '', linkUrl: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: promotion?.title || '',
                imageUrl: promotion?.imageUrl || '',
                linkUrl: promotion?.linkUrl || '',
            });
        }
    }, [isOpen, promotion]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-dark-card border border-white/10 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-white/10">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Icon name={promotion ? 'edit-3' : 'plus-circle'} size={20} className="text-brand-primary"/>
                        {promotion ? 'Edit Promotion' : 'Add Promotion'}
                    </h3>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"><Icon name="x"/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <ImageUploader value={formData.imageUrl} onChange={(val) => setFormData(p => ({...p, imageUrl: val}))} />
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Title</label>
                        <input type="text" value={formData.title} onChange={e => setFormData(p => ({...p, title: e.target.value}))} className="w-full bg-dark-bg border border-gray-700 rounded-lg p-3 text-white focus:border-brand-primary outline-none" placeholder="Optional title"/>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Link URL</label>
                        <input type="url" value={formData.linkUrl} onChange={e => setFormData(p => ({...p, linkUrl: e.target.value}))} className="w-full bg-dark-bg border border-gray-700 rounded-lg p-3 text-white focus:border-brand-primary outline-none" placeholder="Optional link (e.g., https://...)"/>
                    </div>
                </form>
                <div className="p-5 border-t border-white/10 bg-dark-bg flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-300 bg-white/5 rounded-lg hover:bg-white/10">Cancel</button>
                    <button onClick={handleSubmit} disabled={isSaving} className="px-5 py-2.5 text-sm font-bold text-black bg-brand-primary rounded-lg flex items-center gap-2 hover:opacity-90">
                        <Icon name="save" size={18}/> {isSaving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PromotionFormModal;