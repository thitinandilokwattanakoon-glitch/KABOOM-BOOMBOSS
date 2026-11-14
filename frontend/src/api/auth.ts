import type { Role, User } from '../types/auth';
import { request } from './http';

const BASE: Record<Role, string> = { teacher: '/api/auth', student: '/api/student-auth' };

/** The server names the account object after the role ("teacher" / "student"); flatten that to `user`. */
interface RawSession {
  token: string;
  teacher?: User;
  student?: User;
}

export interface Session {
  token: string;
  user: User;
}

function toSession(raw: RawSession): Session {
  const user = raw.teacher ?? raw.student;
  if (!user) throw new Error('ข้อมูลที่ได้จากเซิร์ฟเวอร์ไม่ครบ');
  return { token: raw.token, user };
}

export const authApi = {
  register: (role: Role, email: string, password: string, displayName: string) =>
    request<RawSession>(`${BASE[role]}/register`, { method: 'POST', body: { email, password, displayName } }).then(toSession),
  login: (role: Role, email: string, password: string, remember: boolean) =>
    request<RawSession>(`${BASE[role]}/login`, { method: 'POST', body: { email, password, remember } }).then(toSession),
  /** Always succeeds when the server is reachable, whether or not the e-mail has an account. */
  forgotPassword: (role: Role, email: string) =>
    request<void>(`${BASE[role]}/forgot-password`, { method: 'POST', body: { email } }),
  resetPassword: (role: Role, token: string, password: string) =>
    request<void>(`${BASE[role]}/reset-password`, { method: 'POST', body: { token, password } }),
  /** Student profile page. E-mail and password changes need the current password. */
  changeName: (displayName: string) =>
    request<User>('/api/student-auth/me/name', { method: 'PUT', body: { displayName } }),
  changeEmail: (email: string, currentPassword: string) =>
    request<User>('/api/student-auth/me/email', { method: 'PUT', body: { email, currentPassword } }),
  /** Logs out every other device and returns a fresh login for this one. */
  changePassword: (currentPassword: string, newPassword: string) =>
    request<RawSession>('/api/student-auth/me/password', { method: 'PUT', body: { currentPassword, newPassword } }).then(toSession),
  me: (role: Role) => request<User>(`${BASE[role]}/me`),
  logout: (role: Role) => request<void>(`${BASE[role]}/logout`, { method: 'POST' })
};
