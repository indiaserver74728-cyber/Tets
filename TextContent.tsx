import React, { useState, useEffect, useContext } from 'react';
import Icon from '../../components/Icon';
import * as types from '../../types';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import AdminSection from '../../components/admin/AdminSection';
import { ToastContext } from '../../contexts';

interface TextContentProps {
    appSettings: types.AppSettings;
    setAppSettings: React.Dispatch<React.SetStateAction<types.AppSettings>>;
}

const AdminTextContentScreen: React.FC<TextContentProps> = ({ appSettings, setAppSettings }) => {
    const [lines, setLines] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const toastContext = useContext(ToastContext);

    useEffect(() => {
        setLines(appSettings.welcomeBannerLines || []);
    }, [appSettings]);

    const handleLineChange = (index: number, value: string) => {
        const newLines = [...lines];
        newLines[index] = value;
        setLines(newLines);
    };
    
    const handleAddLine = () => {
        setLines([...lines, '']);
    };
    
    const handleDeleteLine = (index: number) => {
        if (lines.length <= 1) {
            toastContext?.showToast("Cannot delete the last line.", "error");
            return;
        }
        const newLines = lines.filter((_, i) => i !== index);
        setLines(newLines);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateDoc(doc(db, 'settings', 'app'), { welcomeBannerLines: lines });
            setAppSettings(prev => ({ ...prev, welcomeBannerLines: lines }));
            toastContext?.showToast("Text content updated successfully!", "success");
        } catch (error) {
            console.error(error);
            toastContext?.showToast("Failed to save text content.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AdminSection icon="file-text" title="Text Content" subtitle="Manage dynamic text content across the app.">
            <div className="space-y-8">
                <section>
                    <div className="mb-6 border-b border-white/5 pb-2">
                        <h3 className="text-lg font-bold text-white uppercase tracking-wide">Home Screen Welcome Banner</h3>
                        <p className="text-xs text-gray-500 mt-1">Edit the text that appears at the top of the home screen. The first line is the title.</p>
                    </div>
                    <div className="bg-dark-bg border border-white/5 rounded-2xl p-6 shadow-lg">
                        <div className="space-y-4">
                            {lines.map((line, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-gray-500 w-16 text-right">
                                        {index === 0 ? 'Title' : `Line ${index}`}
                                    </span>
                                    <input
                                        type="text"
                                        value={line}
                                        onChange={(e) => handleLineChange(index, e.target.value)}
                                        className="flex-1 w-full bg-dark-card border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all outline-none"
                                        placeholder={index === 0 ? 'Enter title...' : 'Enter line text...'}
                                    />
                                    <button 
                                        onClick={() => handleDeleteLine(index)}
                                        disabled={lines.length <= 1}
                                        className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={lines.length <= 1 ? "Cannot delete the last line" : "Delete line"}
                                    >
                                        <Icon name="trash-2" size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button 
                            onClick={handleAddLine}
                            className="mt-4 w-full bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-bold py-3 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center gap-2 transition-colors"
                        >
                            <Icon name="plus" size={16} />
                            Add New Line
                        </button>
                    </div>
                </section>

                <div className="flex justify-end pt-4 border-t border-white/5">
                    <button onClick={handleSave} disabled={isSaving} className="bg-brand-primary text-black font-extrabold px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-brand-primary/30 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                        {isSaving ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <Icon name="save" size={18} />}
                        {isSaving ? 'SAVING...' : 'SAVE TEXT CONTENT'}
                    </button>
                </div>
            </div>
        </AdminSection>
    );
};

export default AdminTextContentScreen;
