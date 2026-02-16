import React from 'react';
import Icon from './Icon';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="relative bg-dark-card border border-white/10 rounded-2xl w-full max-w-md mx-auto flex flex-col max-h-[85vh] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-white/10 bg-dark-bg/50">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white transition-colors z-10"
          >
              <Icon name="x" size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {children}
        </div>
      </div>
    </div>
  );
};

export default InfoModal;