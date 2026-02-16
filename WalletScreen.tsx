import React, { useState, useContext, useEffect, useMemo } from 'react';
import { UserContext, ToastContext } from '../contexts';
import Icon from '../components/Icon';
import { Transaction, User, Notification, PromoCode, AppSettings, PaymentMethod } from '../types';
import ConfirmModal from '../components/ConfirmModal';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, increment, getDoc, collection, query, where, getDocs, runTransaction } from 'firebase/firestore';
import TransactionCard from '../components/TransactionCard';
import MediaDisplay from '../components/MediaDisplay';

type WalletSheet = null | 'deposit' | 'withdraw' | 'history' | 'convert' | 'share';
type HistoryTab = 'Deposits' | 'Withdrawals' | 'Share' | 'Convert';

interface WalletScreenProps {
    allUsers: User[];
    appSettings: AppSettings;
    paymentMethods: PaymentMethod[];
}

const WalletActionSheet: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
    return (
        <div className={`fixed inset-0 bg-black bg-opacity-70 z-20 flex flex-col justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}>
            <div 
                className={`bg-light-card dark:bg-dark-card/95 backdrop-blur-lg border-t border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-200 rounded-t-3xl pt-2 px-4 pb-[3.8rem] w-full max-w-md mx-auto transition-transform duration-300 relative ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white transition-colors z-10"
                    aria-label="Close"
                >
                    <Icon name="x" size={20} />
                </button>
                <div className="w-10 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-2"></div>
                <h2 className="text-xl font-bold text-center mb-4 text-gray-900 dark:text-white">{title}</h2>
                <div className="max-h-[75vh] overflow-y-auto pr-1 pb-4 custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    )
}

const BalanceCard: React.FC<{ icon: string; label: string; amount: number; gradient: string }> = ({ icon, label, amount, gradient }) => (
    <div className={`text-white p-4 rounded-xl shadow-lg relative overflow-hidden ${gradient}`}>
        <div className="absolute -top-4 -right-4 w-30 h-10 bg-white/10 rounded-full opacity-50"></div>
        <div className="flex items-center mb-2">
            <Icon name={icon} size={16} className="mr-2 opacity-80" />
            <p className={`font-semibold uppercase tracking-wider text-xs`}>{label}</p>
        </div>
        <p className={`font-extrabold text-[1.4rem]`}>💎 {amount.toFixed(1)}</p>
    </div>
);

const ActionButton: React.FC<{ icon: string; label: string; onClick: () => void; gradient: string; }> = ({ icon, label, onClick, gradient }) => (
    <div onClick={onClick} className={`p-4 rounded-lg text-white text-center cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-brand-cyan/20 transform hover:-translate-y-1 ${gradient}`}>
        <Icon name={icon} size={28} className="mx-auto mb-2 opacity-90"/>
        <p className="font-bold text-sm tracking-wide">{label}</p>
    </div>
);

const WalletScreen: React.FC<WalletScreenProps> = ({ allUsers, appSettings, paymentMethods }) => {
    const userContext = useContext(UserContext);
    const toastContext = useContext(ToastContext);

    if (!userContext || !toastContext) return null;
    const { user, updateUser } = userContext;
    const { showToast } = toastContext;

    const [activeSheet, setActiveSheet] = useState<WalletSheet>(null);
    const [withdrawMethod, setWithdrawMethod] = useState('');
    const [walletHistoryTab, setWalletHistoryTab] = useState<HistoryTab>('Deposits');
    
    const [withdrawInfo, setWithdrawInfo] = useState({ accNum: '', accName: '', amount: '' });
    const [convertAmount, setConvertAmount] = useState('');
    const [shareInfo, setShareInfo] = useState({ email: '', amount: '' });
    const [recipient, setRecipient] = useState<User | null>(null);
    
    const [promoCodeInput, setPromoCodeInput] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);

    const [isShareConfirmOpen, setIsShareConfirmOpen] = useState(false);
    const [isConvertConfirmOpen, setIsConvertConfirmOpen] = useState(false);
    
    const enabledMethods = paymentMethods.filter(pm => pm.enabled);
    
    useEffect(() => {
        if (enabledMethods.length > 0 && !withdrawMethod) {
            setWithdrawMethod(enabledMethods[0].name);
        }
    }, [enabledMethods, withdrawMethod]);

    const handleWithdraw = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(withdrawInfo.amount);
        if (isNaN(amount) || amount <= 0) { 
            showToast("Please enter a valid amount.", "error"); 
            return; 
        }
        if (amount < appSettings.minWithdrawal) {
            showToast(`Minimum withdrawal is 💎${appSettings.minWithdrawal}.`, "error");
            return;
        }
        if (amount > user.winnings) { 
            showToast("Insufficient Winnings Balance.", "error"); 
            return; 
        }
        
        showToast("Withdrawal request sent!", "success");
        
        updateUser(prev => ({
            ...prev,
            winnings: prev.winnings - amount,
            transactions: [...prev.transactions, {
                id: Date.now(), 
                type: 'Withdrawal', 
                amount: -amount, 
                date: new Date().toISOString(), 
                status: 'Pending',
                withdrawalDetails: {
                    method: withdrawMethod,
                    accNum: withdrawInfo.accNum,
                    accName: withdrawInfo.accName,
                }
            }]
        }));
        setWithdrawInfo({ accNum: '', accName: '', amount: '' });
        setActiveSheet(null);
    }

    const handleConvert = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(convertAmount);
        if (isNaN(amount) || amount <= 0) { 
            showToast("Enter a valid amount.", "error"); 
            return; 
        }
        if (amount > user.winnings) { 
            showToast("Insufficient Winnings.", "error"); 
            return; 
        }
        setIsConvertConfirmOpen(true);
    }
    
    const handleConfirmConvert = () => {
        const amount = parseFloat(convertAmount);
        updateUser(prev => ({
            ...prev,
            winnings: prev.winnings - amount,
            deposit: prev.deposit + amount,
            transactions: [...prev.transactions, {id: Date.now(), type: 'Conversion', amount: amount, date: new Date().toISOString(), status: 'Completed'}]
        }));
        
        showToast(`Converted 💎${amount} to Deposit Balance`, "success");
        
        setConvertAmount('');
        setActiveSheet(null);
        setIsConvertConfirmOpen(false);
    }

    const handleShareEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const email = e.target.value;
        setShareInfo(prev => ({ ...prev, email }));
    
        if (!email.trim()) {
            setRecipient(null);
            return;
        }
        
        if (email.toLowerCase() === user.email.toLowerCase()) {
            setRecipient(null);
            return;
        }
    
        const foundUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
        setRecipient(foundUser || null);
    };

    const handleShare = (e: React.FormEvent) => {
        e.preventDefault();
        if (!recipient) {
            showToast("Recipient not found.", "error");
            return;
        }
        const amount = parseFloat(shareInfo.amount);
        if (isNaN(amount) || amount <= 0) { 
            showToast("Invalid amount.", "error"); 
            return; 
        }
        if (amount > user.winnings) { 
            showToast("Insufficient winnings.", "error"); 
            return; 
        }
        if (amount > appSettings.shareLimit) {
            showToast(`Share amount cannot exceed the limit of 💎${appSettings.shareLimit}`, 'error');
            return;
        }
        
        setIsShareConfirmOpen(true);
    }
    
    const handleConfirmShare = async () => {
        if (!recipient) return;
        const amount = parseFloat(shareInfo.amount);
        const currentDate = new Date().toISOString();

        try {
            const recipientRef = doc(db, 'users', recipient.email.toLowerCase());
            
            const newRecipientTx: Transaction = { id: Date.now() + 1, type: 'Share', amount: amount, date: currentDate, status: 'Completed', reason: `Received from ${user.name}` };
            const newRecipientNotif: Notification = { id: Date.now(), icon: 'gift', title: 'Diamonds Received!', message: `You have received 💎${amount} from ${user.name}.`, time: new Date().toISOString(), read: false, iconColor: 'text-brand-cyan' };

            await updateDoc(recipientRef, {
                deposit: increment(amount),
                transactions: arrayUnion(newRecipientTx),
                notifications: arrayUnion(newRecipientNotif)
            });

            // Update Sender Local & Firestore
            updateUser(prev => ({
                ...prev,
                winnings: prev.winnings - amount,
                transactions: [...prev.transactions, { 
                    id: Date.now(), 
                    type: 'Share', 
                    amount: -amount, 
                    date: currentDate, 
                    status: 'Completed',
                    reason: `Sent to ${recipient.name} (${recipient.email})` // Add recipient detail here
                }]
            }));

            showToast(`Shared 💎${amount} with ${recipient.name}`, "success");
            setShareInfo({ email: '', amount: '' });
            setRecipient(null);
            setActiveSheet(null);
        } catch (error) {
            console.error("Share error:", error);
            showToast("Transfer failed. Check connection.", "error");
        }
        setIsShareConfirmOpen(false);
    }

    const handleRedeem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!promoCodeInput) return;
        setIsRedeeming(true);

        try {
            const q = query(collection(db, 'promo_codes'), where('code', '==', promoCodeInput.trim()));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                throw new Error("Invalid Promo Code");
            }

            const promoDoc = snapshot.docs[0];
            const promo = promoDoc.data() as PromoCode;
            const now = new Date();

            // Checks
            if (new Date(promo.expiryDate) < now) throw new Error("Promo Code Expired");
            if (promo.uses >= promo.maxUses) throw new Error("Promo Code Fully Redeemed");
            
            const userClaims = promo.claimedBy.filter(c => c.email === user.email).length;
            if (userClaims >= promo.maxUsesPerUser) throw new Error("You have already used this code.");

            // 1. Update Promo Code
            const newClaim = {
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                phone: user.phone,
                timestamp: new Date().toISOString()
            };
            
            await updateDoc(doc(db, 'promo_codes', promoDoc.id.toString()), {
                uses: increment(1),
                claimedBy: arrayUnion(newClaim)
            });

            // 2. Update User
            const transaction: Transaction = {
                id: Date.now(),
                type: 'Promo Code',
                amount: promo.amount,
                date: new Date().toISOString(),
                status: 'Completed',
                reason: `Redeemed: ${promo.code}`
            };

            const updateData: any = {
                transactions: arrayUnion(transaction)
            };
            
            if (promo.depositType === 'Winnings') {
                updateData.winnings = increment(promo.amount);
            } else {
                updateData.deposit = increment(promo.amount);
            }

            await updateDoc(doc(db, 'users', user.email.toLowerCase()), updateData);
            
            showToast(`Successfully redeemed 💎${promo.amount}!`, 'success');
            setPromoCodeInput('');
            setActiveSheet(null);

        } catch (err: any) {
            showToast(err.message || "Failed to redeem code.", 'error');
        } finally {
            setIsRedeeming(false);
        }
    };

    const walletHistoryTransactions = useMemo(() => {
        const sorted = [...user.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        switch (walletHistoryTab) {
            case 'Deposits':
                return sorted.filter(t => ['Deposit', 'Promo Code', 'Winnings', 'Referral Bonus'].includes(t.type) || (t.type === 'Admin Adjustment' && t.amount > 0) || (t.type === 'Share' && t.amount > 0));
            case 'Withdrawals':
                return sorted.filter(t => ['Withdrawal', 'Entry Fee'].includes(t.type) || (t.type === 'Admin Adjustment' && t.amount < 0));
            case 'Share':
                return sorted.filter(t => t.type === 'Share');
            case 'Convert':
                return sorted.filter(t => t.type === 'Conversion');
            default:
                return [];
        }
    }, [user.transactions, walletHistoryTab]);
    
    const recentTransactions = [...user.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);

    const historyTabs: { label: HistoryTab, icon: string }[] = [
        { label: 'Deposits', icon: 'arrow-down-circle' },
        { label: 'Withdrawals', icon: 'send' },
        { label: 'Share', icon: 'share-2' },
        { label: 'Convert', icon: 'convert' },
    ];
    
    // Calculate visible buttons for responsive layout
    const topRowButtons = [
        appSettings.showDepositButton && { key: 'deposit', icon: 'plus-circle', label: 'Deposit', onClick: () => setActiveSheet('deposit'), gradient: 'bg-gradient-to-br from-brand-pink to-brand-cyan' },
        appSettings.showWithdrawButton && { key: 'withdraw', icon: 'send', label: 'Withdraw', onClick: () => setActiveSheet('withdraw'), gradient: 'bg-gradient-to-br from-brand-pink to-brand-cyan' },
    ].filter(Boolean);

    const bottomRowButtons = [
        appSettings.showShareButton && { key: 'share', icon: 'share-2', label: 'Share', onClick: () => setActiveSheet('share'), gradient: 'bg-gradient-to-br from-brand-pink to-brand-cyan' },
        appSettings.showConvertButton && { key: 'convert', icon: 'convert', label: 'Convert', onClick: () => setActiveSheet('convert'), gradient: 'bg-gradient-to-br from-brand-pink to-brand-cyan' },
        { key: 'history', icon: 'history', label: 'History', onClick: () => setActiveSheet('history'), gradient: 'bg-gradient-to-br from-slate-600 to-slate-800' }
    ].filter(Boolean);


    return (
        <div className="p-4">
            {/* Balance Cards */}
            <div className="grid grid-cols-2 gap-2 my-6 ">
                <BalanceCard 
                    icon="arrow-down-circle"
                    label="Deposit"
                    amount={user.deposit}
                    gradient="bg-gradient-to-br from-blue-600 to-brand-cyan"
                />
                <BalanceCard 
                    icon="trophy"
                    label="Winnings"
                    amount={user.winnings}
                    gradient="bg-gradient-to-br from-amber-500 to-yellow-400"
                />
            </div>

            {/* Action Buttons */}
            <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                
                {topRowButtons.length > 0 && (
                    <div className={`grid ${topRowButtons.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-4 mb-4`}>
                        {topRowButtons.map(btn => (
                            <ActionButton key={btn.key} {...btn} />
                        ))}
                    </div>
                )}

                {bottomRowButtons.length > 0 && (
                    <div className={`grid ${
                        bottomRowButtons.length === 1 ? 'grid-cols-1' :
                        bottomRowButtons.length === 2 ? 'grid-cols-2' :
                        'grid-cols-3'
                    } gap-4`}>
                        {bottomRowButtons.map(btn => (
                            <ActionButton key={btn.key} {...btn} />
                        ))}
                    </div>
                )}
            </div>
            
            {/* Recent Transactions */}
            <div>
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
                    <button onClick={() => setActiveSheet('history')} className="text-sm font-semibold text-brand-cyan hover:underline">View All</button>
                 </div>
                 <div className="space-y-3">
                    {recentTransactions.length > 0 ? (
                        recentTransactions.map(tx => (
                            <TransactionCard key={tx.id} transaction={tx} />
                        ))
                    ) : (
                        <div className="text-center text-gray-500 py-8 bg-dark-card rounded-xl border border-white/5">
                            <MediaDisplay 
                                src={appSettings.noTransactionsImageUrl} 
                                alt="No transactions" 
                                className="mx-auto mb-2 object-contain"
                                style={{
                                    width: `${appSettings.noTransactionsImageWidth || 160}px`,
                                    height: `${appSettings.noTransactionsImageHeight || 120}px`
                                }}
                            />
                            <p className="font-semibold">No transactions yet.</p>
                        </div>
                    )}
                 </div>
            </div>

            {/* Action Sheets */}
            <WalletActionSheet isOpen={activeSheet === 'deposit'} onClose={() => setActiveSheet(null)} title="PAYMENT ID">
                <div className="px-2 pb-4">
                    <form onSubmit={handleRedeem}>
                        
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-brand-cyan/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="wallet" size={46} className="text-brand-cyan" />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium max-w-[4500px] mx-auto leading-relaxed">
                                Contact Admin To get Payment ID Then Enter your Payment ID below to Instantly Deposit Diamonds in Your Wallet.
                            </p>
                        </div>
                        
                        <div className="relative mb-4 group">
                            <input 
                                type="text" 
                                value={promoCodeInput} 
                                onChange={e => setPromoCodeInput(e.target.value.toUpperCase())} 
                                placeholder="ENTER PAYMENT ID" 
                                className="w-full h-14 bg-light-bg dark:bg-dark-bg border-2 border-gray-300 dark:border-gray-700 rounded-2xl text-center text-2xl font-bold text-gray-900 dark:text-white focus:border-brand-cyan focus:ring-0 focus:shadow-[0_0_20px_rgba(0,242,255,0.15)] transition-all uppercase font-mono tracking-widest placeholder:text-gray-400 placeholder:text-lg placeholder:font-semibold placeholder:tracking-normal" 
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isRedeeming || !promoCodeInput} 
                            className="w-full h-14 bg-gradient-to-r from-brand-pink to-brand-cyan text-white font-bold py-4 rounded-2xl hover:shadow-lg hover:shadow-brand-cyan/30 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2 text-lg tracking-wide shadow-md"
                        >
                            {isRedeeming ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Icon name="check-circle" size={24} />}
                            {isRedeeming ? 'VERIFYING...' : 'SUBMIT PAYMENT ID'}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
                        <a 
                            href={`https://wa.me/${appSettings.supportNumber}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full bg-dark-bg border border-white/10 hover:border-brand-primary/50 hover:bg-dark-card-hover text-gray-400 hover:text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm group"
                        >
                            <Icon name="message-circle" size={18} className="text-green-500 group-hover:scale-110 transition-transform"/>
                            <span>Contact Admin for Payment ID</span>
                        </a>
                    </div>
                </div>
            </WalletActionSheet>

            <WalletActionSheet isOpen={activeSheet === 'withdraw'} onClose={() => setActiveSheet(null)} title="WITHDRAW 💎">
                <form onSubmit={handleWithdraw} className="text-gray-900 dark:text-white space-y-3">
                     <p className="text-sm text-center mb-0">Available Winnings: <span className="font-bold text-gray-900 dark:text-white">💎{user.winnings.toFixed(2)}</span></p>
                     
                    <div className="text-center text-xs text-gray-500 dark:text-gray-400 bg-light-bg dark:bg-dark-bg p-2 rounded-md border border-gray-200 dark:border-gray-700">
                        Minimum withdrawal is 💎{appSettings.minWithdrawal}. {appSettings.withdrawalInstructionText}
                        
                    </div>
                    <p className="text-sm text-center mb-2">Select Payment Method: <span className="font-bold text-gray-900 dark:text-white"></span></p>
                    
                    {/* Enhanced Method Selection */}
                    {enabledMethods.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 pl-1">
                            {enabledMethods.map(method => (
                                <button type="button" key={method.id} onClick={() => setWithdrawMethod(method.name)} className={`h-22 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center p-3 ${withdrawMethod === method.name ? 'border-brand-cyan bg-brand-cyan/10 ring-9 ring-brand-cyan/50' : 'border-gray-300 dark:border-gray-700 bg-light-bg dark:bg-dark-bg'}`}>
                                    <div className="flex-grow w-full flex items-center justify-center">
                                        <div
                                            className="flex items-center justify-center"
                                            style={{
                                                height: `${method.logoHeight || 40}px`,
                                                width: method.logoWidth ? `${method.logoWidth}px` : '100px',
                                            }}
                                        >
                                            <img 
                                                src={method.logoUrl} 
                                                alt={method.name} 
                                                className="object-contain max-h-full max-w-full"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-800 dark:text-white mt-2 flex-shrink-0">{method.name}</p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-yellow-500 text-sm bg-yellow-500/10 p-3 rounded-lg">Withdrawals are Temporarily Disabled.</p>
                    )}


                    {/* Enhanced Inputs */}
                    <div className="relative pl-1">
                        <Icon name="hash" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"/>
                        <input type="number" value={withdrawInfo.accNum} onChange={e => setWithdrawInfo({...withdrawInfo, accNum: e.target.value})} placeholder="Account Number" className="w-full bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-700 rounded-md p-[0.58rem] pl-9 text-gray-900 dark:text-white focus:border-brand-cyan focus:ring-brand-cyan transition-colors" required/>
                    </div>
                    <div className="relative pl-1">
                         <Icon name="user" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"/>
                        <input type="text" value={withdrawInfo.accName} onChange={e => setWithdrawInfo({...withdrawInfo, accName: e.target.value})} placeholder="Account Holder Name" className="w-full bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-700 rounded-md p-[0.58rem] pl-9 text-gray-900 dark:text-white focus:border-brand-cyan focus:ring-brand-cyan transition-colors" required/>
                    </div>
                    <div className="relative pl-1">
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">💎</span>
                        <input type="number" value={withdrawInfo.amount} onChange={e => setWithdrawInfo({...withdrawInfo, amount: e.target.value})} placeholder="Withdrawal Amount" className="w-full bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-700 rounded-md p-[0.58rem] pl-9 text-gray-900 dark:text-white focus:border-brand-cyan focus:ring-brand-cyan transition-colors" required/>
                    </div>
                  
                    
                    <button type="submit" className="w-full bg-gradient-to-r from-brand-pink to-brand-cyan text-white font-bold py-2.5 rounded-md hover:shadow-lg hover:shadow-brand-cyan/30 transition-all transform hover:-translate-y-1" disabled={enabledMethods.length === 0}>SEND PAYMENT REQUEST</button>
                </form>
            </WalletActionSheet>

            <WalletActionSheet isOpen={activeSheet === 'history'} onClose={() => setActiveSheet(null)} title="Transactions History">
                <div className="grid grid-cols-4 gap-2 bg-dark-bg p-1 rounded-lg border border-white/5 mb-4">
                    {historyTabs.map(tab => (
                        <button 
                            key={tab.label} 
                            onClick={() => setWalletHistoryTab(tab.label)} 
                            className={`flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold rounded-md transition-colors duration-200 ${walletHistoryTab === tab.label ? 'bg-brand-primary text-black shadow' : 'text-gray-400 hover:bg-white/10'}`}
                        >
                            <Icon name={tab.icon} size={12} />
                            {tab.label.toUpperCase()}
                        </button>
                    ))}
                </div>
                {walletHistoryTransactions.length > 0 ? (
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {walletHistoryTransactions.map(tx => (
                            <TransactionCard key={tx.id} transaction={tx} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10">
                        <MediaDisplay src={appSettings.noTransactionsImageUrl} alt="Empty History" className="w-32 h-24 mx-auto mb-4 object-contain" />
                        <p className="font-bold text-gray-500">No Transactions Found</p>
                        <p className="text-xs text-gray-600">This category is empty.</p>
                    </div>
                )}
            </WalletActionSheet>

            <WalletActionSheet isOpen={activeSheet === 'convert'} onClose={() => setActiveSheet(null)} title="Convert Balance">
                <form onSubmit={handleConvert}>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-6">Convert your winning balance into deposit balance and Reuse it to Participate in Upcoming Matches.</p>
                    <p className="text-sm text-center mb-2">Available Winnings: <span className="font-bold text-gray-900 dark:text-white">💎{user.winnings.toFixed(2)}</span></p>
                    <div className="relative mb-4">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">💎</span>
                        <input type="number" placeholder="Enter Amount" value={convertAmount} onChange={e => setConvertAmount(e.target.value)} className="w-full bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-700 rounded-md p-3 pl-9 text-gray-900 dark:text-white focus:border-brand-cyan focus:ring-brand-cyan transition-colors" required/>
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-brand-pink to-brand-cyan text-white font-bold py-3.5 rounded-md hover:shadow-lg hover:shadow-brand-cyan/30 transition-all transform hover:-translate-y-1">CONVERT NOW</button>
                </form>
            </WalletActionSheet>
            
            <WalletActionSheet isOpen={activeSheet === 'share'} onClose={() => setActiveSheet(null)} title="Share Diamonds 💎">
                <form onSubmit={handleShare}>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-6">
                        Share diamonds from your winnings balance with another user. Max share limit is 
                        <span className="font-bold text-brand-cyan"> 💎{appSettings.shareLimit}</span>. This action cannot be undone.
                    </p>
                    <p className="text-sm text-center mb-2">Available for Sharing: <span className="font-bold text-gray-900 dark:text-white">💎{user.winnings.toFixed(2)}</span></p>
                    <div className="relative mb-4">
                        <Icon name="mail" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"/>
                        <input type="email" placeholder="Recipient's Email" value={shareInfo.email} onChange={handleShareEmailChange} className="w-full bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-700 rounded-md p-3 pl-9 text-gray-900 dark:text-white focus:border-brand-cyan focus:ring-brand-cyan transition-colors" required/>
                    </div>
                     {shareInfo.email.trim() && (
                        <div className="mb-4 transition-all duration-300">
                            {recipient ? (
                                <div className="flex items-center p-3 bg-light-bg dark:bg-dark-bg rounded-lg border border-gray-200 dark:border-white/10">
                                    <img src={recipient.avatar} alt={recipient.name} className="w-10 h-10 rounded-full object-cover mr-3"/>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{recipient.name}</p>
                                        <p className="text-xs text-green-500 font-semibold">Recipient Found</p>
                                    </div>
                                </div>
                            ) : (
                                shareInfo.email.toLowerCase() !== user.email.toLowerCase() && (
                                    <div className="text-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                                        <p className="text-sm font-semibold text-red-500">User not found.</p>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                    <div className="relative mb-4">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">💎</span>
                        <input type="number" placeholder="Amount to Share" value={shareInfo.amount} onChange={e => setShareInfo({...shareInfo, amount: e.target.value})} className="w-full bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-700 rounded-md p-3 pl-9 text-gray-900 dark:text-white focus:border-brand-cyan focus:ring-brand-cyan transition-colors" required/>
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-brand-pink to-brand-cyan text-white font-bold py-3.5 rounded-md hover:shadow-lg hover:shadow-brand-cyan/30 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!recipient || !shareInfo.amount}>SEND DIAMONDS</button>
                </form>
            </WalletActionSheet>

            <ConfirmModal
                isOpen={isShareConfirmOpen}
                onClose={() => setIsShareConfirmOpen(false)}
                onConfirm={handleConfirmShare}
                title="Confirm Share"
                message={`Are you sure you want to share 💎${shareInfo.amount} with ${recipient?.name}? This action cannot be undone.`}
                confirmText="Share Now"
                confirmIcon="share-2"
                confirmButtonClass="bg-gradient-to-r from-brand-pink to-brand-cyan hover:opacity-90"
            />

            <ConfirmModal
                isOpen={isConvertConfirmOpen}
                onClose={() => setIsConvertConfirmOpen(false)}
                onConfirm={handleConfirmConvert}
                title="Confirm Conversion"
                message={`Are you sure you want to convert 💎${convertAmount} from winnings to your deposit balance?`}
                confirmText="Convert"
                confirmIcon="repeat"
                confirmButtonClass="bg-gradient-to-r from-brand-pink to-brand-cyan hover:opacity-90"
            />
        </div>
    );
};

export default WalletScreen;