import React, { useState, useEffect, useRef, useContext } from 'react';
import Icon from '../../components/Icon';
import * as types from '../../types';
import { db } from '../../firebase';
import { doc, updateDoc, deleteDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import AdminSection from '../../components/admin/AdminSection';
import ConfirmModal from '../../components/ConfirmModal';
import PaymentMethodModal from '../../components/admin/PaymentMethodModal';
import { ToastContext } from '../../contexts';

interface WithdrawalSettingsProps {
    appSettings: types.AppSettings;
    paymentMethods: types.PaymentMethod[];
}

const InputGroup: React.FC<{
    label: string; 
    icon?: string; 
    value: string | number; 
    onChange: (val: string) => void; 
    type?: string; 
    placeholder?: string;
    helper?: string;
}> = ({ label, icon, value, onChange, type = "text", placeholder, helper }) => (
    <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            {icon && <Icon name={icon} size={12} className="text-brand-primary/70" />}
            {label}
        </label>
        <div className="relative group">
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all outline-none"
            />
        </div>
        {helper && <p className="text-[10px] text-gray-600 mt-1.5 ml-1">{helper}</p>}
    </div>
);

const AdminWithdrawalSettingsScreen: React.FC<WithdrawalSettingsProps> = (props) => {
    const [minWithdrawal, setMinWithdrawal] = useState(props.appSettings.minWithdrawal);
    const [instructionText, setInstructionText] = useState(props.appSettings.withdrawalInstructionText);
    const [methods, setMethods] = useState<types.PaymentMethod[]>(props.paymentMethods);
    const [isSaving, setIsSaving] = useState(false);
    
    const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<types.PaymentMethod | null>(null);

    const [methodToDelete, setMethodToDelete] = useState<types.PaymentMethod | null>(null);
    
    const toastContext = useContext(ToastContext);

    // Sync local state with props from Firestore
    useEffect(() => {
        setMethods(props.paymentMethods);
    }, [props.paymentMethods]);

    useEffect(() => {
        setMinWithdrawal(props.appSettings.minWithdrawal);
        setInstructionText(props.appSettings.withdrawalInstructionText || '');
    }, [props.appSettings]);
    
    useEffect(() => {
        if(window.lucide) window.lucide.createIcons();
    }, [methods]);

    const handleEditMethod = (method: types.PaymentMethod) => {
        setEditingMethod(method);
        setIsMethodModalOpen(true);
    };

    const handleAddMethod = () => {
        setEditingMethod(null);
        setIsMethodModalOpen(true);
    };
    
    const handleSaveMethod = (methodData: Partial<types.PaymentMethod>) => {
        if (editingMethod) {
            // Editing existing method
            setMethods(prev => prev.map(m => m.id === editingMethod.id ? { ...m, ...methodData } as types.PaymentMethod : m));
        } else {
            // Creating new method
            const newMethod: types.PaymentMethod = {
                id: Date.now(),
                name: methodData.name!,
                logoUrl: methodData.logoUrl!,
                logoHeight: methodData.logoHeight || 40,
                logoWidth: methodData.logoWidth,
                enabled: true
            };
            setMethods(prev => [...prev, newMethod]);
        }
    };
    
    const handleToggleMethod = (id: number) => {
        setMethods(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
    };

    const confirmDelete = () => {
        if (methodToDelete) {
            setMethods(prev => prev.filter(m => m.id !== methodToDelete.id));
            setMethodToDelete(null);
        }
    };
    
    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Update app settings
            await updateDoc(doc(db, 'settings', 'app'), {
                minWithdrawal: Number(minWithdrawal),
                withdrawalInstructionText: instructionText
            });

            // Sync payment methods
            const existingMethodsSnapshot = await getDocs(collection(db, 'paymentMethods'));
            const existingIds = existingMethodsSnapshot.docs.map(d => d.id);
            const currentIds = methods.map(m => m.id.toString());
            
            // Delete methods that were removed
            const deletePromises = existingIds
                .filter(id => !currentIds.includes(id))
                .map(id => deleteDoc(doc(db, 'paymentMethods', id)));

            // Update or create methods
            const savePromises = methods.map(method => {
                const { id, ...data } = method;
                return setDoc(doc(db, 'paymentMethods', id.toString()), data);
            });
            
            await Promise.all([...deletePromises, ...savePromises]);
            toastContext?.showToast("Settings saved successfully!", "success");

        } catch (error) {
            console.error("Error saving settings:", error);
            toastContext?.showToast("Failed to save settings.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AdminSection icon="credit-card" title="Withdrawal Settings" subtitle="Configure payout options and rules.">
            <div className="relative">
                {isSaving && (
                    <div className="absolute inset-0 bg-dark-card/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl animate-fade-in">
                        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 font-bold text-white text-lg">Saving Settings...</p>
                    </div>
                )}
                <div className="space-y-8">
                    {/* General Rules */}
                    <div className="bg-dark-bg p-6 rounded-2xl border border-white/10">
                        <h3 className="text-base font-bold text-white mb-4">General Rules</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputGroup label="Minimum Withdrawal Amount" icon="dollar-sign" type="number" value={minWithdrawal} onChange={setMinWithdrawal} />
                            <InputGroup label="Instructions Text" icon="file-text" value={instructionText} onChange={setInstructionText} helper="This text appears on the withdrawal screen for users." />
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="bg-dark-bg p-6 rounded-2xl border border-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-base font-bold text-white">Payment Methods</h3>
                            <button 
                                onClick={handleAddMethod}
                                className="bg-brand-primary text-black font-bold px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
                            >
                                <Icon name="plus" size={16}/> Add Method
                            </button>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {methods.map(method => (
                                <div key={method.id} className="bg-dark-card border border-white/5 rounded-xl p-4 flex flex-col items-center text-center group transition-all hover:border-white/20">
                                    <div 
                                        className="bg-white p-2 rounded-lg flex items-center justify-center mb-3"
                                        style={{
                                            height: `${method.logoHeight || 60}px`,
                                            width: method.logoWidth ? `${method.logoWidth}px` : '120px',
                                        }}
                                    >
                                        <img 
                                            src={method.logoUrl} 
                                            alt={method.name} 
                                            className="object-contain max-h-full max-w-full"
                                            onError={(e) => {
                                                const target = e.currentTarget as HTMLImageElement;
                                                target.style.display = 'none';
                                                if (target.parentElement) {
                                                    target.parentElement.innerHTML = `<span class="text-xs text-red-500">Image Error</span>`;
                                                }
                                            }}
                                        />
                                    </div>
                                    <p className="font-bold text-white text-sm mb-4 flex-1">{method.name}</p>
                                    
                                    <div className="w-full pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center gap-2">
                                        <button onClick={() => handleToggleMethod(method.id)} className={`w-full sm:w-auto flex-1 px-3 py-1.5 text-xs font-bold rounded-md ${method.enabled ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {method.enabled ? 'ENABLED' : 'DISABLED'}
                                        </button>
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <button onClick={() => handleEditMethod(method)} className="flex-1 sm:flex-initial p-2 bg-blue-500/10 text-blue-500 rounded-md hover:bg-blue-500 hover:text-white transition-colors">
                                                <Icon name="edit-3" size={16}/>
                                            </button>
                                            <button onClick={() => setMethodToDelete(method)} className="flex-1 sm:flex-initial p-2 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500 hover:text-white transition-colors">
                                                <Icon name="trash-2" size={16}/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end mt-8">
                        <button onClick={handleSave} disabled={isSaving} className="bg-brand-primary text-black font-extrabold px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-brand-primary/30 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                            {isSaving ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <Icon name="save" size={18} />}
                            {isSaving ? 'SAVING...' : 'SAVE ALL SETTINGS'}
                        </button>
                    </div>
                </div>
            </div>

            <PaymentMethodModal
                isOpen={isMethodModalOpen}
                onClose={() => setIsMethodModalOpen(false)}
                onSave={handleSaveMethod}
                method={editingMethod}
            />

            <ConfirmModal
                isOpen={!!methodToDelete}
                onClose={() => setMethodToDelete(null)}
                onConfirm={confirmDelete}
                title="Delete Method"
                message={`Are you sure you want to delete the "${methodToDelete?.name}" payment method?`}
                confirmText="Delete"
                confirmIcon="trash-2"
                confirmButtonClass="bg-red-500"
            />
        </AdminSection>
    );
};

export default AdminWithdrawalSettingsScreen;