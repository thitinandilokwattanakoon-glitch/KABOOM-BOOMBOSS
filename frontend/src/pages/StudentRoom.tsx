import { useEffect, useState } from 'react';
import { roomsApi } from '../api/rooms';
import { GameScreen } from '../components/GameScreen';
import { BossSkillBanner } from '../components/BossSkillBanner';
import { Choices } from '../components/Choices';
import { DialogBox } from '../components/DialogBox';
import { PlayerTag } from '../components/PlayerTag';
import { useAuth } from '../hooks/useAuth';
import { useCountdown } from '../hooks/useCountdown';
import { useRoom } from '../hooks/useRoom';
import { comboBonusPct, PLAYER_SKILL } from '../lib/skills';

export function StudentRoom({ code, onLeave }: { code: string; onLeave: () => void }) {
  const { user } = useAuth();
  const { room, connected, notFound, apply, serverNow } = useRoom(code);
  const [pick, setPick] = useState(-1);
  const [error, setError] = useState('');
  const [joinError, setJoinError] = useState('');
  const [busy, setBusy] = useState(false);

  const me = user?.id;
  const myActive = room?.activeSkills.find((a) => a.playerId === me)?.skill;
  // Extra time only moves this student's own deadline.
  const deadline = room?.status === 'QUESTION'
    ? room.deadlineMs + (myActive === 'EXTRA_TIME' ? room.extraTimeSec * 1000 : 0)
    : null;
  const left = useCountdown(deadline, serverNow);

  // Joining is repeatable (the server ignores a second join), so just do it whenever this page opens.
  useEffect(() => {
    roomsApi
      .join(code)
      .then(apply)
      .catch((e) => setJoinError(e instanceof Error ? e.message : 'เข้าห้องไม่สำเร็จ'));
  }, [code, apply]);

  // A new question starts: forget the previous pick.
  const qIndex = room?.questionIndex ?? -1;
  useEffect(() => setPick(-1), [qIndex]);

  async function answer(i: number) {
    setError('');
    setPick(i);
    try {
      apply(await roomsApi.answer(code, i));
    } catch (e) {
      setPick(-1);
      setError(e instanceof Error ? e.message : 'ส่งคำตอบไม่สำเร็จ');
    }
  }

  async function useSkill() {
    setError('');
    setBusy(true);
    try {
      apply(await roomsApi.useSkill(code));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ใช้สกิลไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }

  if (notFound || joinError) {
    return (
      <div className="panel">
        <h2>{notFound ? `ไม่พบห้อง ${code}` : 'เข้าห้องไม่ได้'}</h2>
        <p className="hint">{joinError || 'ตรวจรหัสห้องกับครูอีกครั้ง'}</p>
        <button type="button" className="btn-primary" onClick={onLeave}>กลับ</button>
      </div>
    );
  }
  if (!room) return <div className="spinner" role="status" aria-label="กำลังโหลด" />;

  const iAnswered = !!me && room.answeredIds.includes(me);
  const myResult = room.reveal?.results.find((r) => r.playerId === me);
  const myRank = room.players.findIndex((p) => p.id === me) + 1;
  const myPlayer = room.players.find((p) => p.id === me);
  const held = myPlayer?.skill ?? null;
  const canUse = room.status === 'QUESTION' && !iAnswered && pick < 0 && !myActive && held !== null && left !== 0;

  return (
    <GameScreen room={room} me={me}>
      {!connected && <p className="conn-warn">กำลังเชื่อมต่อแบบเรียลไทม์…</p>}

      {room.status === 'LOBBY' && (
        <div className="panel">
          <h2>เข้าห้อง {room.code} แล้ว</h2>
          <p className="hint">รอครูกดเริ่มเกม ผู้เล่นตอนนี้ {room.players.length} คน</p>
          <ul className="chips">
            {room.players.map((p) => (
              <li key={p.id} className={p.id === me ? 'me' : ''}>
                <PlayerTag id={p.id} name={p.name} />
              </li>
            ))}
          </ul>
          <button type="button" className="link-btn dark" onClick={onLeave}>ออกจากห้อง</button>
        </div>
      )}

      {room.status === 'QUESTION' && room.question && (
        <>
          <BossSkillBanner room={room} meId={me} />
          <DialogBox
            narration={`${room.bossName} ถามคำถามแล้ว! เตรียมตัวตอบคำถามได้เลย!`}
            count={`ข้อ ${room.questionIndex + 1} / ${room.questionCount}`}
            timer={left !== null ? `${left} วินาที` : undefined}
          >
            <h2 className="dialog-q">{room.question.text}</h2>
          </DialogBox>
          <div className="panel">
            <Choices
              choices={room.question.choices}
              picked={pick}
              onPick={answer}
              disabled={iAnswered || pick >= 0 || left === 0}
            />
            {error && <p className="error-text">{error}</p>}
            <p className="hint">
              {iAnswered || pick >= 0 ? 'ส่งคำตอบแล้ว รอเพื่อนคนอื่น…' : 'ตอบเร็วยิ่งทำดาเมจแรง!'}
            </p>
            {myPlayer && myPlayer.combo > 0 && (
              <p className="combo-chip">
                <strong>Combo x{myPlayer.combo}</strong>
                <span>{comboBonusPct(myPlayer.combo + 1) > 0 ? `ถูกอีกข้อ ดาเมจ +${comboBonusPct(myPlayer.combo + 1)}%` : 'ตอบถูกต่อเนื่องเพื่อเพิ่มดาเมจ'}</span>
              </p>
            )}

            <div className="skill-card">
              {myActive ? (
                <>
                  <strong>ใช้สกิล {PLAYER_SKILL[myActive].name} แล้ว</strong>
                  <span>{PLAYER_SKILL[myActive].detail(room.extraTimeSec)}</span>
                </>
              ) : held ? (
                <>
                  <strong>สกิลของคุณ: {PLAYER_SKILL[held].name}</strong>
                  <span>{PLAYER_SKILL[held].detail(room.extraTimeSec)}</span>
                  <button type="button" className="btn-primary btn-sm" disabled={!canUse || busy} onClick={useSkill}>
                    ใช้สกิลในข้อนี้
                  </button>
                </>
              ) : (
                <span>ยังไม่มีสกิล ตอบถูกมีโอกาสได้สกิล และได้แน่นอนเมื่อคอมโบครบทุก 3 ข้อ</span>
              )}
            </div>
          </div>
        </>
      )}

      {room.status === 'REVEAL' && room.question && room.reveal && (
        <>
          <BossSkillBanner room={room} meId={me} />
          <DialogBox
            narration={`เฉลยแล้ว! ทั้งห้องรวมกันทำดาเมจ ${room.reveal.totalDamage.toLocaleString('th-TH')} รอครูไปข้อถัดไป`}
            count={`ข้อ ${room.questionIndex + 1} / ${room.questionCount}`}
          >
            <h2 className="dialog-q">{room.question.text}</h2>
          </DialogBox>
          <div className="panel">
            <Choices
              choices={room.question.choices}
              picked={myResult && myResult.choice >= 0 ? myResult.choice : -1}
              correctIndex={room.reveal.correctIndex}
            />
            <p className="damage-line">
              {!myResult || myResult.choice < 0
                ? 'ข้อนี้คุณไม่ได้ตอบ'
                : myResult.correct
                  ? `ถูก! ใช้เวลา ${(myResult.elapsedMs / 1000).toFixed(1)} วิ ทำดาเมจ ${myResult.damage}`
                  : 'ข้อนี้ตอบผิด ไม่มีดาเมจ'}
            </p>
            {myResult && myResult.combo > 0 && (
              <p className="combo-chip">
                <strong>Combo x{myResult.combo}</strong>
                <span>{myResult.correct && comboBonusPct(myResult.combo) > 0 ? `ข้อนี้ได้ดาเมจ +${comboBonusPct(myResult.combo)}%` : 'คอมโบยังอยู่'}</span>
              </p>
            )}
            {myResult?.doubled && <p className="hint">คุณใช้สกิลพลังโจมตี +50% ในข้อนี้{myResult.correct ? '' : ' แต่ตอบผิด สกิลจึงหมดเปล่า'}</p>}
            {myResult?.shielded && <p className="hint">คุณใช้โล่ป้องกันในข้อนี้{myResult.correct ? '' : ' คอมโบจึงไม่หาย'}</p>}
            {myResult?.nerfed && <p className="hint">บอสจ้องจับผิดคุณ ดาเมจข้อนี้ถูกลดครึ่งหนึ่ง</p>}
            {myResult?.earned && (
              <div className="skill-card">
                <strong>คุณได้รับสกิล {PLAYER_SKILL[myResult.earned].name}</strong>
                <span>{PLAYER_SKILL[myResult.earned].detail(room.extraTimeSec)}</span>
              </div>
            )}
          </div>
        </>
      )}

      {room.status === 'ENDED' && (
        <div className="panel">
          <h2>{room.victory ? `ชนะแล้ว! ${room.bossName} ล้มลง` : `${room.bossName} ยังรอดอยู่`}</h2>
          {myPlayer && (
            <p className="damage-line">
              คุณอยู่อันดับ {myRank}
              <br />
              ดาเมจรวม {myPlayer.totalDamage.toLocaleString('th-TH')}
              <br />
              ตอบถูก {myPlayer.correctCount} ข้อ
            </p>
          )}
          <ol className="board">
            {room.players.map((p) => (
              <li key={p.id} className={p.id === me ? 'me' : ''}>
                <PlayerTag id={p.id} name={p.name} />
                <span className="board-stat">{p.totalDamage.toLocaleString('th-TH')}</span>
              </li>
            ))}
          </ol>
          <button type="button" className="btn-primary" onClick={onLeave}>กลับหน้าหลัก</button>
        </div>
      )}
    </GameScreen>
  );
}
