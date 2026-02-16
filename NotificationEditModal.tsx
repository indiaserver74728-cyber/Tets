
import React, { useState, useEffect } from 'react';
import { Notification } from '../../types';
import Icon from '../Icon';

const icons = [
    { name: 'megaphone', color: 'text-brand-primary' },
    { name: 'gift', color: 'text-green-500' },
    { name: 'trophy', color: 'text-brand-gold' },
    { name: 'info', color: 'text-blue-400' },
    { name: 'alert-triangle', color: 'text-yellow-500' },
];

const IconPicker: React.FC<{ selectedIcon: string; onSelect: (icon: string, color: string) => void }> = ({ selectedIcon, onSelect }) => (
    <div>
        <label className="text-xs text-gray-400 mb-2 block font-bold uppercase">Icon</label>
        <div className="flex gap-2">
            {icons.map(icon => (
                <button
                    type="button"
                    key={icon.name}
                    onClick={() => onSelect(icon.name, icon.color)}
                    className={`p-3 rounded-lg border-2 transition-all ${selectedIcon === icon.name ? 'border-brand-primary bg-brand-primary/10' : 'border-gray-700 bg-dark-bg hover:border-gray-500'}`}
                >
                    <Icon name={icon.name} className={icon.color} size={20} />
                </button>
            ))}
        </div>
    </div>
);

interface NotificationEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    notification: Notification | null;
    onSave: (updatedNotification: Notification) => void;
}

const NotificationEditModal: React.FC<NotificationEditModalProps> = ({ isOpen, onClose, notification, onSave }) => {
    const [formData, setFormData] = useState<Notification | null>(null);

    useEffect(() => {
        if (notification) {
            setFormData(notification);
        }
    }, [notification]);
    
    useEffect(() => {
        if (isOpen && window.lucide) {
            setTimeout(() => window.lucide.createIcons(), 50);
        }
    }, [isOpen]);

    if (!isOpen || !formData) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => prev ? { ...prev, [e.target.name]: e.target.value } : null);
    };

    const handleIconSelect = (icon: string, iconColor: string) => {
        setFormData(prev => prev ? { ...prev, icon, iconColor } : null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData) {
            onSave(formData);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="relative bg-dark-card border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-5 border-b border-white/10 bg-dark-bg/50">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Icon name="edit" size={20} className="text-brand-primary"/>
                        Edit Notification
                    </h3>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"><Icon name="x" size={20} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Title</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full bg-dark-bg border border-gray-700 rounded-lg p-3 text-white focus:border-brand-primary outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Message</label>
                        <textarea name="message" value={formData.message} onChange={handleChange} rows={4} className="w-full bg-dark-bg border border-gray-700 rounded-lg p-3 text-white focus:border-brand-primary outline-none"></textarea>
                    </div>
                    <IconPicker selectedIcon={formData.icon} onSelect={handleIconSelect} />
                    <p className="text-xs text-gray-500 italic">Note: Editing only affects the history record, not notifications already delivered to users.</p>
                </form>

                <div className="p-5 border-t border-white/10 bg-dark-bg flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-300 bg-white/5 rounded-lg hover:bg-white/10">Cancel</button>
                    <button type="submit" onClick={handleSubmit} className="px-5 py-2.5 text-sm font-bold text-black bg-brand-primary rounded-lg hover:opacity-90">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default NotificationEditModal;
