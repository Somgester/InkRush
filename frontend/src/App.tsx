import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import JoinRoom from './components/JoinRoom';

interface Player {
    id: string;
    username: string;
    score: number;
    isDrawing: boolean;
    hasGuessed: boolean;
}

interface Room {
    id: string;
    hostId?: string;
    players: Player[];
    status: 'LOBBY' | 'WORD_SELECTION' | 'DRAWING' | 'ROUND_END';
    currentRound: number;
    totalRounds: number;
    timer: number;
    wordChoices: string[];
    currentWord?: string;
}

const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:5000';
const socket: Socket = io(backendUrl);

function App() {
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [username, setUsername] = useState('');
    const [roomId, setRoomId] = useState('');
    const [roomData, setRoomData] = useState<Room | null>(null);

    useEffect(() => {
        function onConnect() { setIsConnected(true); }
        function onDisconnect() { setIsConnected(false); }
        function onRoomData(data: Room) { setRoomData(data); }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('room_data', onRoomData);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('room_data', onRoomData);
        };
    }, []);

    const handleJoinRoom = (name: string, room: string) => {
        setUsername(name);
        setRoomId(room);
        socket.emit('join_room', { username: name, roomId: room });
    };

    if (!roomData) {
        return (
            <div className="min-h-screen bg-yellow-400 flex flex-col items-center justify-center p-6 bg-[radial-gradient(#facc15_1px,transparent_1px)] [background-size:20px_20px]">
                <div className="mb-12 text-center animate-in zoom-in duration-700">
                    <h1 className="text-8xl font-black text-white tracking-tighter drop-shadow-[0_10px_0_rgba(29,78,216,1)] italic transform -rotate-2">
                        INKRUSH
                    </h1>
                    <p className="mt-6 text-blue-800 font-black text-xl uppercase tracking-widest bg-white/30 backdrop-blur-md px-6 py-2 rounded-full inline-block border-2 border-white">
                        Multiplayer Fun
                    </p>
                </div>
                <JoinRoom onJoin={handleJoinRoom} />
                <div className="mt-12 flex items-center space-x-3 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/50 shadow-sm">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                    <span className="text-sm font-black text-white uppercase tracking-widest">
                        Server: {isConnected ? 'Connected' : 'Offline'}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
            <h1 className="text-4xl font-black text-blue-600">Room Joined: {roomId}</h1>
            <p className="text-xl font-bold mt-4">Username: {username}</p>
            <p className="mt-8 text-gray-400 font-bold italic">More features coming in next commits...</p>
        </div>
    );
}

export default App;
