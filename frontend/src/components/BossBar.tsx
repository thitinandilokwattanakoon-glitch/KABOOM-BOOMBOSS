import type { RoomView } from '../types/room';
import { Avatar } from './Avatar';

/** Boss picture (the teacher's character), name and health bar. */
export function BossBar({ room }: { room: RoomView }) {
  const pct = room.maxHp > 0 ? Math.max(0, Math.min(100, (room.hp / room.maxHp) * 100)) : 0;
  return (
    <div className="boss-bar">
      <Avatar ownerId={room.teacherId} name={room.bossName} kind="boss" size={72} />
      <div className="boss-info">
        <div className="boss-name">{room.bossName}</div>
        <div className="hp-track" role="progressbar" aria-valuemin={0} aria-valuemax={room.maxHp} aria-valuenow={room.hp}>
          <div className="hp-fill" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }} />
        </div>
        <div className="hp-text">
          เลือด {room.hp.toLocaleString('th-TH')} / {room.maxHp.toLocaleString('th-TH')}
        </div>
      </div>
    </div>
  );
}
