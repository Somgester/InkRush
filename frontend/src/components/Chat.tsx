import React, { useState, useEffect, useRef } from 'react';

interface Message {
    id: string;
    sender: string;
    text: string;
    isSystem?: boolean;
}

interface ChatProps {
    messages: Message[];
    onSendMessage: (text: string) => void;
}

const Chat: React.FC<ChatProps> = ({ messages, onSendMessage }) => {
    const [inputValue, setInputValue] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onSendMessage(inputValue);
            setInputValue('');
        }
    };

    return (
        <div className="flex flex-col h-full min-h-0 bg-white border-3 border-gray-100 rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b-3 border-gray-100">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Live Guessing</h3>
            </div>
            
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.isSystem ? 'items-center' : 'items-start'}`}>
                        {msg.isSystem ? (
                            <div className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-blue-100 shadow-sm">
                                {msg.text}
                            </div>
                        ) : (
                            <div className="max-w-[90%]">
                                <span className="text-xs font-black text-blue-600 mb-1 block ml-1 uppercase tracking-tighter">
                                    {msg.sender}
                                </span>
                                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl rounded-tl-none font-bold text-sm shadow-sm border border-white">
                                    {msg.text}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            
            <form onSubmit={handleSubmit} className="p-3 sm:p-4 bg-gray-50 border-t-3 border-gray-100">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your guess..."
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 font-bold text-gray-700 shadow-inner"
                />
            </form>
        </div>
    );
};

export default Chat;
