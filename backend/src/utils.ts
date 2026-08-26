export const levenshteinDistance = (s: string, t: string): number => {
    if (!s.length) return t.length;
    if (!t.length) return s.length;
    const arr = [];
    for (let i = 0; i <= t.length; i++) {
        arr[i] = [i];
    }
    for (let j = 0; j <= s.length; j++) {
        arr[0]![j] = j;
    }
    for (let i = 1; i <= t.length; i++) {
        for (let j = 1; j <= s.length; j++) {
            arr[i]![j] = Math.min(
                arr[i - 1]![j]! + 1,
                arr[i]![j - 1]! + 1,
                arr[i - 1]![j - 1]! + (s[j - 1] === t[i - 1] ? 0 : 1)
            );
        }
    }
    return arr[t.length]![s.length]!;
};

import { Room } from './types.js';

// Date.now() alone collides whenever two messages leave in the same millisecond
// (a correct guess emits the player's line and the system line back to back),
// which gives React duplicate keys in the event log.
let messageCounter = 0;
export const createMessageId = (): string =>
    `${Date.now().toString(36)}-${(messageCounter++).toString(36)}`;

export const findAvailableRoom = (rooms: Room[]): Room | undefined => {
    return rooms
        .filter(room => 
            room.settings.isPublic && 
            room.players.length < room.settings.maxPlayers &&
            room.status === 'LOBBY'
        )
        .sort((a, b) => b.players.length - a.players.length)[0];
};
