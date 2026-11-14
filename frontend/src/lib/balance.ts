import type { Difficulty } from '../types/questionSet';

/** Base damage of a correct answer. Same numbers as GameRules.java. */
export const BASE_DAMAGE: Record<Difficulty, number> = { EASY: 20, MEDIUM: 30, HARD: 40 };

/**
 * What one average student is expected to deal over a set: about 60% of the answers right,
 * answered around the middle of the time (speed x1.0), with a little combo bonus (x1.1).
 */
const PER_STUDENT = 0.6 * 1.0 * 1.1;

function tidy(n: number): number {
  const step = n >= 5000 ? 500 : n >= 1000 ? 100 : n >= 200 ? 50 : 10;
  return Math.min(100000, Math.max(10, Math.round(n / step) * step));
}

export interface HpAdvice {
  /** The class should win with questions to spare. */
  easy: number;
  /** The class wins near the last questions if it does about average. */
  fair: number;
  /** The class has to do better than average to win. */
  hard: number;
}

/** Suggested boss health for this many students playing these questions. */
export function suggestBossHp(students: number, difficulties: Difficulty[]): HpAdvice | null {
  if (!Number.isFinite(students) || students < 1 || difficulties.length === 0) return null;
  const total = students * PER_STUDENT * difficulties.reduce((sum, d) => sum + BASE_DAMAGE[d], 0);
  return { easy: tidy(total * 0.6), fair: tidy(total * 0.8), hard: tidy(total) };
}
