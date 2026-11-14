import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { authApi } from '../api/auth';
import background from '../assets/login-bg.png';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types/auth';
import './login.css';

type Mode = 'login' | 'register' | 'forgot' | 'reset';

export interface ResetLink {
  token: string;
  role: Role;
}

/** The "set a new password" link from the e-mail looks like /?reset=<secret>&role=student */
export function readResetLink(): ResetLink | null {
  const q = new URLSearchParams(window.location.search);
  const token = q.get('reset');
  const role = q.get('role');
  if (!token || (role !== 'teacher' && role !== 'student')) return null;
  return { token, role };
}

/** Removes the secret from the address bar so it doesn't stay in the history or get shared by accident. */
export function clearResetLink(): void {
  window.history.replaceState(null, '', window.location.pathname);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  displayName?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

const SIDE: Record<Role, { name: string; tag: string; signup: string; signupCopy: string }> = {
  student: {
    name: 'นักเรียน',
    tag: 'STUDENT · HERO',
    signup: 'สมัครเป็นผู้กล้า',
    signupCopy: 'สมัครเป็นผู้กล้า แล้วชวนเพื่อนเข้าร่วมศึก!'
  },
  teacher: {
    name: 'อาจารย์',
    tag: 'TEACHER · BOSS',
    signup: 'สมัครเป็นจอมมาร',
    signupCopy: 'สมัครเป็นจอมมาร เพื่อสร้างสนามรบของคุณ!'
  }
};

function StudentIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="m2.5 11.2 13.5-6 13.5 6-13.5 6-13.5-6Z" fill="currentColor" opacity=".95" />
      <path d="M8 14.1v7.1c4.8 3.4 11.2 3.4 16 0v-7.1l-8 3.6-8-3.6Z" fill="currentColor" opacity=".72" />
      <path d="M29.5 12v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function TeacherIcon() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M5 9 2.5 3.5C8.2 4.2 11.5 6.1 13 10h6c1.5-3.9 4.8-5.8 10.5-6.5L27 9c2.3 2 3 4.2 2.3 7.2-.9 4.1-5.3 8.4-13.3 12.3C8 24.6 3.6 20.3 2.7 16.2 2 13.2 2.7 11 5 9Z"
        fill="currentColor"
      />
      <path className="demon-eyes" d="m10 15 4 2-1.5 3.5L10 15Zm12 0-4 2 1.5 3.5L22 15Z" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg className="lg-field-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4.5 20c.5-3.7 3.2-5.7 7.5-5.7s7 2 7.5 5.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="lg-field-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="lg-field-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10.5" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 14v2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m3 3 18 18M10.6 6.2A9.9 9.9 0 0 1 12 6c6.1 0 9.5 6 9.5 6a15 15 0 0 1-3.1 3.7M6.2 6.8C3.8 8.4 2.5 12 2.5 12s3.4 6 9.5 6c1.1 0 2.1-.2 3-.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface FieldProps {
  id: string;
  label: string;
  icon: ReactNode;
  error?: string;
  children: ReactNode;
}

function Field({ id, label, icon, error, children }: FieldProps) {
  return (
    <div className="lg-field">
      <label htmlFor={id}>{label}</label>
      <div className={`lg-input${error ? ' has-error' : ''}`}>
        {icon}
        {children}
      </div>
      {error && (
        <p className="lg-field-error" id={`${id}-err`}>
          {error}
        </p>
      )}
    </div>
  );
}

interface Props {
  /** Set when the page was opened from a "set a new password" e-mail. */
  reset?: ResetLink | null;
  /** Called after the new password was saved. */
  onResetDone?: () => void;
  /** Called when the user leaves the reset form without saving. */
  onResetCancel?: () => void;
}

/** Entry screen: pick a side (student / teacher), then log in, sign up, or recover a password. */
export function LoginPage({ reset = null, onResetDone, onResetCancel }: Props) {
  const { login, register } = useAuth();
  const [role, setRole] = useState<Role>(reset?.role ?? 'student');
  const [mode, setMode] = useState<Mode>(reset ? 'reset' : 'login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  function switchMode(next: Mode, message = '') {
    if (mode === 'reset' && next !== 'reset') onResetCancel?.();
    setMode(next);
    setPassword('');
    setConfirm('');
    setShowPw(false);
    setErrors({});
    setServerError('');
    setNotice(message);
  }

  function chooseSide(next: Role) {
    setRole(next);
    setServerError('');
    setNotice('');
  }

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (mode === 'register') {
      if (!displayName.trim()) e.displayName = 'กรอกชื่อที่ใช้แสดง';
      else if (displayName.trim().length > 50) e.displayName = 'ชื่อที่ใช้แสดงยาวไม่เกิน 50 ตัวอักษร';
    }
    if (mode !== 'reset') {
      if (!email.trim()) e.email = 'กรอกอีเมล';
      else if (!EMAIL_RE.test(email.trim())) e.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }
    if (mode !== 'forgot') {
      if (!password) e.password = mode === 'reset' ? 'กรอกรหัสผ่านใหม่' : 'กรอกรหัสผ่าน';
      else if (mode !== 'login' && (password.length < 8 || password.length > 72)) e.password = 'รหัสผ่านต้องยาว 8-72 ตัวอักษร';
    }
    if ((mode === 'register' || mode === 'reset') && !e.password && password !== confirm) {
      e.confirm = 'รหัสผ่านทั้งสองช่องไม่ตรงกัน';
    }
    return e;
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setServerError('');
    setNotice('');
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      if (mode === 'login') {
        await login(role, email.trim(), password, remember);
      } else if (mode === 'register') {
        await register(role, email.trim(), password, displayName.trim());
      } else if (mode === 'forgot') {
        await authApi.forgotPassword(role, email.trim());
        setNotice('ถ้ามีบัญชีที่ใช้อีเมลนี้ ระบบได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปแล้ว ลิงก์ใช้ได้ 30 นาที ดูในกล่องจดหมายและโฟลเดอร์สแปม');
      } else if (reset) {
        await authApi.resetPassword(role, reset.token, password);
        setMode('login');
        setPassword('');
        setConfirm('');
        setShowPw(false);
        setNotice('ตั้งรหัสผ่านใหม่แล้ว เข้าสู่ระบบด้วยรหัสผ่านใหม่ได้เลย');
        onResetDone?.();
      }
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง');
    } finally {
      setBusy(false);
    }
  }

  const side = SIDE[role];
  const heading =
    mode === 'login'
      ? { title: 'เข้าสู่ระบบ', copy: 'เลือกฝ่ายของคุณ แล้วเข้าสู่สนามรบ!' }
      : mode === 'register'
        ? { title: 'สร้างบัญชีใหม่', copy: side.signupCopy }
        : mode === 'forgot'
          ? { title: 'ลืมรหัสผ่าน', copy: 'กรอกอีเมลที่ใช้สมัคร ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้' }
          : { title: 'ตั้งรหัสผ่านใหม่', copy: `บัญชี${side.name} ตั้งรหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร` };
  const submitLabel =
    mode === 'login' ? 'เข้าสู่ระบบ' : mode === 'register' ? side.signup : mode === 'forgot' ? 'ส่งลิงก์ตั้งรหัสใหม่' : 'บันทึกรหัสผ่านใหม่';
  const busyLabel = mode === 'forgot' ? 'กำลังส่ง…' : 'กำลังดำเนินการ…';
  const describe = (key: keyof FieldErrors, id: string) => (errors[key] ? `${id}-err` : undefined);

  return (
    <div className="lg-page">
      <main className="lg-scene">
        <div className="lg-art">
          <img src={background} alt="ภาพผู้กล้านักเรียนต่อสู้กับอาจารย์จอมมารในโลก Kaboom บูมบอส" fetchPriority="high" />
        </div>

        <section className="lg-area" aria-label="เข้าสู่ระบบ Kaboom บูมบอส">
          <div className="lg-card" data-side={role}>
            <div className="lg-topline" aria-hidden="true">
              <span className="lg-topline-dot" />
              <span>PLAYER ACCESS</span>
              <span className="lg-topline-line" />
            </div>

            <header className="lg-heading">
              <div className="lg-heading-mark" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 3 3.5 7.2v5.4c0 4.2 3.1 7.1 8.5 8.9 5.4-1.8 8.5-4.7 8.5-8.9V7.2L12 3Z" stroke="currentColor" strokeWidth="1.6" />
                  <path d="m8.2 12.2 2.4 2.4 5.3-5.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="lg-eyebrow">WELCOME TO THE BATTLE</p>
                <h1>{heading.title}</h1>
                <p className="lg-heading-copy">{heading.copy}</p>
              </div>
            </header>

            {mode !== 'reset' && (
              <div className="lg-factions" role="group" aria-label="เลือกประเภทบัญชี">
                {(['student', 'teacher'] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`lg-faction${role === r ? ' is-active' : ''}`}
                    aria-pressed={role === r}
                    onClick={() => chooseSide(r)}
                  >
                    <span className={`lg-faction-icon ${r}`}>{r === 'student' ? <StudentIcon /> : <TeacherIcon />}</span>
                    <span className="lg-faction-label">
                      <strong>{SIDE[r].name}</strong>
                      <small>{SIDE[r].tag}</small>
                    </span>
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={submit} noValidate>
              {mode === 'register' && (
                <Field id="lg-name" label="ชื่อที่ใช้แสดง" icon={<PersonIcon />} error={errors.displayName}>
                  <input
                    id="lg-name"
                    type="text"
                    autoComplete="name"
                    placeholder={role === 'teacher' ? 'เช่น ครูสมชาย' : 'ชื่อที่เพื่อนจะเห็นในเกม'}
                    value={displayName}
                    maxLength={50}
                    onChange={(e) => setDisplayName(e.target.value)}
                    aria-invalid={!!errors.displayName}
                    aria-describedby={describe('displayName', 'lg-name')}
                  />
                </Field>
              )}

              {mode !== 'reset' && (
                <Field id="lg-email" label="อีเมล" icon={<MailIcon />} error={errors.email}>
                  <input
                    id="lg-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder={role === 'teacher' ? 'กรอกอีเมลของคุณ' : 'กรอกอีเมลของคุณ'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!errors.email}
                    aria-describedby={describe('email', 'lg-email')}
                  />
                </Field>
              )}

              {mode !== 'forgot' && (
                <Field id="lg-password" label={mode === 'reset' ? 'รหัสผ่านใหม่' : 'รหัสผ่าน'} icon={<LockIcon />} error={errors.password}>
                  <input
                    id="lg-password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    placeholder={mode === 'login' ? 'กรอกรหัสผ่าน' : 'อย่างน้อย 8 ตัวอักษร'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={!!errors.password}
                    aria-describedby={describe('password', 'lg-password')}
                  />
                  <button
                    type="button"
                    className="lg-reveal"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    aria-pressed={showPw}
                  >
                    <EyeIcon open={!showPw} />
                  </button>
                </Field>
              )}

              {(mode === 'register' || mode === 'reset') && (
                <Field id="lg-confirm" label="ยืนยันรหัสผ่าน" icon={<LockIcon />} error={errors.confirm}>
                  <input
                    id="lg-confirm"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    aria-invalid={!!errors.confirm}
                    aria-describedby={describe('confirm', 'lg-confirm')}
                  />
                </Field>
              )}

              {mode === 'login' && (
                <div className="lg-options">
                  <label className="lg-remember">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                    <span className="lg-check" aria-hidden="true">
                      <svg viewBox="0 0 16 16">
                        <path d="m3 8 3.1 3.1L13 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span>จดจำฉันไว้ 30 วัน</span>
                  </label>
                  <button type="button" className="lg-text-link" onClick={() => switchMode('forgot')}>
                    ลืมรหัสผ่าน?
                  </button>
                </div>
              )}

              <button className="lg-primary" type="submit" disabled={busy}>
                <span>{busy ? busyLabel : submitLabel}</span>
                <span className="lg-arrow" aria-hidden="true">
                  ›
                </span>
              </button>

              <div className="lg-messages" aria-live="polite">
                {serverError && <p className="lg-server-error">{serverError}</p>}
                {notice && <p className="lg-notice">{notice}</p>}
              </div>
            </form>

            {mode === 'login' && (
              <div className="lg-separator" aria-hidden="true">
                <span />
                <em>หรือ</em>
                <span />
              </div>
            )}

            <button
              className="lg-secondary"
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                <path d="M19 8v6m-3-3h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <span>{mode === 'login' ? 'สมัครสมาชิก' : 'กลับไปเข้าสู่ระบบ'}</span>
            </button>

            <button className="lg-role-help" type="button" onClick={() => dialogRef.current?.showModal()}>
              <span className="lg-help-symbol" aria-hidden="true">
                ?
              </span>
              อธิบายบทบาทของแต่ละฝ่าย
              <span className="lg-help-chevron" aria-hidden="true">
                ›
              </span>
            </button>
          </div>

          <p className="lg-caption" aria-hidden="true">
            LEARN <b>×</b> PLAY <b>×</b> WIN
          </p>
        </section>

        <dialog
          className="lg-dialog"
          ref={dialogRef}
          aria-labelledby="lg-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) e.currentTarget.close();
          }}
        >
          <div className="lg-dialog-top">
            <span>CHOOSE YOUR DESTINY</span>
            <button className="lg-dialog-close" type="button" aria-label="ปิด" onClick={() => dialogRef.current?.close()}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <h2 id="lg-dialog-title">สองฝ่าย หนึ่งสนามรบ</h2>
          <div className="lg-role-cards">
            <article className="lg-role-card student">
              <span className="lg-role-card-icon">
                <StudentIcon />
              </span>
              <h3>นักเรียน · ผู้กล้า</h3>
              <p>รวมพลังกับเพื่อน ตอบคำถามให้ถูกต้องและรวดเร็ว เพื่อโจมตีบอสอาจารย์และคว้าชัยชนะ</p>
            </article>
            <article className="lg-role-card teacher">
              <span className="lg-role-card-icon">
                <TeacherIcon />
              </span>
              <h3>อาจารย์ · จอมมาร</h3>
              <p>สร้างห้อง ตั้งคำถาม และรับบทเป็นบอส ใช้สกิลท้าทายผู้กล้าทั้งห้อง</p>
            </article>
          </div>
          <p className="lg-dialog-foot">ความรู้คือพลังที่แท้จริง แล้วพบกันในสนามรบ!</p>
        </dialog>
      </main>
    </div>
  );
}
