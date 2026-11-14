import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { defaultOutfit, normalizeOutfit, type Outfit } from '../game/avatar';
import { request } from './http';

/**
 * Dress-up characters of students, kept in one small store so every place that shows a character
 * (home page, name tags, the battle scene) redraws as soon as an outfit is loaded or changed.
 * A student who has never dressed up gets the default look for their id.
 */
const known = new Map<string, Outfit>();
const loading = new Map<string, Promise<Outfit>>();
/** Ids changed in this browser: a slow answer from the server must not undo what the player just picked. */
const edited = new Set<string>();
const listeners = new Set<() => void>();

function put(id: string, outfit: Outfit) {
  known.set(id, outfit);
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Loads a student's character once; `fresh` asks the server again (used when someone joins a room). */
export function loadOutfit(studentId: string, fresh = false): Promise<Outfit> {
  const cached = known.get(studentId);
  if (cached && !fresh) return Promise.resolve(cached);
  let job = loading.get(studentId);
  if (!job) {
    job = request<unknown>(`/api/outfits/${studentId}`)
      .then((raw) => {
        const outfit = normalizeOutfit(raw, defaultOutfit(studentId));
        if (!edited.has(studentId)) put(studentId, outfit);
        return known.get(studentId) ?? outfit;
      })
      // The server can't be reached: show the last known look, or the default one, and try again next time.
      .catch(() => known.get(studentId) ?? defaultOutfit(studentId))
      .finally(() => loading.delete(studentId));
    loading.set(studentId, job);
  }
  return job;
}

/** true once the real answer for this student has arrived (false while loading, or when the server could not be reached). */
export const hasOutfit = (studentId: string) => known.has(studentId);

/** Shows a new look everywhere right away (the caller saves it with `saveOutfit`). */
export function wearOutfit(studentId: string, outfit: Outfit) {
  edited.add(studentId);
  put(studentId, outfit);
}

/** Saves the logged-in student's own character. */
export function saveOutfit(outfit: Outfit): Promise<void> {
  return request<unknown>('/api/outfit', { method: 'PUT', body: outfit }).then(() => undefined);
}

/**
 * The character of one student, loading it when needed.
 * `loaded` is false while the first answer is on its way (the default look is shown meanwhile).
 */
export function useOutfit(studentId: string | undefined): { outfit: Outfit; loaded: boolean } {
  const stored = useSyncExternalStore(subscribe, () => (studentId ? known.get(studentId) : undefined));
  useEffect(() => {
    if (studentId && !known.has(studentId)) void loadOutfit(studentId);
  }, [studentId]);
  const fallback = useMemo(() => defaultOutfit(studentId), [studentId]);
  return { outfit: stored ?? fallback, loaded: stored !== undefined };
}
