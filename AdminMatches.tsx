
import React, { useState } from 'react';
import { Match, User } from '../../types';
import Icon from '../Icon';
import MatchFormModal from './MatchFormModal';
import FinalizeMatchModal from './FinalizeMatchModal';

type MatchFilter = 'All' | 'Upcoming' | 'Ongoing' | 'Results' | 'Completed';

interface AdminMatchesProps {
    matches: Match[];
    setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const AdminMatches: React.FC<AdminMatchesProps> = ({ matches, setMatches, setUsers }) => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
    const [editingMatch, setEditingMatch] = useState<Match | null>(null);
    const [matchToFinalize, setMatchToFinalize] = useState<Match | null>(null);
    const [filter, setFilter] = useState<MatchFilter>('All');

    const openCreateModal = () => {
        setEditingMatch(null);
        setIsFormModalOpen(true);
    };

    const openEditModal = (match: Match) => {
        setEditingMatch(match);
        setIsFormModalOpen(true);
    };
    
    const openFinalizeModal = (match: Match) => {
        setMatchToFinalize(match);
        setIsFinalizeModalOpen(true);
    };
    
    const handleDelete = (matchId: number) => {
        if(confirm('Are you sure you want to delete this match? This cannot be undone.')) {
            setMatches(prev => prev.filter(m => m.id !== matchId));
        }
    }

    const filteredMatches = matches.filter(match => {
        if (filter === 'All') return true;
        if (filter === 'Completed') return match.winningsDistributed;
        return match.type === filter && !match.winningsDistributed;
    });

    const filterButtons: MatchFilter[] = ['All', 'Upcoming', 'Ongoing', 'Results', 'Completed'];


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Match Management</h1>
                <button 
                    onClick={openCreateModal}
                    className="bg-brand-cyan text-black font-bold py-2 px-4 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                    <Icon name="plus" size={18} />
                    Add Match
                </button>
            </div>
            
            <div className="mb-4 bg-light-card dark:bg-dark-card p-1.5 rounded-lg border border-gray-200 dark:border-white/10 inline-flex items-center gap-2">
                {filterButtons.map(btn => (
                    <button key={btn} onClick={() => setFilter(btn)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${filter === btn ? 'bg-brand-cyan text-black' : 'text-gray-500 hover:bg-light-card-hover dark:hover:bg-dark-card-hover'}`}>
                        {btn}
                    </button>
                ))}
            </div>

            <div className="bg-light-card dark:bg-dark-card rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-dark-card-hover dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Match Details</th>
                                <th scope="col" className="px-6 py-3">Schedule</th>
                                <th scope="col" className="px-6 py-3">Fees & Prizes</th>
                                <th scope="col" className="px-6 py-3">Players</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMatches.map((match) => (
                                <tr key={match.id} className="bg-light-card dark:bg-dark-card border-b dark:border-gray-700 hover:bg-light-card-hover dark:hover:bg-dark-card-hover/50">
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                        <div>{match.title}</div>
                                        <div className="text-xs text-gray-400">{match.category} - {match.map}</div>
                                    </th>
                                    <td className="px-6 py-4 text-xs">
                                        <div>{new Date(match.time).toLocaleDateString()}</div>
                                        <div className="text-gray-400">{new Date(match.time).toLocaleTimeString()}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-green-500">Fee: 💎{match.entryFee}</div>
                                        <div className="font-semibold text-amber-500 text-xs">Prize: 💎{match.prizePool}</div>
                                    </td>
                                    <td className="px-6 py-4">{match.registeredPlayers}/{match.maxPlayers}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                            match.winningsDistributed ? 'bg-green-500/20 text-green-500' :
                                            match.type === 'Upcoming' ? 'bg-blue-500/20 text-blue-500' :
                                            match.type === 'Ongoing' ? 'bg-red-500/20 text-red-500' :
                                            'bg-yellow-500/20 text-yellow-500'
                                        }`}>{match.winningsDistributed ? 'Completed' : match.type}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center items-center gap-2">
                                            {match.type === 'Results' && !match.winningsDistributed && (
                                                 <button onClick={() => openFinalizeModal(match)} className="p-2 text-green-500 hover:bg-green-500/10 rounded-md"><Icon name="check-circle" size={16} /></button>
                                            )}
                                            <button onClick={() => openEditModal(match)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-md"><Icon name="edit" size={16} /></button>
                                            <button onClick={() => handleDelete(match.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-md"><Icon name="trash-2" size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <MatchFormModal 
                isOpen={isFormModalOpen} 
                onClose={() => setIsFormModalOpen(false)}
                setMatches={setMatches}
                match={editingMatch}
            />
            <FinalizeMatchModal
                isOpen={isFinalizeModalOpen}
                onClose={() => setIsFinalizeModalOpen(false)}
                match={matchToFinalize}
                setMatches={setMatches}
                setUsers={setUsers}
            />
        </div>
    );
};

export default AdminMatches;