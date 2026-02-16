import React, { useState, useEffect, useRef, useContext } from 'react';
import { InAppAd } from '../../types';
import Icon from '../Icon';
import { ToastContext } from '../../contexts';
import { compressImage } from '../../utils';
import { uploadMediaAsset } from '../../image-hosting';
import MediaDisplay from '../MediaDisplay';

interface AdFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (adData: InAppAd) => void;
    ad: InAppAd | null;
}

const AdFormModal: React.FC<AdFormModalProps> = ({ isOpen, onClose, onSave, ad }) => {
    const [formData, setFormData] = useState<Partial<InAppAd>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toastContext = useContext(ToastContext);

    useEffect(() => {
        if (isOpen) {
            setFormData(ad ? { ...ad } : {
                id: Date.now(),
                imageUrl: '',
                linkUrl: '',
                width: 90,
                height: 450,
                enabled: true,
            });
            if(window.lucide) setTimeout(() => window.lucide.createIcons(), 50);
        }
    }, [isOpen, ad]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({...prev, [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsUploading(true);
            try {
                const base64Data = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.8 });
                const downloadURL = await uploadMediaAsset(base64Data);
                setFormData(prev => ({ ...prev, imageUrl: downloadURL }));
                toastContext?.showToast('Ad image uploaded!', 'success');
            } catch (error: any) {
                console.error("Upload failed:", error);
                toastContext?.showToast(error.message || 'Upload failed. Please try again.', 'error');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.id) {
            toastContext?.showToast('Display Order ID is required and must be a number.', 'error');
            return;
        }
        setIsSaving(true);
        const finalData: InAppAd = formData as InAppAd;
        onSave(finalData);
        setIsSaving(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[40] flex items-center justify-center p-6 animate-fade-in mt-1" onClick={onClose}>
            <div className="bg-dark-card border border-white/10 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-white/10">
                    <h3 className="text-xl font-bold text-white">{ad ? 'Edit Ad' : 'Create New Ad'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-full"><Icon name="x" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
                    <div>
                        <div onClick={!isUploading ? () => fileInputRef.current?.click() : undefined} className="w-full aspect-video bg-dark-bg rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center cursor-pointer">
                            {isUploading ? <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div> : <MediaDisplay src={formData.imageUrl || ''} alt="Ad Preview" className="w-full h-full object-contain p-2"/>}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,image/gif" />
                    </div>
                     <div>
                        <label className="text-xs text-gray-400">Display Order ID</label>
                        <input 
                            type="number" 
                            name="id" 
                            value={formData.id || ''} 
                            onChange={handleChange} 
                            className="w-full bg-dark-bg border border-gray-700 rounded-lg p-2 text-white" 
                            required 
                        />
                        <p className="text-[10px] text-gray-500 mt-1">Lower numbers show first. Must be unique.</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400">Image URL</label>
                        <input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleChange} className="w-full bg-dark-bg border border-gray-700 rounded-lg p-2 text-white" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400">Link URL (Optional)</label>
                        <input type="text" name="linkUrl" value={formData.linkUrl} onChange={handleChange} className="w-full bg-dark-bg border border-gray-700 rounded-lg p-2 text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400">Width (%)</label>
                            <input type="number" name="width" value={formData.width} onChange={handleChange} className="w-full bg-dark-bg border border-gray-700 rounded-lg p-2 text-white" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400">Height (px)</label>
                            <input type="number" name="height" value={formData.height} onChange={handleChange} className="w-full bg-dark-bg border border-gray-700 rounded-lg p-2 text-white" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between bg-dark-bg p-3 rounded-lg">
                        <label className="text-sm font-bold text-white">Enabled</label>
                        <input type="checkbox" name="enabled" checked={formData.enabled} onChange={handleChange} className="w-6 h-6 rounded text-brand-primary bg-gray-700 border-gray-600 focus:ring-brand-primary" />
                    </div>
                </form>
                <div className="p-4 border-t border-white/10 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-300 bg-white/10">Cancel</button>
                    <button onClick={handleSubmit} disabled={isSaving} className="bg-brand-primary text-black font-bold px-4 py-2 rounded-lg">
                        {isSaving ? 'Saving...' : 'Save Ad'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdFormModal;