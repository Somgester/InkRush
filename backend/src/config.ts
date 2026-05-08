import 'dotenv/config';

export const config = {
  port: Number(process.env.BACKEND_PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || '*',

  maxPlayersPerRoom: Number(process.env.MAX_PLAYERS_PER_ROOM) || 12,
  minPlayersToStart: Number(process.env.MIN_PLAYERS_TO_START) || 2,
  totalRounds: Number(process.env.TOTAL_ROUNDS) || 10,

  wordSelectionSeconds: Number(process.env.WORD_SELECTION_SECONDS) || 15,
  drawingSeconds: Number(process.env.DRAWING_SECONDS) || 30,
  roundEndSeconds: Number(process.env.ROUND_END_SECONDS) || 5,
  gameEndSeconds: Number(process.env.GAME_END_SECONDS) || 10,

  guessProximityThreshold: Number(process.env.GUESS_PROXIMITY_THRESHOLD) || 1,

  minGuessPoints: Number(process.env.MIN_GUESS_POINTS) || 100,
  maxGuessPoints: Number(process.env.MAX_GUESS_POINTS) || 500,
  pointDeductionPerGuesser: Number(process.env.POINT_DEDUCTION_PER_GUESSER) || 50,
  artistBonusPoints: Number(process.env.ARTIST_BONUS_POINTS) || 50,

  systemMessageSender: process.env.SYSTEM_MESSAGE_SENDER || 'System',
};
