export interface Player {
    id: string;
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
}

export interface Room {
    id: string;
    hostId?: string;
    players: Player[];
    status: GameStatus;
    currentRound: number;
    totalRounds: number;
    currentArtistId?: string;
    currentWord?: string;
    timer: number;
    wordChoices: string[];
    drawnPlayerIds: string[];
    settings: RoomSettings;
    customWordsPool: string[];
    defaultWordsPool: string[];
}
