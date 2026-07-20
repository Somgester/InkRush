import { describe, it, expect } from 'vitest';
import { findAvailableRoom } from '../../src/utils.js';
import { Room } from '../../src/types.js';

describe('utils.findAvailableRoom', () => {
    const createMockRoom = (id: string, playersCount: number, isPublic: boolean, status: Room['status'] = 'LOBBY'): Room => ({
        id,
        players: Array(playersCount).fill({}),
        status,
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
            isPublic
        },
        customWordsPool: [],
        defaultWordsPool: []
    } as Room);

    it('should find the most populated public room in lobby', () => {
        const rooms = [
            createMockRoom('room1', 2, true),
            createMockRoom('room2', 5, true),
            createMockRoom('room3', 1, true),
        ];
        const result = findAvailableRoom(rooms);
        expect(result?.id).toBe('room2');
    });

    it('should ignore private rooms', () => {
        const rooms = [
            createMockRoom('room1', 8, false),
            createMockRoom('room2', 2, true),
        ];
        const result = findAvailableRoom(rooms);
        expect(result?.id).toBe('room2');
    });

    it('should ignore full rooms', () => {
        const fullRoom = createMockRoom('room1', 10, true);
        const availableRoom = createMockRoom('room2', 2, true);
        const rooms = [fullRoom, availableRoom];
        const result = findAvailableRoom(rooms);
        expect(result?.id).toBe('room2');
    });

    it('should ignore rooms not in lobby', () => {
        const rooms = [
            createMockRoom('room1', 5, true, 'DRAWING'),
            createMockRoom('room2', 2, true, 'LOBBY'),
        ];
        const result = findAvailableRoom(rooms);
        expect(result?.id).toBe('room2');
    });

    it('should return undefined if no rooms are available', () => {
        const rooms = [
            createMockRoom('room1', 10, true), // full
            createMockRoom('room2', 5, false), // private
            createMockRoom('room3', 2, true, 'GAME_OVER'), // not in lobby
        ];
        const result = findAvailableRoom(rooms);
        expect(result).toBeUndefined();
    });
});
