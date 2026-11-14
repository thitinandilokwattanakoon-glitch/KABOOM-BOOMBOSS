import { useEffect, useRef, useState } from 'react';
import type { RoomView } from '../types/room';
import { Avatar } from './Avatar';

const MAX_CROWD = 8;

/**
 * The battle scene: boss card (name, chapter, health) top left, the boss's picture in the middle,
 * and the students lined up in front. Students who have already answered light up.
 */
export function BattleScene({ room }: { room: RoomView }) {
  const pct = room.maxHp > 0 ? Math.max(0, Math.min(100, (room.hp / room.maxHp) * 100)) : 0;

  // Attack effect: blink + shake and a floating number when the boss loses health (or heals).
  const prevHp = useRef(room.hp);
  const [fx, setFx] = useState<{ key: number; amount: number } | null>(null);
  useEffect(() => {
    const diff = room.hp - prevHp.current;
    prevHp.current = room.hp;
    if (diff === 0) return;
    setFx((old) => ({ key: (old?.key ?? 0) + 1, amount: diff }));
    const id = window.setTimeout(() => setFx(null), 1300);
    return () => window.clearTimeout(id);
  }, [room.hp]);
  const hit = fx !== null && fx.amount < 0;
  const heal = fx !== null && fx.amount > 0;
  const tone = pct > 50 ? 'ok' : pct > 20 ? 'mid' : 'low';

  const crowd = room.players.slice(0, MAX_CROWD);
  const extra = room.players.length - crowd.length;

  return (
    <section className={`battle${hit ? ' is-hit' : ''}${heal ? ' is-heal' : ''}`} aria-label={`สนามต่อสู้กับ ${room.bossName}`}>
      <div className="status-card">
        <div className="status-top">
          <div className="status-name">{room.bossName}</div>
          <div className="status-chapter" title={room.setName}>
            บท {room.setName}
          </div>
        </div>
        <div className="hp-row">
          <span className="hp-label">HP</span>
          <div className="hp-track" role="progressbar" aria-label="เลือดบอส" aria-valuemin={0} aria-valuemax={room.maxHp} aria-valuenow={room.hp}>
            <div className={`hp-fill ${tone}`} style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }} />
          </div>
        </div>
        <div className="hp-text">
          {room.hp.toLocaleString('th-TH')} / {room.maxHp.toLocaleString('th-TH')}
        </div>
      </div>

      <div className="floor" aria-hidden="true" />

      <div className="boss-stage">
        {fx && (
          <span key={fx.key} className={`float-num${fx.amount > 0 ? ' heal' : ''}`} aria-hidden="true">
            {fx.amount > 0 ? '+' : '−'}
            {Math.abs(fx.amount).toLocaleString('th-TH')}
          </span>
        )}
        <div className="boss-aura" aria-hidden="true" />
        <div className="boss-portrait">
          <Avatar ownerId={room.teacherId} name={room.bossName} kind="boss" size="fill" />
        </div>
      </div>

      <ul className="crowd" aria-label="ผู้เล่น">
        {crowd.map((p) => (
          <li key={p.id} className={room.answeredIds.includes(p.id) ? 'ready' : ''} title={p.name}>
            <Avatar ownerId={p.id} name={p.name} kind="player" size={52} />
          </li>
        ))}
        {extra > 0 && <li className="crowd-more">+{extra}</li>}
      </ul>
    </section>
  );
}
