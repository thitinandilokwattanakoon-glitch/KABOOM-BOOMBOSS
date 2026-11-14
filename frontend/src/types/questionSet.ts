export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface Question {
  text: string;
  choices: string[]; // always 4
  correctIndex: number; // 0-3, or -1 while the teacher hasn't picked one yet
  difficulty: Difficulty;
}

export interface QuestionSet {
  id: string;
  name: string;
  questions: Question[];
  updatedAt: string;
}

export interface QuestionSetSummary {
  id: string;
  name: string;
  questionCount: number;
  updatedAt: string;
}

export interface QuestionSetInput {
  name: string;
  questions: Question[];
}
