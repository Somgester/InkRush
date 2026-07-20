import { Server } from 'socket.io';
import { Room } from './types.js';
import { getRandomWords, WORDS } from './words.js';
import { levenshteinDistance } from './utils.js';
import { config } from './config.js';
import { prisma } from './db.js';

export class GameEngine {
    private io: Server;
    private rooms: Map<string, Room>;
    private timers: Map<string, NodeJS.Timeout> = new Map();
    private readonly wordSelectionSeconds = config.wordSelectionSeconds;
    private readonly drawingSeconds = config.drawingSeconds;
    private readonly roundEndSeconds = config.roundEndSeconds;
    private readonly gameEndSeconds = config.gameEndSeconds;
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
        room.drawnPlayerIds = [];
        room.customWordsPool = [...room.settings.customWords].sort(() => 0.5 - Math.random());
        room.defaultWordsPool = getRandomWords(WORDS.length);

        this.selectRandomArtist(room);
        this.startWordSelection(room);
    }

    private selectRandomArtist(room: Room) {
        room.players.forEach(p => {
            p.isDrawing = false;
            p.hasGuessed = false;
            p.hasGuessedCorrectly = false;
        });

        const eligiblePlayers = room.players.filter(p => !room.drawnPlayerIds.includes(p.id));
        const nextArtist = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];

        if (!nextArtist) return;

        room.currentArtistId = nextArtist.id;
        room.drawnPlayerIds.push(nextArtist.id);
        nextArtist.isDrawing = true;
    }

    private startWordSelection(room: Room) {
        room.status = 'WORD_SELECTION';
        
        const choices: string[] = [];

        while (choices.length < 3 && room.customWordsPool.length > 0) {
            choices.push(room.customWordsPool.shift()!);
        }
        
        while (choices.length < 3) {
            if (room.defaultWordsPool.length === 0) {
                room.defaultWordsPool = getRandomWords(WORDS.length);
            }
            choices.push(room.defaultWordsPool.shift()!);
        }
        
        room.wordChoices = choices;
        room.timer = this.wordSelectionSeconds;
        
        this.broadcastRoomData(room);
        this.startTimer(room, () => {
            this.chooseWord(room.id, room.wordChoices[0]!);
        });
    }

    public chooseWord(roomId: string, word: string) {
        const room = this.rooms.get(roomId);
        if (!room || room.status !== 'WORD_SELECTION') return;

        room.wordChoices.forEach(choice => {
            if (choice !== word && room.settings.customWords.includes(choice)) {
                room.customWordsPool.push(choice);
            }
        });

        room.currentWord = word;
        room.status = 'DRAWING';
        room.timer = room.settings.drawingTime;
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
            player.hasGuessedCorrectly = true;
            
            const guessersCount = room.players.filter(p => p.hasGuessed).length;
            const points = Math.max(this.minGuessPoints, this.maxGuessPoints - (guessersCount - 1) * this.pointDeductionPerGuesser);
            player.score += points;

            if (player.dbUserId) {
                prisma.user.update({
                    where: { id: player.dbUserId },
                    data: { bestWordsGuessed: { increment: 1 } }
                }).catch((e: unknown) => console.error('Failed to update words guessed:', e));
            }

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

        room.drawnPlayerIds = room.drawnPlayerIds.filter(id => id !== playerId);

        if (room.currentArtistId === playerId && (room.status === 'WORD_SELECTION' || room.status === 'DRAWING')) {
            this.endRound(room);
        } else if (room.status === 'DRAWING') {
            const allGuessed = room.players.every(p => p.isDrawing || p.hasGuessed);
            if (allGuessed && room.players.length >= this.minPlayersToStart) {
                this.endRound(room);
            }
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

        const isRoundComplete = room.drawnPlayerIds.length >= room.players.length;

        this.startTimer(room, () => {
            if (isRoundComplete) {
                if (this.shouldEndGame(room)) {
                    this.endGame(room);
                } else {
                    room.currentRound++;
                    room.drawnPlayerIds = [];
                    this.selectRandomArtist(room);
                    this.startWordSelection(room);
                }
            } else {
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
        room.status = 'GAME_OVER';
        room.timer = this.gameEndSeconds;
        room.currentArtistId = undefined;
        room.currentWord = undefined;
        
        this.broadcastRoomData(room);
        this.saveGameStats(room).catch(e => console.error('Failed to save game stats:', e));

        this.startTimer(room, () => {
            room.status = 'LOBBY';
            room.currentRound = 0;
            room.timer = 0;
            
            // Reset player states for next game
            room.players.forEach(player => {
                player.score = 0;
                player.isDrawing = false;
                player.hasGuessed = false;
                player.hasGuessedCorrectly = false;
            });

            this.broadcastRoomData(room);
        });
    }

    private async saveGameStats(room: Room) {
        if (!room.players || room.players.length === 0) return;
        const maxScore = Math.max(...room.players.map(p => p.score));
        
        for (const player of room.players) {
            if (player.dbUserId) {
                const isWinner = player.score === maxScore && maxScore > 0;
                try {
                    await prisma.user.update({
                        where: { id: player.dbUserId },
                        data: {
                            gamesPlayed: { increment: 1 },
                            gamesWon: { increment: isWinner ? 1 : 0 },
                            totalPoints: { increment: player.score }
                        }
                    });
                } catch (e) {
                    console.error('Failed to update stats for user:', player.dbUserId, e);
                }
            }
        }
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
