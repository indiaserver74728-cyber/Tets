
import React, { useEffect } from 'react';
import Icon from '../Icon';

interface AdminSectionProps {
    icon: string;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    iconColor?: string;
}

const AdminSection: React.FC<AdminSectionProps> = ({ icon, title, subtitle, children, iconColor = 'bg-brand-primary' }) => {
    
    useEffect(() => {
        if(window.lucide) window.lucide.createIcons();
    }, []);

    return (
        <div className="bg-dark-card border border-white/10 rounded-2xl p-3 shimmer-bg">
            <div className="flex items-start gap-4 mb-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                    <Icon name={icon} size={24} className="text-black" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white uppercase">{title}</h2>
                    {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
                </div>
            </div>
            {children}
        </div>
    );
};

export default AdminSection;
