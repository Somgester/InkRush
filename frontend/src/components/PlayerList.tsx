import React from 'react';

interface Player {
    id: string;
    username: string;
    score: number;
    isDrawing: boolean;
    hasGuessed: boolean;
}

interface PlayerListProps {
    players: Player[];
    hostId?: string;
}

const PlayerList: React.FC<PlayerListProps> = ({ players, hostId }) => {
    return (
        <div className="bg-white border-3 border-gray-100 rounded-2xl shadow-lg p-4 sm:p-5 w-full lg:w-64 h-full lg:max-h-none max-h-[280px] overflow-y-auto">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 border-b-2 border-gray-50 pb-2">Scoreboard</h3>
            <div className="space-y-4">
                {players.sort((a, b) => b.score - a.score).map((player, index) => (
                    <div 
                        key={player.id} 
                        className={`relative group flex items-center p-3 rounded-xl transition-all border-2 ${
                            player.isDrawing ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                        }`}
                    >
                        <div className={`absolute -left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-md ${
                            index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-blue-400'
                        }`}>
                            {index + 1}
                        </div>
                        
                        <div className="flex-1 ml-4 overflow-hidden">
                            <div className="flex items-center justify-between">
                                <span className="font-black text-gray-800 text-sm truncate uppercase tracking-tighter">
                                    {player.username}
                                </span>
                                <div className="flex items-center gap-1">
                                    {player.id === hostId && (
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-400 text-blue-900" title="Host">HOST</span>
                                    )}
                                    {player.isDrawing && (
                                        <span className="animate-pulse text-blue-500" title="Drawing Now">🎨</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-[10px] font-black text-gray-400 uppercase">Points</span>
                                <span className="text-xs font-black text-blue-600 tabular-nums">{player.score}</span>
                            </div>
                        </div>

                        {player.hasGuessed && (
                            <div className="absolute -right-2 -top-2 bg-green-500 text-white rounded-full p-1 shadow-lg border-2 border-white animate-bounce">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PlayerList;
