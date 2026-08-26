import React from 'react';
import type { RoomSettings } from '../types';

interface LobbySettingsProps {
    settings: RoomSettings;
    onUpdate: (settings: Partial<RoomSettings>) => void;
    isHost: boolean;
}

const LobbySettings: React.FC<LobbySettingsProps> = ({ settings, onUpdate, isHost }) => {
    const [wordsInput, setWordsInput] = React.useState(settings.customWords.join(', '));

    const handleChange = (key: keyof RoomSettings, value: RoomSettings[keyof RoomSettings]) => {
        if (!isHost) return;
        onUpdate({ [key]: value });
    };

    const handleWordsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        setWordsInput(newValue);
        
        const words = newValue.split(',')
            .map(s => s.trim())
            .filter(s => s !== '');
            
        onUpdate({ customWords: words });
    };

    return (
        <div className="t-card" style={{ width: '100%', boxSizing: 'border-box' }}>
            <h3 className="section-heading" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                Room Configuration
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="t-input-group">
                    <label className="t-label" htmlFor="lobby-max-players">Max Players</label>
                    <select
                        id="lobby-max-players"
                        disabled={!isHost}
                        value={settings.maxPlayers}
                        onChange={(e) => handleChange('maxPlayers', parseInt(e.target.value))}
                        className="t-input mono"
                    >
                        {[2, 4, 8, 12, 16, 20].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>

                <div className="t-input-group">
                    <label className="t-label" htmlFor="lobby-total-rounds">Total Rounds</label>
                    <select
                        id="lobby-total-rounds"
                        disabled={!isHost}
                        value={settings.totalRounds}
                        onChange={(e) => handleChange('totalRounds', parseInt(e.target.value))}
                        className="t-input mono"
                    >
                        {[2, 3, 5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>

                <div className="t-input-group">
                    <label className="t-label" htmlFor="lobby-drawing-time">Drawing Time (s)</label>
                    <select
                        id="lobby-drawing-time"
                        disabled={!isHost}
                        value={settings.drawingTime}
                        onChange={(e) => handleChange('drawingTime', parseInt(e.target.value))}
                        className="t-input mono"
                    >
                        {[30, 45, 60, 90, 120, 180].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>

                <div className="t-input-group" style={{ justifyContent: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input 
                            type="checkbox" 
                            checked={settings.isPublic}
                            disabled={!isHost}
                            onChange={(e) => handleChange('isPublic', e.target.checked)}
                            style={{ margin: 0 }}
                        />
                        <span className="t-label">Public Room</span>
                    </label>
                </div>
            </div>

            <div className="t-input-group" style={{ marginTop: '16px' }}>
                <label className="t-label" htmlFor="lobby-custom-words">Custom Words (comma separated)</label>
                <textarea
                    id="lobby-custom-words"
                    disabled={!isHost}
                    value={wordsInput}
                    onChange={handleWordsChange}
                    placeholder="word1, word2, word3..."
                    className="t-input mono"
                    style={{ height: '64px', padding: '8px', resize: 'none' }}
                />
            </div>

            {!isHost && (
                <div style={{ marginTop: '16px' }}>
                    <p className="caption" style={{ color: 'var(--t-warning)', textAlign: 'center' }}>Only host can modify settings.</p>
                </div>
            )}
        </div>
    );
};

export default LobbySettings;
