import React, { useEffect, useState } from 'react';
import type { User } from '../types';

interface LeaderboardProps {
    onClose: () => void;
}

const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:5000';

const Leaderboard: React.FC<LeaderboardProps> = ({ onClose }) => {
    const [players, setPlayers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${backendUrl}/api/users/leaderboard`)
            .then(res => res.json())
            .then(data => {
                setPlayers(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden border-4 border-yellow-400">
                <div className="bg-yellow-400 p-6 flex justify-between items-center text-blue-900 border-b-4 border-yellow-500">
                    <h2 className="text-3xl font-black uppercase tracking-widest italic transform -rotate-1">Global Leaderboard</h2>
                    <button onClick={onClose} className="text-white hover:text-blue-900 transition-colors">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                    {loading ? (
                        <div className="text-center font-black text-gray-400 py-10 uppercase tracking-widest">Loading...</div>
                    ) : players.length === 0 ? (
                        <div className="text-center font-black text-gray-400 py-10 uppercase tracking-widest">No players yet.</div>
                    ) : (
                        <div className="space-y-4">
                            {players.map((p, i) => (
                                <div key={p.id} className="bg-white p-4 rounded-2xl flex items-center gap-4 border-2 border-gray-100 shadow-sm">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-gray-300 text-gray-800' : i === 2 ? 'bg-amber-600 text-orange-100' : 'bg-blue-100 text-blue-600'}`}>
                                        {i + 1}
                                    </div>
                                    {p.avatarUrl ? (
                                        <img src={p.avatarUrl} alt={p.name} className="w-12 h-12 rounded-full border-2 border-gray-200" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-xl">
                                            {p.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h3 className="font-black text-lg text-gray-800">{p.name}</h3>
                                        <div className="flex gap-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            <span>{p.gamesPlayed} Games</span>
                                            <span>{p.gamesWon} Wins</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black text-2xl text-blue-600">{p.totalPoints}</div>
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Points</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
