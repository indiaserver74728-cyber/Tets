
import React, { useContext, useState, useEffect, useRef } from 'react';
import Icon from '../Icon';
import { UserContext } from '../../contexts';
import * as assets from '../../assets';

type AdminView = 'dashboard' | 'matches' | 'users';

interface AdminHeaderProps {
    currentView: string;
    setView: (view: AdminView) => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ currentView, setView }) => {
    const userContext = useContext(UserContext);
    const { user, logout } = userContext!;
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'layout-grid' },
        { id: 'matches', label: 'Matches', icon: 'swords' },
        { id: 'users', label: 'Users', icon: 'users' },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownRef]);
    
    useEffect(() => {
        if(window.lucide) window.lucide.createIcons();
    }, [isDropdownOpen]);

    return (
        <header className="bg-light-card dark:bg-dark-card border-b border-gray-200 dark:border-white/10 flex-shrink-0">
            <div className="mx-auto px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <img src={assets.LOGO_IMG} alt="Logo" className="w-9 h-9 rounded-full" />
                        <h1 className="font-bold text-lg text-gray-900 dark:text-white">WarHub Admin</h1>
                    </div>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center space-x-2">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setView(item.id as AdminView)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                                    currentView === item.id
                                        ? 'bg-brand-cyan text-black'
                                        : 'text-gray-500 dark:text-gray-300 hover:bg-light-card-hover dark:hover:bg-dark-card-hover'
                                }`}
                            >
                                <Icon name={item.icon} size={16} />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    {/* Profile Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2">
                            <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-brand-cyan" />
                        </button>
                        
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-light-card dark:bg-dark-card rounded-lg shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden z-10">
                                <div className="p-4 border-b border-gray-200 dark:border-white/10">
                                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{user.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                </div>
                                <div className="p-2">
                                    <button
                                        onClick={logout}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
                                    >
                                        <Icon name="log-out" size={16} />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
