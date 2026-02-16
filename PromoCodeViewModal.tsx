import React from 'react';
import { PromoCode } from '../../types';
import Icon from '../Icon';

interface PromoCodeViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    promoCode: PromoCode | null;
}

const PromoCodeViewModal: React.FC<PromoCodeViewModalProps> = ({ isOpen, onClose, promoCode }) => {
    if (!isOpen || !promoCode) return null;

    const sortedClaims = [...promoCode.claimedBy].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="relative bg-[#1a1a1a] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/5 bg-gradient-to-r from-dark-bg to-dark-card">
                    <div>
                        <h3 className="text-xl font-extrabold text-white flex items-center gap-3">
                            <div className="p-2 bg-brand-primary/10 rounded-xl">
                                <Icon name="users" size={20} className="text-brand-primary"/>
                            </div>
                            Claim History
                        </h3>
                        <p className="text-xs text-gray-400 mt-1 ml-1">
                            Voucher: <span className="font-mono text-brand-cyan font-bold bg-brand-cyan/10 px-1.5 py-0.5 rounded tracking-wide">{promoCode.code}</span>
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2.5 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all transform hover:rotate-90"
                    >
                        <Icon name="x" size={20} />
                    </button>
                </div>
                
                {/* Body */}
                <div className="p-4 space-y-3 overflow-y-auto flex-1 custom-scrollbar bg-[#121212]">
                    {sortedClaims.length > 0 ? (
                        sortedClaims.map((claim, idx) => (
                            <div 
                                key={`${claim.email}-${idx}`} 
                                className="group flex items-center gap-4 p-4 bg-dark-card border border-white/5 rounded-2xl hover:border-brand-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-brand-primary/5"
                            >
                                {/* Avatar */}
                                <div className="relative">
                                    <img 
                                        src={claim.avatar} 
                                        className="w-12 h-12 rounded-full object-cover border-2 border-white/10 group-hover:border-brand-primary/50 transition-colors" 
                                        alt={claim.name} 
                                    />
                                    <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-dark-card"></div>
                                </div>

                                {/* User Details */}
                                <div className="flex-1 min-w-0">
                                   <p className="text-sm font-bold text-white truncate mb-0.5">{claim.name}</p>
                                   <div className="flex flex-col gap-0.5">
                                        <p className="text-[11px] text-gray-500 truncate flex items-center gap-1.5">
                                            <Icon name="mail" size={10} className="text-gray-600"/>
                                            {claim.email}
                                        </p>
                                        <p className="text-[11px] text-gray-500 truncate flex items-center gap-1.5">
                                            <Icon name="phone" size={10} className="text-gray-600"/>
                                            {claim.phone || 'N/A'}
                                        </p>
                                   </div>
                                </div>

                                {/* Timestamp */}
                                <div className="text-right  border-l border-white/5">
                                    <p className="text-[10px] text-gray-500 font-medium bg-white/5 pl-0 py-1 rounded-full inline-block">
                                        {new Date(claim.timestamp).toLocaleString([], {dateStyle: 'short', timeStyle: 'short'})}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                         <div className="flex flex-col items-center justify-center h-full text-center text-gray-600 py-12">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 ring-1 ring-white/10">
                                <Icon name="user-x" size={40} className="opacity-30 text-gray-400"/>
                            </div>
                            <h3 className="font-bold text-lg text-gray-300">No Claims Yet</h3>
                            <p className="text-xs max-w-[200px] text-gray-500 mt-1 leading-relaxed">
                                This code hasn't been used by anyone. Share it to see activity!
                            </p>
                        </div>
                    )}
                </div>
                
                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-dark-card flex justify-between items-center text-xs">
                    <span className="text-gray-500">Total Redeemed</span>
                    <span className="font-extrabold text-white bg-brand-primary/10 px-3 py-1 rounded-lg text-brand-primary border border-brand-primary/20">
                        {sortedClaims.length} Users
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PromoCodeViewModal;