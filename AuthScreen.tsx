import React, { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import * as assets from '../assets';
import { User, AppSettings, Notification } from '../types';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

interface AuthScreenProps {
    existingUsers: User[];
    appSettings: AppSettings;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ existingUsers, appSettings }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
        setPersistence(auth, browserLocalPersistence).catch((error) => {
            console.error("Firebase Persistence Error:", error);
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                try {
                    sessionStorage.setItem('authAction', 'login');
                    await signInWithEmailAndPassword(auth, email, password);
                    localStorage.setItem('deviceHasAccount', 'true');
                } catch (loginError: any) {
                    // If sign-in fails, check for a pre-provisioned account that exists in Firestore but not Firebase Auth
                    if (loginError.code === 'auth/invalid-credential' || loginError.code === 'auth/user-not-found') {
                        const preProvisionedUser = existingUsers.find(
                            u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
                        );

                        if (preProvisionedUser) {
                            // This is our special case. Try to create the user in Firebase Auth.
                            // This will also sign them in.
                            await createUserWithEmailAndPassword(auth, email, password);
                            localStorage.setItem('deviceHasAccount', 'true');
                            // Successful "silent" creation and sign-in. Auth listener will handle the rest.
                            return; // Exit successfully
                        }
                    }
                    // If it wasn't the special case, re-throw the original error.
                    throw loginError;
                }
            } else {
                if (appSettings.oneAccountPerDevice && localStorage.getItem('deviceHasAccount') === 'true') {
                    throw new Error('Per Device One account');
                }
                if (!name || !phone || !email || !password || !confirmPassword) {
                    throw new Error('Please fill in all fields.');
                }
                if (password.length < 6) {
                    throw new Error('Password must be at least 6 characters.');
                }
                if (password !== confirmPassword) {
                    throw new Error('Passwords do not match.');
                }
                
                if (referralCode.trim()) {
                    const code = referralCode.trim().toUpperCase();
                    const referrerExists = existingUsers.some(u => u.referralCode === code);
                    if (!referrerExists) {
                        setReferralCode(''); // Clear the input
                        throw new Error('Invalid refer code');
                    }
                }

                sessionStorage.setItem('authAction', 'signup');
                await createUserWithEmailAndPassword(auth, email, password);
                
                const userDocRef = doc(db, 'users', email.toLowerCase());
                
                // Check if a user document was already created by an admin
                const existingDoc = await getDoc(userDocRef);

                if (!existingDoc.exists()) {
                    let cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
                    if (cleanName.length < 3) {
                        cleanName = cleanName.padEnd(3, 'X');
                    }
                    const prefix = cleanName.substring(0, 3);
                    const suffix = Math.floor(100 + Math.random() * 900);
                    const generatedReferralCode = `${prefix}${suffix}`;
                    
                    const welcomeNotification: Notification = {
                        id: Date.now(),
                        icon: 'megaphone',
                        title: appSettings.welcomeNotificationTitle || `Welcome to ${appSettings.appName}!`,
                        message: appSettings.welcomeNotificationMessage || 'Join tournaments and win big! Check out the rules before playing.',
                        time: new Date().toISOString(),
                        read: false,
                        iconColor: 'text-brand-cyan'
                    };

                    const newUser: User = {
                        name,
                        email: email.toLowerCase(),
                        phone: `+92${phone}`,
                        avatar: appSettings.defaultAvatarUrl || assets.DEFAULT_AVATAR_IMG,
                        password: password,
                        role: 'user',
                        status: 'Active',
                        deposit: 0,
                        winnings: 0,
                        totalWinnings: 0,
                        referralCode: generatedReferralCode,
                        creationDate: new Date().toISOString(),
                        referralRewardClaimed: false,
                        kills: 0,
                        matches: 0,
                        transactions: [],
                        joinedMatchDetails: [],
                        notifications: [welcomeNotification],
                    };

                    if (referralCode.trim()) {
                        newUser.referredBy = referralCode.trim().toUpperCase();
                    }

                    await setDoc(userDocRef, newUser);
                }
                localStorage.setItem('deviceHasAccount', 'true');
            }
        } catch (err: any) {
            console.error("Auth Error:", err);
            sessionStorage.removeItem('authAction'); // Clear action on any error
            let msg = "An error occurred.";
            
            if (err.message === 'Per Device One account') {
                msg = err.message;
            } else if (err.message === 'Invalid refer code') {
                msg = err.message;
            } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                msg = "Invalid email or password. Please try again.";
            } else if (err.code === 'auth/email-already-in-use') {
                msg = "This email is already registered. Please Login instead.";
            } else if (err.code === 'auth/weak-password') {
                msg = "Password should be at least 6 characters.";
            } else if (err.code === 'auth/too-many-requests') {
                msg = "Too many failed attempts. Please try again later.";
            } else if (err.message) {
                msg = err.message;
            }
            
            setError(msg);
            setLoading(false);
        }
    };

    const toggleAuthMode = () => {
        if (loading) return;
        setIsLogin(!isLogin);
        setError('');
        setName('');
        setEmail('');
        setPassword('');
        setPhone('');
        setConfirmPassword('');
        setReferralCode('');
    };

    return (
        <div className="h-full flex flex-col p-3 bg-dark-bg text-white overflow-y-auto animate-fade-in" style={{ backgroundImage: `url(${assets.CYBER_PATTERN})`}}>
            <div className="w-full max-w-sm m-auto bg-dark-card/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl shadow-brand-cyan/20">
                <div className="text-center mb-3">
                    <img src={appSettings.appLogoUrl} alt={`${appSettings.appName} Logo`} className="w-28 h-28 rounded-full mx-auto mb-5 border-4 border-dark-bg ring-4 ring-brand-cyan shadow-2xl shadow-brand-cyan/40" />
                    <h1 className="text-4xl font-bold text-white tracking-tight">{isLogin ? 'Login Account' : 'Create Account'}</h1>
                    <p className="text-gray-400 mt-2">{isLogin ? 'Log-in to your account to Continue.' : 'Create an account to Continue.'}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {!isLogin && (
                        <>
                            <div className="relative">
                                <Icon name="user" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input type="text" placeholder="Username" value={name} onChange={e => setName(e.target.value)} disabled={loading} className="w-full bg-dark-bg border border-gray-700 rounded-lg py-3 px-12 text-white placeholder-gray-500 focus:border-brand-cyan focus:ring-brand-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed" required/>
                            </div>
                            <div className="relative flex items-center">
                                <div className="absolute left-0 top-0 bottom-0 flex items-center pl-2 pr-2 text-gray-400 border-r border-gray-700 pointer-events-none">
                                    +92
                                </div>
                                <input 
                                    type="tel" 
                                    placeholder="3001234567" 
                                    value={phone} 
                                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} 
                                    disabled={loading}
                                    className="w-full bg-dark-bg border border-gray-700 rounded-lg py-3 pl-[58px] text-white placeholder-gray-500 focus:border-brand-cyan focus:ring-brand-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                                    required 
                                    pattern="\d{10}"
                                    title="Please enter a 10-digit Phone Number (e.g., 3001234567)"
                                />
                            </div>
                        </>
                    )}
                    <div className="relative">
                        <Icon name="mail" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} className="w-full bg-dark-bg border border-gray-700 rounded-lg py-3 px-12 text-white placeholder-gray-500 focus:border-brand-cyan focus:ring-brand-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed" required/>
                    </div>
                    <div className="relative">
                        <Icon name="lock" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} className="w-full bg-dark-bg border border-gray-700 rounded-lg py-3 px-12 text-white placeholder-gray-500 focus:border-brand-cyan focus:ring-brand-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed" required/>
                    </div>
                     {!isLogin && (
                         <>
                            <div className="relative">
                                <Icon name="lock" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={loading} className="w-full bg-dark-bg border border-gray-700 rounded-lg py-3 px-12 text-white placeholder-gray-500 focus:border-brand-cyan focus:ring-brand-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed" required/>
                            </div>
                            <div className="relative">
                                <Icon name="gift" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input type="text" placeholder="Referral Code (Optional)" value={referralCode} onChange={e => setReferralCode(e.target.value)} disabled={loading} className="w-full bg-dark-bg border border-gray-700 rounded-lg py-3 px-12 text-white placeholder-gray-500 focus:border-brand-cyan focus:ring-brand-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed"/>
                            </div>
                         </>
                    )}

                    {error && <p className="text-sm text-red-500 text-center bg-red-500/10 p-2 rounded border border-red-500/20">{error}</p>}

                    <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-brand-pink to-brand-cyan text-white font-bold py-3.5 rounded-lg hover:shadow-lg hover:shadow-brand-cyan/30 transition-all transform hover:-translate-y-1 disabled:opacity-50 flex items-center justify-center">
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            isLogin ? 'LOGIN' : 'SIGN UP'
                        )}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <button onClick={toggleAuthMode} className="text-sm text-brand-cyan font-semibold hover:underline">
                        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthScreen;