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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {!user ? (
                    <GoogleLogin 
                        onSuccess={handleGoogleSuccess}
                        onError={() => console.log('Login Failed')}
                    />
                ) : (
                    <div className="t-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button onClick={() => setShowProfile(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', padding: 0 }}>
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#4285F4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 400, fontSize: '16px', fontFamily: 'sans-serif' }}>
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span style={{ color: 'var(--t-text-primary)', fontSize: '13px', fontWeight: 500 }}>{user.name}</span>
                                <span className="caption" style={{ color: 'var(--t-text-muted)' }}>{user.totalPoints} pts</span>
                            </div>
                        </button>
                        <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--t-border)' }}></div>
                        <button onClick={handleLogout} className="btn btn-ghost btn-icon" title="Logout" style={{ color: 'var(--t-danger)' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                        </button>
                    </div>
                )}
                
                <button onClick={() => setShowLeaderboard(true)} className="btn btn-secondary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Leaderboard
                </button>
            </div>

            <div className="t-card" style={{ width: '100%', maxWidth: '360px', boxSizing: 'border-box' }}>
                <h2 className="section-heading" style={{ marginBottom: '24px', textAlign: 'center' }}>Welcome to Inkrush</h2>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="t-input-group">
                        <label className="t-label">Your Name</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="t-input mono"
                            placeholder="John Doe"
                            maxLength={15}
                            required
                        />
                    </div>
                    <div className="t-input-group">
                        <label className="t-label">Room Code</label>
                        <input
                            type="text"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            className={`t-input mono ${quickJoinError ? 'error' : ''}`}
                            placeholder="ROOM_CODE"
                        />
                        {quickJoinError && (
                            <div className="t-error-text">{quickJoinError}</div>
                        )}
                    </div>
                    
                    <div style={{ marginTop: '8px' }}>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                            START DRAWING
                        </button>
                    </div>
                </form>
            </div>
            
            {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
            {showProfile && user && <Profile user={user} onClose={() => setShowProfile(false)} />}
        </div>
    );
};

export default JoinRoom;
