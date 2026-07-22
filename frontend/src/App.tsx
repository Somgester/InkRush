import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import JoinRoom from './components/JoinRoom';
import Chat from './components/Chat';
import PlayerList from './components/PlayerList';
import WordSelection from './components/WordSelection';
import Canvas from './components/Canvas';
import Podium from './components/Podium';
import LobbySettings from './components/LobbySettings';
import type { Message, Room, RoomSettings } from './types';

const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:5000';
const socket: Socket = io(backendUrl);
let pendingUsername = '';
let pendingUserId: string | undefined = undefined;

function App() {
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [roomId, setRoomId] = useState('');
    const [roomData, setRoomData] = useState<Room | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [timer, setTimer] = useState(0);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [quickJoinError, setQuickJoinError] = useState('');
    const previousCorrectGuessRef = useRef(false);
    const copyFeedbackTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | undefined>(undefined);

    const initialRoomId = new URLSearchParams(window.location.search).get('room') || 
                         (window.location.search.startsWith('?') && !window.location.search.includes('=') 
                             ? window.location.search.substring(1) 
                             : '');

    useEffect(() => {
        function onConnect() { setIsConnected(true); }
        function onDisconnect() { setIsConnected(false); }
        function onRoomData(data: Room) { setRoomData(data); setTimer(data.timer); }
        function onNewMessage(message: Message) { setMessages((prev) => [...prev, message]); }
        function onTimerUpdate(newTimer: number) { setTimer(newTimer); }
        function onQuickJoinSuccess({ roomId }: { roomId: string }) {
            socket.emit('join_room', { username: pendingUsername, roomId, userId: pendingUserId });
            setRoomId(roomId);
        }
        function onNoRoomsAvailable() {
            setQuickJoinError("No open rooms right now. Create one and others will join you!");
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('room_data', onRoomData);
        socket.on('new_message', onNewMessage);
        socket.on('timer_update', onTimerUpdate);
        socket.on('quick_join_success', onQuickJoinSuccess);
        socket.on('no_rooms_available', onNoRoomsAvailable);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('room_data', onRoomData);
            socket.off('new_message', onNewMessage);
            socket.off('timer_update', onTimerUpdate);
            socket.off('quick_join_success', onQuickJoinSuccess);
            socket.off('no_rooms_available', onNoRoomsAvailable);
        };
    }, []);
    const pingServer = () => fetch(`${backendUrl}/health`).catch(() => {});

    useEffect(() => {
        pingServer();
        const keepAlive = setInterval(pingServer, 5 * 60 * 1000);
        return () => clearInterval(keepAlive);
    }, []);

    useEffect(() => () => {
        if (copyFeedbackTimeoutRef.current !== undefined) {
            window.clearTimeout(copyFeedbackTimeoutRef.current);
            copyFeedbackTimeoutRef.current = undefined;
        }
    }, []);

    const handleJoinRoom = (name: string, room: string, userId?: string) => {
        pendingUsername = name;
        pendingUserId = userId;
        setRoomId(room);
        pingServer();
        if (room) {
            socket.emit('join_room', { username: name, roomId: room, userId });
        } else {
            setQuickJoinError('');
            socket.emit('quick_join');
        }
    };

    const handleSendMessage = (text: string) => { if (roomId) socket.emit('send_message', { roomId, text }); };
    const handleStartGame = () => {
        pingServer();
        if (roomId) socket.emit('start_game', { roomId });
    };
    const handleWordSelect = (word: string) => { if (roomId) socket.emit('choose_word', { roomId, word }); };
    const handleUpdateSettings = (settings: Partial<RoomSettings>) => { if (roomId) socket.emit('update_settings', { roomId, settings }); };

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

        const url = `${window.location.origin}${window.location.pathname}?${roomData.id}`;

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
            <div className="t-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '400px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <h1 className="page-title" style={{ fontSize: '32px', lineHeight: '40px' }}>INKRUSH</h1>
                        <p className="caption" style={{ marginTop: '8px', color: 'var(--t-text-muted)' }}>Multiplayer Drawing Game</p>
                    </div>
                    <JoinRoom onJoin={handleJoinRoom} initialRoomId={initialRoomId} quickJoinError={quickJoinError} />
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isConnected ? 'var(--t-success)' : 'var(--t-danger)' }} />
                        <span className="caption" style={{ color: 'var(--t-text-muted)' }}>
                            Server: {isConnected ? 'Connected' : 'Offline'}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="t-layout">
            <div className="t-sidebar">
                <div style={{ padding: '16px', borderBottom: '1px solid var(--t-border)', display: 'flex', alignItems: 'center', height: '44px', boxSizing: 'border-box' }}>
                    <span style={{ fontWeight: 700, color: 'var(--t-text-emphasis)', fontSize: '15px' }}>INKRUSH</span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <PlayerList players={roomData.players} hostId={roomData.hostId} />
                </div>
            </div>
            <div className="t-main">
                <div className="t-topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span className="caption">Round</span>
                            <span className="mono" style={{ color: 'var(--t-text-emphasis)' }}>{roomData.currentRound} / {roomData.totalRounds}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span className="caption">Time</span>
                            <span className="mono" style={{ color: timer < 10 ? 'var(--t-danger)' : 'var(--t-text-emphasis)' }}>{timer}s</span>
                        </div>
                        <button onClick={handleCopyInviteLink} className="btn btn-secondary btn-compact" style={{ marginLeft: '16px' }}>
                            Invite
                            {copyStatus === 'success' && <span style={{ marginLeft: '8px', color: 'var(--t-success)' }}>Copied!</span>}
                        </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {roomData.status === 'DRAWING' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--t-accent-bg)', padding: '4px 12px', borderRadius: '4px', border: '1px solid var(--t-accent-hover)' }}>
                                <span className="caption" style={{ color: 'var(--t-accent)' }}>{isArtist ? 'DRAW:' : 'GUESS:'}</span>
                                <span className="mono" style={{ fontSize: '14px', color: 'var(--t-text-emphasis)', letterSpacing: isArtist ? '0' : '0.2em' }}>
                                    {isArtist ? roomData.currentWord : roomData.currentWord?.replace(/[a-zA-Z]/g, '_')}
                                </span>
                            </div>
                        )}
                        {roomData.status === 'ROUND_END' && (
                            <div className="t-badge t-badge-active">The word was: {roomData.currentWord}</div>
                        )}
                        {roomData.status === 'GAME_OVER' && (
                            <div className="t-badge t-badge-info">Game Over</div>
                        )}
                        {roomData.status === 'WORD_SELECTION' && (
                            <div className="t-badge t-badge-warning">Choosing word...</div>
                        )}
                        {roomData.status === 'LOBBY' && (
                            <div className="t-badge t-badge-pending">Lobby</div>
                        )}
                    </div>
                </div>
                <div className="t-content" style={{ display: 'flex', gap: '24px', maxWidth: 'none', padding: '0', height: '100%', overflow: 'hidden' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--t-bg-root)', position: 'relative' }}>
                        {roomData.status === 'LOBBY' && (
                            <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--t-bg-surface)' }}>
                                <h2 className="section-heading" style={{ marginBottom: '24px' }}>Waiting Room</h2>
                                {roomData.players.length >= 2 && currentPlayer?.id === roomData.hostId ? (
                                    <button onClick={handleStartGame} className="btn btn-primary">Start Engine</button>
                                ) : (
                                    <div className="t-badge t-badge-disabled">Waiting for host to start</div>
                                )}
                                {currentPlayer?.id === roomData.hostId && (
                                    <div style={{ marginTop: '24px', width: '400px' }}>
                                        <LobbySettings settings={roomData.settings} onUpdate={handleUpdateSettings} isHost={true} />
                                    </div>
                                )}
                            </div>
                        )}

                        {roomData.status === 'WORD_SELECTION' && isArtist && (
                            <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--t-bg-surface)' }}>
                                <WordSelection words={roomData.wordChoices} onSelect={handleWordSelect} />
                            </div>
                        )}

                        {roomData.status === 'WORD_SELECTION' && !isArtist && (
                            <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--t-bg-surface)' }}>
                                <span className="caption">Artist is picking...</span>
                            </div>
                        )}

                        {roomData.status === 'GAME_OVER' && (
                            <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--t-bg-surface)', overflow: 'auto' }}>
                                <Podium players={roomData.players} />
                            </div>
                        )}

                        <div style={{ flex: 1, position: 'relative' }}>
                            <Canvas socket={socket} roomId={roomData.id} isDrawingEnabled={isDrawingEnabled} />
                        </div>
                    </div>
                    <div style={{ width: '320px', borderLeft: '1px solid var(--t-border)', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--t-bg-surface)' }}>
                        <Chat messages={messages} onSendMessage={handleSendMessage} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
