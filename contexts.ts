
import React, { createContext } from 'react';
import { User, View, ToastType } from './types';

type Theme = 'light' | 'dark';

// Context for user data
export const UserContext = createContext<{
  user: User;
  updateUser: React.Dispatch<React.SetStateAction<User>>;
  logout: () => void;
  setAllUsers: React.Dispatch<React.SetStateAction<User[]>>;
} | null>(null);

// Context for theme
export const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
} | null>(null);

// Context for view navigation
export const ViewContext = createContext<{
  setCurrentView: (view: View) => void;
} | null>(null);

// Context for Toasts (Notifications)
export const ToastContext = createContext<{
  showToast: (message: string, type: ToastType) => void;
} | null>(null);
