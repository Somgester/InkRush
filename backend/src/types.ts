export interface Player {
    id: string;
    dbUserId?: string;
    username: string;
    score: number;
    isDrawing: boolean;
    hasGuessed: boolean;
    hasGuessedCorrectly: boolean;
}

export interface Message {
    id: string;
    sender: string;
    text: string;
    isSystem?: boolean;
}

export type GameStatus = 'LOBBY' | 'WORD_SELECTION' | 'DRAWING' | 'ROUND_END' | 'GAME_OVER';

export interface RoomSettings {
    maxPlayers: number;
    totalRounds: number;
    drawingTime: number;
    customWords: string[];
    isPublic: boolean;
}

export interface Room {
    id: string;
    hostId?: string;
    players: Player[];
    status: GameStatus;
    currentRound: number;
    totalRounds: number;
    currentArtistId?: string;
    /** Only ever sent to the artist while a word is live. See GameEngine.roomStateFor. */
    currentWord?: string;
    /** Underscored form of currentWord, safe to send to guessers. */
    maskedWord?: string;
    timer: number;
    wordChoices: string[];
    drawnPlayerIds: string[];
    settings: RoomSettings;
    customWordsPool: string[];
    defaultWordsPool: string[];
}

/**
 * A Room as it goes over the wire. The word pools are server-only bookkeeping —
 * defaultWordsPool holds the entire remaining deck in draw order, so shipping it
 * would hand every player the upcoming words.
 */
export type ClientRoom = Omit<Room, 'customWordsPool' | 'defaultWordsPool'>;
