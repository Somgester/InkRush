import React, { useState } from 'react';

interface JoinRoomProps {
    onJoin: (username: string, roomId: string) => void;
    initialRoomId?: string;
}

const JoinRoom: React.FC<JoinRoomProps> = ({ onJoin, initialRoomId = '' }) => {
    const [username, setUsername] = useState('');
    const [roomId, setRoomId] = useState(initialRoomId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim() && roomId.trim()) {
            onJoin(username, roomId);
        }
    };

    return (
        <div className="relative group">
            {/* Playful background shadow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            
            <div className="relative bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-[min(100vw-2rem,24rem)] border-4 border-yellow-400">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-yellow-400 text-white font-black px-6 py-2 rounded-full shadow-lg border-4 border-white transform -rotate-2">
                    PLAY NOW!
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-black mb-8 text-center text-gray-800 tracking-tight mt-2">
                    Welcome to <span className="text-blue-600">Inkrush</span>
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Your Name</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-5 py-4 bg-gray-50 border-3 border-gray-100 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-all font-bold text-gray-700 placeholder-gray-300"
                            placeholder="John Doe"
                            maxLength={15}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Room Code</label>
                        <input
                            type="text"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            className="w-full px-5 py-4 bg-gray-50 border-3 border-gray-100 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-all font-bold text-gray-700 placeholder-gray-300"
                            placeholder="SECRET_ROOM"
                            required
                        />
                    </div>
                    
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all font-black text-lg sm:text-xl transform active:scale-95 border-b-6 border-blue-800"
                    >
                        START DRAWING
                    </button>
                </form>
                
                <p className="mt-6 text-center text-xs text-gray-400 font-bold uppercase tracking-widest">
                    Build with ❤️ by Somgester
                </p>
            </div>
        </div>
    );
};

export default JoinRoom;
