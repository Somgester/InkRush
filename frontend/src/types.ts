export interface Player {
    id: string;
    username: string;
    score: number;
    isDrawing: boolean;
    hasGuessed: boolean;
    hasGuessedCorrectly: boolean;
}

export interface User {
    id: string;
    name: string;
    avatarUrl: string | null;
    totalPoints: number;
    gamesPlayed: number;
    gamesWon: number;
    bestWordsGuessed: number;
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
    /** Present only for the artist while a word is live; revealed to all at ROUND_END. */
    currentWord?: string;
    /** Underscored form of the word, sent to guessers in place of currentWord. */
    maskedWord?: string;
    timer: number;
    wordChoices: string[];
    drawnPlayerIds: string[];
    settings: RoomSettings;
}