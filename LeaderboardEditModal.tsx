import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import Icon from '../Icon';

interface LeaderboardEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onSave: (updatedUser: User) => void;
    isSaving: boolean;
}

const LeaderboardEditModal: React.FC<LeaderboardEditModalProps> = ({ isOpen, onClose, user, onSave, isSaving }) => {
    const [formData, setFormData] = useState({ totalWinnings: 0, kills: 0, matches: 0 });

    useEffect(() => {
        if (user) {
            setFormData({
                totalWinnings: user.totalWinnings,
                kills: user.kills,
                matches: user.matches,
            });
        }
    }, [user]);

    if (!isOpen || !user) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: Number(value) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...user, ...formData });
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-dark-card border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Icon name="edit-3" className="text-brand-primary"/> Edit Stats
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><Icon name="x" size={20}/></button>
                </div>
                <p className="text-sm text-gray-400 mb-4">Editing stats for <span className="font-bold text-white">{user.name}</span></p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Total Lifetime Winnings</label>
                        <input type="number" name="totalWinnings" value={formData.totalWinnings} onChange={handleChange} className="w-full bg-dark-bg border border-gray-700 rounded-lg p-3 text-white focus:border-brand-primary outline-none" />
                    </div>
                     <div>
                        <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Total Kills</label>
                        <input type="number" name="kills" value={formData.kills} onChange={handleChange} className="w-full bg-dark-bg border border-gray-700 rounded-lg p-3 text-white focus:border-brand-primary outline-none" />
                    </div>
                     <div>
                        <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Matches Played</label>
                        <input type="number" name="matches" value={formData.matches} onChange={handleChange} className="w-full bg-dark-bg border border-gray-700 rounded-lg p-3 text-white focus:border-brand-primary outline-none" />
                    </div>
                    <button type="submit" disabled={isSaving} className="w-full bg-brand-primary text-black font-bold py-3 rounded-lg hover:opacity-90 flex items-center justify-center gap-2">
                        {isSaving ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <Icon name="save" size={18}/>}
                        {isSaving ? 'Saving...' : 'Save Stats'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LeaderboardEditModal;