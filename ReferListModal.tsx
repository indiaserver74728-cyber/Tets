import React from 'react';
import Icon from './Icon';
import { AppSettings } from '../types';
import MediaDisplay from './MediaDisplay';

interface ReferredUser {
  name: string;
  reward: number;
  status: 'Claimed' | 'Pending';
  avatar: string;
}

interface ReferListModalProps {
  isOpen: boolean;
  onClose: () => void;
  referredUsers: ReferredUser[];
  appSettings: AppSettings;
}

const ReferListModal: React.FC<ReferListModalProps> = ({ isOpen, onClose, referredUsers, appSettings }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex flex-col justify-end p-4 max-w-md mx-auto" onClick={onClose}>
      <div 
        className={`bg-light-card dark:bg-dark-card text-gray-800 dark:text-gray-200 rounded-t-3xl p-4 w-full transition-transform duration-300 transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-200 dark:border-white/10">
          <div className="w-10"></div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center"><Icon name="users" className="text-brand-cyan mr-2"/>REFERRAL LIST</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white p-2 rounded-full">
            <Icon name="x" size={24} />
          </button>
        </div>
        
        {referredUsers.length > 0 ? (
          <div className="flex-grow overflow-y-auto space-y-3 pr-2 max-h-80">
            {referredUsers.map((user, index) => (
              <div key={index} className="flex items-center p-3 bg-light-bg dark:bg-dark-bg rounded-lg border border-gray-200 dark:border-white/10">
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover mr-3 flex-shrink-0 border-2 border-white/10" />
                <div className="flex-grow min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                  <p className={`text-xs font-medium ${user.status === 'Claimed' ? 'text-green-500' : 'text-yellow-500'}`}>
                    {user.status}
                  </p>
                </div>
                {user.status === 'Claimed' && (
                    <div className="font-bold text-brand-cyan text-sm">💎 {user.reward}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <MediaDisplay 
                src={appSettings.noReferralsImageUrl} 
                alt="No referrals" 
                className="mx-auto object-contain"
                style={{
                    width: `${appSettings.noReferralsImageWidth || 160}px`,
                    height: `${appSettings.noReferralsImageHeight || 160}px`
                }}
            />
            <p className="mt-4 font-medium text-gray-500">You haven't referred anyone yet.</p>
            <p className="text-xs text-gray-500 mt-1">Share your code to earn rewards!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferListModal;