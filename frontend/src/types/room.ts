import type { Difficulty } from './questionSet';

export type RoomStatus = 'LOBBY' | 'QUESTION' | 'REVEAL' | 'ENDED';

export type PlayerSkill = 'DOUBLE' | 'EXTRA_TIME' | 'SHIELD';
export type BossSkillType = 'HEAL' | 'SHORTEN' | 'NERF_TOP';

export interface PlayerView {
  id: string;
  name: string;
  totalDamage: number;
  correctCount: number;
  skill: PlayerSkill | null; // the skill this player is holding
  combo: number; // correct answers in a row right now
}

export interface ResultView {
  playerId: string;
  name: string;
  choice: number; // -1 = did not answer
  correct: boolean;
  damage: number;
  elapsedMs: number;
  doubled: boolean;
  nerfed: boolean;
  earned: PlayerSkill | null; // the skill this answer earned
  combo: number; // the player's combo after this question
  shielded: boolean; // used the shield on this question
}

export interface RoomView {
  code: string;
  teacherId: string;
  status: RoomStatus;
  bossName: string;
  hp: number;
  maxHp: number;
  setName: string;
  timeLimitSec: number;
  questionLimitSec: number; // this question's time (shorter when the boss shortened it)
  extraTimeSec: number;
  questionIndex: number;
  questionCount: number;
  serverNowMs: number;
  deadlineMs: number;
  question: { text: string; choices: string[]; difficulty: Difficulty } | null;
  answeredIds: string[];
  bossSkill: { type: BossSkillType; targetId: string | null; targetName: string | null } | null;
  activeSkills: { playerId: string; skill: PlayerSkill }[];
  reveal: { correctIndex: number; totalDamage: number; healed: number; results: ResultView[] } | null;
  victory: boolean | null;
  players: PlayerView[];
}

export interface CreateRoomInput {
  questionSetId: string;
  bossName: string;
  maxHp: number;
  timeLimitSec: number;
}
