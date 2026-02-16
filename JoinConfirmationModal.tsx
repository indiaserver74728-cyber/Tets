
import React, { useState, useEffect } from 'react';
import { Match } from '../types';
import Icon from './Icon';

interface JoinConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (ign: string, uid: string, whatsapp: string, slotNumber: number) => Promise<void>;
  match: Match | null;
}

const JoinConfirmationModal: React.FC<JoinConfirmationModalProps> = ({ isOpen, onClose, onConfirm, match }) => {
  const [ign, setIgn] = useState('');
  const [uid, setUid] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  useEffect(() => {
    // Reset form when modal is closed
    if (!isOpen) {
      setIgn('');
      setUid('');
      setWhatsapp('');
      setSelectedSlot(null);
      setStatus('idle');
    }
  }, [isOpen]);
  
  if (!isOpen || !match) return null;
  
  const handleConfirm = async () => {
    if (selectedSlot === null) {
        alert('Please select an available slot.');
        return;
    }
    if (!ign || !uid || !whatsapp) {
      alert('Please fill in all required fields.');
      return;
    }
    
    setStatus('loading');
    
    try {
        await onConfirm(ign, uid, whatsapp, selectedSlot);
        setStatus('success');
        // Auto close after success animation
        setTimeout(() => {
            onClose();
        }, 2000);
    } catch (error) {
        console.error("Join failed", error);
        setStatus('idle');
        // Parent component should handle toast error
    }
  };

  const totalSlots = Array.from({ length: match.maxPlayers }, (_, i) => i + 1);
  const filledSlots = match.filledSlots || [];
  const availableSlots = totalSlots.filter(slot => !filledSlots.includes(slot));


  return (
    <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={status === 'loading' ? undefined : onClose}>
        <div 
            className={`relative bg-dark-card border border-white/10 text-white rounded-3xl w-full max-w-sm mx-auto shadow-2xl overflow-hidden transition-all duration-300 ${status === 'success' ? 'scale-105 border-green-500/50' : 'scale-100'}`}
            onClick={(e) => e.stopPropagation()}
        >
            
            {status === 'idle' && (
                <>
                    {/* Header */}
                    <div className="bg-gradient-to-r from-brand-secondary to-dark-bg p-5 border-b border-white/5 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-white">Match Entry</h2>
                            <p className="text-xs text-gray-400">{match.title}</p>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="bg-white/5 hover:bg-white/10 p-2 rounded-full text-gray-400 hover:text-white transition-colors"
                        >
                            <Icon name="x" size={20} />
                        </button>
                    </div>

                    <div className="p-6">
                        {/* Slot Selection */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Slot</p>
                                <span className="text-[10px] bg-brand-cyan/10 text-brand-cyan px-2 py-0.5 rounded-full font-bold">{availableSlots.length} Available</span>
                            </div>
                            <div className="grid grid-cols-6 gap-2 text-center max-h-32 overflow-y-auto bg-black/20 p-2 rounded-xl border border-white/5 custom-scrollbar">
                                {availableSlots.map((slotNumber) => {
                                    const isSelected = selectedSlot === slotNumber;
                                    return (
                                        <button
                                            key={slotNumber}
                                            onClick={() => setSelectedSlot(slotNumber)}
                                            className={`p-2 rounded-lg text-xs font-bold transition-all duration-200
                                                ${isSelected 
                                                    ? 'bg-brand-cyan text-black shadow-lg shadow-brand-cyan/20 scale-110' 
                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}
                                            `}
                                        >
                                            {slotNumber}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Inputs */}
                        <div className="space-y-4 mb-6">
                             <div className="relative group">
                                <Icon name="user" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-cyan transition-colors"/>
                                <input type="text" placeholder="In-Game Name (IGN)" value={ign} onChange={e => setIgn(e.target.value)} className="w-full bg-dark-bg border border-gray-700 rounded-xl p-3 pl-10 text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all outline-none text-sm font-medium" />
                            </div>
                             <div className="relative group">
                                <Icon name="hash" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-cyan transition-colors"/>
                                <input type="text" placeholder="In-Game UID" value={uid} onChange={e => setUid(e.target.value)} className="w-full bg-dark-bg border border-gray-700 rounded-xl p-3 pl-10 text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all outline-none text-sm font-medium" />
                            </div>
                             <div className="relative group">
                                <Icon name="smartphone" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-cyan transition-colors"/>
                                <input type="text" placeholder="WhatsApp Number" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="w-full bg-dark-bg border border-gray-700 rounded-xl p-3 pl-10 text-white focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all outline-none text-sm font-medium" />
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-4 mb-6 flex justify-between items-center">
                            <div>
                                <p className="text-xs text-brand-primary font-bold uppercase">Total Entry Fee</p>
                                <p className="text-[10px] text-gray-400">Deducted from Deposit Balance</p>
                            </div>
                            <p className="text-xl font-extrabold text-white">💎{match.entryFee}</p>
                        </div>
                        
                        <div className="flex gap-3">
                            <button onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 font-bold py-3.5 rounded-xl transition-colors text-sm">
                                Cancel
                            </button>
                            <button 
                                onClick={handleConfirm} 
                                disabled={!selectedSlot || !ign || !uid || !whatsapp}
                                className="flex-[2] bg-gradient-to-r from-brand-pink to-brand-cyan text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-brand-cyan/20 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm flex items-center justify-center gap-2"
                            >
                                <Icon name="check-circle" size={18} />
                                Confirm Payment
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Loading State */}
            {status === 'loading' && (
                <div className="p-10 flex flex-col items-center justify-center text-center min-h-[400px]">
                    <div className="relative w-20 h-20 mb-6">
                        <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-brand-cyan rounded-full border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Icon name="gamepad-2" size={24} className="text-brand-cyan animate-pulse" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Processing Entry...</h3>
                    <p className="text-gray-400 text-sm">Verifying balance & reserving slot #{selectedSlot}</p>
                </div>
            )}

            {/* Success State */}
            {status === 'success' && (
                <div className="p-10 flex flex-col items-center justify-center text-center min-h-[400px] animate-success-scale">
                    <div className="success-checkmark mb-6">
                        <div className="check-icon">
                            <span className="icon-line line-tip"></span>
                            <span className="icon-line line-long"></span>
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Slot Confirmed!</h3>
                    <p className="text-gray-400 text-sm mb-6">You have successfully joined <br/> <span className="text-brand-cyan font-bold">{match.title}</span></p>
                    <div className="bg-green-500/10 text-green-400 px-4 py-2 rounded-lg text-xs font-bold border border-green-500/20">
                        Fee Deducted: 💎{match.entryFee}
                    </div>
                </div>
            )}

        </div>
    </div>
  );
};

export default JoinConfirmationModal;
