import React, { useState, useEffect, useContext } from 'react';
import Icon from '../components/Icon';
import * as assets from '../assets';
import { UserContext, ToastContext } from '../contexts';
import ReferListModal from '../components/ReferListModal';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { User, ReferralSettings, AppSettings } from '../types';
import MediaDisplay from '../components/MediaDisplay';

interface ReferredUser {
  name: string;
  reward: number;
  status: 'Claimed' | 'Pending';
  avatar: string;
}

interface ReferScreenProps {
    referralSettings: ReferralSettings;
    appSettings: AppSettings;
}

const ReferScreen: React.FC<ReferScreenProps> = ({ referralSettings, appSettings }) => {
    const userContext = useContext(UserContext);
    const toastContext = useContext(ToastContext);
    const user = userContext?.user;
    const showToast = toastContext?.showToast;
    
    const referralCode = user?.referralCode || 'WARHUB';
    
    const [copied, setCopied] = useState(false);
    const [isReferListModalOpen, setIsReferListModalOpen] = useState(false);
    const [referredUsersList, setReferredUsersList] = useState<ReferredUser[]>([]);
    const [isLoadingRefers, setIsLoadingRefers] = useState(false);

    useEffect(() => {
        if(window.lucide) window.lucide.createIcons();
    }, [copied, isReferListModalOpen]);

    useEffect(() => {
        const fetchReferredUsers = async () => {
            if (!user?.referralCode) return;
            setIsLoadingRefers(true);
            try {
                const q = query(collection(db, 'users'), where('referredBy', '==', user.referralCode));
                const querySnapshot = await getDocs(q);
                
                const fetchedUsers: ReferredUser[] = querySnapshot.docs.map(doc => {
                    const data = doc.data() as User;
                    const hasPlayed = data.matches > 0 || data.referralRewardClaimed;
                    return {
                        name: data.name,
                        avatar: data.avatar,
                        status: hasPlayed ? 'Claimed' : 'Pending',
                        reward: hasPlayed ? referralSettings.referrerReward : 0
                    };
                });
                
                setReferredUsersList(fetchedUsers);
            } catch (error) {
                console.error("Error fetching referrals:", error);
            } finally {
                setIsLoadingRefers(false);
            }
        };

        fetchReferredUsers();
    }, [user?.referralCode, referralSettings.referrerReward]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralCode).then(() => {
            setCopied(true);
            if(showToast) showToast('Referral code copied!', 'success');
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const shareMessage = referralSettings.shareMessageTemplate
        .replace(/\[USERNAME\]/g, user?.name || 'Your friend')
        .replace(/\[REFERRALCODE\]/g, referralCode);

    const handleReferNow = () => {
        const fullShareMessage = `${shareMessage} ${appSettings.shareAppUrl}`;
        if (navigator.share) {
            navigator.share({
                title: `Join me on ${appSettings.appName}!`,
                text: shareMessage,
                url: appSettings.shareAppUrl,
            }).catch((error) => {
                if (error.name !== 'AbortError') {
                    navigator.clipboard.writeText(fullShareMessage)
                        .then(() => showToast && showToast('Sharing failed. Message copied!', 'info'))
                        .catch(() => showToast && showToast('Could not share or copy message.', 'error'));
                }
            });
        } else {
            navigator.clipboard.writeText(fullShareMessage).then(() => {
                if(showToast) showToast('Referral message copied!', 'success');
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                if(showToast) showToast('Could not copy message.', 'error');
            });
        }
    };

    return (
        <>
            <div className="p-4 text-center">
                <MediaDisplay src={referralSettings.imageUrl} alt="Refer a friend" className="w-full h-36 object-contain rounded-lg my-6" />
                
                <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Earn More With Friends! ✌️</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm mx-auto">{referralSettings.text}</p>

                <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg mb-6 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 relative">
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-2 font-semibold">Your Referral:</p>
                    <span className="text-3xl font-extrabold tracking-[0.2em] text-brand-cyan">{referralCode}</span>
                    <button onClick={copyToClipboard} className="absolute top-1/2 right-3 -translate-y-1/2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white p-2 rounded-md text-sm font-semibold transition-all hover:bg-gray-300 dark:hover:bg-gray-600">
                        {copied ? <Icon name="check" size={16} className="text-green-500"/> : <Icon name="copy" size={16} />}
                    </button>
                </div>

                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 font-semibold">♦️ HOW IT WORKS ♦️</p>
                <div className="flex justify-center items-center gap-2 text-center text-xs text-gray-500 dark:text-gray-400 mb-8">
                    <div className="flex flex-col items-center">
                        <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-white/10 rounded-lg p-3 mb-2">
                            <Icon name="user-plus" size={24} className="text-brand-cyan" />
                        </div>
                        <p>Register</p>
                    </div>
                    <Icon name="arrow-right" className="text-gray-400 dark:text-gray-600 mx-2"/>
                    <div className="flex flex-col items-center">
                        <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-white/10 rounded-lg p-3 mb-2">
                            <Icon name="swords" size={24} className="text-brand-cyan" />
                        </div>
                        <p>Join Match</p>
                    </div>
                     <Icon name="arrow-right" className="text-gray-400 dark:text-gray-600 mx-2"/>
                     <div className="flex flex-col items-center">
                        <div className="bg-light-card dark:bg-dark-card border border-gray-200 dark:border-white/10 rounded-lg p-3 mb-2">
                            <Icon name="gift" size={24} className="text-brand-cyan" />
                        </div>
                        <p>Get Reward</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <button onClick={handleReferNow} className="w-full bg-gradient-to-r from-brand-pink to-brand-cyan text-white font-bold py-3.5 rounded-md hover:shadow-lg hover:shadow-brand-cyan/30 transition-all transform hover:-translate-y-1">REFER NOW</button>
                    <button onClick={() => setIsReferListModalOpen(true)} className="w-full bg-light-card dark:bg-dark-card border-2 border-transparent text-gray-800 dark:text-white font-bold py-3.5 rounded-md hover:bg-light-card-hover dark:hover:bg-dark-card-hover transition-all transform hover:-translate-y-1 btn-chromatic-hover">
                        REFER LIST {referredUsersList.length > 0 && `(${referredUsersList.length})`}
                    </button>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">Note: Bonus is applied only after the referred person joins a paid match.</p>
            </div>
            <ReferListModal 
                isOpen={isReferListModalOpen} 
                onClose={() => setIsReferListModalOpen(false)} 
                referredUsers={referredUsersList}
                appSettings={appSettings}
            />
        </>
    );
};

export default ReferScreen;