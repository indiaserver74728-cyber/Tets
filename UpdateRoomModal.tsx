
import React, { useState, useEffect } from 'react';
import { Match } from '../../types';
import Icon from '../Icon';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface UpdateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    match: Match | null;
    setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
}

const UpdateRoomModal: React.FC<UpdateRoomModalProps> = ({ isOpen, onClose, match, setMatches }) => {
    const [roomId, setRoomId] = useState('');
    const [password, setPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && match) {
            setRoomId(match.roomId || '');
            setPassword(match.roomPassword || '');
        }
    }, [isOpen, match]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!match) return;
        setIsSaving(true);
        try {
            await updateDoc(doc(db, 'matches', match.id.toString()), {
                roomId,
                roomPassword: password
            });
            setMatches(prev => prev.map(m => m.id === match.id ? { ...m, roomId, roomPassword: password } : m));
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to update room details.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-dark-card border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><Icon name="key" className="text-brand-primary"/> Update Room Details</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><Icon name="x" size={20}/></button>
                </div>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Room ID</label>
                        <input type="text" value={roomId} onChange={e => setRoomId(e.target.value)} className="w-full bg-dark-bg border border-gray-700 rounded-lg p-3 text-white focus:border-brand-primary outline-none" placeholder="Enter Room ID" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Password</label>
                        <input type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-dark-bg border border-gray-700 rounded-lg p-3 text-white focus:border-brand-primary outline-none" placeholder="Enter Password" />
                    </div>
                    <button type="submit" disabled={isSaving} className="w-full bg-brand-primary text-black font-bold py-3 rounded-lg hover:opacity-90 flex items-center justify-center gap-2">
                        {isSaving ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <Icon name="save" size={18}/>}
                        {isSaving ? 'Saving...' : 'Save Details'}
                    </button>
                </form>
            </div>
        </div>
    );
};
export default UpdateRoomModal;
