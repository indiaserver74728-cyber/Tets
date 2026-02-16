import React from 'react';
import { Transaction } from '../types';
import Icon from './Icon';

const TransactionCard: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
    const isCredit = transaction.amount > 0;
    const iconMap = {
        'Deposit': { icon: 'arrow-down-circle', color: 'text-green-400', bg: 'bg-green-500/10', label: 'Deposit' },
        'Conversion': { icon: 'repeat', color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Conversion' },
        'Withdrawal': { icon: 'send', color: 'text-red-400', bg: 'bg-red-500/10', label: 'Withdrawal' },
        'Entry Fee': { icon: 'gamepad-2', color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Entry Fee' },
        'Share': { icon: 'share-2', color: isCredit ? 'text-green-400' : 'text-red-400', bg: isCredit ? 'bg-green-500/10' : 'bg-red-500/10', label: 'Share' },
        'Winnings': { icon: 'trophy', color: 'text-brand-gold', bg: 'bg-yellow-500/10', label: 'Winnings' },
        'Promo Code': { icon: 'ticket', color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Payment ID' }, // Label for the main heading
        'Admin Adjustment': { icon: 'sliders', color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Adjustment' },
        'Referral Bonus': { icon: 'gift', color: 'text-pink-400', bg: 'bg-pink-500/10', label: 'Referral Bonus' },
    };
    // FIX: Provide a fallback for unexpected transaction types to prevent crashes.
    const typeInfo = iconMap[transaction.type as keyof typeof iconMap] || { icon: 'help-circle', color: 'text-gray-400', bg: 'bg-gray-500/10', label: transaction.type };

    let statusText = 'Completed';
    let statusColor = 'text-green-400';
    if (transaction.status === 'Pending') {
        statusText = 'Pending';
        statusColor = 'text-yellow-400';
    } else if (transaction.status === 'Failed' || transaction.status === 'Rejected') {
        statusText = 'Failed';
        statusColor = 'text-red-400';
    }

    // Function to format the reason for Promo Code transactions
    const formatPromoCodeReason = (reason: string) => {
        if (reason.startsWith('Redeemed: ')) {
            // Extract the code part and prepend new text
            return `USED PAYMENT ID : ${reason.substring('Redeemed: '.length)}`;
        }
        return reason; // Return original reason if it doesn't match
    };

    return (
        <div className="bg-dark-card border border-white/10 rounded-2xl p-4 space-y-3 transition-all hover:border-white/20 hover:shadow-lg">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${typeInfo.bg}`}>
                        <Icon name={typeInfo.icon} size={20} className={typeInfo.color} />
                    </div>
                    <div>
                        <p className="font-bold text-white text-base">{typeInfo.label}</p>
                        <p className={`text-xs font-medium ${statusColor}`}>{statusText}</p>
                    </div>
                </div>
                <p className={`text-xl font-extrabold font-mono ${isCredit ? 'text-green-500' : 'text-red-500'}`}>
                    {isCredit ? '+' : '-'}💎{Math.abs(transaction.amount).toFixed(2)}
                </p>
            </div>

            {(transaction.reason || transaction.withdrawalDetails) && (
                <div className="bg-dark-bg p-3 rounded-lg border border-white/5 text-xs text-gray-400 space-y-1">
                   {transaction.reason && (
                       <p className="flex items-start gap-2">
                           <Icon name="file-text" size={12} className="mt-0.5"/>
                           <span>
                               {transaction.type === 'Promo Code'
                                   ? formatPromoCodeReason(transaction.reason) // Apply formatting for Promo Code
                                   : transaction.reason // Display as is for other types
                               } 
                           </span>
                       </p>
                   )}
                   {transaction.withdrawalDetails && <p className="flex items-center gap-2 font-mono"><Icon name="credit-card" size={12}/> Payment Method : {transaction.withdrawalDetails.method} <br />Account Number : {transaction.withdrawalDetails.accNum.slice(-10)} <br />Account Holder : {transaction.withdrawalDetails.accName.slice(-10)}</p>}
                </div>
            )}
            
            <div className="flex justify-end items-center text-[10px] text-gray-500 font-mono pt-2 border-t border-white/5">
                <span>{new Date(transaction.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
            </div>
        </div>
    );
};

export default React.memo(TransactionCard);