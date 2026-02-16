import React, { useState, useEffect, useMemo, useContext } from 'react';
import Icon from '../../components/Icon';
import * as types from '../../types';
import { db } from '../../firebase';
import { doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import AdminSection from '../../components/admin/AdminSection';
import { ToastContext } from '../../contexts';

interface ReferralsProps {
    users: types.User[];
    referralSettings: types.ReferralSettings;
    setReferralSettings: React.Dispatch<React.SetStateAction<types.ReferralSettings>>;
}

/* --- Reusable UI Components --- */
const SectionTitle: React.FC<{ title: string; description: string }> = ({ title, description }) => (
    <div className="mb-6 border-b border-white/5 pb-2">
        <h3 className="text-lg font-bold text-white uppercase tracking-wide">{title}</h3>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
);

const InputGroup: React.FC<{ 
    label: string; icon: string; value: string | number; 
    onChange: (val: string) => void; type?: string; multiline?: boolean; helper?: string;
}> = ({ label, icon, value, onChange, type = "text", multiline = false, helper }) => (
    <div className="mb-5">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Icon name={icon} size={12} className="text-brand-primary/70" /> {label}
        </label>
        {multiline ? (
            <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand-primary outline-none resize-y"/>
        ) : (
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-sm text-white focus:border-brand-primary outline-none"/>
        )}
        {helper && <p className="text-[10px] text-gray-600 mt-1.5 ml-1">{helper}</p>}
    </div>
);

const ToggleSwitch: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between bg-dark-bg border border-white/5 p-4 rounded-xl hover:border-white/10">
        <div>
            <p className="font-bold text-sm text-white">{label}</p>
            {!checked && <p className="text-[10px] text-red-400 mt-1">Referral input will be hidden on Signup.</p>}
        </div>
        <button onClick={() => onChange(!checked)} className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-brand-primary' : 'bg-gray-700'}`}>
            <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-md transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
    </div>
);

const StatCard: React.FC<{ icon: string; label: string; value: string | number; color: string; }> = ({ icon, label, value, color }) => (
    <div className={`bg-dark-card border border-white/5 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:shadow-xl transition-all hover:border-white/10 group relative overflow-hidden`}>
        <div className={`absolute -top-4 -right-4 w-20 h-20 ${color} bg-opacity-10 rounded-full transition-transform group-hover:scale-125`}></div>
        <div className="relative z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${color} bg-opacity-20`}>
                <Icon name={icon} size={20} className={color.replace('bg-', 'text-')} />
            </div>
            <p className="text-3xl font-extrabold text-white group-hover:scale-105 transition-transform origin-left">{value}</p>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mt-1">{label}</p>
        </div>
    </div>
);

const AdminReferralsScreen: React.FC<ReferralsProps> = (props) => {
    const { users, referralSettings, setReferralSettings } = props;
    const [tab, setTab] = useState<'pending' | 'completed'>('pending');
    const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
    const toastContext = useContext(ToastContext);
    const [settings, setSettings] = useState(referralSettings);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => { setSettings(referralSettings); }, [referralSettings]);
    useEffect(() => { if (window.lucide) window.lucide.createIcons(); }, [tab, users, settings]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateDoc(doc(db, 'settings', 'referral'), settings);
            setReferralSettings(settings);
            toastContext?.showToast("Referral settings saved!", "success");
        } catch(e) { console.error(e); toastContext?.showToast("Failed to save settings.", "error"); } finally { setIsSaving(false); }
    };

    const allReferrals = useMemo(() => {
        return users.filter(u => u.referredBy).map(referredUser => ({
            referredUser, 
            referrerUser: users.find(u => u.referralCode === referredUser.referredBy)
        })).filter((r): r is { referredUser: types.User; referrerUser: types.User } => !!r.referrerUser);
    }, [users]);
    
    const topReferrers = useMemo(() => {
        const referrerCounts = new Map<string, number>();
        users.forEach(user => {
            if (user.referredBy) {
                referrerCounts.set(user.referredBy, (referrerCounts.get(user.referredBy) || 0) + 1);
            }
        });

        return Array.from(referrerCounts.entries())
            .map(([referralCode, count]) => {
                const referrerUser = users.find(u => u.referralCode === referralCode);
                return referrerUser ? { ...referrerUser, referralCount: count } : null;
            })
            .filter((u): u is types.User & { referralCount: number } => u !== null)
            .sort((a, b) => b.referralCount - a.referralCount)
            .slice(0, 5);
    }, [users]);
    
    const pendingReferrals = allReferrals.filter(r => !r.referredUser.referralRewardClaimed && r.referredUser.matches === 0);
    const completedReferrals = allReferrals.filter(r => r.referredUser.referralRewardClaimed || r.referredUser.matches > 0);

    const stats = {
        total: allReferrals.length, 
        completed: completedReferrals.length, 
        pending: pendingReferrals.length,
        totalValue: completedReferrals.length * (settings.newUserReward + settings.referrerReward)
    };

    const handleManualApprove = async (referredUser: types.User, referrerUser: types.User) => {
        if (!window.confirm(`Are you sure you want to approve this referral?\n\nThis will add ${settings.newUserReward} gems to ${referredUser.name} and ${settings.referrerReward} gems to ${referrerUser.name}.`)) {
            return;
        }

        setLoadingUserId(referredUser.email);
        try {
            const referredUserRef = doc(db, 'users', referredUser.email);
            const referredTx: types.Transaction = { id: Date.now(), type: 'Referral Bonus', amount: settings.newUserReward, date: new Date().toISOString(), status: 'Completed', reason: `Signup bonus from ${referrerUser.name}`};
            await updateDoc(referredUserRef, { deposit: increment(settings.newUserReward), referralRewardClaimed: true, transactions: arrayUnion(referredTx) });

            const referrerUserRef = doc(db, 'users', referrerUser.email);
            const referrerTx: types.Transaction = { id: Date.now() + 1, type: 'Referral Bonus', amount: settings.referrerReward, date: new Date().toISOString(), status: 'Completed', reason: `Bonus for referring ${referredUser.name}`};
            const referrerNotif: types.Notification = { id: Date.now(), icon: 'user-plus', title: 'Referral Success!', message: `Your friend ${referredUser.name} completed the referral! You earned 💎${settings.referrerReward}.`, time: new Date().toISOString(), read: false, iconColor: 'text-brand-cyan'};
            await updateDoc(referrerUserRef, { deposit: increment(settings.referrerReward), transactions: arrayUnion(referrerTx), notifications: arrayUnion(referrerNotif) });
            
            toastContext?.showToast('Referral approved successfully!', 'success');
        } catch (error) { console.error(error); toastContext?.showToast('Failed to approve referral.', 'error'); } finally { setLoadingUserId(null); }
    };

    const handleManualReject = async (referredUser: types.User) => {
        if (!window.confirm(`Are you sure you want to REJECT this referral for ${referredUser.name}?\n\nThey will NOT receive a bonus.`)) {
            return;
        }

        setLoadingUserId(referredUser.email);
        try {
            await updateDoc(doc(db, 'users', referredUser.email.toLowerCase()), { referralRewardClaimed: true });
            toastContext?.showToast('Referral has been rejected.', 'info');
        } catch (error) { console.error("Error rejecting referral:", error); toastContext?.showToast('Failed to reject referral.', 'error'); } finally { setLoadingUserId(null); }
    };
    
    // --- ENHANCED REFERRAL CARD WITH RGB BORDER ---
    const ReferralCard: React.FC<{ referredUser: types.User; referrerUser: types.User }> = ({ referredUser, referrerUser }) => {
        const isProcessing = loadingUserId === referredUser.email;
        const isPending = !referredUser.referralRewardClaimed && referredUser.matches === 0;

        return (
            <div className={`rounded-2xl transition-all ${isPending ? 'p-[2px] rgb-glow shadow-lg shadow-brand-primary/20' : 'bg-dark-card border border-white/10 hover:border-brand-primary/30'}`}>
                <div className="bg-dark-card rounded-2xl overflow-hidden h-full">
                    <div className="p-5">
                        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                            
                            {/* LEFT: Referrer Details (Avatar -> Details) */}
                            <div className="flex-1 flex items-start gap-4 w-full md:w-auto bg-white/5 p-3 rounded-xl border border-white/5">
                                <div className="relative shrink-0">
                                    <img src={referrerUser.avatar || 'https://via.placeholder.com/40'} className="w-12 h-12 rounded-full object-cover border-2 border-purple-500/30" alt={referrerUser.name}/>
                                    <div className="absolute -bottom-1 -right-1 bg-dark-bg rounded-full p-0.5"><div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center"><Icon name="link" size={10} className="text-white"/></div></div>
                                </div>
                                <div className="min-w-0 overflow-hidden flex flex-col">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Referrer</span>
                                        <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-500/30">
                                            +{settings.referrerReward} 💎
                                        </span>
                                    </div>
                                    <p className="font-bold text-white text-base truncate leading-tight mt-1">{referrerUser.name}</p>
                                    <p className="text-xs text-white-900 truncate mt-1">{referrerUser.email}</p>
                                    <p className="text-[10px] text-white-900 font-mono mt-0.5">Reg No: {referrerUser.phone || referrerUser.id}</p>
                                </div>
                            </div>

                            {/* CENTER: Code & Arrow */}
                            <div className="flex flex-col items-center justify-center shrink-0 w-full md:w-auto self-center">
                                <div className="bg-brand-cyan/10 border border-brand-cyan/20 px-3 py-1 rounded-full mb-2">
                                    <span className="text-white-900 mono font-bold text-brand-cyan tracking-widest">{referrerUser.referralCode}</span>
                                </div>
                                <div className="flex items-center text-white-cyan-900 gap-2">
                                    <Icon className="text-gray-500 hidden md:block" name="arrow-right" size={24}/>
                                    <Icon className="text-gray-500 md:hidden" name="arrow-down" size={24}/>
                                </div>
                            </div>

                            {/* RIGHT: New User Details */}
                            <div className="flex-1 flex items-start gap-4 w-full md:w-auto bg-white/5 p-3 rounded-xl border border-white/5">
                                <div className="relative shrink-0">
                                    <img src={referredUser.avatar || 'https://via.placeholder.com/40'} className="w-12 h-12 rounded-full object-cover border-2 border-green-500/30" alt={referredUser.name}/>
                                    <div className="absolute -bottom-1 -right-1 bg-dark-bg rounded-full p-0.5"><div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"><Icon name="user-plus" size={10} className="text-white"/></div></div>
                                </div>
                                <div className="min-w-0 overflow-hidden flex flex-col">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">New User</span>
                                        <span className="bg-green-500/20 text-green-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-green-500/30">
                                            +{settings.newUserReward} 💎
                                        </span>
                                    </div>
                                    <p className="font-bold text-white text-base truncate leading-tight mt-1">{referredUser.name}</p>
                                    <p className="text-xs text-white-900 truncate mt-1">{referredUser.email}</p>
                                    <p className="text-[10px] text-white-900 font-mono mt-0.5">Reg No: {referredUser.phone || referredUser.id}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Section */}
                    <div className="bg-black/20 p-3 px-5 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Icon name="clock" size={14} />
                            <span>Signed up: <span className="text-gray-300 font-medium">{new Date(referredUser.creationDate).toLocaleString()}</span></span>
                        </div>
                        
                        {isPending ? (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button 
                                    onClick={() => handleManualReject(referredUser)} 
                                    disabled={isProcessing} 
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all text-xs font-bold uppercase disabled:opacity-50"
                                >
                                    {isProcessing ? <span className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full"/> : <Icon name="x" size={14} />} Reject
                                </button>
                                <button 
                                    onClick={() => handleManualApprove(referredUser, referrerUser)} 
                                    disabled={isProcessing} 
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 transition-all text-xs font-bold uppercase disabled:opacity-50"
                                >
                                    {isProcessing ? <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"/> : <Icon name="check" size={14} />} Approve
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 bg-brand-cyan/5 px-3 py-1.5 rounded border border-brand-cyan/10">
                                <Icon name="check-circle" size={14} className="text-brand-cyan"/>
                                <span className="text-xs font-bold text-gray-300">
                                    Rewards Paid: <span className="text-brand-cyan">💎{settings.newUserReward} + 💎{settings.referrerReward}</span>
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AdminSection icon="gift" title="Referral Management" subtitle="Control Referral Rewards, Set Refer Settings, and Control Referrals.">
            {/* Custom Styles for RGB Glow */}
            <style>{`
                @keyframes rgb-flow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .rgb-glow {
                    background: linear-gradient(45deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000);
                    background-size: 400% 400%;
                    animation: rgb-flow 5s ease infinite;
                }
            `}</style>

            <div className="space-y-12">
                
                {/* SETTINGS SECTION */}
                <section>
                    <SectionTitle title="Referral Settings" description="Manage Rewards, Content and Settings for the Referral Program." />
                    <div className="bg-dark-bg p-6 rounded-2xl border border-white/10 space-y-4 shadow-sm">
                        <ToggleSwitch label="Enable Referral System" checked={settings.enabled} onChange={(v) => setSettings(p => ({...p, enabled: v}))} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputGroup label="Sign Up Bonus (Gems)" value={settings.newUserReward} onChange={(v) => setSettings(p => ({...p, newUserReward: parseInt(v) || 0}))} type="number" icon="gift" />
                            <InputGroup label="Referrer Bonus (Gems)" value={settings.referrerReward} onChange={(v) => setSettings(p => ({...p, referrerReward: parseInt(v) || 0}))} type="number" icon="users" />
                        </div>
                        <InputGroup label="Instruction Text" value={settings.text} onChange={(v) => setSettings(p => ({...p, text: v}))} multiline icon="info" />
                        <InputGroup label="Share Message Template" value={settings.shareMessageTemplate} onChange={(v) => setSettings(p => ({...p, shareMessageTemplate: v}))} multiline icon="share-2" helper="Use [USERNAME] and [REFERRALCODE] as placeholders." />
                         <div className="flex justify-end pt-4 border-t border-white/5">
                            <button onClick={handleSave} disabled={isSaving} className="bg-brand-primary text-black font-extrabold px-6 py-2.5 rounded-xl text-sm hover:shadow-lg hover:shadow-brand-primary/20 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                {isSaving ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <Icon name="save" size={16} />} {isSaving ? 'SAVING...' : 'SAVE SETTINGS'}
                            </button>
                        </div>
                    </div>
                </section>

                {/* TRACKING SECTION */}
                <section>
                    <SectionTitle title="Referral Tracking" description="Track and manually approve pending referrals." />
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard label="Total Referrals" value={stats.total} icon="users" color="bg-blue-500" />
                        <StatCard label="Completed" value={stats.completed} icon="check-circle" color="bg-green-500" />
                        <StatCard label="Pending" value={stats.pending} icon="clock" color="bg-yellow-500" />
                        <StatCard label="Total Paid" value={`${stats.totalValue.toLocaleString()}`} icon="gem" color="bg-purple-500" />
                    </div>
                    
                    {/* Top Referrers */}
                    <div className="bg-dark-bg p-6 rounded-2xl border border-white/10 mb-8">
                        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2"><Icon name="bar-chart-2" size={18} className="text-brand-primary"/> Top Referrers</h3>
                        <div className="space-y-3">
                            {topReferrers.length > 0 ? topReferrers.map((referrer, index) => {
                                const rank = index + 1;
                                let rankColor = rank === 1 ? 'text-brand-gold' : rank === 2 ? 'text-brand-silver' : rank === 3 ? 'text-brand-bronze' : 'text-gray-500';
                                return (
                                    <div key={referrer.email} className="bg-dark-card border border-white/5 rounded-xl p-3 flex items-center gap-4 hover:bg-white/5 transition-colors">
                                        <div className={`w-8 text-center font-bold text-lg ${rankColor}`}>#{rank}</div>
                                        <img src={referrer.avatar || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-full object-cover" alt={referrer.name} />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white truncate">{referrer.name}</p>
                                            <p className="text-xs text-gray-500 font-mono">{referrer.referralCode}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-extrabold text-brand-cyan text-lg">{referrer.referralCount}</p>
                                            <p className="text-[10px] text-gray-500 uppercase">Users</p>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <p className="text-xs text-gray-500 italic text-center py-4">No referral data available yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center border border-white/10 rounded-lg p-1 mb-6 max-w-sm bg-dark-bg mx-auto md:mx-0">
                        <button onClick={() => setTab('pending')} className={`relative w-1/2 py-2 rounded font-semibold transition-colors text-sm flex items-center justify-center gap-2 ${tab === 'pending' ? 'bg-brand-primary text-black' : 'text-gray-400 hover:text-white'}`}>
                            PENDING {stats.pending > 0 && <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">{stats.pending}</span>}
                        </button>
                        <button onClick={() => setTab('completed')} className={`w-1/2 py-2 rounded font-semibold transition-colors text-sm ${tab === 'completed' ? 'bg-brand-primary text-black' : 'text-gray-400 hover:text-white'}`}>
                            COMPLETED
                        </button>
                    </div>

                    {/* Referral Cards List */}
                    <div className="space-y-4">
                        {(tab === 'pending' ? pendingReferrals : completedReferrals).length > 0 ? ( 
                            (tab === 'pending' ? pendingReferrals : completedReferrals).map(({referredUser, referrerUser}) => (
                                <ReferralCard key={referredUser.email} referredUser={referredUser} referrerUser={referrerUser} />
                            )) 
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-gray-500 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                    <Icon name="inbox" size={32} className="opacity-40"/>
                                </div>
                                <p className="font-semibold">No {tab} referrals found.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </AdminSection>
    );
};

export default AdminReferralsScreen;