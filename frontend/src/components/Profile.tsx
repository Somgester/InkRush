import React from 'react';
import type { User } from '../types';

interface ProfileProps {
    user: User;
    onClose: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden border-4 border-blue-400 transform transition-all">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 flex justify-between items-start text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.2),_transparent_50%)]" />
                    <div className="relative z-10 flex flex-col gap-2 w-full">
                        <div className="flex justify-between items-center w-full">
                            <h2 className="text-2xl font-black uppercase tracking-widest italic drop-shadow-md">Player Profile</h2>
                            <button onClick={onClose} className="text-blue-100 hover:text-white transition-colors bg-white/10 p-1.5 rounded-full hover:bg-white/20">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex items-center gap-5 mt-4">
                            <div className="relative">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt={user.name} className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover bg-white" />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-yellow-400 text-yellow-900 flex items-center justify-center font-black text-4xl border-4 border-white shadow-lg">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-blue-900 text-[10px] font-black px-2 py-1 rounded-full border-2 border-white shadow-md transform rotate-12">
                                    LVL {Math.floor(user.gamesPlayed / 10) + 1}
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-2xl font-black tracking-tight drop-shadow-md">{user.name}</h3>
                                <span className="text-sm font-bold text-blue-100 bg-black/20 px-3 py-1 rounded-full w-fit mt-1 border border-white/10 shadow-inner">
                                    {user.totalPoints.toLocaleString()} Total Points
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="p-8 bg-gray-50 flex-1 relative">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-2xl border-2 border-gray-100 shadow-sm flex flex-col items-center justify-center gap-1 hover:border-blue-200 transition-colors group">
                            <svg className="w-8 h-8 text-blue-400 mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-3xl font-black text-gray-800">{user.gamesPlayed}</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Games Played</span>
                        </div>
                        
                        <div className="bg-white p-5 rounded-2xl border-2 border-gray-100 shadow-sm flex flex-col items-center justify-center gap-1 hover:border-yellow-300 transition-colors group">
                            <svg className="w-8 h-8 text-yellow-500 mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                            <span className="text-3xl font-black text-gray-800">{user.gamesWon}</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Games Won</span>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border-2 border-gray-100 shadow-sm flex flex-col items-center justify-center gap-1 col-span-2 hover:border-green-300 transition-colors group">
                            <svg className="w-8 h-8 text-green-500 mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-3xl font-black text-gray-800">{user.bestWordsGuessed}</span>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Words Guessed Correctly</span>
                        </div>
                    </div>
                    
                    <div className="mt-8 flex justify-center">
                        <div className="bg-blue-50 px-6 py-3 rounded-xl border border-blue-100 text-center w-full">
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1">Win Rate</span>
                            <span className="text-2xl font-black text-blue-600">
                                {user.gamesPlayed > 0 ? Math.round((user.gamesWon / user.gamesPlayed) * 100) : 0}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
