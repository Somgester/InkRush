import { Server } from 'socket.io';
import { Room, Player, GameStatus } from './types.js';
import { getRandomWords } from './words.js';
import { levenshteinDistance } from './utils.js';
import { config } from './config.js';

export class GameEngine {
    private io: Server;
    private rooms: Map<string, Room>;
    private timers: Map<string, NodeJS.Timeout> = new Map();
    private readonly wordSelectionSeconds = config.wordSelectionSeconds;
    private readonly drawingSeconds = config.drawingSeconds;
    private readonly roundEndSeconds = config.roundEndSeconds;
    private readonly guessProximityThreshold = config.guessProximityThreshold;
    private readonly minGuessPoints = config.minGuessPoints;
    private readonly maxGuessPoints = config.maxGuessPoints;
    private readonly pointDeductionPerGuesser = config.pointDeductionPerGuesser;
    private readonly artistBonusPoints = config.artistBonusPoints;
    private readonly minPlayersToStart = config.minPlayersToStart;

    constructor(io: Server, rooms: Map<string, Room>) {
        this.io = io;
        this.rooms = rooms;
    }

    public startGame(roomId: string) {
        const room = this.rooms.get(roomId);
        if (!room || room.players.length < this.minPlayersToStart) return;

        room.status = 'WORD_SELECTION';
        room.currentRound = 1;
        this.selectRandomArtist(room);
        this.startWordSelection(room);
    }

    private selectRandomArtist(room: Room) {
        room.players.forEach(p => {
            p.isDrawing = false;
            p.hasGuessed = false;
        });

        const eligiblePlayers = room.players.filter(player => player.id !== room.currentArtistId);
        const pool = eligiblePlayers.length > 0 ? eligiblePlayers : room.players;
        const nextArtist = pool[Math.floor(Math.random() * pool.length)];

        if (!nextArtist) return;

        room.currentArtistId = nextArtist.id;
        nextArtist.isDrawing = true;
    }

    private startWordSelection(room: Room) {
        room.status = 'WORD_SELECTION';
        room.wordChoices = getRandomWords(3);
        room.timer = this.wordSelectionSeconds;
        
        this.broadcastRoomData(room);
        this.startTimer(room, () => {
            this.chooseWord(room.id, room.wordChoices[0]!);
        });
    }

    public chooseWord(roomId: string, word: string) {
        const room = this.rooms.get(roomId);
        if (!room || room.status !== 'WORD_SELECTION') return;

        room.currentWord = word;
        room.status = 'DRAWING';
        room.timer = this.drawingSeconds;
        room.wordChoices = [];
        
        this.io.to(roomId).emit('clear_canvas');
        this.broadcastRoomData(room);
        
        this.startTimer(room, () => {
            this.endRound(room);
        });
    }

    public handleGuess(roomId: string, playerId: string, guess: string): 'CORRECT' | 'CLOSE' | 'WRONG' {
        const room = this.rooms.get(roomId);
        if (!room || room.status !== 'DRAWING' || !room.currentWord) return 'WRONG';

        const player = room.players.find(p => p.id === playerId);
        if (!player || player.isDrawing || player.hasGuessed) return 'WRONG';

        if (guess.toLowerCase() === room.currentWord.toLowerCase()) {
            player.hasGuessed = true;
            
            const guessersCount = room.players.filter(p => p.hasGuessed).length;
            const points = Math.max(this.minGuessPoints, this.maxGuessPoints - (guessersCount - 1) * this.pointDeductionPerGuesser);
            player.score += points;

            const artist = room.players.find(p => p.id === room.currentArtistId);
            if (artist) {
                artist.score += this.artistBonusPoints;
            }

            this.broadcastRoomData(room);

            const allGuessed = room.players.every(p => p.isDrawing || p.hasGuessed);
            if (allGuessed) {
                this.endRound(room);
            }
            return 'CORRECT';
        }

        if (levenshteinDistance(guess.toLowerCase(), room.currentWord.toLowerCase()) === this.guessProximityThreshold) {
            return 'CLOSE';
        }

        return 'WRONG';
    }

    public handlePlayerDisconnect(roomId: string, playerId: string) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        if (room.currentArtistId === playerId && (room.status === 'WORD_SELECTION' || room.status === 'DRAWING')) {
            this.endRound(room);
        }

        if (room.players.length < this.minPlayersToStart && room.status !== 'LOBBY') {
            this.endGame(room);
        }
    }

    private endRound(room: Room) {
        this.stopTimer(room.id);
        room.status = 'ROUND_END';
        room.timer = this.roundEndSeconds;
        
        this.broadcastRoomData(room);

        this.startTimer(room, () => {
            if (this.shouldEndGame(room)) {
                this.endGame(room);
            } else {
                room.currentRound++;
                this.selectRandomArtist(room);
                this.startWordSelection(room);
            }
        });
    }

    private shouldEndGame(room: Room): boolean {
        return room.currentRound >= room.totalRounds;
    }

    private endGame(room: Room) {
        this.stopTimer(room.id);
        room.status = 'LOBBY';
        room.currentRound = 0;
        room.currentArtistId = undefined;
        room.currentWord = undefined;
        
        this.broadcastRoomData(room);
    }

    private startTimer(room: Room, callback: () => void) {
        this.stopTimer(room.id);

        const timerId = setInterval(() => {
            room.timer--;
            if (room.timer <= 0) {
                this.stopTimer(room.id);
                callback();
            } else {
                this.io.to(room.id).emit('timer_update', room.timer);
            }
        }, 1000);

        this.timers.set(room.id, timerId);
    }

    private stopTimer(roomId: string) {
        const timerId = this.timers.get(roomId);
        if (timerId) {
            clearInterval(timerId);
            this.timers.delete(roomId);
        }
    }

    private broadcastRoomData(room: Room) {
        this.io.to(room.id).emit('room_data', room);
    }
}
