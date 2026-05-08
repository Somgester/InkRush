export interface Player {
    id: string;
    username: string;
    score: number;
    isDrawing: boolean;
    hasGuessed: boolean;
}

export interface Message {
    id: string;
    sender: string;
    text: string;
    isSystem?: boolean;
}

export type GameStatus = 'LOBBY' | 'WORD_SELECTION' | 'DRAWING' | 'ROUND_END';

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
}
