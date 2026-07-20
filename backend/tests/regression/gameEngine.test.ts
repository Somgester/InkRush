import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameEngine } from '../../src/gameEngine.js';
import { Room } from '../../src/types.js';
import { Server } from 'socket.io';

describe('GameEngine Regression Tests', () => {
    let ioMock: Partial<Server>;
    let rooms: Map<string, Room>;
    let gameEngine: GameEngine;
    let mockRoom: Room;

    beforeEach(() => {
        vi.useFakeTimers();
        
        // Mock Socket.io Server
        ioMock = {
            to: vi.fn().mockReturnThis(),
            emit: vi.fn()
        };

        rooms = new Map();
        gameEngine = new GameEngine(ioMock as unknown as Server, rooms);

        // Initial mock room setup
        mockRoom = {
            id: 'room1',
            players: [
                { id: 'p1', username: 'user1', score: 0, isDrawing: false, hasGuessed: false, hasGuessedCorrectly: false },
                { id: 'p2', username: 'user2', score: 0, isDrawing: false, hasGuessed: false, hasGuessedCorrectly: false }
            ],
            status: 'LOBBY',
            currentRound: 0,
            totalRounds: 3,
            timer: 0,
            wordChoices: [],
            drawnPlayerIds: [],
            settings: {
                maxPlayers: 10,
                totalRounds: 3,
                drawingTime: 30,
                customWords: [],
                isPublic: true
            },
            customWordsPool: [],
            defaultWordsPool: []
        };
        rooms.set(mockRoom.id, mockRoom);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('should start game if minimum players are present', () => {
        gameEngine.startGame('room1');
        
        expect(mockRoom.status).toBe('WORD_SELECTION');
        expect(mockRoom.currentRound).toBe(1);
        expect(mockRoom.currentArtistId).toBeDefined();
        expect(mockRoom.wordChoices.length).toBe(3);
    });

    it('should not start game if players are less than minimum', () => {
        mockRoom.players = [mockRoom.players[0]!];
        gameEngine.startGame('room1');
        
        expect(mockRoom.status).toBe('LOBBY');
    });

    it('should handle correct guesses and award points', () => {
        gameEngine.startGame('room1');
        const artistId = mockRoom.currentArtistId!;
        const guesserId = mockRoom.players.find(p => p.id !== artistId)!.id;
        
        // Status should be WORD_SELECTION
        gameEngine.chooseWord('room1', mockRoom.wordChoices[0]!);
        
        expect(mockRoom.status).toBe('DRAWING');

        const result = gameEngine.handleGuess('room1', guesserId, mockRoom.currentWord!);
        
        expect(result).toBe('CORRECT');
        const guesser = mockRoom.players.find(p => p.id === guesserId)!;
        const artist = mockRoom.players.find(p => p.id === artistId)!;
        
        expect(guesser.hasGuessedCorrectly).toBe(true);
        expect(guesser.score).toBeGreaterThan(0);
        expect(artist.score).toBeGreaterThan(0);
    });

    it('should identify close guesses', () => {
        gameEngine.startGame('room1');
        const selectedWord = 'Apple';
        gameEngine.chooseWord('room1', selectedWord);
        
        const guesserId = mockRoom.players.find(p => p.id !== mockRoom.currentArtistId)!.id;
        const result = gameEngine.handleGuess('room1', guesserId, 'Appl'); // 1 char diff
        
        expect(result).toBe('CLOSE');
    });

    it('should transition to next round after all players have guessed', () => {
        gameEngine.startGame('room1');
        const artistId = mockRoom.currentArtistId!;
        const guesserId = mockRoom.players.find(p => p.id !== artistId)!.id;
        
        gameEngine.chooseWord('room1', mockRoom.wordChoices[0]!);
        gameEngine.handleGuess('room1', guesserId, mockRoom.currentWord!);
        
        expect(mockRoom.status).toBe('ROUND_END');
    });

    it('should end game after total rounds are completed', () => {
        mockRoom.totalRounds = 1;
        gameEngine.startGame('room1');
        
        // Force round end conditions
        mockRoom.currentRound = 1;
        mockRoom.drawnPlayerIds = ['p1', 'p2']; 
        
        gameEngine.chooseWord('room1', mockRoom.wordChoices[0]!);
        
        // Status is DRAWING, timer is 30
        expect(mockRoom.status).toBe('DRAWING');
        
        // Advance 30 seconds
        vi.advanceTimersByTime(30000);
        
        // At 30 seconds exactly, it might still be 0 and calling the callback
        // Let's advance a bit more to be sure
        vi.advanceTimersByTime(1000);
        
        expect(mockRoom.status).toBe('ROUND_END');
        
        // Advance 5 more seconds for the round end timer
        vi.advanceTimersByTime(6000);
        
        expect(mockRoom.status).toBe('GAME_OVER');
    });

    it('should handle player disconnect and end round if artist leaves', () => {
        gameEngine.startGame('room1');
        const artistId = mockRoom.currentArtistId!;
        
        gameEngine.chooseWord('room1', mockRoom.wordChoices[0]!);
        expect(mockRoom.status).toBe('DRAWING');
        
        gameEngine.handlePlayerDisconnect('room1', artistId);
        
        expect(mockRoom.status).toBe('ROUND_END');
    });
});
