import { useState } from 'react';
import { roomsApi } from '../api/rooms';
import { GameScreen } from '../components/GameScreen';
import { BossSkillBanner } from '../components/BossSkillBanner';
import { Choices } from '../components/Choices';
import { DialogBox } from '../components/DialogBox';
import { PlayerTag } from '../components/PlayerTag';
import { useCountdown } from '../hooks/useCountdown';
import { useRoom } from '../hooks/useRoom';
import { PLAYER_SKILL } from '../lib/skills';

/** The teacher's screen for one room: lobby -> questions -> results. The boss skills fire by themselves. */
export function TeacherRoom({ code, onLeave }: { code: string; onLeave: () => void }) {
  const { room, connected, notFound, apply, serverNow } = useRoom(code);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const extraActive = !!room?.activeSkills.some((a) => a.skill === 'EXTRA_TIME');
  const deadline = room?.status === 'QUESTION' ? room.deadlineMs + (extraActive ? room.extraTimeSec * 1000 : 0) : null;
  const left = useCountdown(deadline, serverNow);

  async function act(fn: () => Promise<unknown>) {
    setError('');
    setBusy(true);
    try {
      const v = await fn();
      if (v) apply(v as Awaited<ReturnType<typeof roomsApi.get>>);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    } finally {
      setBusy(false);
    }
  }

  if (notFound) {
    return (
      <div className="panel">
        <h2>ไม่พบห้อง {code}</h2>
        <p className="hint">ห้องนี้หายไปแล้ว (อาจเพราะ backend ถูกรีสตาร์ท) กลับไปเปิดห้องใหม่ได้เลย</p>
        <button type="button" className="btn-primary" onClick={onLeave}>กลับหน้าหลัก</button>
      </div>
    );
  }
  if (!room) return <div className="spinner" role="status" aria-label="กำลังโหลด" />;

  const answered = room.answeredIds.length;
  const lastStep = room.hp <= 0 || room.questionIndex >= room.questionCount - 1;

  return (
    <GameScreen room={room}>
      {!connected && <p className="conn-warn">กำลังเชื่อมต่อแบบเรียลไทม์… (ถ้านานเกินไป ลองรีเฟรชหน้า)</p>}

      {room.status === 'LOBBY' && (
        <div className="panel">
          <p className="hint">นักเรียนเข้าสู่ระบบแล้วใส่รหัสห้องนี้</p>
          <div className="room-code" aria-label={`รหัสห้อง ${room.code}`}>{room.code}</div>
          <h2>ผู้เล่นในห้อง ({room.players.length})</h2>
          {room.players.length === 0 ? (
            <p className="hint">ยังไม่มีใครเข้าห้อง</p>
          ) : (
            <ul className="chips">
              {room.players.map((p) => (
                <li key={p.id}>
                  <PlayerTag id={p.id} name={p.name} />
                </li>
              ))}
            </ul>
          )}
          {error && <p className="error-text">{error}</p>}
          <button type="button" className="btn-primary" disabled={busy || room.players.length === 0} onClick={() => act(() => roomsApi.start(code))}>
            เริ่มเกม
          </button>
        </div>
      )}

      {(room.status === 'QUESTION' || room.status === 'REVEAL') && room.question && (
        <>
          <BossSkillBanner room={room} />
          <DialogBox
            narration={
              room.status === 'QUESTION'
                ? `${room.bossName} ถามคำถามแล้ว! รอนักเรียนตอบ`
                : `เฉลยแล้ว! ทุกคนรวมกันทำดาเมจ ${room.reveal?.totalDamage.toLocaleString('th-TH') ?? 0}`
            }
            count={`ข้อ ${room.questionIndex + 1} / ${room.questionCount}`}
            timer={room.status === 'QUESTION' && left !== null ? `${left} วินาที` : undefined}
          >
            <h2 className="dialog-q">{room.question.text}</h2>
          </DialogBox>
          <div className="panel">
            <Choices choices={room.question.choices} correctIndex={room.reveal?.correctIndex} />

            {room.status === 'QUESTION' && (
              <>
                <p className="hint">ตอบแล้ว {answered} / {room.players.length} คน</p>
                {room.activeSkills.length > 0 && (
                  <ul className="skill-log">
                    {room.activeSkills.map((a) => {
                      const who = room.players.find((p) => p.id === a.playerId);
                      return (
                        <li key={a.playerId}>
                          {who?.name ?? 'ผู้เล่น'} ใช้สกิล {PLAYER_SKILL[a.skill].name}
                        </li>
                      );
                    })}
                  </ul>
                )}
                {error && <p className="error-text">{error}</p>}
                <button type="button" className="btn-primary" disabled={busy} onClick={() => act(() => roomsApi.reveal(code))}>
                  ปิดข้อนี้ทันที
                </button>
              </>
            )}

            {room.status === 'REVEAL' && room.reveal && (
              <>
                <ul className="result-list">
                  {room.reveal.results.map((r) => (
                    <li key={r.playerId} className={r.correct ? 'ok' : 'no'}>
                      <PlayerTag id={r.playerId} name={r.name} />
                      <span className="res-meta">
                        {r.choice < 0 ? (
                          <span>ไม่ได้ตอบ</span>
                        ) : r.correct ? (
                          <>
                            <span>ถูก</span>
                            <span>{(r.elapsedMs / 1000).toFixed(1)} วิ</span>
                            <span className="res-dmg">−{r.damage}</span>
                          </>
                        ) : (
                          <span>ผิด</span>
                        )}
                        {r.combo > 1 && <span className="res-tag">Combo x{r.combo}</span>}
                        {r.doubled && <span className="res-tag">+50%</span>}
                        {r.shielded && <span className="res-tag">โล่</span>}
                        {r.nerfed && <span className="res-tag bad">ถูกจ้อง</span>}
                      </span>
                    </li>
                  ))}
                </ul>
                {error && <p className="error-text">{error}</p>}
                <button type="button" className="btn-primary" disabled={busy} onClick={() => act(() => roomsApi.next(code))}>
                  {lastStep ? 'ดูผลสรุป' : 'ข้อถัดไป'}
                </button>
              </>
            )}
          </div>
        </>
      )}

      {room.status === 'ENDED' && (
        <div className="panel">
          <h2>{room.victory ? `ชนะแล้ว! ${room.bossName} ล้มลง` : `${room.bossName} ยังรอดอยู่`}</h2>
          <h3 className="sub-title">อันดับดาเมจ</h3>
          <ol className="board">
            {room.players.map((p) => (
              <li key={p.id}>
                <PlayerTag id={p.id} name={p.name} />
                <span className="board-stat">{p.totalDamage.toLocaleString('th-TH')}</span>
                <span className="board-stat muted">ตอบถูก {p.correctCount}</span>
              </li>
            ))}
          </ol>
          <button type="button" className="btn-primary" onClick={onLeave}>กลับหน้าหลัก</button>
        </div>
      )}

      {room.status !== 'ENDED' && room.status !== 'LOBBY' && (
        <button type="button" className="link-btn" disabled={busy} onClick={() => act(() => roomsApi.end(code))}>
          จบเกมตอนนี้
        </button>
      )}
      {room.status === 'LOBBY' && (
        <button type="button" className="link-btn" style={{ whiteSpace: 'nowrap' }} onClick={onLeave}>ออกจากห้อง (ห้องยังเปิดอยู่)</button>
      )}
    </GameScreen>
  );
}
