import { FormEvent, InputHTMLAttributes, ReactNode, useState } from 'react';
import { authApi } from '../api/auth';
import { ApiError } from '../api/http';
import { useAuth } from '../hooks/useAuth';
import { AlertIcon, BackIcon, CapIcon, CheckIcon, EyeIcon, Face, LockIcon, LogoutIcon, MailIcon, NameTagIcon } from './student-ui';

type Status = { kind: 'ok' | 'error'; text: string } | null;

function message(e: unknown): string {
  return e instanceof ApiError ? e.message : 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง';
}

/** One card of the profile page: a small form with its own save button and result message. */
function Section({ icon, title, hint, status, busy, onSubmit, children }: {
  icon: ReactNode;
  title: string;
  hint: string;
  status: Status;
  busy: boolean;
  onSubmit: (e: FormEvent) => void;
  children: ReactNode;
}) {
  return (
    <form className="sh-panel sh-section" onSubmit={onSubmit} noValidate>
      <div className="sh-section-head">
        <span className="sh-section-icon">{icon}</span>
        <div>
          <h2>{title}</h2>
          <p>{hint}</p>
        </div>
      </div>
      <div className="sh-fields">{children}</div>
      <div className="sh-section-foot">
        {status ? (
          <p className={`sh-status is-${status.kind}`} role={status.kind === 'ok' ? 'status' : 'alert'}>
            {status.kind === 'ok' ? <CheckIcon /> : <AlertIcon />}
            {status.text}
          </p>
        ) : (
          <span />
        )}
        <button type="submit" className="sh-btn" disabled={busy}>
          {busy ? 'กำลังบันทึก…' : 'บันทึก'}
        </button>
      </div>
    </form>
  );
}

type FieldProps = { id: string; label: string; wide?: boolean } & InputHTMLAttributes<HTMLInputElement>;

function Field({ id, label, wide, ...rest }: FieldProps) {
  return (
    <div className={wide ? 'sh-field is-wide' : 'sh-field'}>
      <label htmlFor={id}>{label}</label>
      <div className="sh-input">
        <input id={id} {...rest} />
      </div>
    </div>
  );
}

/** Password box with a show/hide button. */
function PasswordField({ id, label, wide, ...rest }: FieldProps) {
  const [show, setShow] = useState(false);
  return (
    <div className={wide ? 'sh-field is-wide' : 'sh-field'}>
      <label htmlFor={id}>{label}</label>
      <div className="sh-input has-toggle">
        <input id={id} {...rest} type={show ? 'text' : 'password'} />
        <button
          type="button"
          className="sh-eye"
          aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
          aria-pressed={show}
          onClick={() => setShow((v) => !v)}
        >
          <EyeIcon open={!show} />
        </button>
      </div>
    </div>
  );
}

/** Student profile: change name, e-mail or password, and log out. */
export function StudentProfile({ onBack }: { onBack: () => void }) {
  const { user, logout, updateUser, renewSession } = useAuth();

  const [name, setName] = useState(user?.displayName ?? '');
  const [nameStatus, setNameStatus] = useState<Status>(null);
  const [nameBusy, setNameBusy] = useState(false);

  const [email, setEmail] = useState(user?.email ?? '');
  const [emailPw, setEmailPw] = useState('');
  const [emailStatus, setEmailStatus] = useState<Status>(null);
  const [emailBusy, setEmailBusy] = useState(false);

  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwStatus, setPwStatus] = useState<Status>(null);
  const [pwBusy, setPwBusy] = useState(false);

  async function saveName(e: FormEvent) {
    e.preventDefault();
    const v = name.trim();
    if (!v) return setNameStatus({ kind: 'error', text: 'กรอกชื่อที่ใช้แสดง' });
    if (v.length > 50) return setNameStatus({ kind: 'error', text: 'ชื่อที่ใช้แสดงยาวไม่เกิน 50 ตัวอักษร' });
    setNameBusy(true);
    try {
      updateUser(await authApi.changeName(v));
      setNameStatus({ kind: 'ok', text: 'เปลี่ยนชื่อแล้ว' });
    } catch (err) {
      setNameStatus({ kind: 'error', text: message(err) });
    } finally {
      setNameBusy(false);
    }
  }

  async function saveEmail(e: FormEvent) {
    e.preventDefault();
    const v = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return setEmailStatus({ kind: 'error', text: 'รูปแบบอีเมลไม่ถูกต้อง' });
    if (!emailPw) return setEmailStatus({ kind: 'error', text: 'กรอกรหัสผ่านปัจจุบัน' });
    setEmailBusy(true);
    try {
      updateUser(await authApi.changeEmail(v, emailPw));
      setEmailPw('');
      setEmailStatus({ kind: 'ok', text: 'เปลี่ยนอีเมลแล้ว ครั้งหน้าใช้อีเมลใหม่เข้าสู่ระบบ' });
    } catch (err) {
      setEmailStatus({ kind: 'error', text: message(err) });
    } finally {
      setEmailBusy(false);
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    if (!curPw) return setPwStatus({ kind: 'error', text: 'กรอกรหัสผ่านปัจจุบัน' });
    if (newPw.length < 8 || newPw.length > 72) return setPwStatus({ kind: 'error', text: 'รหัสผ่านใหม่ต้องยาว 8-72 ตัวอักษร' });
    if (newPw !== confirmPw) return setPwStatus({ kind: 'error', text: 'รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน' });
    setPwBusy(true);
    try {
      renewSession(await authApi.changePassword(curPw, newPw));
      setCurPw('');
      setNewPw('');
      setConfirmPw('');
      setPwStatus({ kind: 'ok', text: 'เปลี่ยนรหัสผ่านแล้ว เครื่องอื่นที่เคยเข้าสู่ระบบไว้จะถูกออกจากระบบ' });
    } catch (err) {
      setPwStatus({ kind: 'error', text: message(err) });
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <div className="sh-profile">
      <aside className="sh-panel sh-id">
        <h1 className="sh-title">โปรไฟล์</h1>
        {user && (
          <div className="sh-id-face">
            <Face studentId={user.id} />
          </div>
        )}
        <p className="sh-id-name">{user?.displayName}</p>
        <p className="sh-id-email">{user?.email}</p>
        <p className="sh-chip sh-chip-role">
          <CapIcon />
          นักเรียน
        </p>
        <div className="sh-id-actions">
          <button type="button" className="sh-btn-ghost" onClick={onBack}>
            <BackIcon />
            กลับหน้าแรก
          </button>
          <button type="button" className="sh-btn-danger" onClick={() => void logout()}>
            <LogoutIcon />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      <div className="sh-sections">
        <Section
          icon={<NameTagIcon />}
          title="ชื่อที่ใช้แสดง"
          hint="ชื่อนี้จะแสดงให้เพื่อนและคุณครูเห็นในห้องเกม"
          status={nameStatus}
          busy={nameBusy}
          onSubmit={saveName}
        >
          <Field id="pf-name" label="ชื่อ" wide value={name} maxLength={50} autoComplete="nickname" onChange={(e) => setName(e.target.value)} />
        </Section>

        <Section
          icon={<MailIcon />}
          title="อีเมล"
          hint="ใช้เข้าสู่ระบบและรับลิงก์ตั้งรหัสผ่านใหม่"
          status={emailStatus}
          busy={emailBusy}
          onSubmit={saveEmail}
        >
          <Field id="pf-email" label="อีเมลใหม่" type="email" value={email} autoComplete="email" onChange={(e) => setEmail(e.target.value)} />
          <PasswordField id="pf-email-pw" label="รหัสผ่านปัจจุบัน" value={emailPw} autoComplete="current-password" onChange={(e) => setEmailPw(e.target.value)} />
        </Section>

        <Section
          icon={<LockIcon />}
          title="รหัสผ่าน"
          hint="เปลี่ยนแล้ว เครื่องอื่นที่เข้าสู่ระบบไว้จะถูกออกจากระบบ"
          status={pwStatus}
          busy={pwBusy}
          onSubmit={savePassword}
        >
          <PasswordField id="pf-cur" label="รหัสผ่านปัจจุบัน" wide value={curPw} autoComplete="current-password" onChange={(e) => setCurPw(e.target.value)} />
          <PasswordField id="pf-new" label="รหัสผ่านใหม่ (8 ตัวขึ้นไป)" value={newPw} autoComplete="new-password" onChange={(e) => setNewPw(e.target.value)} />
          <PasswordField id="pf-confirm" label="ยืนยันรหัสผ่านใหม่" value={confirmPw} autoComplete="new-password" onChange={(e) => setConfirmPw(e.target.value)} />
        </Section>
      </div>
    </div>
  );
}
