import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameEngine } from '../../src/gameEngine.js';
import { ClientRoom, Room } from '../../src/types.js';
import { Server } from 'socket.io';

/**
 * The secret word must never reach a guesser's socket. These tests read the
 * payloads the engine actually emits, per recipient, rather than the shared
 * room object it emits them from.
 */
describe('Room payload visibility', () => {
    let emitted: Array<{ to: string; event: string; payload: ClientRoom }>;
    let ioMock: Partial<Server>;
    let rooms: Map<string, Room>;
    let gameEngine: GameEngine;
    let mockRoom: Room;

    const payloadsFor = (playerId: string) =>
        emitted.filter(e => e.to === playerId && e.event === 'room_data').map(e => e.payload);
    const latestFor = (playerId: string) => payloadsFor(playerId).at(-1)!;

    beforeEach(() => {
        vi.useFakeTimers();
        emitted = [];

        ioMock = {
            to: vi.fn((target: string) => ({
                emit: vi.fn((event: string, payload: ClientRoom) => {
                    emitted.push({ to: target, event, payload });
                })
            }))
        } as unknown as Partial<Server>;

        rooms = new Map();
        gameEngine = new GameEngine(ioMock as unknown as Server, rooms);

        mockRoom = {
            id: 'room1',
            players: [
                { id: 'p1', username: 'user1', score: 0, isDrawing: false, hasGuessed: false, hasGuessedCorrectly: false },
                { id: 'p2', username: 'user2', score: 0, isDrawing: false, hasGuessed: false, hasGuessedCorrectly: false },
                { id: 'p3', username: 'user3', score: 0, isDrawing: false, hasGuessed: false, hasGuessedCorrectly: false }
            ],
            status: 'LOBBY',
            currentRound: 0,
            totalRounds: 3,
            timer: 0,
            wordChoices: [],
            drawnPlayerIds: [],
            settings: { maxPlayers: 10, totalRounds: 3, drawingTime: 30, customWords: [], isPublic: true },
            customWordsPool: [],
            defaultWordsPool: []
        };
        rooms.set(mockRoom.id, mockRoom);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    const guessers = () => mockRoom.players.filter(p => p.id !== mockRoom.currentArtistId).map(p => p.id);

    it('withholds the word choices from everyone but the artist during WORD_SELECTION', () => {
        gameEngine.startGame('room1');

        expect(latestFor(mockRoom.currentArtistId!).wordChoices).toHaveLength(3);
        for (const id of guessers()) {
            expect(latestFor(id).wordChoices).toEqual([]);
        }
    });

    it('never sends the drawn word to a guesser', () => {
        gameEngine.startGame('room1');
        gameEngine.chooseWord('room1', 'elephant');

        for (const id of guessers()) {
            for (const payload of payloadsFor(id)) {
                expect(payload.currentWord).toBeUndefined();
            }
        }
    });

    it('sends the artist the real word while drawing', () => {
        gameEngine.startGame('room1');
        gameEngine.chooseWord('room1', 'elephant');

        expect(latestFor(mockRoom.currentArtistId!).currentWord).toBe('elephant');
    });

    it('gives guessers a mask of the right shape instead', () => {
        gameEngine.startGame('room1');
        gameEngine.chooseWord('room1', 'ice cream');

        for (const id of guessers()) {
            expect(latestFor(id).maskedWord).toBe('___ _____');
        }
    });

    it('reveals the word to everyone once the round ends', () => {
        gameEngine.startGame('room1');
        gameEngine.chooseWord('room1', 'elephant');

        for (const id of guessers()) {
            gameEngine.handleGuess('room1', id, 'elephant');
        }

        expect(mockRoom.status).toBe('ROUND_END');
        for (const player of mockRoom.players) {
            expect(latestFor(player.id).currentWord).toBe('elephant');
        }
    });

    it('never ships the word pools, which hold the upcoming deck in draw order', () => {
        mockRoom.settings.customWords = ['zeppelin', 'trombone'];
        gameEngine.startGame('room1');
        gameEngine.chooseWord('room1', 'elephant');

        expect(mockRoom.defaultWordsPool.length).toBeGreaterThan(0);
        for (const player of mockRoom.players) {
            for (const payload of payloadsFor(player.id)) {
                expect(payload).not.toHaveProperty('defaultWordsPool');
                expect(payload).not.toHaveProperty('customWordsPool');
            }
        }
    });

    it('leaves the stored room object untouched when building payloads', () => {
        gameEngine.startGame('room1');
        gameEngine.chooseWord('room1', 'elephant');

        // guess checking still compares against the real word on the server
        expect(mockRoom.currentWord).toBe('elephant');
        expect(gameEngine.handleGuess('room1', guessers()[0]!, 'elephant')).toBe('CORRECT');
    });
});
