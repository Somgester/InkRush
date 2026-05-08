import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Room, Player, Message } from './types.js';
import { GameEngine } from './gameEngine.js';
import { config } from './config.js';

const app = express();
const port = config.port;
const maxPlayersPerRoom = config.maxPlayersPerRoom;
const totalRounds = config.totalRounds;
const frontendOrigin = config.frontendUrl;
const systemMessageSender = config.systemMessageSender;

app.use(cors({
    origin: frontendOrigin,
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: frontendOrigin,
        methods: ['GET', 'POST'],
    },
});

// Room state storage
const rooms = new Map<string, Room>();
const gameEngine = new GameEngine(io, rooms);

app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Ping Pong Ding Dong' });
});

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' , "message": 'i am in good condition and healthy af' });
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', ({ roomId, username }: { roomId: string; username: string }) => {
        if (!rooms.has(roomId)) {
            rooms.set(roomId, {
                id: roomId,
                hostId: socket.id,
                players: [],
                status: 'LOBBY',
                currentRound: 0,
                totalRounds,
                timer: 0,
                wordChoices: []
            });
        }

        const room = rooms.get(roomId)!;
        if (room.players.length >= maxPlayersPerRoom) {
            socket.emit('new_message', {
                id: Date.now().toString(),
                sender: systemMessageSender,
                text: `Room is full. Maximum ${maxPlayersPerRoom} players allowed.`,
                isSystem: true
            } satisfies Message);
            return;
        }

        socket.join(roomId);

        const newPlayer: Player = {
            id: socket.id,
            username,
            score: 0,
            isDrawing: false,
            hasGuessed: false
        };

        room.players.push(newPlayer);
        if (!room.hostId) {
            room.hostId = newPlayer.id;
        }
        
        io.to(roomId).emit('room_data', room);
        
        const systemMessage: Message = {
            id: Date.now().toString(),
            sender: systemMessageSender,
            text: `${username} joined the room!`,
            isSystem: true
        };
        io.to(roomId).emit('new_message', systemMessage);
    });

    socket.on('start_game', ({ roomId }: { roomId: string }) => {
        const room = rooms.get(roomId);
        if (!room || room.hostId !== socket.id) return;

        gameEngine.startGame(roomId);
    });

    socket.on('choose_word', ({ roomId, word }: { roomId: string; word: string }) => {
        gameEngine.chooseWord(roomId, word);
    });

    socket.on('send_message', ({ roomId, text }: { roomId: string; text: string }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        if (!player) return;

        const guessStatus = gameEngine.handleGuess(roomId, socket.id, text);

        if (guessStatus === 'CORRECT') {
            const systemMessage: Message = {
                id: Date.now().toString(),
                sender: systemMessageSender,
                text: `${player.username} guessed the word!`,
                isSystem: true
            };
            io.to(roomId).emit('new_message', systemMessage);
        } else if (guessStatus === 'CLOSE') {
            const systemMessage: Message = {
                id: Date.now().toString(),
                sender: systemMessageSender,
                text: `'${text}' is very close!`,
                isSystem: true
            };
            socket.emit('new_message', systemMessage);
            
            const message: Message = {
                id: Date.now().toString(),
                sender: player.username,
                text
            };
            io.to(roomId).emit('new_message', message);
        } else {
            const message: Message = {
                id: Date.now().toString(),
                sender: player.username,
                text
            };
            io.to(roomId).emit('new_message', message);
        }
    });

    socket.on('draw_move', ({ roomId, ...data }: { roomId: string; [key: string]: any }) => {
        socket.to(roomId).emit('draw_move', data);
    });

    socket.on('clear_canvas', ({ roomId }: { roomId: string }) => {
        socket.to(roomId).emit('clear_canvas');
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        rooms.forEach((room, roomId) => {
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                const player = room.players[playerIndex];
                room.players.splice(playerIndex, 1);
                
                gameEngine.handlePlayerDisconnect(roomId, socket.id);

                if (room.hostId === socket.id) {
                    room.hostId = room.players[0]?.id;
                }

                if (room.players.length === 0) {
                    rooms.delete(roomId);
                } else {
                    io.to(roomId).emit('room_data', room);
                    const systemMessage: Message = {
                        id: Date.now().toString(),
                        sender: systemMessageSender,
                        text: `${player.username} left the room.`,
                        isSystem: true
                    };
                    io.to(roomId).emit('new_message', systemMessage);
                }
            }
        });
    });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    void next;
    console.error(err);
    res.status(err.status || 500).json({ error: err.message });
});

const startServer = async (): Promise<void> => {
    httpServer.listen(port, () => {
        console.log(`Health check endpoint: http://localhost:${port}/health`);
        console.log(`Root endpoint: http://localhost:${port}/`);
        console.log(`CORS allowed origin: ${frontendOrigin}`);
    });
};

void startServer();

export default app;
