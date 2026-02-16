import React, { useState, useEffect, useRef, useContext } from 'react';
import { PaymentMethod } from '../../types';
import Icon from '../Icon';
import { ToastContext } from '../../contexts';
import { compressImage } from '../../utils';
import { uploadMediaAsset } from '../../image-hosting';

const ImageUploader: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toastContext = useContext(ToastContext);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsUploading(true);
            try {
                const base64Data = await compressImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.9 });
                const downloadURL = await uploadMediaAsset(base64Data);
                onChange(downloadURL);
                toastContext?.showToast('Logo uploaded!', 'success');
            } catch (error: any) {
                console.error("Upload failed:", error);
                toastContext?.showToast(error.message || 'Upload failed. Please try again.', 'error');
            } finally {
                setIsUploading(false);
            }
        }
    };

    return (
        <div>
            <label className="text-xs text-gray-400 mb-1 block">Logo Image</label>
            <div 
                onClick={!isUploading ? () => fileInputRef.current?.click() : undefined}
                className={`w-full aspect-[2/1] bg-dark-bg rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center relative overflow-hidden ${isUploading ? 'cursor-wait' : 'cursor-pointer hover:border-brand-primary group'}`}
            >
                {isUploading ? (
                    <div className="flex flex-col items-center justify-center text-white">
                        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                        <p className="text-xs mt-2 font-bold">Uploading...</p>
                    </div>
                ) : value ? (
                    <>
                        <img src={value} alt="Preview" className="w-full h-full object-contain p-2" />
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-xs font-bold flex items-center gap-2"><Icon name="edit-3" size={12}/> Change Image</span>
                        </div>
                    </>
                ) : (
                    <div className="text-center text-gray-500">
                        <Icon name="upload-cloud" size={24} />
                        <p className="text-xs mt-1">Click to upload</p>
                    </div>
                )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,image/gif" />
            <input 
                type="text" 
                value={value} 
                onChange={e => onChange(e.target.value)}
                placeholder="Or paste image URL"
                disabled={isUploading}
                className="w-full bg-dark-bg border border-gray-700 rounded-lg p-2 text-xs mt-2 text-white"
            />
        </div>
    );
};


interface PaymentMethodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (methodData: Partial<PaymentMethod>) => void;
    method: PaymentMethod | null;
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({ isOpen, onClose, onSave, method }) => {
    const [name, setName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [logoHeight, setLogoHeight] = useState('40');
    const [logoWidth, setLogoWidth] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const toastContext = useContext(ToastContext);

    useEffect(() => {
        if (isOpen) {
            setName(method?.name || '');
            setLogoUrl(method?.logoUrl || '');
            setLogoHeight(String(method?.logoHeight || 40));
            setLogoWidth(String(method?.logoWidth || ''));
        }
    }, [isOpen, method]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !logoUrl) {
            toastContext?.showToast('Name and Logo are required.', 'error');
            return;
        }
        setIsSaving(true);
        onSave({ 
            name, 
            logoUrl, 
            logoHeight: Number(logoHeight) || 40,
            logoWidth: logoWidth ? Number(logoWidth) : null 
        });
        setIsSaving(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-dark-card border border-white/10 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-white/10">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Icon name={method ? 'edit-3' : 'plus-circle'} size={20} className="text-brand-primary"/>
                        {method ? 'Edit Payment Method' : 'Add Payment Method'}
                    </h3>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"><Icon name="x"/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Method Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-dark-bg border border-gray-700 rounded-lg p-3 text-white focus:border-brand-primary outline-none" placeholder="e.g. EasyPaisa"/>
                    </div>
                    
                    <ImageUploader value={logoUrl} onChange={setLogoUrl} />

                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs text-gray-400 mb-1 block">Logo Height (px)</label>
                            <input 
                                type="number" 
                                value={logoHeight} 
                                onChange={e => setLogoHeight(e.target.value)} 
                                required 
                                className="w-full bg-dark-bg border border-gray-700 rounded-lg p-3 text-white focus:border-brand-primary outline-none" 
                                placeholder="e.g. 40"
                            />
                        </div>
                         <div>
                            <label className="text-xs text-gray-400 mb-1 block">Logo Width (px)</label>
                            <input 
                                type="number" 
                                value={logoWidth} 
                                onChange={e => setLogoWidth(e.target.value)}
                                className="w-full bg-dark-bg border border-gray-700 rounded-lg p-3 text-white focus:border-brand-primary outline-none" 
                                placeholder="Auto"
                            />
                        </div>
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

export default PaymentMethodModal;