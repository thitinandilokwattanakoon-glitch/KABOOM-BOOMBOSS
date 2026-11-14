import { request } from './http';

/** One game the student played (a card on the dashboard). */
export interface GameCard {
  gameId: string;
  setName: string;
  bossName: string;
  victory: boolean;
  /** Questions that were asked in that game. */
  questionCount: number;
  correctCount: number;
  totalDamage: number;
  /** 1 = most damage. */
  place: number;
  playerCount: number;
  endedAt: number;
}

export interface BoardRow {
  place: number;
  studentId: string;
  name: string;
  correctCount: number;
  totalDamage: number;
}

export interface GameDetail {
  game: GameCard;
  board: BoardRow[];
  /** Number of questions in the solo practice (the whole set). */
  practiceCount: number;
}

export interface PracticeQuestion {
  text: string;
  choices: string[];
}

export const resultsApi = {
  list: () => request<GameCard[]>('/api/results'),
  detail: (gameId: string) => request<GameDetail>(`/api/results/${gameId}`),
  practice: (gameId: string) => request<PracticeQuestion[]>(`/api/results/${gameId}/practice`),
  /** The server tells the right answer only after a choice is sent. */
  check: (gameId: string, index: number, choice: number) =>
    request<{ correct: boolean; correctIndex: number }>(`/api/results/${gameId}/practice/${index}`, { method: 'POST', body: { choice } })
};
