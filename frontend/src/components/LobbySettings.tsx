import React from 'react';
import type { RoomSettings } from '../types';

interface LobbySettingsProps {
    settings: RoomSettings;
    onUpdate: (settings: Partial<RoomSettings>) => void;
    isHost: boolean;
}

const LobbySettings: React.FC<LobbySettingsProps> = ({ settings, onUpdate, isHost }) => {
    const [wordsInput, setWordsInput] = React.useState(settings.customWords.join(', '));

    const handleChange = (key: keyof RoomSettings, value: any) => {
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
        <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-gray-100 space-y-6">
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Room Settings
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label htmlFor="maxPlayers" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Max Players</label>
                    <select
                        id="maxPlayers"
                        disabled={!isHost}
                        value={settings.maxPlayers}
                        onChange={(e) => handleChange('maxPlayers', parseInt(e.target.value))}
                        className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none font-bold text-gray-700 disabled:opacity-60"
                    >
                        {[2, 4, 8, 12, 16, 20].map(n => <option key={n} value={n}>{n} Players</option>)}
                    </select>
                </div>

                <div className="space-y-1">
                    <label htmlFor="totalRounds" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Total Rounds</label>
                    <select
                        id="totalRounds"
                        disabled={!isHost}
                        value={settings.totalRounds}
                        onChange={(e) => handleChange('totalRounds', parseInt(e.target.value))}
                        className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none font-bold text-gray-700 disabled:opacity-60"
                    >
                        {[2, 3, 5, 10, 15, 20].map(n => <option key={n} value={n}>{n} Rounds</option>)}
                    </select>
                </div>

                <div className="space-y-1">
                    <label htmlFor="drawingTime" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Drawing Time</label>
                    <select
                        id="drawingTime"
                        disabled={!isHost}
                        value={settings.drawingTime}
                        onChange={(e) => handleChange('drawingTime', parseInt(e.target.value))}
                        className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none font-bold text-gray-700 disabled:opacity-60"
                    >
                        {[30, 45, 60, 90, 120, 180].map(n => <option key={n} value={n}>{n} Seconds</option>)}
                    </select>
                </div>
            </div>

            <div className="space-y-1">
                <label htmlFor="customWords" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Custom Words (comma separated)</label>
                <textarea
                    id="customWords"
                    disabled={!isHost}
                    value={wordsInput}
                    onChange={handleWordsChange}
                    placeholder="word1, word2, word3..."
                    className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none font-bold text-gray-700 min-h-[80px] disabled:opacity-60 resize-none"
                />
            </div>

            {!isHost && (
                <div className="pt-2">
                    <p className="text-[10px] font-bold text-blue-400 uppercase text-center italic">Only the host can change these settings</p>
                </div>
            )}
        </div>
    );
};

export default LobbySettings;
