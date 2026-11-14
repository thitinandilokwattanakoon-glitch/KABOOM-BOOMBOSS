import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api/http';
import { resultsApi, type GameDetail, type PracticeQuestion } from '../api/results';
import { AlertIcon, BackIcon, CheckIcon, ChevronsIcon, Face, TrophyIcon } from './student-ui';
import './student-dashboard.css';

type Screen = { kind: 'list' } | { kind: 'detail'; gameId: string } | { kind: 'practice'; gameId: string; setName: string };

const message = (e: unknown) => (e instanceof ApiError ? e.message : 'โหลดข้อมูลไม่สำเร็จ ลองใหม่อีกครั้ง');

function when(ms: number): string {
  return new Date(ms).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

/** Loads something when the screen opens, with a retry. */
function useLoad<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const run = useCallback(() => {
    setError('');
    setData(null);
    load().then(setData).catch((e) => setError(message(e)));
  }, [load]);
  useEffect(run, [run]);
  return { data, error, retry: run };
}

function Waiting({ error, retry }: { error: string; retry: () => void }) {
  return error ? (
    <div className="sd-note" role="alert">
      <p>{error}</p>
      <button type="button" className="sh-btn-ghost" onClick={retry}>
        ลองอีกครั้ง
      </button>
    </div>
  ) : (
    <p className="sd-note" role="status">
      กำลังโหลด…
    </p>
  );
}

/** Bar "ถูก x ข้อ" over "จำนวนข้อ y". */
function ScoreBar({ correct, total }: { correct: number; total: number }) {
  const part = total > 0 ? Math.min(1, correct / total) : 0;
  return (
    <div className="sd-score">
      <span className="sd-score-total">จำนวน {total} ข้อ</span>
      <div className="sd-bar" role="img" aria-label={`ตอบถูก ${correct} จาก ${total} ข้อ`}>
        <span className="sd-bar-fill" style={{ width: `${Math.max(part * 100, correct > 0 ? 34 : 0)}%` }} />
        <span className="sd-bar-text">ถูก {correct} ข้อ</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Recent Activity

function GameList({ onOpen, onHome }: { onOpen: (gameId: string) => void; onHome: () => void }) {
  const { data, error, retry } = useLoad(resultsApi.list);

  return (
    <section className="sd-wrap" aria-labelledby="sd-title">
      <h1 id="sd-title" className="sh-title">
        Recent Activity
      </h1>
      {!data ? (
        <Waiting error={error} retry={retry} />
      ) : data.length === 0 ? (
        <div className="sh-panel sd-empty">
          <div className="sh-soon-art">
            <TrophyIcon />
          </div>
          <p className="sd-empty-title">ยังไม่มีเกมที่เล่นจบ</p>
          <p className="sh-lead">เล่นเกมกับคุณครูให้จบหนึ่งเกม แล้วผลจะมาแสดงที่นี่</p>
          <button type="button" className="sh-btn-ghost" onClick={onHome}>
            <BackIcon />
            กลับหน้าแรก
          </button>
        </div>
      ) : (
        <ul className="sd-grid">
          {data.map((g) => (
            <li key={g.gameId}>
              <button type="button" className="sd-card" onClick={() => onOpen(g.gameId)}>
                <span className="sd-scene" aria-hidden="true" />
                <span className="sd-card-name">{g.setName}</span>
                <span className="sd-card-meta">
                  {when(g.endedAt)} · อันดับ {g.place}/{g.playerCount}
                </span>
                <ScoreBar correct={g.correctCount} total={g.questionCount} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- one game

function Detail({ gameId, onBack, onPractice }: { gameId: string; onBack: () => void; onPractice: (setName: string) => void }) {
  const load = useCallback(() => resultsApi.detail(gameId), [gameId]);
  const { data, error, retry } = useLoad<GameDetail>(load);

  if (!data) {
    return (
      <section className="sd-wrap sd-narrow">
        <Waiting error={error} retry={retry} />
        <button type="button" className="sh-btn-ghost" onClick={onBack}>
          <BackIcon />
          กลับ
        </button>
      </section>
    );
  }
  const g = data.game;
  return (
    <section className="sd-wrap sd-narrow" aria-labelledby="sd-detail-title">
      <button type="button" className="sd-back" onClick={onBack}>
        <BackIcon />
        Recent Activity
      </button>
      <div className="sh-panel sd-detail">
        <span className="sd-scene" aria-hidden="true" />
        <div className="sd-detail-body">
          <h1 id="sd-detail-title" className="sh-title">
            {g.setName}
          </h1>
          <p className="sd-card-meta">
            {when(g.endedAt)} · บอส {g.bossName} · {g.victory ? 'ชนะบอส' : 'แพ้บอส'}
          </p>
          <dl className="sd-stats">
            <div>
              <dt>คะแนน</dt>
              <dd>{g.totalDamage}</dd>
            </div>
            <div>
              <dt>อันดับ</dt>
              <dd>
                {g.place}
                <small> / {g.playerCount}</small>
              </dd>
            </div>
            <div>
              <dt>ตอบถูก</dt>
              <dd>
                {g.correctCount}
                <small> / {g.questionCount}</small>
              </dd>
            </div>
          </dl>

          <button type="button" className="sh-cta sd-practice-btn" disabled={data.practiceCount === 0} onClick={() => onPractice(g.setName)}>
            ทำข้อสอบใหม่คนเดียว
            <ChevronsIcon />
          </button>
          <p className="sd-hint">ฝึกทำ {data.practiceCount} ข้อของบทนี้อีกครั้ง ไม่จับเวลา และไม่เปลี่ยนคะแนนเดิม</p>

          <h2 className="sd-sub">อันดับในเกมนี้</h2>
          <ol className="sd-board">
            {data.board.map((r) => (
              <li key={r.studentId} className={r.place === g.place ? 'is-me' : undefined}>
                <span className="sd-place">{r.place}</span>
                <span className="sd-face">
                  <Face studentId={r.studentId} />
                </span>
                <span className="sd-name">{r.name}</span>
                <span className="sd-points">
                  {r.totalDamage} <small>คะแนน</small>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- solo practice

function Practice({ gameId, setName, onBack }: { gameId: string; setName: string; onBack: () => void }) {
  const load = useCallback(() => resultsApi.practice(gameId), [gameId]);
  const { data, error, retry } = useLoad<PracticeQuestion[]>(load);
  const [at, setAt] = useState(0);
  const [pick, setPick] = useState(-1);
  const [right, setRight] = useState(-1);
  const [score, setScore] = useState(0);
  const [problem, setProblem] = useState('');

  async function answer(choice: number) {
    if (pick >= 0) return;
    setProblem('');
    setPick(choice);
    try {
      const res = await resultsApi.check(gameId, at, choice);
      setRight(res.correctIndex);
      if (res.correct) setScore((s) => s + 1);
    } catch (e) {
      setPick(-1);
      setProblem(message(e));
    }
  }

  function next() {
    setAt(at + 1);
    setPick(-1);
    setRight(-1);
  }

  function again() {
    setAt(0);
    setPick(-1);
    setRight(-1);
    setScore(0);
  }

  if (!data) {
    return (
      <section className="sd-wrap sd-narrow">
        <Waiting error={error} retry={retry} />
        <button type="button" className="sh-btn-ghost" onClick={onBack}>
          <BackIcon />
          กลับ
        </button>
      </section>
    );
  }

  if (at >= data.length) {
    return (
      <section className="sd-wrap sd-narrow" aria-labelledby="sd-done-title">
        <div className="sh-panel sd-done">
          <div className="sh-soon-art">
            <TrophyIcon />
          </div>
          <h1 id="sd-done-title" className="sh-title">
            ทำครบแล้ว
          </h1>
          <p className="sd-done-score">
            ถูก {score} <small>จาก {data.length} ข้อ</small>
          </p>
          <div className="sd-done-actions">
            <button type="button" className="sh-btn" onClick={again}>
              ทำอีกครั้ง
            </button>
            <button type="button" className="sh-btn-ghost" onClick={onBack}>
              <BackIcon />
              กลับไปดูผลเกม
            </button>
          </div>
        </div>
      </section>
    );
  }

  const q = data[at];
  const checked = right >= 0;
  return (
    <section className="sd-wrap sd-narrow" aria-labelledby="sd-q-title">
      <button type="button" className="sd-back" onClick={onBack}>
        <BackIcon />
        เลิกทำ
      </button>
      <div className="sh-panel sd-quiz">
        <p className="sd-card-meta">
          {setName} · ข้อที่ {at + 1} / {data.length}
        </p>
        <h1 id="sd-q-title" className="sd-question">
          {q.text}
        </h1>
        <div className="sd-choices">
          {q.choices.map((text, i) => {
            const state = !checked ? (pick === i ? 'is-picked' : '') : i === right ? 'is-right' : i === pick ? 'is-wrong' : 'is-dim';
            return (
              <button key={i} type="button" className={`sd-choice ${state}`} disabled={pick >= 0} onClick={() => void answer(i)}>
                <span className="sd-letter">{'ABCD'[i]}</span>
                <span>{text}</span>
              </button>
            );
          })}
        </div>
        {problem && (
          <p className="sh-status is-error" role="alert">
            <AlertIcon />
            {problem}
          </p>
        )}
        {checked && (
          <div className="sd-after">
            <p className={pick === right ? 'sh-status is-ok' : 'sh-status is-error'} role="status">
              {pick === right ? <CheckIcon /> : <AlertIcon />}
              {pick === right ? 'ถูกต้อง' : `ยังไม่ถูก คำตอบคือ ${'ABCD'[right]}`}
            </p>
            <button type="button" className="sh-btn" onClick={next}>
              {at + 1 === data.length ? 'ดูผล' : 'ข้อต่อไป'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/** My Dashboard: the games the student played, the detail of one, and practising it alone. */
export function StudentDashboard({ onHome }: { onHome: () => void }) {
  const [screen, setScreen] = useState<Screen>({ kind: 'list' });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  if (screen.kind === 'detail') {
    const { gameId } = screen;
    return <Detail gameId={gameId} onBack={() => setScreen({ kind: 'list' })} onPractice={(setName) => setScreen({ kind: 'practice', gameId, setName })} />;
  }
  if (screen.kind === 'practice') {
    const { gameId } = screen;
    return <Practice key={gameId} gameId={gameId} setName={screen.setName} onBack={() => setScreen({ kind: 'detail', gameId })} />;
  }
  return <GameList onOpen={(gameId) => setScreen({ kind: 'detail', gameId })} onHome={onHome} />;
}
