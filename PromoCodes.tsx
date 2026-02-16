
import React, { useState, useEffect, useMemo, useContext } from 'react';
import Icon from '../../components/Icon';
import * as types from '../../types';
import { db } from '../../firebase';
import { doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import ConfirmModal from '../../components/ConfirmModal';
import PromoCodeForm from '../../components/admin/PromoCodeFormModal';
import PromoCodeViewModal from '../../components/admin/PromoCodeViewModal';
import { ToastContext } from '../../contexts';

interface PromoCodesProps {
    promoCodes: types.PromoCode[];
    users: types.User[];
}

const StatCard: React.FC<{ icon: string; label: string; value: string | number; color: string; }> = ({ icon, label, value, color }) => (
    <div className="bg-dark-card border border-white/5 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:shadow-xl transition-all hover:border-white/10 group">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">{label}</p>
                <p className="text-3xl font-extrabold text-white group-hover:scale-105 transition-transform origin-left">{value}</p>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color} bg-opacity-10 group-hover:bg-opacity-20 transition-all`}>
                 <Icon name={icon} size={20} className={color.replace('bg-', 'text-')} />
            </div>
        </div>
    </div>
);

const ProgressBar: React.FC<{ value: number; max: number }> = ({ value, max }) => {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div className="w-full bg-[#1a1a1a] rounded-full h-2 border border-white/5 overflow-hidden">
            <div 
                className="bg-gradient-to-r from-brand-primary to-blue-500 h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(0,242,255,0.5)]" 
                style={{ width: `${percentage}%` }}
            ></div>
        </div>
    );
};

const getStatus = (code: types.PromoCode) => {
    const isExpired = new Date(code.expiryDate) < new Date();
    if (isExpired) return { text: 'Expired', color: 'red', icon: 'clock' };
    
    const isMaxed = code.uses >= code.maxUses;
    if (isMaxed) return { text: 'Used', color: 'yellow', icon: 'alert-triangle' };

    return { text: 'Active', color: 'green', icon: 'check-circle' };
}

const AdminPromoCodesScreen: React.FC<PromoCodesProps> = ({ promoCodes, users }) => {
    const toastContext = useContext(ToastContext);
    const showToast = toastContext?.showToast;
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCode, setEditingCode] = useState<types.PromoCode | null>(null);
    const [viewModalCode, setViewModalCode] = useState<types.PromoCode | null>(null);
    const [deleteModalCode, setDeleteModalCode] = useState<types.PromoCode | null>(null);

    const { activeCodes, totalUses, totalValueClaimed } = useMemo(() => {
        if (!promoCodes) return { activeCodes: 0, totalUses: 0, totalValueClaimed: 0 };
        return promoCodes.reduce((acc, code) => {
            if (getStatus(code).text === 'Active') acc.activeCodes++;
            acc.totalUses += code.uses;
            acc.totalValueClaimed += code.uses * code.amount;
            return acc;
        }, { activeCodes: 0, totalUses: 0, totalValueClaimed: 0 });
    }, [promoCodes]);
    
    const sortedCodes = useMemo(() => 
        [...(promoCodes || [])].sort((a,b) => b.id - a.id), 
    [promoCodes]);

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        if (showToast) showToast(`Copied "${code}"`, 'info');
    };

    const handleSaveCode = async (codeData: types.PromoCode) => {
        try {
            if (editingCode) {
                await updateDoc(doc(db, 'promo_codes', codeData.id.toString()), codeData);
                if (showToast) showToast('Promo code updated!', 'success');
            } else {
                await setDoc(doc(db, 'promo_codes', codeData.id.toString()), codeData);
                if (showToast) showToast('Promo code created!', 'success');
            }
            setIsFormOpen(false);
            setEditingCode(null);
        } catch (error) {
            console.error(error);
            if (showToast) showToast('Failed to save promo code.', 'error');
        }
    };

    const handleEdit = (code: types.PromoCode) => {
        setEditingCode(code);
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const confirmDelete = async () => {
        if (!deleteModalCode) return;
        try {
            await deleteDoc(doc(db, 'promo_codes', deleteModalCode.id.toString()));
            if (showToast) showToast('Promo code deleted.', 'info');
            setDeleteModalCode(null);
        } catch (error) {
            console.error(error);
            if (showToast) showToast('Failed to delete promo code.', 'error');
        }
    };

    return (
        <div className="space-y-8 pb-24">
            
            {/* Header & Stats */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Icon name="wallet" size={30} className="text-brand-primary" />
                           Payment IDs
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">Manage Payment IDs and Create New Payment IDs.</p>
                    </div>
                    <button 
                        onClick={() => { setIsFormOpen(true); setEditingCode(null); }}
                        className="bg-brand-primary text-black font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20 active:scale-95"
                    >
                        <Icon name="plus" size={20} />
                        CREATE NEW ID
                    </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total Payment ID" value={sortedCodes.length} icon="wallet" color="bg-blue-500" />
                    <StatCard label="Active Payment ID" value={activeCodes} icon="power" color="bg-green-500" />
                    <StatCard label="Total Used" value={totalUses} icon="users" color="bg-yellow-500" />
                    <StatCard label="Diamond Distributed" value={`${totalValueClaimed.toLocaleString()}`} icon="gem" color="bg-purple-500" />
                </div>
            </div>

            {/* Creation Form */}
            {isFormOpen && (
                <div className="bg-dark-card border border-brand-primary/30 rounded-2xl shadow-2xl overflow-hidden animate-fade-in relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary"></div>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Icon name={editingCode ? "edit-3" : "plus-circle"} size={23} className="text-brand-primary"/>
                                {editingCode ? 'Edit Payment ID' : 'New Payment ID'}
                            </h2>
                            <button onClick={() => {setIsFormOpen(false); setEditingCode(null);}} className="text-gray-500 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"><Icon name="x" size={20}/></button>
                        </div>
                        <PromoCodeForm 
                            promoCode={editingCode} 
                            onSave={handleSaveCode} 
                            onCancel={() => { setIsFormOpen(false); setEditingCode(null); }}
                        />
                    </div>
                </div>
            )}

            {/* Voucher List */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedCodes.map(code => {
                    const status = getStatus(code);
                    const usagePercent = Math.round((code.uses / code.maxUses) * 100);
                    
                    return (
                        <div key={code.id} className={`group relative bg-[#151515] rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-primary/10 ${status.text !== 'Active' ? 'border-white/5 opacity-70 hover:opacity-100' : 'border-brand-primary/20 hover:border-brand-primary/50'}`}>
                            
                            {/* Decorative background accent */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-primary/10 to-transparent rounded-bl-full pointer-events-none"></div>

                            <div className="p-6 relative z-10">
                                {/* Header: Value & Status */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-12 h-12 bg-dark-bg border border-white/10 rounded-xl flex items-center justify-center shadow-inner">
                                            <Icon name="gem" size={24} className="text-brand-cyan" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-white tracking-tight">💎 {code.amount}</p>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{code.depositType}</p>
                                        </div>
                                    </div>
                                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                                        status.text === 'Active' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 
                                        status.text === 'Expired' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                                    }`}>
                                        <Icon name={status.icon} size={10} /> {status.text}
                                    </span>
                                </div>

                                {/* Code Display */}
                                <div 
                                    className="bg-black/30 border border-dashed border-gray-600 rounded-xl p-3 flex justify-between items-center mb-5 cursor-pointer hover:border-brand-primary hover:bg-brand-primary/5 transition-colors group/code"
                                    onClick={() => handleCopyCode(code.code)}
                                >
                                    <span className="font-mono text-xl font-bold text-brand-primary tracking-wider">{code.code}</span>
                                    <Icon name="copy" size={16} className="text-gray-500 group-hover/code:text-white transition-colors" />
                                </div>

                                {/* Progress */}
                                <div className="mb-5">
                                    <div className="flex justify-between text-xs mb-2 font-medium">
                                        <span className="text-gray-400">Used Progress</span>
                                        <span className={usagePercent >= 100 ? 'text-red-400' : 'text-brand-cyan'}>{usagePercent}%</span>
                                    </div>
                                    <ProgressBar value={code.uses} max={code.maxUses} />
                                    <div className="flex justify-between mt-2 text-[10px] text-gray-500 font-mono">
                                        <span>{code.uses} Used</span>
                                        <span>{code.maxUses} Limit</span>
                                    </div>
                                </div>

                                {/* Footer Info & Actions */}
                                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                    <div className="text-xs text-gray-500">
                                        <p className="flex items-center gap-1.5 mb-0.5"><Icon name="calendar" size={12}/> {new Date(code.expiryDate).toLocaleDateString()}</p>
                                        <p className="flex items-center gap-1.5"><Icon name="user" size={12}/> {code.maxUsesPerUser} per user</p>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setViewModalCode(code)} 
                                            className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all"
                                            title="View Claims"
                                        >
                                            <Icon name="users" size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleEdit(code)} 
                                            className="w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500 hover:text-white flex items-center justify-center transition-all"
                                            title="Edit Voucher"
                                        >
                                            <Icon name="edit-3" size={16} />
                                        </button>
                                        <button 
                                            onClick={() => setDeleteModalCode(code)} 
                                            className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
                                            title="Delete Voucher"
                                        >
                                            <Icon name="trash-2" size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {sortedCodes.length === 0 && !isFormOpen && (
                <div className="text-center py-20 text-gray-500 bg-dark-card rounded-2xl border-2 border-dashed border-white/5 flex flex-col items-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <Icon name="ticket" size={40} className="opacity-30" />
                    </div>
                    <h3 className="font-bold text-xl text-white mb-2">No Vouchers Yet</h3>
                    <p className="text-sm max-w-xs mx-auto mb-8">Create promotional codes to reward your users and boost engagement.</p>
                    <button onClick={() => setIsFormOpen(true)} className="text-brand-primary font-bold text-sm hover:underline flex items-center justify-center gap-2">
                        <Icon name="plus-circle" size={16} /> Create First Voucher
                    </button>
                </div>
            )}

            <PromoCodeViewModal isOpen={!!viewModalCode} onClose={() => setViewModalCode(null)} promoCode={viewModalCode}/>
            <ConfirmModal 
                isOpen={!!deleteModalCode} 
                onClose={() => setDeleteModalCode(null)} 
                onConfirm={confirmDelete} 
                title="Delete Voucher" 
                message={`Are you sure you want to delete "${deleteModalCode?.code}"? This will not affect users who already claimed it.`} 
                confirmText="Delete Voucher" 
                confirmButtonClass="bg-red-500 hover:bg-red-600" 
                confirmIcon="trash-2"
            />
        </div>
    );
};

export default AdminPromoCodesScreen;
