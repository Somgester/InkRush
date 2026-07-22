import React from 'react';
import type { Player } from '../types';

interface PlayerListProps {
    players: Player[];
    hostId?: string;
}

const PlayerList: React.FC<PlayerListProps> = ({ players, hostId }) => {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

    return (
        <table className="t-table">
            <thead>
                <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                    <th>Player</th>
                    <th style={{ textAlign: 'right' }}>Score</th>
                </tr>
            </thead>
            <tbody>
                {sortedPlayers.map((player, index) => {
                    const isDrawing = player.isDrawing;
                    const hasGuessedCorrectly = player.hasGuessedCorrectly;
                    
                    return (
                        <tr 
                            key={player.id} 
                            className={hasGuessedCorrectly ? 'selected' : ''}
                            style={{ 
                                borderLeft: isDrawing ? '2px solid var(--t-violet)' : undefined,
                                backgroundColor: isDrawing ? 'var(--t-bg-surface)' : undefined
                            }}
                        >
                            <td style={{ textAlign: 'center', color: 'var(--t-text-muted)' }}>
                                {index + 1}
                            </td>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ color: hasGuessedCorrectly ? 'var(--t-success)' : 'var(--t-text-primary)', fontWeight: hasGuessedCorrectly ? 700 : 500 }}>
                                            {player.username}
                                        </span>
                                    </div>
                                    {player.id === hostId && (
                                        <span className="t-badge t-badge-warning" style={{ fontSize: '9px', height: '16px', padding: '0 4px' }}>HOST</span>
                                    )}
                                    {isDrawing && (
                                        <span className="t-badge" style={{ backgroundColor: 'var(--t-violet)', color: 'var(--t-void)', fontSize: '9px', height: '16px', padding: '0 4px' }}>DRAW</span>
                                    )}
                                </div>
                            </td>
                            <td style={{ textAlign: 'right' }} className="mono">
                                {player.score}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

export default PlayerList;
