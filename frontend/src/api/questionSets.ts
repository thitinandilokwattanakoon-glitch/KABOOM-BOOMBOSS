import type { QuestionSet, QuestionSetInput, QuestionSetSummary } from '../types/questionSet';
import { request } from './http';

export const questionSetsApi = {
  list: () => request<QuestionSetSummary[]>('/api/question-sets'),
  get: (id: string) => request<QuestionSet>(`/api/question-sets/${id}`),
  create: (input: QuestionSetInput) => request<QuestionSet>('/api/question-sets', { method: 'POST', body: input }),
  update: (id: string, input: QuestionSetInput) =>
    request<QuestionSet>(`/api/question-sets/${id}`, { method: 'PUT', body: input }),
  remove: (id: string) => request<void>(`/api/question-sets/${id}`, { method: 'DELETE' })
};
