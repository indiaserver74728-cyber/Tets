import React from 'react';
import Icon from './Icon';
import { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] flex flex-col items-center pointer-events-none space-y-3 px-4 w-full max-w-md">
      {toasts.map(toast => (
        <div 
            key={toast.id} 
            className={`pointer-events-auto flex items-center px-6 py-4 rounded-2xl border-2 shadow-2xl backdrop-blur-xl animate-slide-down w-full
                ${toast.type === 'success' ? 'bg-green-400/30 border-green-500 text-white shadow-green-500/20' : ''}
                ${toast.type === 'error' ? 'bg-red-400/30 border-red-500 text-white shadow-red-500/20' : ''}
                ${toast.type === 'info' ? 'bg-blue-400/30 border-blue-500 text-white shadow-blue-500/20' : ''}
            `}
        >
            <div className="flex-shrink-0 mr-4">
                {toast.type === 'success' && <Icon name="check-circle" size={28} className="text-white drop-shadow-md" />}
                {toast.type === 'error' && <Icon name="x-circle" size={28} className="text-white drop-shadow-md" />}
                {toast.type === 'info' && <Icon name="info" size={28} className="text-white drop-shadow-md" />}
            </div>
            <div className="flex-1">
                <p className="text-base font-bold leading-snug drop-shadow-md">{toast.message}</p>
            </div>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;