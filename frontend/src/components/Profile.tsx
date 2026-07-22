import React from 'react';
import type { User } from '../types';

interface ProfileProps {
    user: User;
    onClose: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onClose }) => {
    return (
        <div className="t-modal-backdrop" onClick={onClose}>
            <div className="t-modal-container t-modal-medium" onClick={e => e.stopPropagation()}>
                <div className="t-modal-header">
                    <div className="t-modal-title">Player Profile</div>
                    <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                
                <div className="t-modal-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#4285F4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 400, fontFamily: 'sans-serif' }}>
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '20px', fontWeight: 600, color: 'var(--t-text-emphasis)' }}>{user.name}</span>
                            <span className="caption" style={{ color: 'var(--t-accent)' }}>Level {Math.floor(user.gamesPlayed / 10) + 1}</span>
                        </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className="caption">Total Points</span>
                            <span className="metric" style={{ color: 'var(--t-text-emphasis)' }}>{user.totalPoints.toLocaleString()}</span>
                        </div>
                        <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className="caption">Win Rate</span>
                            <span className="metric" style={{ color: 'var(--t-text-emphasis)' }}>
                                {user.gamesPlayed > 0 ? Math.round((user.gamesWon / user.gamesPlayed) * 100) : 0}%
                            </span>
                        </div>
                        <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className="caption">Games Played</span>
                            <span className="metric" style={{ color: 'var(--t-text-emphasis)' }}>{user.gamesPlayed}</span>
                        </div>
                        <div className="t-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className="caption">Words Guessed</span>
                            <span className="metric" style={{ color: 'var(--t-text-emphasis)' }}>{user.bestWordsGuessed}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
