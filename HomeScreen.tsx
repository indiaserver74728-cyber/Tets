import React, { useState, useEffect, useContext, useRef } from 'react';
import Icon from '../components/Icon';
import MatchCard from '../components/MatchCard';
import ResultModal from '../components/ResultModal';
import MatchDetailModal from '../components/MatchDetailModal';
import JoinConfirmationModal from '../components/JoinConfirmationModal';
import JoinedMatchDetailModal from '../components/JoinedMatchDetailModal';
import PromotionSlider from '../components/PromotionSlider';
import { Match, Promotion, Category, JoinedMatchInfo, User, AppSettings } from '../types';
import { UserContext, ToastContext } from '../contexts';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import MediaDisplay from '../components/MediaDisplay';

interface HomeScreenProps {
    matches: Match[];
    promotions: Promotion[];
    categories: Category[];
    allUsers: User[];
    appSettings: AppSettings;
    resetToken: number;
}

const GameModeCard: React.FC<{ title: string; imageUrl: string; onClick: () => void }> = ({ title, imageUrl, onClick }) => (
    <div className="relative bg-light-card dark:bg-dark-card rounded-lg overflow-hidden text-center cursor-pointer group transition-all duration-300 hover:scale-105 border border-gray-200 dark:border-white/10 hover:border-brand-primary/50 hover:shadow-xl hover:shadow-brand-primary/10" onClick={onClick}>
        <div className="absolute hidden group-hover:block inset-0 bg-gradient-to-tr from-brand-pink to-transparent opacity-30 z-0"></div>
        <MediaDisplay src={imageUrl} alt={title} className="w-full h-32 object-cover transform group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute bottom-0 left-0 right-0 pt-8 pb-2 px-2 bg-gradient-to-t from-black/90 to-transparent z-10">
            <p className="font-bold text-sm text-white drop-shadow-lg">{title}</p>
        </div>
    </div>
);

const WelcomeBanner: React.FC<{ settings: AppSettings }> = ({ settings }) => {
    const lines = settings.welcomeBannerLines || [];
    if (lines.length === 0) return null;

    const [title, ...otherLines] = lines;

    return (
        <div className="bg-dark-card border border-brand-primary/30 p-4 mx-4 my-4 rounded-lg text-center leading-relaxed text-sm font-medium">
            <p className="font-bold text-base text-brand-primary mb-2">{title}</p>
            {otherLines.map((line, index) => (
                <p key={index} className="text-gray-300">{line}</p>
            ))}
        </div>
    );
};

const HomeScreen: React.FC<HomeScreenProps> = ({ matches, promotions, categories, allUsers, appSettings, resetToken }) => {
    const userContext = useContext(UserContext);
    const toastContext = useContext(ToastContext);
    
    if (!userContext || !toastContext) return null;
    const { user, updateUser } = userContext;
    const { showToast } = toastContext;

    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [activeTab, setActiveTab] = useState<'Upcoming' | 'Ongoing' | 'Results'>('Upcoming');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [isJoinedDetailModalOpen, setIsJoinedDetailModalOpen] = useState(false);
    
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [matchToJoin, setMatchToJoin] = useState<Match | null>(null);
    const [joinedModalView, setJoinedModalView] = useState<'rules' | 'details'>('details');
    
    const [isTransitioning, setIsTransitioning] = useState(false);

    // For animation tracking
    const prevViewRef = useRef(view);
    useEffect(() => {
        prevViewRef.current = view;
    });
    const prevView = prevViewRef.current;

    const isInitialMount = useRef(true);
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
        } else {
            setView('grid');
            setSelectedCategory(null);
        }
    }, [resetToken]);

    useEffect(() => {
        if(window.lucide) window.lucide.createIcons();
    }, [view, activeTab, isResultModalOpen, isDetailModalOpen, isJoinModalOpen, isJoinedDetailModalOpen, matches]);

    const handleModeClick = (category: string) => {
        setIsTransitioning(true);
        setView('list');
        setSelectedCategory(category);
        setActiveTab('Upcoming');
        setTimeout(() => {
            setIsTransitioning(false);
        }, 1000);
    };
    
    const handleResultClick = (matchId: number) => {
        const match = matches.find(m => m.id === matchId);
        setSelectedMatch(match || null);
        setIsResultModalOpen(true);
    };

    const handleCardClick = (match: Match) => {
        setSelectedMatch(match);
        // Always show generic details when clicking card body, even if joined
        setIsDetailModalOpen(true);
    };

    const handleJoinedMatchClick = (match: Match) => {
        setIsTransitioning(true);
        setView('list');
        setSelectedCategory(match.category);
        if (match.type === 'Upcoming' || match.type === 'Ongoing' || match.type === 'Results') {
             setActiveTab(match.type);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
            setIsTransitioning(false);
        }, 1000);
    };
    
    const handleInitiateJoin = (match: Match) => {
        if (user.deposit < match.entryFee) {
            showToast('Insufficient deposit balance!', 'error');
            return;
        }
        setMatchToJoin(match);
        setIsDetailModalOpen(false);
        setIsJoinModalOpen(true);
    };

    const handleViewDetails = (match: Match, initialView: 'rules' | 'details') => {
        setSelectedMatch(match);
        setJoinedModalView(initialView);
        setIsJoinedDetailModalOpen(true);
    };
    
    const handleViewRoomDetails = (match: Match) => {
        setSelectedMatch(match);
        setJoinedModalView('details');
        setIsDetailModalOpen(false);
        setIsJoinedDetailModalOpen(true);
    }
    
    const handleConfirmJoin = async (ign: string, uid: string, whatsapp: string, slotNumber: number): Promise<void> => {
        if (!matchToJoin) return;
        
        // Return a promise to allow the Modal to show loading state
        return new Promise(async (resolve, reject) => {
            try {
                // Simulate network delay for better UX (as requested "Show loading screen")
                await new Promise(r => setTimeout(r, 1500));

                const newJoinedMatchInfo: JoinedMatchInfo = {
                    matchId: matchToJoin.id,
                    ign,
                    uid,
                    whatsapp,
                    slotNumber,
                    joinTimestamp: new Date().toISOString(),
                };

                // 1. Update Match Document in Firestore (Add slot, increment count)
                // We do this first to check for slot availability in a real app, assuming success here.
                const matchRef = doc(db, 'matches', matchToJoin.id.toString());
                await updateDoc(matchRef, {
                    filledSlots: arrayUnion(slotNumber),
                    registeredPlayers: increment(1)
                });

                // 2. Update User Document (Deduct fee, add match details)
                // Using the context updater which syncs to Firestore
                updateUser(prev => ({ 
                    ...prev, 
                    deposit: prev.deposit - matchToJoin.entryFee, 
                    matches: prev.matches + 1, 
                    joinedMatchDetails: [...prev.joinedMatchDetails, newJoinedMatchInfo], 
                    transactions: [ ...prev.transactions, { 
                        id: Date.now(), 
                        type: 'Entry Fee', 
                        amount: -matchToJoin.entryFee, 
                        date: new Date().toISOString(), 
                        status: 'Completed',
                        matchId: matchToJoin.id,
                        reason: matchToJoin.title // Save match title as reason for history
                    } ] 
                }));
                
                // Success!
                // We DON'T close the modal here immediately. The modal handles the success animation then closes itself.
                // We just resolve the promise.
                resolve();

                // Clear selection state
                setMatchToJoin(null);

            } catch (error) {
                console.error("Error joining match:", error);
                showToast("Failed to join match. Please try again.", 'error');
                reject(error);
            }
        });
    };

    const filteredMatches = matches.filter(match => match.type === activeTab).filter(match => !selectedCategory || match.category === selectedCategory);
    
    const sortedCategories = [...categories].sort((a,b) => (a.position ?? 999) - (b.position ?? 999));

    // Get Joined Matches - Filter out 'Results' so only Upcoming/Ongoing are shown
    const joinedMatches = matches
        .filter(m => user.joinedMatchDetails.some(d => d.matchId === m.id) && m.type !== 'Results')
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()); // Sort ascending: nearest upcoming first

    const renderGridView = () => (
        <>
            <WelcomeBanner settings={appSettings} />
            <PromotionSlider slides={promotions} settings={appSettings} />
            <div className="px-4 grid grid-cols-3 gap-3 pb-6">
                {sortedCategories.map(cat => (
                    <GameModeCard 
                        key={cat.id} 
                        title={cat.name}
                        imageUrl={cat.imageUrl}
                        onClick={() => handleModeClick(cat.name)}
                    />
                ))}
            </div>

            {/* JOINED MATCHES SECTION */}
            {appSettings.showJoinedMatches && joinedMatches.length > 0 && (
                <div className="px-4 pb-20">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-white/10 pb-2">
                        <Icon name="swords" className="text-brand-primary" />
                        JOINED MATCHES
                    </h3>
                    <div className="space-y-4">
                        {joinedMatches.map(match => (
                            <MatchCard 
                                key={match.id} 
                                match={match} 
                                allUsers={allUsers} 
                                isJoined={true} 
                                onResultClick={handleResultClick} 
                                onJoinClick={handleInitiateJoin} 
                                onCardClick={() => handleJoinedMatchClick(match)} 
                                onViewDetailsClick={handleViewDetails} 
                                appSettings={appSettings}
                            />
                        ))}
                    </div>
                </div>
            )}
        </>
    );
    
    const listTitle = selectedCategory ? `${selectedCategory}` : `${activeTab} MATCHES`;

    const getEmptyStateConfig = () => {
        switch (activeTab) {
            case 'Upcoming':
                return { url: appSettings.upcomingFallbackUrl, w: appSettings.upcomingFallbackWidth, h: appSettings.upcomingFallbackHeight };
            case 'Ongoing':
                return { url: appSettings.ongoingFallbackUrl, w: appSettings.ongoingFallbackWidth, h: appSettings.ongoingFallbackHeight };
            case 'Results':
                return { url: appSettings.resultsFallbackUrl, w: appSettings.resultsFallbackWidth, h: appSettings.resultsFallbackHeight };
            default:
                return { url: appSettings.upcomingFallbackUrl, w: appSettings.upcomingFallbackWidth, h: appSettings.upcomingFallbackHeight };
        }
    };
    const emptyStateConfig = getEmptyStateConfig();

    const handleBackToGrid = () => {
        setView('grid');
        setSelectedCategory(null);
    };

    const renderLoadingView = () => (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)]">
            <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 font-bold text-white text-lg">Loading...</p>
        </div>
    );

    const renderListView = () => (
        <div className="p-4 pb-6">
            <div className="flex justify-between items-center mb-4">
                <button onClick={handleBackToGrid} className="text-white p-2 rounded-full hover:bg-dark-card"><Icon name="arrow-left"/></button>
                <h2 className="text-xl font-bold uppercase">{listTitle}</h2>
                <div className="w-8"></div>
            </div>

            {isTransitioning ? (
                renderLoadingView()
            ) : (
                <div className="animate-fade-in">
                    <div className="px-4 mb-4">
                        <div className="flex bg-dark-card rounded-full p-1 border border-white/10">
                            {['Upcoming', 'Ongoing', 'Results'].map((tab) => (
                                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`w-full py-2 text-sm font-semibold rounded-full transition-colors duration-300 ${activeTab === tab ? 'bg-brand-primary text-black shadow' : 'text-gray-400'}`}>
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        {filteredMatches.length > 0 ? (
                            filteredMatches.map(match => <MatchCard key={match.id} match={match} allUsers={allUsers} isJoined={user.joinedMatchDetails.some(d => d.matchId === match.id)} onResultClick={handleResultClick} onJoinClick={handleInitiateJoin} onCardClick={() => handleCardClick(match)} onViewDetailsClick={handleViewDetails} appSettings={appSettings} />)
                        ) : (
                            <div className="text-center text-gray-500 py-10">
                                <MediaDisplay 
                                    src={emptyStateConfig.url} 
                                    alt="Not Found" 
                                    className="mx-auto object-contain"
                                    style={{ 
                                        width: `${emptyStateConfig.w || 160}px`, 
                                        height: `${emptyStateConfig.h || 160}px` 
                                    }}
                                />
                                <p className="mt-4 font-medium">No {activeTab} matches found in this category.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            <ResultModal isOpen={isResultModalOpen} onClose={() => setIsResultModalOpen(false)} match={selectedMatch} users={allUsers} appSettings={appSettings} />
            <MatchDetailModal 
                isOpen={isDetailModalOpen} 
                onClose={() => setIsDetailModalOpen(false)} 
                match={selectedMatch} 
                onJoin={handleInitiateJoin} 
                isJoined={selectedMatch ? user.joinedMatchDetails.some(d => d.matchId === selectedMatch.id) : false}
                onViewRoom={handleViewRoomDetails}
            />
            <JoinConfirmationModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} onConfirm={handleConfirmJoin} match={matchToJoin} />
            <JoinedMatchDetailModal isOpen={isJoinedDetailModalOpen} onClose={() => setIsJoinedDetailModalOpen(false)} match={selectedMatch} initialView={joinedModalView} />
        </div>
    );
    
    return (
        <div className="w-full relative">
            {view === 'grid' ? (
                 <div className={prevView === 'list' ? 'animate-slide-in-from-left' : ''}>
                    {renderGridView()}
                </div>
            ) : (
                 <div className={prevView === 'grid' ? 'animate-slide-in-from-right' : ''}>
                    {renderListView()}
                </div>
            )}
        </div>
    );
};

export default HomeScreen;