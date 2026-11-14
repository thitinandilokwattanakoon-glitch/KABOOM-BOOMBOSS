import type { CreateRoomInput, RoomView } from '../types/room';
import { request } from './http';

const post = (code: string, action: string, body?: unknown) =>
  request<RoomView>(`/api/rooms/${code}/${action}`, { method: 'POST', body });

export const roomsApi = {
  create: (input: CreateRoomInput) => request<{ code: string }>('/api/rooms', { method: 'POST', body: input }),
  get: (code: string) => request<RoomView>(`/api/rooms/${code}`),
  join: (code: string) => post(code, 'join'),
  start: (code: string) => post(code, 'start'),
  reveal: (code: string) => post(code, 'reveal'),
  next: (code: string) => post(code, 'next'),
  end: (code: string) => post(code, 'end'),
  useSkill: (code: string) => post(code, 'skill'),
  answer: (code: string, choice: number) => post(code, 'answer', { choice })
};

const KEY = 'kaboom.room';

/** The room this browser was last in, so a page refresh can drop the user back into it. */
export function getSavedRoom(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function saveRoom(code: string | null): void {
  try {
    if (code) sessionStorage.setItem(KEY, code);
    else sessionStorage.removeItem(KEY);
  } catch {
    /* storage blocked: refreshing just returns to the home page */
  }
}
