
import React from 'react';
import Icon from './Icon';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmIcon?: string;
  confirmButtonClass?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmText = 'Confirm',
  confirmIcon = 'check-circle',
  confirmButtonClass = 'bg-brand-red hover:bg-red-600'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4" onClick={onClose}>
     
      <div 
        className="relative bg-light-card dark:bg-dark-card rounded-2xl p-6 w-full max-w-sm mx-auto transform transition-all border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        
      >
        <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-4">{title}</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-6">{message}</p>
        
        <div className="flex gap-3">
          <button onClick={onClose} className="w-full bg-gray-200 dark:bg-dark-card-hover text-gray-800 dark:text-white font-bold py-3 rounded-md transition-colors hover:bg-gray-300 dark:hover:bg-gray-600">
            Cancel
          </button>
          <button onClick={onConfirm} className={`w-full text-white font-bold py-2 rounded-md transition-shadow flex items-center justify-center gap-2 ${confirmButtonClass}`}>
            <Icon name={confirmIcon} size={18} />
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
