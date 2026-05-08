import React from 'react';

interface WordSelectionProps {
    words: string[];
    onSelect: (word: string) => void;
}

const WordSelection: React.FC<WordSelectionProps> = ({ words, onSelect }) => {
    return (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-40 rounded-3xl animate-in fade-in duration-300">
            <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-2xl max-w-md w-[min(100vw-2rem,28rem)] text-center border-4 border-yellow-400 transform -rotate-1">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-yellow-400 text-blue-900 font-black px-6 py-2 rounded-full shadow-lg border-4 border-white whitespace-nowrap">
                    YOUR TURN!
                </div>
                
                <h2 className="text-xl sm:text-2xl font-black mb-8 text-gray-800 uppercase tracking-tighter mt-2 italic">Choose a word to draw</h2>
                
                <div className="grid grid-cols-1 gap-4">
                    {words.map((word) => (
                        <button
                            key={word}
                            onClick={() => onSelect(word)}
                            className="group relative bg-blue-50 hover:bg-blue-600 border-b-4 border-blue-200 hover:border-blue-800 text-blue-700 hover:text-white font-black py-4 px-6 rounded-2xl transition-all transform hover:scale-105 active:scale-95 text-lg uppercase tracking-widest shadow-sm hover:shadow-blue-500/40"
                        >
                            {word}
                        </button>
                    ))}
                </div>
                
                <p className="mt-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Pick fast, the clock is ticking!</p>
            </div>
        </div>
    );
};

export default WordSelection;
