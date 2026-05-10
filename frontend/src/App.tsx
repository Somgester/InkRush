import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import JoinRoom from './components/JoinRoom';
import Chat from './components/Chat';
import PlayerList from './components/PlayerList';
import WordSelection from './components/WordSelection';
import Canvas from './components/Canvas';
import Podium from './components/Podium';
import type { Message, Room } from './types';

const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:5000';
const socket: Socket = io(backendUrl);

function App() {
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [username, setUsername] = useState('');
    const [roomId, setRoomId] = useState('');
    const [roomData, setRoomData] = useState<Room | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [timer, setTimer] = useState(0);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const previousCorrectGuessRef = useRef(false);
    const copyFeedbackTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | undefined>(undefined);

    const initialRoomId = new URLSearchParams(window.location.search).get('room') || '';

    useEffect(() => {
        function onConnect() { setIsConnected(true); }
        function onDisconnect() { setIsConnected(false); }
        function onRoomData(data: Room) { setRoomData(data); setTimer(data.timer); }
        function onNewMessage(message: Message) { setMessages((prev) => [...prev, message]); }
        function onTimerUpdate(newTimer: number) { setTimer(newTimer); }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('room_data', onRoomData);
        socket.on('new_message', onNewMessage);
        socket.on('timer_update', onTimerUpdate);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('room_data', onRoomData);
            socket.off('new_message', onNewMessage);
            socket.off('timer_update', onTimerUpdate);
        };
    }, []);

    useEffect(() => () => {
        if (copyFeedbackTimeoutRef.current !== undefined) {
            window.clearTimeout(copyFeedbackTimeoutRef.current);
            copyFeedbackTimeoutRef.current = undefined;
        }
    }, []);

    const handleJoinRoom = (name: string, room: string) => {
        setUsername(name);
        setRoomId(room);
        socket.emit('join_room', { username: name, roomId: room });
    };

    const handleSendMessage = (text: string) => roomId && socket.emit('send_message', { roomId, text });
    const handleStartGame = () => roomId && socket.emit('start_game', { roomId });
    const handleWordSelect = (word: string) => roomId && socket.emit('choose_word', { roomId, word });
    const showCopyFeedback = (status: 'success' | 'error') => {
        setCopyStatus(status);

        if (copyFeedbackTimeoutRef.current !== undefined) {
            window.clearTimeout(copyFeedbackTimeoutRef.current);
        }

        copyFeedbackTimeoutRef.current = window.setTimeout(() => {
            setCopyStatus('idle');
            copyFeedbackTimeoutRef.current = undefined;
        }, 2000);
    };

    const handleCopyInviteLink = async () => {
        if (!roomData) return;

        if (!navigator.clipboard?.writeText) {
            showCopyFeedback('error');
            return;
        }

        const url = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomData.id)}`;

        try {
            await navigator.clipboard.writeText(url);
            showCopyFeedback('success');
        } catch {
            showCopyFeedback('error');
        }
    };

    const currentPlayer = roomData?.players.find(p => p.id === socket.id);

    useEffect(() => {
        if (!currentPlayer) {
            previousCorrectGuessRef.current = false;
            return;
        }

        if (currentPlayer.hasGuessedCorrectly && !previousCorrectGuessRef.current) {
            const successSound = new Audio(`${import.meta.env.BASE_URL}sounds/mixkit-winning-a-coin-video-game-2069.wav`);
            void successSound.play().catch(() => undefined);
        }

        previousCorrectGuessRef.current = currentPlayer.hasGuessedCorrectly;
    }, [currentPlayer]);

    const isDrawingEnabled = !!(currentPlayer?.isDrawing && roomData?.status === 'DRAWING');
    const isArtist = !!currentPlayer?.isDrawing;

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
                <JoinRoom onJoin={handleJoinRoom} initialRoomId={initialRoomId} />
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
        <div className="min-h-screen bg-gray-50 flex flex-col h-screen overflow-hidden font-sans text-gray-800">
            {/* Header */}
            <header className="bg-white px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col gap-3 sm:gap-4 lg:flex-row lg:justify-between lg:items-center z-20 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border-b-4 border-gray-100">
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 lg:gap-10 justify-between lg:justify-start">
                    <h1 className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tighter italic transform -rotate-2 hover:rotate-0 transition-transform cursor-default">INKRUSH</h1>
                    
                    <div className="flex items-center gap-3 sm:gap-4 bg-gray-50 px-4 sm:px-6 py-2 rounded-2xl border-2 border-gray-100">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Round</span>
                            <span className="text-lg sm:text-xl font-black text-gray-800 leading-none tabular-nums">
                                {roomData.currentRound}<span className="text-gray-300 mx-1">/</span>{roomData.totalRounds}
                            </span>
                        </div>
                        <div className="w-px h-8 bg-gray-200" />
                        <div className="flex flex-col min-w-[60px]">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Time Left</span>
                            <span className={`text-lg sm:text-xl font-black leading-none tabular-nums ${timer < 10 ? 'text-red-500 animate-pulse' : 'text-blue-600'}`}>
                                {timer}s
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleCopyInviteLink}
                        className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-2xl border-2 border-blue-100 transition-all font-black text-xs uppercase tracking-widest relative"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Invite
                        {copyStatus !== 'idle' && (
                            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded-md animate-in fade-in slide-in-from-top-1 whitespace-nowrap">
                                {copyStatus === 'success' ? 'Copied!' : 'Copy failed'}
                            </span>
                        )}
                    </button>
                </div>

                <div className="flex-1 flex flex-col items-start lg:items-center">
                    {roomData.status === 'DRAWING' && (
                        <div className="flex flex-col items-start lg:items-center animate-in slide-in-from-top duration-500">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                {isArtist ? 'YOUR WORD TO DRAW' : 'WHAT IS BEING DRAWN?'}
                            </span>
                            <div className="bg-blue-600 px-4 sm:px-8 py-2 rounded-full shadow-lg shadow-blue-500/20 border-b-4 border-blue-800 max-w-full overflow-hidden text-ellipsis">
                                {isArtist ? (
                                    <span className="text-lg sm:text-2xl font-black text-white tracking-widest uppercase break-words">
                                        {roomData.currentWord}
                                    </span>
                                ) : (
                                    <span className="text-lg sm:text-2xl font-black text-white tracking-[0.2em] sm:tracking-[0.4em] translate-x-[0.1em] sm:translate-x-[0.2em] whitespace-nowrap">
                                        {roomData.currentWord?.replace(/[a-zA-Z]/g, '_')}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                    {roomData.status === 'ROUND_END' && (
                        <div className="bg-green-500 px-4 sm:px-8 py-2 rounded-full shadow-lg border-b-4 border-green-700 animate-bounce max-w-full">
                             <span className="text-sm sm:text-xl font-black text-white uppercase">The word was: {roomData.currentWord}</span>
                        </div>
                    )}
                    {roomData.status === 'GAME_OVER' && (
                        <div className="bg-blue-600 px-4 sm:px-8 py-2 rounded-full shadow-lg border-b-4 border-blue-800 animate-pulse max-w-full">
                            <span className="text-sm sm:text-xl font-black text-white uppercase tracking-widest">Final Standings!</span>
                        </div>
                    )}
                    {roomData.status === 'WORD_SELECTION' && (
                         <div className="bg-yellow-400 px-4 sm:px-8 py-2 rounded-full shadow-lg border-b-4 border-yellow-600 animate-pulse max-w-full">
                            <span className="text-sm sm:text-xl font-black text-white uppercase">Choosing a word...</span>
                        </div>
                    )}
                    {roomData.status === 'LOBBY' && (
                         <div className="bg-orange-400 px-4 sm:px-8 py-2 rounded-full shadow-lg border-b-4 border-orange-600 max-w-full">
                            <span className="text-sm sm:text-xl font-black text-white uppercase tracking-widest">Waiting Room</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 sm:gap-6 self-end lg:self-auto">
                    <div className="flex flex-col text-right">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Player</span>
                        <span className="text-sm font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2 justify-end">
                            {username}
                            {currentPlayer?.id === roomData.hostId && (
                                <span className="text-[10px] font-black px-2 py-1 rounded-full bg-yellow-400 text-blue-900 border border-yellow-500">HOST</span>
                            )}
                        </span>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-md border-b-4 border-blue-800">
                        {username.charAt(0).toUpperCase()}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden p-3 sm:p-4 lg:p-6 gap-3 sm:gap-4 lg:gap-6 relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]">
                {/* Left Side: Scoreboard */}
                <div className="order-1 lg:order-1 lg:shrink-0">
                    <PlayerList players={roomData.players} hostId={roomData.hostId} />
                </div>

                {/* Center: Placeholder for Canvas Area */}
                <div className="order-2 lg:order-2 flex-1 min-h-[55vh] lg:min-h-0 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col border-4 border-white overflow-hidden relative ring-8 ring-gray-100/50">
                    {roomData.status === 'LOBBY' && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center z-30 animate-in fade-in duration-500">
                            <div className="relative mb-10">
                                <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
                                <h2 className="relative text-3xl sm:text-5xl font-black text-gray-800 tracking-tighter italic transform -rotate-1 text-center px-4">Ready to start?</h2>
                            </div>
                            
                            {roomData.players.length >= 2 && currentPlayer?.id === roomData.hostId ? (
                                <button
                                    onClick={handleStartGame}
                                    className="group relative px-8 sm:px-12 py-4 sm:py-5 bg-blue-600 rounded-2xl shadow-xl hover:shadow-blue-500/40 transition-all transform hover:scale-105 active:scale-95 border-b-8 border-blue-800 mx-4"
                                >
                                    <span className="text-lg sm:text-2xl font-black text-white tracking-widest uppercase">START ENGINE</span>
                                    <div className="absolute -top-3 -right-2 sm:-right-3 bg-yellow-400 text-blue-900 text-[10px] font-black px-2 py-1 rounded-md rotate-12 border-2 border-white shadow-sm">
                                        LET'S GO!
                                    </div>
                                </button>
                            ) : roomData.players.length >= 2 ? (
                                <div className="bg-blue-50 px-6 sm:px-8 py-4 rounded-2xl border-2 border-blue-100 text-center mx-4">
                                    <p className="text-blue-600 font-black uppercase tracking-widest text-sm mb-1">Waiting for host</p>
                                    <p className="text-blue-400 font-bold text-xs uppercase italic">Only the first player can start</p>
                                </div>
                            ) : (
                                <div className="bg-gray-100 px-6 sm:px-8 py-4 rounded-2xl border-2 border-gray-200 text-center mx-4">
                                    <p className="text-gray-400 font-black uppercase tracking-widest text-sm mb-1">Waiting for more players</p>
                                    <p className="text-gray-300 font-bold text-xs uppercase italic">Minimum 2 required to play</p>
                                </div>
                            )}
                        </div>
                    )}

                    {roomData.status === 'WORD_SELECTION' && isArtist && (
                        <WordSelection words={roomData.wordChoices} onSelect={handleWordSelect} />
                    )}

                    {roomData.status === 'WORD_SELECTION' && !isArtist && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex items-center justify-center z-30 animate-in fade-in duration-500">
                            <div className="text-center p-12 bg-gray-50 rounded-[3rem] border-4 border-white shadow-2xl transform rotate-1">
                                <p className="text-2xl font-black text-gray-800 uppercase tracking-tighter mb-4 italic">Artist is picking...</p>
                                <div className="flex space-x-2 justify-center">
                                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s] shadow-md shadow-blue-500/20" />
                                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s] shadow-md shadow-blue-500/20" />
                                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce shadow-md shadow-blue-500/20" />
                                </div>
                            </div>
                        </div>
                    )}

                    {roomData.status === 'GAME_OVER' && (
                        <Podium players={roomData.players} />
                    )}

                    <Canvas socket={socket} roomId={roomData.id} isDrawingEnabled={isDrawingEnabled} />
                </div>

                {/* Right Side: Chat Area */}
                <div className="order-3 lg:shrink-0 w-full lg:w-80 h-[380px] sm:h-[420px] lg:h-full flex flex-col">
                    <Chat messages={messages} onSendMessage={handleSendMessage} />
                </div>
            </main>
        </div>
    );
}

export default App;
