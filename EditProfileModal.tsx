import React, { useState, useContext, useRef, useEffect } from 'react';
import { UserContext, ToastContext } from '../contexts';
import Icon from './Icon';
import { compressImage } from '../utils';
import { uploadMediaAsset } from '../image-hosting';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const userContext = useContext(UserContext);
  const toastContext = useContext(ToastContext);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [password, setPassword] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
      if (isOpen && userContext?.user) {
          setName(userContext.user.name);
          setAvatar(userContext.user.avatar);
          setPassword('');
      }
  }, [isOpen, userContext?.user]);

  if (!userContext) return null;
  const { user, updateUser } = userContext;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      try {
        const base64Data = await compressImage(file, { maxWidth: 256, maxHeight: 256, quality: 0.8 });
        const downloadURL = await uploadMediaAsset(base64Data);
        setAvatar(downloadURL);
        toastContext?.showToast("Avatar updated!", "success");
      } catch (error: any) {
        console.error("Avatar upload failed:", error);
        toastContext?.showToast(error.message || "Failed to upload image. Please try again.", "error");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  const handleSave = () => {
    const updatedUser = {
      ...user,
      name,
      avatar,
    };
    
    if (password.trim()) {
        updatedUser.password = password;
    }

    updateUser(updatedUser);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="relative bg-light-card dark:bg-dark-card rounded-2xl p-6 w-full max-w-sm mx-auto transform transition-all border border-gray-200 dark:border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 p-2 rounded-full text-gray-400 hover:bg-light-card-hover dark:hover:bg-dark-card-hover hover:text-gray-800 dark:hover:text-white transition-colors z-10"
        >
            <Icon name="x" size={24} />
        </button>

        <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-6">Edit Profile</h2>
        
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-24 h-24">
            <img src={avatar} alt="Current Avatar" className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-brand-cyan shadow-lg shadow-brand-cyan/20" />
            {isUploading && (
                <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-white/50 border-t-white rounded-full animate-spin"></div>
                </div>
            )}
          </div>
           <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarChange}
            accept="image/*,image/gif"
            className="hidden"
          />
          <button onClick={triggerFileSelect} disabled={isUploading} className="text-sm font-semibold text-brand-cyan hover:underline flex items-center gap-1 disabled:opacity-50">
            <Icon name="camera" size={14} /> Change Photo
          </button>
        </div>

        <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="name-input" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Display Name</label>
              <div className="relative">
                <Icon name="user" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"/>
                <input 
                  id="name-input"
                  type="text" 
                  placeholder="In-Game Name (IGN)" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-700 rounded-lg p-3 pl-10 text-gray-900 dark:text-white focus:border-brand-cyan focus:ring-brand-cyan transition-colors text-sm font-medium" 
                  required
                />
              </div>
            </div>

            <div>
                <label htmlFor="password-input" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">New Password</label>
                <div className="relative">
                    <Icon name="lock" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"/>
                    <input 
                    id="password-input"
                    type="password" 
                    placeholder="Set New Password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-700 rounded-lg p-3 pl-10 text-gray-900 dark:text-white focus:border-brand-cyan focus:ring-brand-cyan transition-colors text-sm font-medium" 
                    />
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5 ml-1">Leave blank to keep current password.</p>
            </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="w-full bg-gray-200 dark:bg-dark-card-hover text-gray-800 dark:text-white font-bold py-3 rounded-xl transition-colors text-sm">
            Cancel
          </button>
          <button onClick={handleSave} className="w-full bg-gradient-to-r from-brand-pink to-brand-cyan text-white font-bold py-3 rounded-xl transition-shadow shadow-lg shadow-brand-cyan/20 text-sm">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;