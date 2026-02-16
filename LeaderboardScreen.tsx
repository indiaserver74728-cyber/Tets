import React, { useContext } from 'react';
import { UserContext } from '../contexts';
import Icon from '../components/Icon';
import * as assets from '../assets';
import { User, AppSettings } from '../types';
import MediaDisplay from '../components/MediaDisplay';

interface LeaderboardScreenProps {
    allUsers: User[];
    appSettings: AppSettings;
}

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ allUsers, appSettings }) => {
    const userContext = useContext(UserContext);
    const currentUser = userContext?.user;

    const players = [...allUsers]
        .sort((a, b) => b.totalWinnings - a.totalWinnings)
        .map((user, index) => ({
            ...user,
            rank: index + 1,
        }));

    const currentUserRankInfo = players.find(p => p.email === currentUser?.email);

    if (appSettings.leaderboardMaintenanceMode) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 ">
                <MediaDisplay
                    src={appSettings.leaderboardMaintenanceImageUrl}
                    alt="Maintenance"
                    className="mx-auto mb-6 object-contain"
                    style={{
                        width: `${appSettings.leaderboardMaintenanceImageWidth || 160}px`,
                        height: `${appSettings.leaderboardMaintenanceImageHeight || 160}px`
                    }}
                />
                <h2 className="text-xl font-bold text-yellow-400 mb-2 flex items-center gap-2"><Icon name="alert-triangle" /> Under Maintenance</h2>
                <p className="text-gray-400 max-w-sm">{appSettings.leaderboardMaintenanceMessage}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-light-bg dark:bg-dark-bg ">
            <div className="p-3 flex-grow overflow-y-auto pb-28">

                <h2 className="text-2xl font-bold uppercase text-center text-gray-800 dark:text-white my-6 flex items-center justify-center gap-3">
                    <Icon name="swords" className="text-brand-cyan" />
                    TOP PLAYERS
                    <Icon name="swords" className="text-brand-pink" />
                </h2>

                <div className="space-y-4">
                    {players.map(player => {
                        const isCurrentUser = player.email === currentUser?.email;
                        let rankIndicator: React.ReactNode;
                        let rankStyling = 'border border-gray-200 dark:border-white/10';

                        switch (player.rank) {
                            case 1:
                                rankIndicator = <Icon name="trophy" size={24} className="text-brand-gold drop-shadow-lg" />;
                                rankStyling = 'ring-2 ring-offset-2 ring-offset-light-card dark:ring-offset-dark-card ring-brand-gold shadow-lg shadow-brand-gold/30 dark:shadow-brand-gold/40';
                                break;
                            case 2:
                                rankIndicator = <Icon name="medal" size={24} className="text-brand-silver drop-shadow-lg" />;
                                rankStyling = 'ring-2 ring-offset-2 ring-offset-light-card dark:ring-offset-dark-card ring-brand-silver shadow-lg shadow-brand-silver/30 dark:shadow-brand-silver/40';
                                break;
                            case 3:
                                rankIndicator = <Icon name="award" size={24} className="text-brand-bronze drop-shadow-lg" />;
                                rankStyling = 'ring-2 ring-offset-2 ring-offset-light-card dark:ring-offset-dark-card ring-brand-bronze shadow-lg shadow-brand-bronze/40 dark:shadow-brand-bronze/50';
                                break;
                            default:
                                rankIndicator = `#${player.rank}`;
                        }

                        const finalStyling = isCurrentUser
                            ? 'bg-gradient-to-r from-blue-500/20 to-transparent border-l-4 border-blue-400'
                            : `bg-light-card dark:bg-dark-card ${rankStyling}`;

                        return (
                            <div key={player.rank} className={`flex items-center p-2 rounded-lg transition-all duration-300 transform hover:scale-[1.02]  ${finalStyling}`}>
                                <div className="w-12 font-bold text-center text-gray-500 dark:text-gray-400 text-lg flex items-center justify-center flex-shrink-0 pl-0">
                                    {rankIndicator}
                                </div>
                                <img src={player.avatar} alt={player.name} className="w-12 h-12 rounded-full object-cover mx-1 flex-shrink-0 border-2 border-white/20" />
                                <div className="flex-grow min-w-0">
                                    <p className="font-bold text-gray-900 dark:text-white truncate text-sm">{player.name}</p>
                                    {/* <p className="text-[10px] text-gray-500 dark:text-gray-400">Matches: {player.matches}ada </p> */}
                                </div>
                                <div className="font-bold text-white text-sm ml-2 whitespace-nowrap">💎 {player.totalWinnings}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {currentUserRankInfo && (
                <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto p-4 z-10">
                    <div className="flex items-center p-3 rounded-xl bg-gradient-to-r from-brand-pink to-brand-cyan text-white shadow-2xl shadow-brand-cyan/30">
                        <div className="w-12 font-extrabold text-center text-white text-2xl drop-shadow-md flex-shrink-0">#{currentUserRankInfo.rank}</div>
                        <img src={currentUserRankInfo.avatar} alt={currentUserRankInfo.name} className="w-12 h-12 rounded-full object-cover mx-3 border-2 border-white/50 flex-shrink-0" />
                        <div className="flex-grow min-w-0">
                            <p className="font-bold truncate text-sm">{currentUserRankInfo.name}</p>
                            <p className="text-xs opacity-80">Your Rank</p>
                        </div>
                        <div className="font-extrabold text-lg ml-2 whitespace-nowrap">💎 {currentUserRankInfo.totalWinnings}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaderboardScreen;