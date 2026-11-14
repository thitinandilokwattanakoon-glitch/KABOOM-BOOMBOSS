import { API_BASE } from './config';

const TOKEN_KEY = 'kaboom.token';
const ROLE_KEY = 'kaboom.role';

/**
 * The login is kept per browser tab (sessionStorage), so a teacher tab and a student tab in the same
 * browser don't overwrite each other's login. When "remember me" is ticked, localStorage also keeps the
 * most recent login so a brand-new tab or a later visit can still start already logged in; otherwise the
 * login ends when the tab is closed.
 */
function read(key: string): string | null {
  try {
    return sessionStorage.getItem(key) ?? localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null, remember = true): void {
  try {
    if (value) {
      sessionStorage.setItem(key, value);
      if (remember) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
    } else {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    }
  } catch {
    /* storage blocked: the user simply has to log in again next visit */
  }
}

export function getToken(): string | null {
  return read(TOKEN_KEY);
}

export function setToken(token: string | null, remember = true): void {
  write(TOKEN_KEY, token, remember);
}

/** true when this login was saved with "remember me" (it is also kept in localStorage). */
export function isRemembered(): boolean {
  try {
    return localStorage.getItem(TOKEN_KEY) !== null;
  } catch {
    return false;
  }
}

/** Which kind of account the saved token belongs to. Missing = teacher (sessions made before students existed). */
export function getRole(): 'teacher' | 'student' {
  return read(ROLE_KEY) === 'student' ? 'student' : 'teacher';
}

export function setRole(role: 'teacher' | 'student' | null, remember = true): void {
  write(ROLE_KEY, role, remember);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** JSON request helper. Adds the login token when there is one and turns {"message"} errors into ApiError. */
export async function request<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: init.method ?? 'GET',
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined
    });
  } catch {
    throw new ApiError(0, 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจว่า backend ยังรันอยู่');
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, (data && data.message) || 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง');
  }
  return data as T;
}
