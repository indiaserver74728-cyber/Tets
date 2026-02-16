
import React, { useState, useEffect } from 'react';
import { PromoCode } from '../../types';
import Icon from '../Icon';

interface PromoCodeFormProps {
    promoCode: PromoCode | null;
    onSave: (codeData: PromoCode) => Promise<void>;
    onCancel: () => void;
}

const InputField: React.FC<{
    label: string;
    name: string;
    type: string;
    icon: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    required?: boolean;
}> = ({ label, name, type, icon, value, onChange, placeholder, required = true }) => (
    <div className="relative group">
        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block ml-1 group-focus-within:text-brand-primary transition-colors">{label}</label>
        <div className="relative">
            <Icon name={icon} size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-primary transition-colors" />
            <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required} className="w-full bg-dark-bg border border-gray-700 rounded-lg p-3 pl-10 text-white focus:border-brand-primary outline-none text-sm transition-all shadow-sm focus:shadow-brand-primary/10"/>
        </div>
    </div>
);

const PromoCodeForm: React.FC<PromoCodeFormProps> = ({ promoCode, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<PromoCode>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setFormData(promoCode ? { ...promoCode } : {
            code: '',
            amount: 10,
            expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            maxUses: 100,
            maxUsesPerUser: 1,
            depositType: 'Deposit',
        });
    }, [promoCode]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let finalValue: string | number = value;
        if (type === 'number') {
            finalValue = parseInt(value, 10);
            if (isNaN(finalValue)) finalValue = 0;
        } else if (name === 'code') {
            finalValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        }
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const finalData: PromoCode = {
                id: promoCode?.id || Date.now(),
                uses: promoCode?.uses || 0,
                createdBy: 'Admin',
                claimedBy: promoCode?.claimedBy || [],
                ...formData
            } as PromoCode;
            await onSave(finalData);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-dark-bg/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <InputField label="Payment ID" name="code" type="text" icon="wallet" value={formData.code || ''} onChange={handleChange} placeholder="Enter Payment ID" />
                <InputField label="Amount (Diamonds))" name="amount" type="number" icon="gem" value={formData.amount || 0} onChange={handleChange} placeholder="10" />
                
                <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block ml-1">Deposit Type</label>
                    <div className="relative group">
                        <Icon name="archive" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-primary transition-colors" />
                        <select name="depositType" value={formData.depositType || 'Deposit'} onChange={handleChange} className="w-full bg-dark-bg border border-gray-700 rounded-lg p-3 pl-10 text-white focus:border-brand-primary outline-none text-sm transition-all appearance-none cursor-pointer">
                            <option value="Deposit">Deposit Wallet</option>
                            <option value="Winnings">Winnings Wallet</option>
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Icon name="chevron-down" size={14} className="text-gray-500"/>
                        </div>
                    </div>
                </div>

                <InputField label="Expiry Date" name="expiryDate" type="date" icon="calendar" value={formData.expiryDate || ''} onChange={handleChange} />
                <InputField label="Max Total Uses" name="maxUses" type="number" icon="users" value={formData.maxUses || 0} onChange={handleChange} placeholder="1" />
                <InputField label="Max Uses Per User" name="maxUsesPerUser" type="number" icon="user" value={formData.maxUsesPerUser || 0} onChange={handleChange} placeholder="1" />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={onCancel} disabled={isSaving} className="px-6 py-2.5 text-sm font-bold text-gray-300 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                    Cancel
                </button>
                <button type="submit" disabled={isSaving} className="px-6 py-2.5 text-sm font-bold text-black bg-brand-primary rounded-lg hover:opacity-90 flex items-center gap-2 shadow-lg shadow-brand-primary/20 transition-all">
                    {isSaving ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <Icon name="save" size={26} />}
                    {isSaving ? 'Saving...' : 'Save'}
                </button>
            </div>
        </form>
    );
};

export default PromoCodeForm;
