import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '../api/http';
import { useOutfit } from '../api/outfits';
import { getSavedRoom, roomsApi, saveRoom } from '../api/rooms';
import { avatarImage } from '../game/avatar';
import { useAuth } from '../hooks/useAuth';
import { StudentDashboard } from './StudentDashboard';
import { StudentDressUp } from './StudentDressUp';
import { StudentProfile } from './StudentProfile';
import { StudentRoom } from './StudentRoom';
import { AlertIcon, BrandImage, ChartIcon, ChevronsIcon, Face, HangerIcon, KeyIcon, PersonIcon } from './student-ui';
import './student-home.css';

type View = 'home' | 'dashboard' | 'profile' | 'dressup';

function KaboomLogo() {
  return (
    <BrandImage
      src="/brand/kaboom-logo.png"
      alt="KABOOM! บูมบอส"
      className="sh-logo"
      width={426}
      height={208}
      fallback={
        <span className="sh-logo-text" role="img" aria-label="KABOOM! บูมบอส">
          KABOOM! <span>บูมบอส</span>
        </span>
      }
    />
  );
}

function StudentBadge() {
  return (
    <BrandImage
      src="/brand/student-badge.png"
      alt="STUDENT ผู้กล้า รวมพลังกันเพื่อนเพื่อต่อสู้กับบอสอาจารย์!"
      className="sh-badge"
      width={466}
      height={336}
      fallback={
        <div className="sh-badge-text">
          <strong>STUDENT</strong>
          <span>ผู้กล้า</span>
          <small>รวมพลังกันเพื่อนเพื่อต่อสู้กับบอสอาจารย์!</small>
        </div>
      }
    />
  );
}

/** Comic-book halftone shapes behind the page: sparkles on the left, a lightning bolt and a dot fade on the right. */
function Backdrop() {
  return (
    <div className="sh-deco" aria-hidden="true">
      <span className="sh-ht sh-ht-sparkle sh-sparkle-1" />
      <span className="sh-ht sh-ht-sparkle sh-sparkle-2" />
      <span className="sh-ht sh-ht-sparkle sh-sparkle-3" />
      <span className="sh-ht sh-ht-bolt" />
      <span className="sh-ht sh-ht-corner" />
      <span className="sh-star sh-star-1" />
      <span className="sh-star sh-star-2" />
      <span className="sh-star sh-star-3" />
      <span className="sh-star sh-star-4" />
    </div>
  );
}

/** The dress-up character of the player. Pressing it opens the dress-up page. */
function Character({ studentId, name, onDressUp }: { studentId: string; name: string; onDressUp: () => void }) {
  const { outfit } = useOutfit(studentId);
  const picture = useMemo(() => avatarImage(outfit), [outfit]);

  return (
    <button type="button" className="sh-char" onClick={onDressUp} aria-label={`ตัวละครของฉัน ${name} กดเพื่อแต่งตัวละคร`}>
      <span className="sh-char-stage">
        <img className="sh-char-img" src={picture} alt="" width={140} height={210} />
      </span>
      <span className="sh-char-name">{name}</span>
      <span className="sh-char-hint">
        <HangerIcon />
        แต่งตัวละคร
      </span>
    </button>
  );
}

/** `compact` = the small one in the top bar (dashboard and profile); it only shows a line of text when something is wrong. */
function JoinForm({ onJoin, compact = false }: { onJoin: (code: string) => void; compact?: boolean }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);

  function fail(text: string) {
    setError(text);
    setShake(true);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const code = input.trim();
    if (!/^\d{4}$/.test(code)) return fail('รหัสห้องเป็นตัวเลข 4 หลัก');
    setError('');
    setBusy(true);
    try {
      // Make sure the room exists before leaving this page, so a mistyped code is fixed right here.
      await roomsApi.get(code);
      onJoin(code);
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError && err.status === 404) fail(`ไม่พบห้อง ${code} ตรวจรหัสกับคุณครูอีกครั้ง`);
      else fail(err instanceof ApiError ? err.message : 'เข้าห้องไม่สำเร็จ ลองใหม่อีกครั้ง');
    }
  }

  return (
    <form className={compact ? 'sh-join is-compact' : 'sh-join'} onSubmit={submit} noValidate>
      <label htmlFor="join-code" className="sh-visually-hidden">
        รหัสห้อง 4 หลัก
      </label>
      <div
        className={shake ? 'sh-join-box is-shaking' : 'sh-join-box'}
        data-ready={input.length === 4 && !busy ? '' : undefined}
        data-invalid={error ? '' : undefined}
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget) setShake(false);
        }}
      >
        <KeyIcon />
        <input
          id="join-code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          autoComplete="off"
          enterKeyHint="go"
          placeholder="Enter a join code"
          value={input}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'join-error' : compact ? undefined : 'join-hint'}
          onChange={(e) => {
            setInput(e.target.value.replace(/\D/g, ''));
            if (error) setError('');
          }}
        />
        <button type="submit" className="sh-cta" aria-busy={busy || undefined}>
          Join
          {busy ? <span className="sh-spin" aria-hidden="true" /> : <ChevronsIcon />}
        </button>
      </div>
      {error ? (
        <p id="join-error" className="sh-join-note is-error" role="alert">
          <AlertIcon />
          {error}
        </p>
      ) : compact ? null : (
        <p id="join-hint" className="sh-join-note">
          {busy ? 'กำลังเข้าห้อง…' : 'ใส่รหัสห้อง 4 หลักที่คุณครูแจก'}
        </p>
      )}
    </form>
  );
}

export function StudentHome() {
  const { user } = useAuth();
  const [roomCode, setRoomCode] = useState<string | null>(getSavedRoom);
  const [view, setView] = useState<View>('home');
  const mainRef = useRef<HTMLElement>(null);
  const firstView = useRef(true);

  // After switching view, start at the top and move keyboard focus to the new content (not on the first load).
  useEffect(() => {
    if (firstView.current) {
      firstView.current = false;
      return;
    }
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [view]);

  function enterRoom(code: string | null) {
    saveRoom(code);
    setRoomCode(code);
  }

  if (roomCode) {
    return (
      <div className="app">
        <StudentRoom key={roomCode} code={roomCode} onLeave={() => enterRoom(null)} />
      </div>
    );
  }

  if (view === 'dressup' && user) {
    return <StudentDressUp studentId={user.id} name={user.displayName} onExit={() => setView('home')} />;
  }

  return (
    <div className="sh-page">
      <Backdrop />

      <header className="sh-top">
        <button type="button" className="sh-home-link" onClick={() => setView('home')} aria-label="KABOOM! บูมบอส หน้าแรก">
          <KaboomLogo />
        </button>
        {view !== 'home' && <JoinForm compact onJoin={enterRoom} />}
        <nav className="sh-nav" aria-label="เมนูนักเรียน">
          <button type="button" className="sh-nav-btn" onClick={() => setView('dressup')}>
            <HangerIcon />
            Avatar
          </button>
          <button
            type="button"
            className="sh-nav-btn"
            aria-current={view === 'dashboard' ? 'page' : undefined}
            onClick={() => setView('dashboard')}
          >
            <ChartIcon />
            My Dashboard
          </button>
          <button
            type="button"
            className="sh-profile-btn"
            aria-label="โปรไฟล์"
            aria-current={view === 'profile' ? 'page' : undefined}
            onClick={() => setView('profile')}
          >
            {user ? <Face studentId={user.id} /> : <PersonIcon />}
          </button>
        </nav>
      </header>

      <main className="sh-main" ref={mainRef} tabIndex={-1}>
        <div className="sh-view" key={view}>
          {view === 'home' && (
            <div className="sh-home">
              <h1 className="sh-visually-hidden">เข้าร่วมห้องเกม</h1>
              <div className="sh-hero">
                <div className="sh-badge-wrap">
                  <StudentBadge />
                </div>
                <JoinForm onJoin={enterRoom} />
              </div>
              {user && <Character studentId={user.id} name={user.displayName} onDressUp={() => setView('dressup')} />}
            </div>
          )}

          {view === 'dashboard' && <StudentDashboard onHome={() => setView('home')} />}

          {view === 'profile' && <StudentProfile onBack={() => setView('home')} />}
        </div>
      </main>
    </div>
  );
}
