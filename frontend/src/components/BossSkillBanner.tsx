import { BOSS_SKILL } from '../lib/skills';
import type { RoomView } from '../types/room';

/** Tells everybody what the boss did to this question. `meId` makes the cursed student's own message stronger. */
export function BossSkillBanner({ room, meId }: { room: RoomView; meId?: string }) {
  const s = room.bossSkill;
  if (!s) return null;

  let detail = '';
  if (s.type === 'HEAL') {
    detail =
      room.status === 'REVEAL' && room.reveal
        ? room.reveal.healed > 0
          ? `เลือดบอสเพิ่มขึ้น ${room.reveal.healed.toLocaleString('th-TH')}`
          : 'บอสล้มก่อนฮีลทัน'
        : 'หลังจบข้อนี้เลือดบอสจะเพิ่มขึ้น';
  } else if (s.type === 'SHORTEN') {
    detail = `ข้อนี้เหลือเวลา ${room.questionLimitSec} วินาที`;
  } else {
    detail =
      meId && s.targetId === meId
        ? 'บอสจ้องคุณอยู่ ข้อนี้ดาเมจของคุณเหลือครึ่งเดียว (ใช้โล่กันได้)'
        : `ข้อนี้ดาเมจของ ${s.targetName ?? 'คนที่คอมโบสูงสุด'} เหลือครึ่งเดียว (ใช้โล่กันได้)`;
  }

  return (
    <div className="skill-banner" role="status">
      <strong>{BOSS_SKILL[s.type]}</strong>
      <span>{detail}</span>
    </div>
  );
}
