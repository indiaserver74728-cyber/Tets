import React, { useState, useEffect, useRef } from 'react';
import { Match, Category } from '../../types';
import Icon from '../Icon';
import { db } from '../../firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

interface MatchFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
    match: Match | null;
    categories: Category[];
}

const defaultRules = [
    "Teaming is strictly prohibited.",
    "Emulators are not allowed.",
    "No hacks or third-party apps.",
    "Be in the room on time.",
    "Respect all players & staff.",
    "Organizer's decisions are final.",
];

const InputField: React.FC<{ 
    label: string; 
    name: string; 
    value: any; 
    onChange: (e: React.ChangeEvent<any>) => void; 
    type?: string; 
    required?: boolean; 
    icon?: string;
    children?: React.ReactNode; 
}> = ({ label, name, value, onChange, type = 'text', required = true, icon, children }) => (
    <div className="mb-4">
        <label htmlFor={name} className="block mb-1.5 text-xs font-bold uppercase tracking-wider text-gray-400">{label}</label>
        <div className="relative">
            {icon && <Icon name={icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />}
            {children ? (
                <select 
                    id={name} 
                    name={name} 
                    value={value} 
                    onChange={onChange} 
                    className={`bg-dark-bg border border-gray-700 text-white text-sm rounded-lg focus:ring-brand-primary focus:border-brand-primary block w-full p-2.5 ${icon ? 'pl-10' : ''}`}
                >
                    {children}
                </select>
            ) : (
                <input 
                    type={type} 
                    id={name} 
                    name={name} 
                    value={value} 
                    onChange={onChange} 
                    required={required} 
                    className={`bg-dark-bg border border-gray-700 text-white text-sm rounded-lg focus:ring-brand-primary focus:border-brand-primary block w-full p-2.5 ${icon ? 'pl-10' : ''} placeholder-gray-500`}
                    placeholder={`Enter ${label}`}
                />
            )}
        </div>
    </div>
);

const MatchFormModal: React.FC<MatchFormModalProps> = ({ isOpen, onClose, setMatches, match, categories }) => {
    const [formData, setFormData] = useState<Partial<Match> & { [key: string]: any }>({});
    const [newRule, setNewRule] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            const defaultCategory = categories.length > 0 ? categories[0].name : '';
            if (match) {
                const formDataToSet = { ...match };
                
                // Super robust date/time handling to prevent crashes
                try {
                    const timeValue = formDataToSet.time;
                    let formattedTime = '';

                    if (timeValue) {
                        // Handles Firestore Timestamp objects, ISO strings, and other valid date formats
                        const date = (timeValue as any).toDate ? (timeValue as any).toDate() : new Date(timeValue);

                        // Only format if the created date is valid
                        if (date instanceof Date && !isNaN(date.getTime())) {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            const hours = String(date.getHours()).padStart(2, '0');
                            const minutes = String(date.getMinutes()).padStart(2, '0');
                            formattedTime = `${year}-${month}-${day}T${hours}:${minutes}`;
                        }
                    }
                    formDataToSet.time = formattedTime;
                } catch (e) {
                    // Fallback to empty string if any error occurs during parsing
                    console.error("Error parsing match time for editor:", e);
                    formDataToSet.time = '';
                }
                
                setFormData({ ...formDataToSet, rules: formDataToSet.rules || defaultRules });
            } else {
                setFormData({
                    title: '',
                    type: 'Upcoming',
                    category: defaultCategory,
                    map: 'Bermuda',
                    mode: 'Solo',
                    entryFee: 0,
                    perKill: 0,
                    prizePool: 0,
                    maxPlayers: 48,
                    time: '',
                    roomId: '',
                    roomPassword: '',
                    imageUrl: '',
                    rules: defaultRules,
                });
            }
            if (window.lucide) {
                setTimeout(() => window.lucide.createIcons(), 50);
            }
        }
    }, [match, isOpen, categories]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'number') {
            const val = value === '' ? '' : parseFloat(value);
            setFormData(prev => ({ ...prev, [name]: val }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleAddRule = () => {
        if (newRule.trim()) {
            setFormData(prev => ({ ...prev, rules: [...(prev.rules || []), newRule.trim()] }));
            setNewRule('');
        }
    };

    const handleDeleteRule = (index: number) => {
        setFormData(prev => ({ ...prev, rules: (prev.rules || []).filter((_, i) => i !== index) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        const newTime = new Date(formData.time);
        const now = new Date();
        // If the new time is in the future, automatically reopen registration
        const isFutureTime = newTime > now;

        const finalData = {
            ...formData,
            maxPlayers: Number(formData.maxPlayers) || 48,
            entryFee: Number(formData.entryFee) || 0,
            prizePool: Number(formData.prizePool) || 0,
            perKill: Number(formData.perKill) || 0,
            rules: formData.rules || [],
            // Automatically uncheck closed registration if time is pushed forward
            registrationClosed: isFutureTime ? false : (match ? match.registrationClosed : false)
        };
        
        try {
            if (match) { 
                const matchRef = doc(db, 'matches', match.id.toString());
                await updateDoc(matchRef, finalData);
            } else { 
                const newId = Date.now();
                const newMatch: Match = {
                    id: newId,
                    registeredPlayers: 0,
                    filledSlots: [],
                    winningsDistributed: false,
                    registrationClosed: false,
                    ...finalData
                } as Match;
                
                await setDoc(doc(db, 'matches', newId.toString()), newMatch);
            }
            onClose();
        } catch (error) {
            console.error("Error saving match:", error);
            alert("Failed to save match. Please check console.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;
    
    const sortedCategories = [...categories].sort((a,b) => (a.position ?? 999) - (b.position ?? 999));

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="relative bg-dark-card border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {isSaving && (
                    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
                        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-brand-primary font-bold text-lg animate-pulse">Saving Match...</p>
                    </div>
                )}

                <div className="flex justify-between items-center p-5 border-b border-white/10 bg-dark-bg/50">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${match ? 'bg-blue-500/10' : 'bg-green-500/10'}`}>
                            <Icon name={match ? "edit" : "plus-circle"} size={24} className={match ? "text-blue-500" : "text-green-500"} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">{match ? 'Edit Tournament' : ' New Tournament'}</h3>
                            <p className="text-xs text-gray-400">{match ? 'Modify match details' : 'Create a new Match'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} disabled={isSaving} className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-lg hover:bg-red-500/20 hover:text-red-500 disabled:opacity-50">
                        <Icon name="x" size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-brand-primary flex items-center gap-2 border-b border-white/5 pb-2">
                            <Icon name="info" size={16}/> Enter All Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <InputField label="Tournament Title" name="title" value={formData.title || ''} onChange={handleChange} icon="type" />
                            </div>
                             <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Cover Image</label>
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full aspect-video rounded-xl bg-black/40 border-2 border-dashed border-white/10 overflow-hidden flex items-center justify-center relative group transition-colors hover:border-brand-primary/30 cursor-pointer"
                                >
                                    {formData.imageUrl ? (
                                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
                                    ) : (
                                        <div className="text-center text-gray-600 flex flex-col items-center">
                                            <Icon name="upload-cloud" size={32} className="mb-2 opacity-50" />
                                            <span className="text-xs font-medium">Upload Image</span>
                                            <span className="text-[10px] text-gray-700">or enter URL below</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <p className="text-white text-xs font-bold flex items-center gap-2"><Icon name="image" size={14}/> Click to change image</p>
                                    </div>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                <InputField label="Image URL (or upload)" name="imageUrl" value={formData.imageUrl || ''} onChange={handleChange} icon="link" required={false} />
                            </div>
                            <InputField label="Category" name="category" value={formData.category} onChange={handleChange} icon="layout-grid">
                                {sortedCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                            </InputField>
                            <InputField label="Map" name="map" value={formData.map || 'Bermuda'} onChange={handleChange} icon="map">
                                <option value="Bermuda">Bermuda</option>
                                <option value="CS">Clash Squad</option>
                                <option value="LW">Lone Wolf</option>
                                <option value="CraftLand">CraftLand</option>
                                <option value="BR">Battle Royale</option>
                            </InputField>
                            <InputField label="Mode" name="mode" value={formData.mode || 'Solo'} onChange={handleChange} icon="users">
                                <option value="Solo">Solo</option>
                                <option value="Duo">Duo</option>
                                <option value="Squad">Squad</option>
                                <option value="1v1">1v1</option>
                                <option value="2v2">2v2</option>
                                <option value="4v4">4v4</option>
                            </InputField>
                             <InputField label="Start Time" name="time" value={formData.time || ''} onChange={handleChange} type="datetime-local" icon="calendar" />
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-yellow-500 flex items-center gap-2 border-b border-white/5 pb-2">
                            <Icon name="book-open" size={16}/> Match Rules
                        </h4>
                         <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2 bg-dark-bg p-3 rounded-lg border border-gray-700">
                            {(formData.rules || []).map((rule: string, index: number) => (
                                <div key={index} className="flex items-center gap-2 bg-dark-card p-2 rounded">
                                    <Icon name="shield" size={14} className="text-gray-500 flex-shrink-0" />
                                    <p className="text-xs text-gray-300 flex-1">{rule}</p>
                                    <button type="button" onClick={() => handleDeleteRule(index)} className="p-1 text-red-500 hover:bg-red-500/10 rounded">
                                        <Icon name="trash-2" size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                         <div className="flex gap-2">
                            <input
                                type="text"
                                value={newRule}
                                onChange={(e) => setNewRule(e.target.value)}
                                placeholder="Add a new rule..."
                                className="flex-1 w-12 bg-dark-bg border border-gray-700 text-white text-sm rounded-lg p-2.5 focus:border-brand-primary"
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddRule(); } }}
                            />
                            <button type="button" onClick={handleAddRule} className="px-4 bg-brand-primary text-black rounded-lg font-bold text-sm">
                                Add
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-green-500 flex items-center gap-2 border-b border-white/5 pb-2">
                            <Icon name="dollar-sign" size={16}/> Details
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <InputField label="Entry Fee" name="entryFee" value={formData.entryFee} onChange={handleChange} type="number" icon="credit-card" />
                            <InputField label="Prize Pool" name="prizePool" value={formData.prizePool} onChange={handleChange} type="number" icon="trophy" />
                            <InputField label="Per Kill" name="perKill" value={formData.perKill} onChange={handleChange} type="number" icon="crosshair" />
                            <InputField label="Max Slots" name="maxPlayers" value={formData.maxPlayers} onChange={handleChange} type="number" icon="users" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-purple-500 flex items-center gap-2 border-b border-white/5 pb-2">
                            <Icon name="key" size={16}/> Room Configuration
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <InputField label="Status" name="type" value={formData.type || 'Upcoming'} onChange={handleChange} icon="activity">
                                <option value="Upcoming">Upcoming</option>
                                <option value="Ongoing">Ongoing</option>
                                <option value="Results">Results</option>
                            </InputField>
                            <InputField label="Room ID" name="roomId" value={formData.roomId || ''} onChange={handleChange} required={false} icon="hash" />
                            <InputField label="Password" name="roomPassword" value={formData.roomPassword || ''} onChange={handleChange} required={false} icon="lock" />
                        </div>
                    </div>
                </form>

                <div className="p-5 border-t border-white/10 bg-dark-bg flex justify-end gap-3">
                    <button type="button" onClick={onClose} disabled={isSaving} className="px-5 py-2.5 text-sm font-bold text-gray-300 bg-white/5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={isSaving} className="px-5 py-2.5 text-sm font-bold text-black bg-brand-primary rounded-lg hover:bg-brand-primary/90 transition-shadow shadow-lg shadow-brand-primary/20 flex items-center gap-2 disabled:opacity-50">
                        <Icon name="save" size={18} />
                        {match ? 'Update Match' : 'Publish Match'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MatchFormModal;