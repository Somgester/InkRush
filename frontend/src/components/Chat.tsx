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
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--t-border)' }}>
                <h3 className="section-heading">Event Log</h3>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {messages.map((msg) => (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column' }}>
                        {msg.isSystem ? (
                            <div className="mono" style={{ 
                                color: msg.text.includes('guessed the word') ? 'var(--t-success)' : 'var(--t-accent)', 
                                fontSize: '11px', 
                                textAlign: 'center', 
                                margin: '4px 0', 
                                opacity: msg.text.includes('guessed the word') ? 1 : 0.8,
                                fontWeight: msg.text.includes('guessed the word') ? 700 : 400
                            }}>
                                &gt; {msg.text}
                            </div>
                        ) : (
                            <div>
                                <span style={{ color: 'var(--t-text-muted)', fontSize: '11px', fontWeight: 600, marginRight: '8px' }}>
                                    {msg.sender}
                                </span>
                                <span style={{ color: 'var(--t-text-primary)' }}>
                                    {msg.text}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '16px', borderTop: '1px solid var(--t-border)' }}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter command or guess..."
                    className="t-input mono"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                />
            </form>
        </div>
    );
};

export default Chat;
