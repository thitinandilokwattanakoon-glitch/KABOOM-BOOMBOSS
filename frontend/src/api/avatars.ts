import { API_BASE } from './config';
import { request } from './http';

/** Address of a character picture. `version` changes after an upload so the browser fetches the new one. */
export function avatarUrl(ownerId: string, version = 0): string {
  return `${API_BASE}/api/avatars/${ownerId}${version ? `?v=${version}` : ''}`;
}

export const avatarApi = {
  save: (image: string) => request<void>('/api/avatar', { method: 'PUT', body: { image } }),
  /** true when this account already has a picture */
  async exists(ownerId: string): Promise<boolean> {
    try {
      const res = await fetch(avatarUrl(ownerId), { cache: 'no-store' });
      return res.ok;
    } catch {
      return false;
    }
  }
};
