import React from 'react';

interface Player {
    id: string;
    username: string;
    score: number;
}

interface PodiumProps {
    players: Player[];
}

const Podium: React.FC<PodiumProps> = ({ players }) => {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const top3 = sortedPlayers.slice(0, 3);
    const rest = sortedPlayers.slice(3);

    // Positions for podium: [2nd, 1st, 3rd]
    const podiumOrder = [
        top3[1] || null, // 2nd
        top3[0] || null, // 1st
        top3[2] || null  // 3rd
    ];

    return (
        <div className="absolute inset-0 bg-blue-600/95 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-6 animate-in fade-in duration-700">
            <div className="text-center mb-12">
                <h2 className="text-5xl sm:text-7xl font-black text-white tracking-tighter italic transform -rotate-2 drop-shadow-[0_8px_0_rgba(30,58,138,1)]">
                    GAME OVER!
                </h2>
                <p className="mt-4 text-blue-100 font-black text-xl uppercase tracking-widest bg-white/10 px-6 py-2 rounded-full border border-white/20">
                    The Champions
                </p>
            </div>

            <div className="flex items-end justify-center gap-2 sm:gap-6 w-full max-w-4xl h-64 sm:h-80 mb-12 px-4">
                {podiumOrder.map((player, index) => {
                    if (!player) return <div key={index} className="flex-1" />;

                    const isFirst = index === 1;
                    const isSecond = index === 0;

                    return (
                        <div key={player.id} className="flex-1 flex flex-col items-center group">
                            {/* Avatar/Initial */}
                            <div className={`mb-4 w-12 h-12 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white font-black text-xl sm:text-3xl shadow-2xl border-4 animate-in zoom-in duration-500 delay-[${index * 200}ms] ${
                                isFirst ? 'bg-yellow-400 border-yellow-200 scale-125 -translate-y-4' : 
                                isSecond ? 'bg-gray-300 border-gray-100' : 
                                'bg-orange-400 border-orange-200'
                            }`}>
                                {player.username.charAt(0).toUpperCase()}
                                {isFirst && (
                                    <div className="absolute -top-6 sm:-top-10 text-3xl sm:text-5xl animate-bounce">👑</div>
                                )}
                            </div>

                            {/* Pillar */}
                            <div className={`w-full rounded-t-3xl flex flex-col items-center justify-start p-2 sm:p-4 shadow-2xl transition-all duration-1000 animate-in slide-in-from-bottom-full delay-[${index * 150}ms] ${
                                isFirst ? 'h-full bg-gradient-to-b from-yellow-400 to-yellow-600 border-t-4 border-yellow-300' :
                                isSecond ? 'h-3/4 bg-gradient-to-b from-gray-300 to-gray-500 border-t-4 border-gray-200' :
                                'h-1/2 bg-gradient-to-b from-orange-400 to-orange-600 border-t-4 border-orange-300'
                            }`}>
                                <span className="text-white font-black text-xs sm:text-xl truncate w-full text-center uppercase tracking-tighter">
                                    {player.username}
                                </span>
                                <span className="text-white/80 font-black text-[10px] sm:text-sm uppercase tracking-widest mt-1">
                                    {player.score} pts
                                </span>
                                <div className="mt-auto mb-2 text-white/20 font-black text-4xl sm:text-6xl italic">
                                    {isFirst ? '1' : isSecond ? '2' : '3'}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Rest of the players */}
            {rest.length > 0 && (
                <div className="w-full max-w-xl bg-white/10 rounded-3xl p-4 border border-white/20 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-700">
                    <div className="grid grid-cols-2 gap-4">
                        {rest.slice(0, 4).map((player, i) => (
                            <div key={player.id} className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-xl">
                                <span className="text-white/60 font-black text-xs mr-3">#{i + 4}</span>
                                <span className="text-white font-bold text-sm truncate flex-1">{player.username}</span>
                                <span className="text-blue-200 font-black text-xs ml-3">{player.score}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Podium;
