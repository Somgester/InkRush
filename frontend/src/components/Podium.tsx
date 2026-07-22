import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';

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

    // Arrange as 2nd, 1st, 3rd for visual hierarchy
    const podiumOrder = [
        top3[1] || null,
        top3[0] || null,
        top3[2] || null
    ];

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(13, 15, 18, 0.95)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '32px',
            opacity: mounted ? 1 : 0,
            transition: 'opacity 0.8s ease-in-out'
        }}>
            
            <div style={{ textAlign: 'center', marginBottom: '48px', transform: mounted ? 'translateY(0)' : 'translateY(-20px)', transition: 'transform 0.8s ease-out' }}>
                <div className="mono" style={{ color: 'var(--t-accent)', letterSpacing: '4px', fontSize: '14px', marginBottom: '8px' }}>GAME CONCLUDED</div>
                <h1 className="page-title" style={{ fontSize: '48px', textTransform: 'uppercase', textShadow: '0 0 20px rgba(6, 182, 212, 0.3)' }}>Final Standings</h1>
            </div>

            {/* Podium Area */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '24px', marginBottom: '48px', height: '240px' }}>
                {podiumOrder.map((player, idx) => {
                    if (!player) return <div key={idx} style={{ width: '140px' }} />;

                    // idx 0 is 2nd place, idx 1 is 1st place, idx 2 is 3rd place
                    const rank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
                    
                    const heightMap = { 1: '200px', 2: '160px', 3: '140px' };
                    const colorMap = { 
                        1: { border: 'var(--t-accent)', bg: 'var(--t-accent-bg)', text: 'var(--t-text-emphasis)', icon: <Trophy size={32} color="var(--t-accent)" /> },
                        2: { border: 'var(--t-border-strong)', bg: 'var(--t-bg-inset)', text: 'var(--t-text-primary)', icon: <Medal size={24} color="#94a3b8" /> },
                        3: { border: '#78350f', bg: 'rgba(120, 53, 15, 0.1)', text: '#d97706', icon: <Award size={24} color="#b45309" /> }
                    };
                    
                    const styling = colorMap[rank as keyof typeof colorMap];

                    return (
                        <div key={player.id} className="t-card" style={{ 
                            width: '160px', 
                            height: heightMap[rank as keyof typeof heightMap],
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            padding: '24px 16px',
                            borderTop: `4px solid ${styling.border}`,
                            backgroundColor: styling.bg,
                            transform: mounted ? 'translateY(0)' : 'translateY(40px)',
                            opacity: mounted ? 1 : 0,
                            transition: `all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${idx * 0.15}s`
                        }}>
                            <div style={{ marginBottom: '16px' }}>{styling.icon}</div>
                            <div style={{ 
                                width: '48px', height: '48px', borderRadius: '50%', backgroundColor: styling.border, color: 'var(--t-void)', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 600, marginBottom: '12px'
                            }}>
                                {player.username.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ color: styling.text, fontWeight: 700, fontSize: '18px', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {player.username}
                            </div>
                            <div className="mono" style={{ color: styling.border, marginTop: '8px', fontSize: '14px' }}>
                                {player.score} PTS
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Rest of the players table */}
            {rest.length > 0 && (
                <div className="t-card" style={{ 
                    width: '100%', maxWidth: '600px', padding: 0, overflow: 'hidden',
                    transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                    opacity: mounted ? 1 : 0,
                    transition: 'all 0.6s ease-out 0.6s'
                }}>
                    <table className="t-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px', textAlign: 'center' }}>Rank</th>
                                <th>Player</th>
                                <th style={{ textAlign: 'right' }}>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rest.map((player, index) => (
                                <tr key={player.id}>
                                    <td style={{ textAlign: 'center' }} className="mono">
                                        {String(index + 4).padStart(2, '0')}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#4285F4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 400, fontFamily: 'sans-serif' }}>
                                                {player.username.charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ color: 'var(--t-text-primary)' }}>{player.username}</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }} className="mono">
                                        {player.score}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            <div style={{ 
                marginTop: '32px',
                opacity: mounted ? 1 : 0,
                transition: 'opacity 1s ease-in 1s'
            }}>
                <span className="caption" style={{ color: 'var(--t-text-muted)' }}>Awaiting host for next session...</span>
            </div>
        </div>
    );
};

export default Podium;
