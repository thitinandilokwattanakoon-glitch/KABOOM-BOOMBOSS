import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api/http';
import { teacherResultsApi, type ReportPlayer, type TeacherGame, type TeacherReport } from '../api/teacherResults';

const LETTERS = ['ก', 'ข', 'ค', 'ง'];
const message = (e: unknown) => (e instanceof ApiError ? e.message : 'โหลดข้อมูลไม่สำเร็จ ลองใหม่อีกครั้ง');

function when(ms: number): string {
  return new Date(ms).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}
function time(ms: number): string {
  return new Date(ms).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}
const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} วิ`;

/** The games this teacher ran. Pressing one opens its report. */
export function TeacherResultList({ onOpen }: { onOpen: (gameId: string) => void }) {
  const [games, setGames] = useState<TeacherGame[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    teacherResultsApi.list().then(setGames).catch((e) => setError(message(e)));
  }, []);

  return (
    <div className="panel">
      <h2>ผลเกมที่ผ่านมา</h2>
      <p className="hint">กดเกมเพื่อดูอันดับ สถิติ ข้อที่นักเรียนผิดบ่อย และดาวน์โหลดเป็น PDF</p>
      {error && <p className="error-text">{error}</p>}
      {!error && games === null && <div className="spinner" role="status" aria-label="กำลังโหลด" />}
      {games && games.length === 0 && <p className="hint">ยังไม่มีเกมที่เล่นจบ ผลจะมาแสดงที่นี่หลังจบเกมแรก</p>}
      {games && games.length > 0 && (
        <ul className="set-list">
          {games.map((g) => (
            <li key={g.gameId}>
              <button type="button" className="set-row" onClick={() => onOpen(g.gameId)}>
                <span className="set-name">{g.setName}</span>
                <span className="set-meta">
                  {when(g.endedAt)} {time(g.endedAt)} · นักเรียน {g.playerCount} คน · {g.questionCount} ข้อ · {g.victory ? 'นักเรียนชนะ' : 'บอสรอด'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Pie of right / wrong / not answered. */
function Pie({ right, wrong, skipped }: { right: number; wrong: number; skipped: number }) {
  const total = right + wrong + skipped;
  const r = 40;
  const round = 2 * Math.PI * r;
  let offset = 0;
  const parts = [
    { key: 'right', n: right },
    { key: 'wrong', n: wrong },
    { key: 'skipped', n: skipped }
  ];
  return (
    <svg className="tr-pie" viewBox="0 0 100 100" role="img" aria-label={`ตอบถูก ${right} ตอบผิด ${wrong} ไม่ได้ตอบ ${skipped}`}>
      <circle className="tr-pie-base" cx="50" cy="50" r={r} />
      {total > 0 &&
        parts.map((p) => {
          const len = (p.n / total) * round;
          const el = <circle key={p.key} className={`tr-pie-${p.key}`} cx="50" cy="50" r={r} strokeDasharray={`${len} ${round - len}`} strokeDashoffset={-offset} />;
          offset += len;
          return el;
        })}
      <text x="50" y="48" className="tr-pie-big">
        {total > 0 ? Math.round((right / total) * 100) : 0}%
      </text>
      <text x="50" y="62" className="tr-pie-small">
        ตอบถูก
      </text>
    </svg>
  );
}

function best<T>(list: T[], score: (x: T) => number): T | null {
  let top: T | null = null;
  for (const x of list) if (score(x) > 0 && (!top || score(x) > score(top))) top = x;
  return top;
}

/** The report of one game: summary, pie chart, highlights, ranking and every question. "ดาวน์โหลด PDF" prints the page. */
export function TeacherReportView({ gameId, onBack }: { gameId: string; onBack: () => void }) {
  const [data, setData] = useState<TeacherReport | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    teacherResultsApi.report(gameId).then(setData).catch((e) => setError(message(e)));
  }, [gameId]);
  useEffect(load, [load]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [gameId]);

  if (!data) {
    return (
      <div className="panel">
        <h2>สรุปผลเกม</h2>
        {error ? <p className="error-text">{error}</p> : <div className="spinner" role="status" aria-label="กำลังโหลด" />}
        <div className="row-actions">
          {error && (
            <button type="button" className="btn-ghost btn-sm" onClick={load}>
              ลองอีกครั้ง
            </button>
          )}
          <button type="button" className="btn-ghost btn-sm" onClick={onBack}>
            ← กลับ
          </button>
        </div>
      </div>
    );
  }

  const g = data.game;
  const mostRight = best<ReportPlayer>(data.players, (p) => p.correctCount);
  const mostWrong = best<ReportPlayer>(data.players, (p) => p.wrongCount);
  const fastest = best<ReportPlayer>(data.players, (p) => (p.avgMs > 0 ? 1e9 - p.avgMs : 0));
  const missed = [...data.questions].filter((q) => q.wrong + q.skipped > 0).sort((a, b) => b.wrong + b.skipped - (a.wrong + a.skipped));
  const hardest = missed[0];

  return (
    <div className="tr-report">
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>สรุปผล: {g.setName}</h2>
            <p className="hint tr-sub">
              {when(g.endedAt)} {time(g.endedAt)} · บอส {g.bossName} · {g.victory ? 'นักเรียนชนะ' : 'บอสรอด'}
            </p>
          </div>
          <div className="row-actions tr-noprint">
            <button type="button" className="btn-ghost btn-sm" onClick={onBack}>
              ← กลับ
            </button>
            <button type="button" className="btn-primary btn-sm" onClick={() => window.print()}>
              ดาวน์โหลด PDF
            </button>
          </div>
        </div>
        <p className="hint tr-noprint">ปุ่มดาวน์โหลด PDF จะเปิดหน้าต่างพิมพ์ ให้เลือกเครื่องพิมพ์เป็น "Save as PDF" หรือ "บันทึกเป็น PDF"</p>

        <div className="tr-top">
          {data.hasAnswers && <Pie right={data.right} wrong={data.wrong} skipped={data.skipped} />}
          <dl className="tr-stats">
            <div>
              <dt>นักเรียน</dt>
              <dd>{g.playerCount}</dd>
            </div>
            <div>
              <dt>จำนวนข้อ</dt>
              <dd>{g.questionCount}</dd>
            </div>
            {data.hasAnswers && (
              <>
                <div>
                  <dt>ตอบถูก</dt>
                  <dd className="is-right">{data.right}</dd>
                </div>
                <div>
                  <dt>ตอบผิด</dt>
                  <dd className="is-wrong">{data.wrong}</dd>
                </div>
                <div>
                  <dt>ไม่ได้ตอบ</dt>
                  <dd>{data.skipped}</dd>
                </div>
              </>
            )}
          </dl>
        </div>

        {!data.hasAnswers && <p className="hint">เกมนี้เล่นก่อนที่ระบบจะเริ่มเก็บคำตอบรายข้อ จึงมีเฉพาะอันดับ ไม่มีสถิติรายข้อ</p>}

        {data.hasAnswers && (
          <ul className="tr-highlights">
            {mostRight && (
              <li>
                <span>ตอบถูกมากที่สุด</span>
                <strong>{mostRight.name}</strong>
                <small>{mostRight.correctCount} ข้อ</small>
              </li>
            )}
            {fastest && (
              <li>
                <span>ตอบเร็วที่สุด</span>
                <strong>{fastest.name}</strong>
                <small>เฉลี่ย {seconds(fastest.avgMs)}</small>
              </li>
            )}
            {mostWrong && (
              <li>
                <span>ตอบผิดมากที่สุด</span>
                <strong>{mostWrong.name}</strong>
                <small>{mostWrong.wrongCount} ข้อ</small>
              </li>
            )}
            {hardest && (
              <li>
                <span>ข้อที่ผิดบ่อยที่สุด</span>
                <strong>ข้อ {hardest.index + 1}</strong>
                <small>ผิดหรือไม่ตอบ {hardest.wrong + hardest.skipped} คน</small>
              </li>
            )}
          </ul>
        )}
      </div>

      <div className="panel">
        <h2>อันดับ</h2>
        <p className="hint">เรียงตามเปอร์เซ็นต์ข้อที่ตอบถูก ถ้าเท่ากันดูดาเมจรวม</p>
        <div className="tr-scroll">
          <table className="tr-table">
            <thead>
              <tr>
                <th>อันดับ</th>
                <th>ชื่อ</th>
                <th>ถูก %</th>
                <th>ถูก</th>
                {data.hasAnswers && <th>ผิด</th>}
                {data.hasAnswers && <th>ไม่ตอบ</th>}
                {data.hasAnswers && <th>เวลาเฉลี่ย</th>}
                <th>ดาเมจ</th>
              </tr>
            </thead>
            <tbody>
              {data.players.map((p) => (
                <tr key={p.studentId}>
                  <td>{p.place}</td>
                  <td className="tr-name">{p.name}</td>
                  <td>{p.percent}%</td>
                  <td>{p.correctCount}</td>
                  {data.hasAnswers && <td>{p.wrongCount}</td>}
                  {data.hasAnswers && <td>{p.skippedCount}</td>}
                  {data.hasAnswers && <td>{p.avgMs > 0 ? seconds(p.avgMs) : '-'}</td>}
                  <td>{p.totalDamage.toLocaleString('th-TH')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data.hasAnswers && (
        <div className="panel">
          <h2>ผลรายข้อ</h2>
          <p className="hint">เรียงจากข้อที่นักเรียนผิดหรือไม่ตอบมากที่สุด ตัวเลขหลังตัวเลือกคือจำนวนคนที่เลือก</p>
          <ol className="tr-questions">
            {[...data.questions]
              .sort((a, b) => b.wrong + b.skipped - (a.wrong + a.skipped) || a.index - b.index)
              .map((q) => {
                const all = q.right + q.wrong + q.skipped;
                const pct = all > 0 ? Math.round((q.right / all) * 100) : 0;
                return (
                  <li key={q.index}>
                    <div className="tr-q-head">
                      <strong>ข้อ {q.index + 1}</strong>
                      <span className={pct < 50 ? 'tr-pct is-low' : 'tr-pct'}>ถูก {pct}%</span>
                    </div>
                    <p className="tr-q-text">{q.text}</p>
                    <ul className="tr-picks">
                      {q.choices.map((c, i) => (
                        <li key={i} className={i === q.correctIndex ? 'is-answer' : undefined}>
                          <span>
                            {LETTERS[i]}. {c}
                          </span>
                          <small>{q.picks[i] ?? 0} คน</small>
                        </li>
                      ))}
                    </ul>
                    {q.skipped > 0 && <p className="tr-q-skip">ไม่ได้ตอบ {q.skipped} คน</p>}
                  </li>
                );
              })}
          </ol>
        </div>
      )}
    </div>
  );
}
