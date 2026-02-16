
import React from 'react';
import { View } from '../types';
import Icon from './Icon';

interface BottomNavProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const NavItem: React.FC<{
  view: View;
  label: string;
  iconName: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ view, label, iconName, isActive, onClick }) => {
  
  const iconClass = `transition-colors duration-200 ${
    isActive 
    ? 'text-brand-cyan' 
    : 'text-gray-400 dark:text-gray-500'
  }`;
    
  const textClass = `mt-1 font-medium transition-colors duration-200 ${
    isActive
    ? 'text-brand-cyan'
    : 'text-gray-500'
  }`;

  const buttonClass = `flex flex-col items-center justify-center w-full pt-2 pb-1 text-xs group`;


  return (
    <button onClick={onClick} className={buttonClass}>
      <Icon name={iconName} className={iconClass} />
      <span className={textClass}>{label}</span>
    </button>
  );
};


const BottomNav: React.FC<BottomNavProps> = ({ currentView, setCurrentView }) => {
  const navItems = [
    { view: View.Home, label: 'Home', icon: 'home' },
    { view: View.Wallet, label: 'Wallet', icon: 'wallet' },
    { view: View.Leaderboard, label: 'Leaderboard', icon: 'bar-chart-2' },
    { view: View.Refer, label: 'Refer', icon: 'gift' },
    { view: View.Profile, label: 'Profile', icon: 'user' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-light-card/80 dark:bg-dark-card/70 backdrop-blur-sm border-t border-gray-200 dark:border-white/10 flex justify-around items-center max-w-md mx-auto z-20">
      {navItems.map(item => (
        <NavItem
          key={item.view}
          view={item.view}
          label={item.label}
          iconName={item.icon}
          isActive={currentView === item.view}
          onClick={() => setCurrentView(item.view)}
        />
      ))}
    </div>
  );
};

export default BottomNav;