
import React, { useContext } from 'react';
import { ThemeContext } from '../contexts';
import Icon from './Icon';

const ThemeToggle: React.FC = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    return null;
  }

  const { theme, setTheme } = context;

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-dark-card transition-colors">
      {theme === 'light' ? (
        <Icon name="moon" size={20} />
      ) : (
        <Icon name="sun" size={20} />
      )}
    </button>
  );
};

export default ThemeToggle;