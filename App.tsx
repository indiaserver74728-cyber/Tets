import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { View, User, Match, Promotion, AppSettings, Category, PaymentMethod, ReferralSettings, ToastMessage, ToastType, PromoCode, InAppAd } from './types';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import ToastContainer from './components/Toast';
import AnnouncementBar from './components/AnnouncementBar';
import { UserContext, ThemeContext, ViewContext, ToastContext } from './contexts';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import * as assets from './assets';
import Icon from './components/Icon';
import AdModal from './components/AdModal';
import MediaDisplay from './components/MediaDisplay';
import WhatsAppButton from './components/WhatsAppButton';
import NoInternetScreen from './components/NoInternetScreen';

// Lazy load screen components for better performance
const HomeScreen = lazy(() => import('./screens/HomeScreen'));
const WalletScreen = lazy(() => import('./screens/WalletScreen'));
const LeaderboardScreen = lazy(() => import('./screens/LeaderboardScreen'));
const ReferScreen = lazy(() => import('./screens/ReferScreen'));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));
const AuthScreen = lazy(() => import('./screens/AuthScreen'));
const AdminScreen = lazy(() => import('./screens/AdminScreen'));

type Theme = 'light' | 'dark';

const AppLoading: React.FC = () => (
    <div className="h-full flex flex-col items-center justify-center bg-dark-bg text-brand-cyan">
        <img src={assets.LOGO_IMG} alt="WarHub Loading" className="w-24 h-24 mb-4 animate-pulse" />
        <p>Loading Please Wait ...</p>
    </div>
);

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>(View.Home);
    const [theme, setTheme] = useState<Theme>('dark');
    const [homeResetToken, setHomeResetToken] = useState(0);
    
    // Auth State
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdminView, setIsAdminView] = useState(false);

    // Auth transition state
    const [isFadingOut, setIsFadingOut] = useState(false);
    const prevUser = useRef<User | null>(user);
    const [isFadingIn, setIsFadingIn] = useState(false);

    // Toast State
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    // Ad Modal State
    const [isAdModalOpen, setIsAdModalOpen] = useState(false);
    const [adQueue, setAdQueue] = useState<InAppAd[]>([]);
    const [currentAdIndex, setCurrentAdIndex] = useState(0);

    // Connectivity State
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [cachedOfflineAsset, setCachedOfflineAsset] = useState<string | null>(null);

    // Data State (Synced with Firestore)
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [appSettings, setAppSettings] = useState<AppSettings>({} as AppSettings);
    const [categories, setCategories] = useState<Category[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [referralSettings, setReferralSettings] = useState<ReferralSettings>({} as ReferralSettings);

    const showToast = (message: string, type: ToastType) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };
    
    // --- OFFLINE ASSET CACHING ---
    useEffect(() => {
        // On initial load, try to get the asset from localStorage
        const storedAsset = localStorage.getItem('offlineAsset');
        if (storedAsset) {
            setCachedOfflineAsset(storedAsset);
        }

        // Function to fetch and cache the asset
        const cacheOfflineAsset = async () => {
            if (isOnline && appSettings.noInternetImageUrl) {
                const storedUrl = localStorage.getItem('offlineAssetUrl');
                // Only re-fetch if the URL has changed to avoid unnecessary downloads
                if (storedUrl !== appSettings.noInternetImageUrl) {
                    try {
                        const response = await fetch(appSettings.noInternetImageUrl);
                        if (!response.ok) throw new Error('Network response was not ok');
                        const blob = await response.blob();
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const base64data = reader.result as string;
                            localStorage.setItem('offlineAsset', base64data);
                            localStorage.setItem('offlineAssetUrl', appSettings.noInternetImageUrl);
                            setCachedOfflineAsset(base64data);
                        };
                        reader.readAsDataURL(blob);
                    } catch (error) {
                        console.error('Failed to cache offline asset:', error);
                        // Clear potentially stale cache if fetching fails
                        localStorage.removeItem('offlineAsset');
                        localStorage.removeItem('offlineAssetUrl');
                        setCachedOfflineAsset(null);
                    }
                }
            }
        };

        cacheOfflineAsset();
    }, [appSettings.noInternetImageUrl, isOnline]);


    // --- CONNECTIVITY LISTENER ---
    useEffect(() => {
        const handleOnline = () => {
            showToast("You're back online!", 'success');
            setIsOnline(true);
        };
        const handleOffline = () => {
            showToast("Connection lost. You are now offline.", 'error');
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []); // Empty dependency array ensures this runs once

    // --- SERVICE WORKER REGISTRATION ---
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    })
                    .catch(err => {
                        console.log('ServiceWorker registration failed: ', err);
                    });
            });
        }
    }, []);
    
    // Login/logout state management for animations
    useEffect(() => {
        // Just logged in
        if (!prevUser.current && user) {
            setIsFadingIn(true);
            setIsFadingOut(false); // Reset fade-out state
        }
        // Just logged out
        if (prevUser.current && !user) {
            setIsFadingIn(false); // Reset fade-in state for next time
        }
        prevUser.current = user;
    }, [user]);

    // --- AUTHENTICATION LISTENER ---
    useEffect(() => {
        let unsubscribeUserDoc: (() => void) | null = null;
        const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
            if (unsubscribeUserDoc) unsubscribeUserDoc();
            
            if (authUser && authUser.email) {
                const userEmail = authUser.email.toLowerCase();
                const userDocRef = doc(db, 'users', userEmail);
                
                const handleUserDoc = (userDoc: any) => { // DocumentSnapshot
                    if (userDoc.exists()) {
                        const userData = userDoc.data() as User;
                        setUser(userData);
                        
                        const authAction = sessionStorage.getItem('authAction');
                        if (authAction) {
                            if (authAction === 'login') showToast('Login Successful!', 'success');
                            else if (authAction === 'signup') showToast('Signup Successful! Welcome!', 'success');
                            sessionStorage.removeItem('authAction');
                        }
                    } else {
                        showToast('User profile not found. Logging out.', 'error');
                        signOut(auth);
                        setUser(null);
                    }
                    setIsLoading(false);
                };
                
                const authAction = sessionStorage.getItem('authAction');
                if (authAction === 'signup') {
                    // For signup, we must wait for the document to exist.
                    unsubscribeUserDoc = onSnapshot(userDocRef, (docSnapshot) => {
                        if (docSnapshot.exists()) {
                            handleUserDoc(docSnapshot);
                            if(unsubscribeUserDoc) unsubscribeUserDoc(); // Stop listening once we have it.
                        }
                    });
                } else {
                    // For login or page refresh, just get the doc once.
                    getDoc(userDocRef).then(handleUserDoc);
                }
            } else {
                setUser(null);
                setIsLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeUserDoc) unsubscribeUserDoc();
        };
    }, []);

    // --- AD MODAL TRIGGER LOGIC ---
    useEffect(() => {
        // Show ad modal on login/signup or page load if all conditions are met.
        const enabledAds = appSettings.inAppAds?.filter(ad => ad.enabled) || [];
        if (user && appSettings.showInAppAd && enabledAds.length > 0 && !isAdminView && !isAdModalOpen) {
            const sortedAds = enabledAds.sort((a, b) => a.id - b.id);
            setAdQueue(sortedAds);
            setCurrentAdIndex(0);
            setIsAdModalOpen(true);
        }
    }, [user, appSettings, isAdminView]);


    // --- FIRESTORE LISTENERS ---
    useEffect(() => {
        const unsubMatches = onSnapshot(collection(db, 'matches'), (snap) => setMatches(snap.docs.map(d => d.data() as Match)));
        const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => setAllUsers(snap.docs.map(d => d.data() as User)));
        const unsubCategories = onSnapshot(collection(db, 'categories'), (snap) => setCategories(snap.docs.map(d => d.data() as Category)));
        const unsubPromos = onSnapshot(collection(db, 'promotions'), (snap) => setPromotions(snap.docs.map(d => d.data() as Promotion)));
        const unsubPromoCodes = onSnapshot(collection(db, 'promo_codes'), (snap) => setPromoCodes(snap.docs.map(d => d.data() as PromoCode)));
        const unsubPaymentMethods = onSnapshot(collection(db, 'paymentMethods'), (snap) => setPaymentMethods(snap.docs.map(d => ({...d.data(), id: parseInt(d.id, 10)}) as PaymentMethod)));
        const unsubAppSettings = onSnapshot(doc(db, 'settings', 'app'), (doc) => { if (doc.exists()) setAppSettings(s => ({...s, ...doc.data()})); });
        const unsubReferralSettings = onSnapshot(doc(db, 'settings', 'referral'), (doc) => { if(doc.exists()) setReferralSettings(s => ({...s, ...doc.data()})); });
        
        return () => {
            unsubMatches(); unsubUsers(); unsubCategories(); unsubPromos(); 
            unsubPromoCodes(); unsubPaymentMethods(); unsubAppSettings(); unsubReferralSettings();
        };
    }, []);
    
    // --- REAL-TIME USER SYNC ---
    useEffect(() => {
        if (!user?.email) return;
        const unsubCurrentUser = onSnapshot(doc(db, 'users', user.email.toLowerCase()), (doc) => {
            if (doc.exists()) setUser(doc.data() as User);
        });
        return () => unsubCurrentUser();
    }, [user?.email]); 

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'dark' ? 'light' : 'dark');
        root.classList.add(theme);
    }, [theme]);

    useEffect(() => {
        if (appSettings.appName) {
            document.title = appSettings.appName;
        }
    }, [appSettings.appName]);
    
    // --- DYNAMIC THEME COLOR UPDATER ---
    useEffect(() => {
        const root = document.documentElement;
        if (appSettings.brandPrimaryColor) {
            root.style.setProperty('--color-brand-primary', appSettings.brandPrimaryColor);
        }
        if (appSettings.brandPinkColor) {
            root.style.setProperty('--color-brand-pink', appSettings.brandPinkColor);
        }
    }, [appSettings.brandPrimaryColor, appSettings.brandPinkColor]);
    
    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [user, isLoading]);

    const logout = () => {
        setIsFadingIn(false); // Ensure fade-in isn't active
        setIsFadingOut(true);
        setTimeout(() => {
            signOut(auth);
        }, 300); // Matches animation duration
    };

    const updateUserState = async (action: React.SetStateAction<User>) => {
        if (!user) return;
        const newUser = typeof action === 'function' ? action(user) : action;
        setUser(newUser); 
        try {
            await setDoc(doc(db, 'users', newUser.email.toLowerCase()), newUser, { merge: true });
        } catch (e) {
            console.error("Error updating user in Firestore:", e);
            showToast("Failed to save changes.", 'error');
        }
    };

    const handleSetCurrentView = (view: View) => {
        if (currentView === View.Home && view === View.Home) setHomeResetToken(Date.now());
        setCurrentView(view);
    };

    const handleAdDismiss = () => {
        const nextIndex = currentAdIndex + 1;
        if (nextIndex < adQueue.length) {
            setCurrentAdIndex(nextIndex);
        } else {
            setIsAdModalOpen(false);
            setAdQueue([]);
            setCurrentAdIndex(0);
        }
    };

    const renderView = () => {
        switch (currentView) {
            case View.Home: return <HomeScreen resetToken={homeResetToken} matches={matches} promotions={promotions} categories={categories} allUsers={allUsers} appSettings={appSettings} />;
            case View.Wallet: return <WalletScreen allUsers={allUsers} appSettings={appSettings} paymentMethods={paymentMethods} />;
            case View.Leaderboard: return <LeaderboardScreen allUsers={allUsers} appSettings={appSettings} />;
            case View.Refer: return <ReferScreen referralSettings={referralSettings} appSettings={appSettings} />;
            case View.Profile: return <ProfileScreen allUsers={allUsers} appSettings={appSettings} />;
            default: return <HomeScreen resetToken={homeResetToken} matches={matches} promotions={promotions} categories={categories} allUsers={allUsers} appSettings={appSettings} />;
        }
    };
    
    // Early return for offline state, BEFORE the main loading check.
    if (!isOnline) {
        return (
            <ThemeContext.Provider value={{ theme, setTheme }}>
                <ToastContext.Provider value={{ showToast }}>
                    <ToastContainer toasts={toasts} />
                    <NoInternetScreen appSettings={appSettings} cachedAsset={cachedOfflineAsset} />
                </ToastContext.Provider>
            </ThemeContext.Provider>
        );
    }

    if (isLoading || !appSettings.appName) {
        return <AppLoading />;
    }
    
    if (!user) {
        return (
            <ThemeContext.Provider value={{ theme, setTheme }}>
                <ToastContext.Provider value={{ showToast }}>
                    <ToastContainer toasts={toasts} />
                    <Suspense fallback={<AppLoading />}>
                        <AuthScreen existingUsers={allUsers} appSettings={appSettings} />
                    </Suspense>
                </ToastContext.Provider>
            </ThemeContext.Provider>
        );
    }
    
    if (user.status === 'Banned') {
        return (
             <div className="h-full flex flex-col items-center justify-center p-6 bg-dark-bg text-white" style={{ backgroundImage: `url(${assets.CYBER_PATTERN})`}}>
                <div className="w-full max-w-sm m-auto bg-dark-card/80 backdrop-blur-md p-8 rounded-2xl border border-red-500/30 shadow-2xl shadow-red-500/20 text-center">
                    <img src={appSettings.appLogoUrl} alt="Logo" className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-dark-bg ring-4 ring-brand-cyan shadow-2xl shadow-brand-cyan/40"/>
                    
                    {user.banImageUrl ? (
                        <MediaDisplay
                            src={user.banImageUrl}
                            alt="Account Suspended"
                            className="my-4 mx-auto rounded-lg max-h-40 object-contain"
                        />
                    ) : appSettings.banScreenImageUrl ? (
                        <MediaDisplay
                            src={appSettings.banScreenImageUrl}
                            alt="Account Suspended"
                            className="my-4 mx-auto rounded-lg"
                            style={{
                                width: `${appSettings.banScreenImageWidth || 160}px`,
                                height: `${appSettings.banScreenImageHeight || 160}px`,
                                objectFit: 'contain'
                            }}
                        />
                    ) : (
                        <Icon name="shield-alert" size={48} className="text-red-500 mx-auto my-4" />
                    )}

                    <h1 className="text-2xl font-bold text-white mb-2">Account Suspended</h1>
                    <p className="text-gray-300 text-sm mb-6">
                        {user.banReason || 'Your account has been suspended for violating our terms of service. Access is restricted.'}
                    </p>
                    <div className="space-y-3">
                        <a href={`https://wa.me/${appSettings.supportNumber}`} target="_blank" rel="noopener noreferrer" className="w-full bg-green-500/10 text-green-400 font-bold py-3 rounded-xl hover:bg-green-500 hover:text-white transition-all flex items-center justify-center gap-2 border border-green-500/20">
                           <Icon name="message-circle" size={16} /> Contact Support
                        </a>
                         <button onClick={logout} className="w-full bg-red-500/10 text-red-400 font-bold py-3 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 border border-red-500/20">
                            <Icon name="log-out" size={16} />
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    if (appSettings.maintenanceMode && user.role !== 'admin') {
        return (
             <div className="h-full flex flex-col items-center justify-center p-6 bg-dark-bg text-white" style={{ backgroundImage: `url(${assets.CYBER_PATTERN})`}}>
                <div className="w-full max-w-sm m-auto bg-dark-card/80 backdrop-blur-md p-8 rounded-2xl border-2 border-red-900 shadow-2xl shadow-brand-cyan/40 text-center">
                    <img src={appSettings.appLogoUrl} alt="Logo" className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-dark-bg ring-4 ring-brand-cyan shadow-2xl shadow-brand-cyan/40"/>
                    <h1 className="text-2xl font-bold text-white mb-2">{appSettings.appName} is Under Maintenance</h1>
                    {appSettings.maintenanceImageUrl && (
                        <MediaDisplay
                            src={appSettings.maintenanceImageUrl}
                            alt="Maintenance"
                            className="my-4 mx-auto rounded-lg"
                            style={{
                                width: `${appSettings.maintenanceImageWidth || 160}px`,
                                height: `${appSettings.maintenanceImageHeight || 160}px`,
                                objectFit: 'contain'
                            }}
                        />
                    )}
                    <p className="text-gray-400 text-sm mb-6">
                        {appSettings.maintenanceMessage || 'We are currently performing scheduled maintenance. Please check back soon.'}
                    </p>
                    <div className="space-y-3">
                        <button onClick={logout} className="w-full bg-red-500/10 text-red-400 font-bold py-3 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 border border-red-500/20">
                            <Icon name="log-out" size={16} />
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <UserContext.Provider value={{ user, updateUser: updateUserState, logout, setAllUsers }}>
            <ViewContext.Provider value={{ setCurrentView }}>
                <ToastContext.Provider value={{ showToast }}>
                    <ToastContainer toasts={toasts} />
                    
                    <AdModal 
                        isOpen={isAdModalOpen}
                        onClose={handleAdDismiss}
                        ad={adQueue[currentAdIndex] || null}
                        animationType={appSettings.inAppAdAnimation}
                    />
                    
                    {user && (user.role === 'admin' || user.role === 'staff') && isAdminView ? (
                        <Suspense fallback={<AppLoading />}>
                             <AdminScreen 
                                onToggleView={() => setIsAdminView(false)}
                                matches={matches}
                                setMatches={setMatches}
                                users={allUsers}
                                setUsers={setAllUsers}
                                promotions={promotions}
                                setPromotions={setPromotions}
                                promoCodes={promoCodes}
                                setPromoCodes={setPromoCodes}
                                appSettings={appSettings}
                                setAppSettings={setAppSettings}
                                categories={categories}
                                setCategories={setCategories}
                                paymentMethods={paymentMethods}
                                setPaymentMethods={setPaymentMethods}
                                referralSettings={referralSettings}
                                setReferralSettings={setReferralSettings}
                            />
                        </Suspense>
                    ) : (
                        <div className={`h-full flex flex-col bg-light-bg dark:bg-dark-bg max-w-md mx-auto ${isFadingIn ? 'animate-fade-in' : ''} ${isFadingOut ? 'animate-fade-out' : ''}`}>
                            <Header currentView={currentView} onToggleAdminView={() => setIsAdminView(true)} appSettings={appSettings} />
                            <AnnouncementBar settings={appSettings} />
                            <main key={currentView} className="flex-grow overflow-y-auto pb-16 animate-fade-in">
                                <Suspense fallback={<div className="flex h-full items-center justify-center"><Icon name="loader" size={32} className="animate-spin text-brand-primary"/></div>}>
                                    {renderView()}
                                </Suspense>
                            </main>
                            <BottomNav currentView={currentView} setCurrentView={handleSetCurrentView} />
                            {appSettings.showWhatsAppButton && <WhatsAppButton settings={appSettings} />}
                        </div>
                    )}
                </ToastContext.Provider>
            </ViewContext.Provider>
        </UserContext.Provider>
      </ThemeContext.Provider>
    );
};

export default App;