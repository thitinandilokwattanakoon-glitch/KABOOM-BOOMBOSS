import { defaultBossLook, normalizeBossLook, type BossLook } from '../game/avatar';
import { request } from './http';

/** How a teacher dressed their boss; the default look when they have not chosen anything yet. */
export async function loadBossLook(teacherId: string): Promise<BossLook> {
  try {
    const res = await request<{ look: string } | undefined>(`/api/boss-looks/${teacherId}`);
    return res ? normalizeBossLook(JSON.parse(res.look)) : defaultBossLook();
  } catch {
    return defaultBossLook();
  }
}

/** Saves the look of the logged-in teacher's boss. */
export function saveBossLook(look: BossLook): Promise<void> {
  return request<unknown>('/api/boss-look', { method: 'PUT', body: { look: JSON.stringify(look) } }).then(() => undefined);
}
