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
        <div className="t-modal-backdrop" onClick={onClose}>
            <div className="t-modal-container t-modal-large" onClick={e => e.stopPropagation()}>
                <div className="t-modal-header">
                    <div className="t-modal-title">Global Leaderboard</div>
                    <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                
                <div className="t-modal-body" style={{ paddingBottom: 0 }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '32px 0' }} className="caption">Connecting...</div>
                    ) : players.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px 0' }} className="caption">No records found.</div>
                    ) : (
                        <div style={{ maxHeight: '60vh', overflowY: 'auto', margin: '0 -16px' }}>
                            <table className="t-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '60px', textAlign: 'center' }}>Rank</th>
                                        <th>Player</th>
                                        <th style={{ textAlign: 'right' }}>Games</th>
                                        <th style={{ textAlign: 'right' }}>Wins</th>
                                        <th style={{ textAlign: 'right' }}>Total Points</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {players.map((p, i) => (
                                        <tr key={p.id}>
                                            <td style={{ textAlign: 'center' }} className="mono">{String(i + 1).padStart(2, '0')}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
                                                    {p.avatarUrl ? (
                                                        <img src={p.avatarUrl} alt={p.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#4285F4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 400, fontFamily: 'sans-serif' }}>
                                                            {p.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <span style={{ color: 'var(--t-text-primary)', fontWeight: 500, fontSize: '14px' }}>{p.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }} className="mono">{p.gamesPlayed}</td>
                                            <td style={{ textAlign: 'right' }} className="mono">{p.gamesWon}</td>
                                            <td style={{ textAlign: 'right', color: 'var(--t-text-emphasis)' }} className="mono">{p.totalPoints}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <div className="t-modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
