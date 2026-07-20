import React, { useState, useEffect } from 'react';
import Leaderboard from './Leaderboard';
import Profile from './Profile';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import type { User } from '../types';

interface JoinRoomProps {
    onJoin: (username: string, roomId: string, userId?: string) => void;
    initialRoomId?: string;
    quickJoinError?: string;
}

const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:5000';

const JoinRoom: React.FC<JoinRoomProps> = ({ onJoin, initialRoomId = '', quickJoinError }) => {
    const [username, setUsername] = useState('');
    const [roomId, setRoomId] = useState(initialRoomId);
    const [user, setUser] = useState<User | null>(null);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            setUsername(parsed.name);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim()) {
            onJoin(username, roomId.trim(), user?.id);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
        if (!credentialResponse.credential) return;
        const decoded: { sub: string; name: string; picture?: string } = jwtDecode(credentialResponse.credential);
        
        try {
            const res = await fetch(`${backendUrl}/api/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    googleId: decoded.sub,
                    name: decoded.name,
                    avatarUrl: decoded.picture
                })
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                setUsername(data.name);
                localStorage.setItem('user', JSON.stringify(data));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        setUsername('');
    };

    return (
        <div className="relative group flex flex-col items-center">
            {/* Playful background shadow */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 -z-10 mt-16"></div>
            
            <div className="flex gap-4 mb-6">
                {!user ? (
                    <div className="flex items-center">
                        <GoogleLogin 
                            onSuccess={handleGoogleSuccess}
                            onError={() => console.log('Login Failed')}
                        />
                    </div>
                ) : (
                    <div className="bg-white px-6 py-2 rounded-xl shadow-md border-2 border-gray-200 flex items-center gap-4">
                        <button onClick={() => setShowProfile(true)} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-black">{user.name.charAt(0)}</div>
                            )}
                            <div className="flex flex-col text-left">
                                <span className="font-black text-gray-800 leading-tight">{user.name}</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight">{user.totalPoints} pts</span>
                            </div>
                        </button>
                        <button onClick={handleLogout} className="text-red-500 hover:text-red-700 ml-2 border-l-2 border-gray-100 pl-4">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                )}
                
                <button onClick={() => setShowLeaderboard(true)} className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-black px-6 py-3 rounded-xl shadow-md border-2 border-yellow-500 transition-all flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    LEADERBOARD
                </button>
            </div>

            <div className="relative bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-[min(100vw-2rem,24rem)] border-4 border-yellow-400">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-yellow-400 text-white font-black px-6 py-2 rounded-full shadow-lg border-4 border-white transform -rotate-2 whitespace-nowrap">
                    PLAY NOW!
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-black mb-8 text-center text-gray-800 tracking-tight mt-6">
                    Welcome to <span className="text-blue-600">Inkrush</span>
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Your Name</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-5 py-4 bg-gray-50 border-3 border-gray-100 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-all font-bold text-gray-700 placeholder-gray-300"
                            placeholder="John Doe"
                            maxLength={15}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Room Code</label>
                        <input
                            type="text"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            className="w-full px-5 py-4 bg-gray-50 border-3 border-gray-100 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-all font-bold text-gray-700 placeholder-gray-300"
                            placeholder="ROOM_CODE"
                        />
                        {quickJoinError && (
                            <p className="text-red-600 text-[10px] font-black uppercase tracking-widest mt-2 ml-1 animate-pulse bg-red-50 px-3 py-1 rounded-full border border-red-100 inline-block">
                                {quickJoinError}
                            </p>
                        )}
                    </div>
                    
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all font-black text-lg sm:text-xl transform active:scale-95 border-b-6 border-blue-800"
                    >
                        START DRAWING
                    </button>
                </form>
            </div>
            
            {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
            {showProfile && user && <Profile user={user} onClose={() => setShowProfile(false)} />}
        </div>
    );
};

export default JoinRoom;
