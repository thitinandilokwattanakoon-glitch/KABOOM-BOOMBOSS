export type Role = 'teacher' | 'student';
export type AuthMode = 'login' | 'register';

export interface User {
  id: string;
  email: string;
  displayName: string;
}
