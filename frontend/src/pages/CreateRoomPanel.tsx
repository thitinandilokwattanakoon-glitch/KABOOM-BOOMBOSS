import { FormEvent, useEffect, useState } from 'react';
import { questionSetsApi } from '../api/questionSets';
import { roomsApi } from '../api/rooms';
import { suggestBossHp } from '../lib/balance';
import type { Difficulty, QuestionSetSummary } from '../types/questionSet';

const DEFAULT_HP = 1000;
const DEFAULT_TIME = 20;

export function CreateRoomPanel({ onCreated }: { onCreated: (code: string) => void }) {
  const [sets, setSets] = useState<QuestionSetSummary[] | null>(null);
  const [setId, setSetId] = useState('');
  const [bossName, setBossName] = useState('');
  const [hp, setHp] = useState(String(DEFAULT_HP));
  const [time, setTime] = useState(String(DEFAULT_TIME));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [students, setStudents] = useState('');
  const [levels, setLevels] = useState<Difficulty[]>([]);

  // The difficulties of the chosen set, to suggest a boss health for the class size.
  useEffect(() => {
    if (!setId) return;
    let alive = true;
    setLevels([]);
    questionSetsApi
      .get(setId)
      .then((s) => alive && setLevels(s.questions.map((q) => q.difficulty)))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [setId]);
  const advice = suggestBossHp(Number(students), levels);

  useEffect(() => {
    questionSetsApi
      .list()
      .then((list) => {
        setSets(list);
        if (list.length > 0) setSetId(list[0].id);
      })
      .catch(() => setSets([]));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const maxHp = Number(hp);
    const timeLimitSec = Number(time);
    if (!setId) return setError('กรุณาเลือกชุดคำถาม');
    if (!bossName.trim()) return setError('กรุณาตั้งชื่อบอส');
    if (!Number.isInteger(maxHp) || maxHp < 10 || maxHp > 100000) return setError('เลือดบอสต้องเป็นเลข 10 - 100,000');
    if (!Number.isInteger(timeLimitSec) || timeLimitSec < 5 || timeLimitSec > 120) {
      return setError('เวลาต่อข้อต้องเป็นเลข 5 - 120 วินาที');
    }
    setBusy(true);
    try {
      const { code } = await roomsApi.create({ questionSetId: setId, bossName: bossName.trim(), maxHp, timeLimitSec });
      onCreated(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'สร้างห้องไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="panel" onSubmit={submit} noValidate>
      <h2>เปิดห้องเล่นเกม</h2>
      {sets && sets.length === 0 ? (
        <p className="hint">ต้องมีชุดคำถามอย่างน้อย 1 ชุดก่อน สร้างได้ที่ "ชุดคำถามของฉัน" ด้านล่าง</p>
      ) : (
        <>
          <div className="field">
            <label htmlFor="room-set">ชุดคำถาม</label>
            <select id="room-set" value={setId} onChange={(e) => setSetId(e.target.value)}>
              {(sets ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.questionCount} ข้อ)
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="room-boss">ชื่อบอส</label>
            <input id="room-boss" type="text" value={bossName} maxLength={40} onChange={(e) => setBossName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="room-students">จำนวนนักเรียนโดยประมาณ (ใส่เพื่อดูเลือดบอสที่แนะนำ)</label>
            <input id="room-students" type="text" inputMode="numeric" value={students} placeholder="เช่น 30" onChange={(e) => setStudents(e.target.value.replace(/\D/g, '').slice(0, 3))} />
            {advice && (
              <div className="hp-advice" role="group" aria-label="เลือดบอสที่แนะนำ">
                <span>เลือดบอสที่แนะนำ (กดเพื่อใช้)</span>
                <button type="button" className="btn-ghost btn-sm" onClick={() => setHp(String(advice.easy))}>
                  ชนะง่าย {advice.easy.toLocaleString('th-TH')}
                </button>
                <button type="button" className="btn-ghost btn-sm" onClick={() => setHp(String(advice.fair))}>
                  พอดี {advice.fair.toLocaleString('th-TH')}
                </button>
                <button type="button" className="btn-ghost btn-sm" onClick={() => setHp(String(advice.hard))}>
                  ท้าทาย {advice.hard.toLocaleString('th-TH')}
                </button>
              </div>
            )}
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="room-hp">เลือดบอส</label>
              <input id="room-hp" type="text" inputMode="numeric" value={hp} onChange={(e) => setHp(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="room-time">เวลาต่อข้อ (วินาที)</label>
              <input id="room-time" type="text" inputMode="numeric" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn-primary" disabled={busy || !sets}>
            {busy ? 'กำลังสร้างห้อง…' : 'สร้างห้อง'}
          </button>
        </>
      )}
    </form>
  );
}
