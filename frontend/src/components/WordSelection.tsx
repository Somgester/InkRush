import React from 'react';

interface WordSelectionProps {
    words: string[];
    onSelect: (word: string) => void;
}

const WordSelection: React.FC<WordSelectionProps> = ({ words, onSelect }) => {
    return (
        <div className="t-card t-card-relaxed" style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
                <h2 className="section-heading" style={{ marginBottom: '8px' }}>Select Target</h2>
                <p className="caption" style={{ color: 'var(--t-text-muted)' }}>Choose an item to draw.</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {words.map((word) => (
                    <button
                        key={word}
                        onClick={() => onSelect(word)}
                        className="btn btn-secondary mono"
                        style={{ width: '100%', height: '36px', fontSize: '14px' }}
                    >
                        {word}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default WordSelection;
