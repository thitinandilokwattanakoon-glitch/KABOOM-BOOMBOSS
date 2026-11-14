import { request } from './http';

/** One finished game in the teacher's list. */
export interface TeacherGame {
  gameId: string;
  setName: string;
  bossName: string;
  victory: boolean;
  /** Questions that were asked. */
  questionCount: number;
  playerCount: number;
  endedAt: number;
}

export interface ReportPlayer {
  place: number;
  studentId: string;
  name: string;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  /** Correct answers out of the questions asked, in percent. */
  percent: number;
  totalDamage: number;
  /** Average time of the answers given, in milliseconds (0 = never answered). */
  avgMs: number;
}

export interface ReportQuestion {
  index: number;
  text: string;
  choices: string[];
  correctIndex: number;
  right: number;
  wrong: number;
  skipped: number;
  /** How many students chose each of the four choices. */
  picks: number[];
}

export interface TeacherReport {
  game: TeacherGame;
  right: number;
  wrong: number;
  skipped: number;
  /** false for games played before answers were kept: only the ranking is known then. */
  hasAnswers: boolean;
  players: ReportPlayer[];
  questions: ReportQuestion[];
}

export const teacherResultsApi = {
  list: () => request<TeacherGame[]>('/api/teacher-results'),
  report: (gameId: string) => request<TeacherReport>(`/api/teacher-results/${gameId}`)
};
